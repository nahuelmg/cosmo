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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { XMLParser, type MatcherView } from "fast-xml-parser";
// Relative imports — no @/ alias; tsx CJS does not resolve webpack aliases
import { PersonSchema } from "../src/content/schemas/people.schema";
import {
  PublicationsFileSchema,
  type Publication,
  type PublicationsMeta,
} from "../src/content/schemas/publications.schema";
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
// I. Extraction helpers — pure functions (exported for tests)
// ---------------------------------------------------------------------------

/**
 * Defensive strip of BibTeX markup from InspireHEP title strings.
 * In practice InspireHEP JSON API rarely contains LaTeX markup, but this
 * guard prevents garbage like "\textit{foo}" from appearing in the UI.
 */
export function stripBibTeX(title: string): string {
  // Remove outer braces: {Title} → Title
  let cleaned = title.replace(/^\{(.+)\}$/, "$1");
  // Remove \command{text} patterns: \textit{foo} → foo
  cleaned = cleaned.replace(/\\[A-Za-z]+\{([^}]*)\}/g, "$1");
  // Remove remaining standalone braces
  cleaned = cleaned.replace(/[{}]/g, "");
  return cleaned.trim();
}

/**
 * Transform a raw InspireHEP hit into a Publication object.
 *
 * Year resolution (SYNC-07):
 *   1. publication_info[0].year
 *   2. preprint_date YYYY segment
 *   3. current year (last resort)
 */
export function inspireHitToPublication(hit: InspireHit): Publication {
  const meta = hit.metadata;
  const arxivId = meta.arxiv_eprints?.[0]?.value; // bare, e.g. "2603.11236"
  const pi = meta.publication_info?.[0];

  // Year resolution: publication_info[0].year → preprint_date YYYY → current year
  const parsedPreprintYear = meta.preprint_date
    ? parseInt(meta.preprint_date.split("-")[0], 10)
    : NaN;
  const year: number =
    pi?.year ?? (Number.isFinite(parsedPreprintYear) ? parsedPreprintYear : new Date().getFullYear());

  const journal: string =
    (pi
      ? [pi.journal_title, pi.journal_volume, pi.year ? `(${pi.year})` : "", pi.artid]
          .filter(Boolean)
          .join(" ")
      : "") || "Preprint";

  // DOI preference: material==="publication" over "bibmatch"
  const doi =
    meta.dois?.find((d) => d.material === "publication")?.value ?? meta.dois?.[0]?.value;

  // Title: prefer non-arXiv-sourced title (Pitfall 9)
  const rawTitle =
    meta.titles.find((t) => t.source !== "arXiv")?.title ??
    meta.titles[0]?.title ??
    "Untitled";

  const pub: Publication = {
    id: arxivId ?? `inspire-${meta.control_number}`,
    authors: meta.authors.map((a) => a.full_name.normalize("NFC")),
    title: stripBibTeX(rawTitle).normalize("NFC"),
    journal,
    year,
    topic_tags: [],
    source: "inspirehep",
    ...(arxivId ? { arxiv: arxivId } : {}),
    ...(doi ? { doi } : {}),
    ...(meta.abstracts?.[0]?.value
      ? { abstract: meta.abstracts[0].value.normalize("NFC") }
      : {}),
  };
  return pub;
}

/**
 * Transform a raw arXiv atom2 entry into a Publication object.
 *
 * atom2 author format (Pitfall 3): ONE <author> element whose <name> is a
 * comma-delimited CSV of all authors — NOT one element per author.
 */
export function arxivEntryToPublication(entry: ArXivEntry): Publication {
  // entry.id = "http://arxiv.org/abs/1305.1476v1" → "1305.1476"
  const arxivId = entry.id.split("/abs/")[1]?.replace(/v\d+$/, "");
  if (!arxivId) throw new Error(`arXiv entry without parseable id: ${entry.id}`);

  const year = parseInt(entry.published.slice(0, 4), 10);

  // atom2 packs all authors into ONE <name> as a comma-delimited string (Pitfall 3)
  const authorCsv = entry.author?.[0]?.name ?? "";
  const authors = authorCsv
    .split(", ")
    .map((a) => a.normalize("NFC").trim())
    .filter((a) => a.length > 0);

  return {
    id: arxivId,
    authors: authors.length > 0 ? authors : ["Unknown"],
    title: stripBibTeX(entry.title).normalize("NFC"),
    journal: "Preprint",
    year,
    arxiv: arxivId,
    topic_tags: [],
    source: "arxiv",
    ...(entry.summary ? { abstract: entry.summary.normalize("NFC") } : {}),
  };
}

/**
 * Intra-source dedup by arXiv ID (SYNC-09, Pitfall 6).
 * Prevents Planck/Euclid co-authored papers from appearing once per member.
 * Key on p.arxiv when present; falls back to p.id for InspireHEP-only entries.
 * First-seen wins.
 */
export function dedupByArxivId(entries: Publication[]): Publication[] {
  const seen = new Set<string>();
  const out: Publication[] = [];
  for (const p of entries) {
    const key = p.arxiv ?? p.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/**
 * Read existing content/publications.json and extract manual entries.
 *
 * Handles three file shapes:
 *  1. File missing → []
 *  2. Bare array (v1.0) → filter where source==="manual" || source===undefined
 *  3. Wrapped { _meta, publications } (v1.1 produced by a sync run) → same filter
 *
 * Uses plain JSON.parse (no Zod) to preserve byte-identical source fields on
 * entries that don't have the field explicitly set.
 */
export function readManualEntries(cwd: string = process.cwd()): Publication[] {
  const filePath = resolve(cwd, "content/publications.json");
  if (!existsSync(filePath)) return [];
  const raw = JSON.parse(readFileSync(filePath, "utf-8")) as unknown;
  const list: Publication[] = Array.isArray(raw)
    ? (raw as Publication[])
    : ((raw as { publications?: Publication[] }).publications ?? []);
  return list
    .filter((p) => p.source === "manual" || p.source === undefined)
    .map((p) => ({ ...p, source: "manual" as const }));
}

/**
 * Read ALL entries from the existing content/publications.json (both manual and synced).
 * Used to compute added/removed/unchanged counts for the summary log.
 * Handles three file shapes: missing → [], bare array (v1.0), wrapped { _meta, publications }.
 */
export function readAllExistingEntries(cwd: string = process.cwd()): Publication[] {
  const filePath = resolve(cwd, "content/publications.json");
  if (!existsSync(filePath)) return [];
  const raw = JSON.parse(readFileSync(filePath, "utf-8")) as unknown;
  return Array.isArray(raw)
    ? (raw as Publication[])
    : ((raw as { publications?: Publication[] }).publications ?? []);
}

/**
 * Merge publications from all sources and sort deterministically (SYNC-10, SYNC-13).
 *
 * Sort order matches getPublicationsByAuthor in src/content/accessors/publications.ts:
 *   1. year desc
 *   2. arXiv ID desc (localeCompare) — within same year, for entries with arXiv IDs
 *   3. no-arXiv entries last within a year bucket
 *
 * No cross-source dedup (locked v1.1 decision).
 * Dedup is applied per-source at the call site before mergePublications is called.
 */
export function mergePublications(
  manualEntries: Publication[],
  inspireEntries: Publication[],
  arxivEntries: Publication[],
): Publication[] {
  const merged = [...manualEntries, ...inspireEntries, ...arxivEntries];
  merged.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (a.arxiv && b.arxiv) return b.arxiv.localeCompare(a.arxiv);
    if (a.arxiv) return -1;
    if (b.arxiv) return 1;
    return 0;
  });
  return merged;
}

// ---------------------------------------------------------------------------
// J. Per-member sync worker
// ---------------------------------------------------------------------------

type MemberSyncResult = {
  slug: string;
  name: string;
  inspirePubs: Publication[];
  arxivPubs: Publication[];
  warnings: string[];
};

async function syncMember(
  person: PersonWithSyncIds,
  runInspire: boolean,
  runArxiv: boolean,
): Promise<MemberSyncResult> {
  const result: MemberSyncResult = {
    slug: person.slug,
    name: person.name,
    inspirePubs: [],
    arxivPubs: [],
    warnings: [],
  };

  if (!person.inspirehep_id && !person.orcid_id) {
    result.warnings.push(`skipped ${person.slug}: no sync IDs`);
    return result;
  }

  if (runInspire) {
    if (person.inspirehep_id) {
      const hits = await fetchInspireHEP(person.inspirehep_id);
      if (hits.length === 0) {
        result.warnings.push(
          `No InspireHEP results for ${person.name} (${person.inspirehep_id})`,
        );
      }
      result.inspirePubs = hits.map(inspireHitToPublication);
    } else {
      result.warnings.push(`skipping InspireHEP for ${person.name}: no inspirehep_id`);
    }
  }

  if (runArxiv) {
    if (person.orcid_id) {
      const entries = await fetchArXiv(person.orcid_id);
      if (entries.length === 0) {
        result.warnings.push(`No arXiv results for ${person.name} (${person.orcid_id})`);
      }
      result.arxivPubs = entries.map(arxivEntryToPublication);
    } else {
      result.warnings.push(`skipping arXiv for ${person.name}: no orcid_id`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// K. main()
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

  // Capture existing file state BEFORE any writes (for added/removed/unchanged counts)
  const existingAll = readAllExistingEntries();
  const existingIds = new Set(existingAll.map((p) => p.id));

  // Filter to --member if specified; otherwise sync all members with at least one ID
  const targetPeople = flags.member
    ? people.filter((p) => p.slug === flags.member)
    : people.filter((p) => p.inspirehep_id || p.orcid_id);

  if (flags.member && targetPeople.length === 0) {
    process.stderr.write(`--member "${flags.member}" not found in content/people.json\n`);
    process.exit(1);
  }

  process.stdout.write(`Syncing ${targetPeople.length} member(s)...\n`);

  // NOTE: runBatched uses Promise.all, so any per-member fetch error propagates here
  // and aborts the whole sync BEFORE the write-gate is reached. This enforces
  // Pitfall 2 / CONTEXT.md "file-level atomicity" — last-good JSON is preserved.
  const tasks = targetPeople.map((p) => () => syncMember(p, runInspire, runArxiv));
  const memberResults = await runBatched(tasks);

  // Emit per-member progress lines (stdout) and drain warnings (stderr)
  const allWarnings: string[] = [];
  for (const r of memberResults) {
    const inspireCell = runInspire ? String(r.inspirePubs.length) : "skipped";
    const arxivCell = runArxiv ? String(r.arxivPubs.length) : "skipped";
    process.stdout.write(`${r.slug} — InspireHEP: ${inspireCell}, arXiv: ${arxivCell}\n`);
    for (const w of r.warnings) {
      process.stderr.write(`Warning: ${w}\n`);
      allWarnings.push(w);
    }
  }

  // Concatenate per-source across all members, then dedup intra-source by arXiv ID (SYNC-09)
  const allInspire = dedupByArxivId(memberResults.flatMap((r) => r.inspirePubs));
  const allArxiv = dedupByArxivId(memberResults.flatMap((r) => r.arxivPubs));
  const manualEntries = readManualEntries();

  const preMerged = mergePublications(manualEntries, allInspire, allArxiv);

  // Cross-source dedup by arXiv ID (Rule 1 Bug fix):
  // A paper appearing in both InspireHEP (with arxiv_eprints[0]) and arXiv (ORCID feed)
  // gets id = arXiv ID from both extractors, producing duplicate IDs in the merged array.
  // Apply first-seen-wins dedup across the full merged set — since mergePublications puts
  // manualEntries first, then inspireEntries, then arxivEntries, InspireHEP entries (which
  // have structured journal info) win over arXiv-only duplicates of the same paper.
  const merged = dedupByArxivId(preMerged);

  // Build _meta block (CONTEXT.md §_meta block shape)
  const meta: PublicationsMeta = {
    synced_at: new Date().toISOString(),
    sources: [
      ...(runInspire ? (["inspirehep"] as const) : []),
      ...(runArxiv   ? (["arxiv"]     as const) : []),
    ],
    counts: {
      inspirehep: allInspire.length,
      arxiv:      allArxiv.length,
      manual:     manualEntries.length,
      orcid:      0,
      deduped:    0,
    },
    warnings: allWarnings,
  };

  const fileData = { _meta: meta, publications: merged };

  // Schema validation gate (SYNC-11): safeParse in memory before any write
  const result = PublicationsFileSchema.safeParse(fileData);
  if (!result.success) {
    process.stderr.write("Schema validation failed:\n");
    for (const issue of result.error.issues) {
      process.stderr.write(`  ${issue.path.join(".")}: ${issue.message}\n`);
    }
    process.exit(1);
  }

  // Compute diff counts for summary line (SYNC-15)
  const newIds = new Set(merged.map((p) => p.id));
  const added = [...newIds].filter((id) => !existingIds.has(id)).length;
  const removed = [...existingIds].filter((id) => !newIds.has(id)).length;
  const unchanged = merged.length - added;

  // Determine output path (SYNC-12, CONTEXT.md §CLI surface)
  let outputPath: string;
  if (flags.member) {
    // --member MUST NOT write to content/publications.json (corruption risk)
    mkdirSync(resolve(process.cwd(), "scripts/tmp"), { recursive: true });
    outputPath = resolve(process.cwd(), `scripts/tmp/sync-${flags.member}.json`);
  } else {
    outputPath = resolve(process.cwd(), "content/publications.json");
  }

  const json = JSON.stringify(fileData, null, 2) + "\n"; // 2-space indent, trailing newline

  if (flags["dry-run"]) {
    process.stdout.write(
      `Sync complete (dry-run): ${merged.length} publications` +
        ` (${added} added, ${removed} removed, ${unchanged} unchanged, ${allWarnings.length} warnings)\n` +
        `Would write ${json.length} bytes to ${outputPath}\n`,
    );
    return;
  }

  writeFileSync(outputPath, json);

  // SYNC-15: final summary line captured by GitHub Action step summary (Phase 10)
  process.stdout.write(
    `Sync complete: ${merged.length} publications` +
      ` (${added} added, ${removed} removed, ${unchanged} unchanged, ${allWarnings.length} warnings)\n`,
  );
  if (flags.member) {
    process.stdout.write(`Wrote per-member output to ${outputPath} (git-ignored)\n`);
  }
}

// Guard: only run main() when executed directly (not when imported by Vitest or other modules)
if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}

// ---------------------------------------------------------------------------
// K. Exports — for 09-02/09-03 and unit tests
// ---------------------------------------------------------------------------

// 09-01 primitives (not inline-exported — exported here)
export { fetchInspireHEP, fetchArXiv, fetchWithRetry, runBatched, xmlParser, BAI_REGEX };
// 09-02 extraction layer (inline-exported on their declarations above)
// stripBibTeX, inspireHitToPublication, arxivEntryToPublication,
// dedupByArxivId, readManualEntries, mergePublications
export type { InspireHit, ArXivEntry, PersonWithSyncIds };
