/**
 * sync-publications.ts
 *
 * CLI: pnpm sync-publications [--dry-run] [--member <slug>] [--no-arxiv] [--no-inspire] [--verbose]
 *
 * Phase 9 scaffold — fetches raw API data from InspireHEP (BAI query) and arXiv
 * (ORCID atom2 feed). Extraction, dedup, merge, and write gate are wired in 09-02/09-03.
 *
 * Rules (from STATE.md locked decisions):
 *  - Relative imports only — no @/ alias (tsx CJS mode does not resolve webpack aliases)
 *  - No top-level await — tsx CJS rejects it; use async function main() pattern
 *  - No arXiv name-based fallback — only orcid_id queries, never au:name search
 *  - AbortSignal.timeout(10_000) on every fetch
 *  - BAI regex from 07-02: /^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/
 *  - --member MUST NOT write to content/publications.json (use scripts/tmp/)
 */

import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { XMLParser, type MatcherView } from "fast-xml-parser";
// Relative import — no @/ alias; tsx CJS does not resolve webpack aliases
import { PersonSchema } from "../src/content/schemas/people.schema";
import type { z } from "zod";

// ---------------------------------------------------------------------------
// A. CLI Flag Parsing
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "dry-run":    { type: "boolean", default: false },
    "member":     { type: "string"                  },
    "no-arxiv":   { type: "boolean", default: false },
    "no-inspire": { type: "boolean", default: false },
    "verbose":    { type: "boolean", default: false },
  },
  strict: true,
});

const isVerbose = Boolean(flags.verbose);

// ---------------------------------------------------------------------------
// B. Constants
// ---------------------------------------------------------------------------

const BAI_REGEX = /^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/;
const REQUEST_TIMEOUT_MS = 10_000;
const INSPIRE_BATCH_SIZE = 5;
const INSPIRE_BATCH_PAUSE_MS = 2000;
const INSPIRE_PAGE_SIZE = 200;       // size param for InspireHEP pagination
const USER_AGENT = "cosmo-sync/1.0 (academic group site; https://github.com/)";

// ---------------------------------------------------------------------------
// C. Types
// ---------------------------------------------------------------------------

type PersonWithSyncIds = z.infer<typeof PersonSchema> & {
  inspirehep_id?: string;
  orcid_id?: string;
};

// Raw API response types — locally declared to keep Zod schemas decoupled from
// network shapes. These are NOT Publication-compatible yet (that's 09-02's job).

interface InspireAuthor {
  full_name: string;
  ids?: { schema: string; value: string }[];
}
interface InspireTitle {
  source?: string;
  title: string;
}
interface InspireArxivEprint {
  categories?: string[];
  value: string;
}
interface InspirePubInfo {
  journal_title?: string;
  journal_volume?: string;
  artid?: string;
  journal_issue?: string;
  year?: number;
}
interface InspireDoi {
  material?: string;
  source?: string;
  value: string;
}
interface InspireAbstract {
  source?: string;
  value: string;
}

interface InspireHit {
  id: string;
  metadata: {
    control_number: number;
    titles: InspireTitle[];
    authors: InspireAuthor[];
    arxiv_eprints?: InspireArxivEprint[];
    preprint_date?: string;
    publication_info?: InspirePubInfo[];
    dois?: InspireDoi[];
    abstracts?: InspireAbstract[];
  };
}

interface InspireResponse {
  hits: { total: number; hits: InspireHit[] };
}

interface ArXivEntry {
  id: string;
  published: string;
  title: string;
  summary?: string;
  // atom2: ONE <author> element whose <name> is a comma-delimited CSV of all authors
  author: { name: string }[];
  link?: { "@_href": string; "@_rel"?: string }[];
  category?: { "@_term"?: string }[];
}

// ---------------------------------------------------------------------------
// D. fast-xml-parser config (RESEARCH.md §C — jpath dot-notation verified)
// ---------------------------------------------------------------------------

const ATOM2_ALWAYS_ARRAY = new Set([
  "feed.entry",
  "feed.entry.author",
  "feed.entry.link",
  "feed.entry.category",
]);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (_tagName: string, jpath: string | MatcherView, _isLeaf: boolean, _isAttr: boolean) =>
    typeof jpath === "string" && ATOM2_ALWAYS_ARRAY.has(jpath),
});

// ---------------------------------------------------------------------------
// E. Utilities — sleep, fetchWithRetry, runBatched
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * fetch wrapper with:
 *  - AbortSignal.timeout(10_000) on every request (SYNC-14)
 *  - User-Agent header
 *  - Exponential backoff on HTTP 429 (2s → 4s → 8s, capped at 30s)
 */
async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  maxRetries = 3,
  baseDelayMs = 2000,
): Promise<Response> {
  let attempt = 0;
  while (true) {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT, ...(init?.headers ?? {}) },
    });
    if (response.status === 429 && attempt < maxRetries) {
      const delay = Math.min(baseDelayMs * 2 ** attempt, 30_000);
      if (isVerbose) {
        process.stderr.write(`  429 — retry ${attempt + 1}/${maxRetries} in ${delay}ms\n`);
      }
      await sleep(delay);
      attempt++;
      continue;
    }
    return response;
  }
}

/**
 * Execute tasks in batches of `concurrency` with `batchPauseMs` between batches.
 * Within each batch, all tasks run concurrently via Promise.all.
 */
async function runBatched<T>(
  tasks: (() => Promise<T>)[],
  concurrency = INSPIRE_BATCH_SIZE,
  batchPauseMs = INSPIRE_BATCH_PAUSE_MS,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((t) => t()));
    results.push(...batchResults);
    if (i + concurrency < tasks.length) await sleep(batchPauseMs);
  }
  return results;
}

// ---------------------------------------------------------------------------
// F. Startup Validation — validateBAIs (SYNC-06, Pitfall 10)
// ---------------------------------------------------------------------------

/**
 * Validate all inspirehep_id values against BAI regex BEFORE any network I/O.
 * Exits 1 immediately if any fail — prevents confusing 0-result API responses
 * from numeric INSPIRE IDs like "INSPIRE-00140145".
 */
function validateBAIs(people: PersonWithSyncIds[]): void {
  const bad = people
    .filter((p) => p.inspirehep_id !== undefined && !BAI_REGEX.test(p.inspirehep_id))
    .map((p) => `  ${p.slug}: "${p.inspirehep_id}"`);
  if (bad.length > 0) {
    process.stderr.write(
      `BAI format error — fix content/people.json before retrying.\n` +
        `Expected BAI (e.g. "E.Calzetta.1"), got:\n${bad.join("\n")}\n`,
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// G. readPeople helper
// ---------------------------------------------------------------------------

/**
 * Read content/people.json with fs.readFileSync + JSON.parse.
 * NO Zod parse here — pnpm validate-content already guards upstream.
 * Resolving via process.cwd() means script must be run from repo root.
 */
function readPeople(): PersonWithSyncIds[] {
  const filePath = resolve(process.cwd(), "content/people.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as PersonWithSyncIds[];
}

// ---------------------------------------------------------------------------
// H. Fetch layers — InspireHEP + arXiv
// ---------------------------------------------------------------------------

/**
 * Fetch ALL InspireHEP literature entries for a BAI identifier.
 * Paginates using hits.total; safety cap at 10 pages (2000 papers).
 * Returns raw InspireHit[] — transformation is 09-02's job.
 *
 * SYNC-05: no arXiv name-based fallback exists in this code.
 */
async function fetchInspireHEP(bai: string): Promise<InspireHit[]> {
  const fields =
    "arxiv_eprints,titles,authors,publication_info,preprint_date,dois,control_number,abstracts";
  const base =
    `https://inspirehep.net/api/literature` +
    `?q=a%20${encodeURIComponent(bai)}` +
    `&size=${INSPIRE_PAGE_SIZE}` +
    `&sort=mostrecent` +
    `&fields=${fields}`;

  let page = 1;
  let total = Infinity;
  const allHits: InspireHit[] = [];

  while (allHits.length < total) {
    const url = `${base}&page=${page}`;
    if (isVerbose) process.stderr.write(`  GET ${url}\n`);
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`InspireHEP ${res.status} for ${bai}`);
    const data = (await res.json()) as InspireResponse;
    total = data.hits.total;
    allHits.push(...data.hits.hits);
    if (isVerbose) {
      process.stderr.write(`  fetched ${allHits.length} of ${total} total for ${bai}\n`);
    }
    page++;
    // Safety cap — anything over 2000 papers is almost certainly a query bug
    if (page > 10) break;
  }

  return allHits;
}

/**
 * Fetch arXiv papers for an ORCID via the atom2 author feed.
 * Uses https://arxiv.org/a/{orcid}.atom2 — the ONLY working ORCID endpoint.
 * (The standard export.arxiv.org/api/query search_query does NOT support ORCID.)
 *
 * HTTP 404 → warning + empty array (ORCID not registered on arXiv).
 */
async function fetchArXiv(orcid: string): Promise<ArXivEntry[]> {
  const url = `https://arxiv.org/a/${orcid}.atom2`;
  if (isVerbose) process.stderr.write(`  GET ${url}\n`);
  const res = await fetchWithRetry(url);
  if (res.status === 404) {
    process.stderr.write(`  Warning: arXiv ORCID not registered: ${orcid}\n`);
    return [];
  }
  if (!res.ok) throw new Error(`arXiv ${res.status} for ORCID ${orcid}`);
  const xml = await res.text();
  const parsed = xmlParser.parse(xml) as { feed?: { entry?: ArXivEntry[] } };
  return parsed?.feed?.entry ?? [];
}

// ---------------------------------------------------------------------------
// I. main()
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Guard: cannot skip both sources
  if (flags["no-arxiv"] && flags["no-inspire"]) {
    process.stderr.write(
      "No sources enabled — pass only one of --no-arxiv / --no-inspire\n",
    );
    process.exit(1);
  }

  // Read people and validate BAIs BEFORE any network I/O (SYNC-06)
  const people = readPeople();
  validateBAIs(people);

  const runInspire = !flags["no-inspire"];
  const runArxiv = !flags["no-arxiv"];

  // Filter to --member if specified
  const targetPeople = flags.member
    ? people.filter((p) => p.slug === flags.member)
    : people;

  if (flags.member && targetPeople.length === 0) {
    process.stderr.write(`--member "${flags.member}" not found in content/people.json\n`);
    process.exit(1);
  }

  // PLACEHOLDER — 09-02 wires extraction, 09-03 wires write gate
  process.stderr.write(
    `[scaffold] would sync ${targetPeople.length} member(s) ` +
      `(inspire=${runInspire}, arxiv=${runArxiv}, dry-run=${flags["dry-run"]})\n`,
  );

  // For 09-01 verification: exercise real fetch paths when --verbose + --member
  // are both set and the member has IDs. Avoids slow fetches in CI.
  if (flags.verbose && flags.member && targetPeople[0]?.inspirehep_id && runInspire) {
    const member = targetPeople[0];
    process.stderr.write(`[scaffold] fetching InspireHEP for ${member.slug}...\n`);
    const hits = await fetchInspireHEP(member.inspirehep_id!);
    process.stderr.write(`[scaffold] InspireHEP returned ${hits.length} hits\n`);
  }

  if (flags.verbose && flags.member && targetPeople[0]?.orcid_id && runArxiv) {
    const member = targetPeople[0];
    process.stderr.write(`[scaffold] fetching arXiv for ${member.slug}...\n`);
    const entries = await fetchArXiv(member.orcid_id!);
    process.stderr.write(`[scaffold] arXiv returned ${entries.length} entries\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// J. Exports — for 09-02 extraction layer and unit tests
// ---------------------------------------------------------------------------

export { fetchInspireHEP, fetchArXiv, fetchWithRetry, runBatched, xmlParser, BAI_REGEX };
export type { InspireHit, ArXivEntry, PersonWithSyncIds };
