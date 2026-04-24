/**
 * sync-publications.ts
 *
 * CLI: pnpm sync-publications [--dry-run] [--member <slug>] [--no-arxiv] [--no-inspire] [--no-orcid] [--verbose]
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
    "no-orcid":   { type: "boolean", default: false },
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

interface InspireThesisInfo {
  degree_type?: string;   // "phd" | "master" | "bachelor" | "diploma" | ...
  defense_date?: string;  // "YYYY-MM-DD"
  institutions?: { name?: string }[];
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
    thesis_info?: InspireThesisInfo;
    earliest_date?: string; // "YYYY" or "YYYY-MM" or "YYYY-MM-DD"
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
// ORCID response types (Phase 17) — minimal: only fields we read
// ---------------------------------------------------------------------------

export interface OrcidExternalId {
  "external-id-type": string; // "doi" | "arxiv" | "issn" | "other-id" | ...
  "external-id-value": string;
}

interface OrcidWorkSummary {
  "put-code": number;
  title: { title: { value: string } };
  "external-ids": { "external-id": OrcidExternalId[] };
  type: string; // "journal-article" | "conference-paper" | ...
  "publication-date"?: { year?: { value: string } | null } | null;
  "journal-title"?: { value: string } | null;
}

interface OrcidGroup {
  "external-ids": { "external-id": OrcidExternalId[] }; // UNION across sibling summaries
  "work-summary": OrcidWorkSummary[]; // 1..N
}

interface OrcidWorksResponse {
  group: OrcidGroup[];
}

export interface OrcidLookupEntry {
  publicationId: string;
  orcid: string;
  putCode: number;
}

interface OrcidContributor {
  "credit-name"?: { value: string } | null;
  // NOTE: contributor-orcid / contributor-attributes exist but we don't read them.
}

interface OrcidWorkDetail {
  contributors?: { contributor?: OrcidContributor[] | null } | null;
  // Detail endpoint also returns everything the summary has; we only use contributors.
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
 *  - Exponential backoff (2s → 4s → 8s, capped at 30s) on:
 *      - HTTP 429 / 503 responses
 *      - Network errors (fetch throws): timeouts, DNS failures, connection resets
 *    Non-retryable errors (e.g. TypeError for an invalid URL) propagate immediately.
 */
async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  maxRetries = 3,
  baseDelayMs = 2000,
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { "User-Agent": USER_AGENT, ...(init?.headers ?? {}) },
      });
      if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * 2 ** attempt, 30_000);
        if (isVerbose) {
          process.stderr.write(`  ${response.status} — retry ${attempt + 1}/${maxRetries} in ${delay}ms\n`);
        }
        await sleep(delay);
        attempt++;
        continue;
      }
      return response;
    } catch (err) {
      // Retry only on transient network failures: AbortError (timeout) and
      // fetch's generic TypeError (DNS, ECONNRESET, ECONNREFUSED, etc.).
      // We can't easily distinguish invalid-URL TypeErrors from network TypeErrors,
      // so we retry both — worst case is 3 retries on a bad URL, then it propagates.
      const isAbort = err instanceof Error && err.name === "TimeoutError";
      const isNetwork = err instanceof TypeError;
      if ((isAbort || isNetwork) && attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * 2 ** attempt, 30_000);
        if (isVerbose) {
          const label = isAbort ? "timeout" : "network";
          process.stderr.write(`  ${label} — retry ${attempt + 1}/${maxRetries} in ${delay}ms\n`);
        }
        await sleep(delay);
        attempt++;
        continue;
      }
      throw err;
    }
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
 * Paginates using hits.total; safety cap at 10 pages (2000 papers). On cap-hit
 * with more results available, pushes a warning into `warnings` so a future
 * high-volume author isn't silently truncated.
 * Returns raw InspireHit[] — transformation is 09-02's job.
 *
 * SYNC-05: no arXiv name-based fallback exists in this code.
 */
async function fetchInspireHEP(bai: string, warnings?: string[]): Promise<InspireHit[]> {
  const fields =
    "arxiv_eprints,titles,authors,publication_info,preprint_date,dois,control_number,abstracts,thesis_info,earliest_date";
  const base =
    `https://inspirehep.net/api/literature` +
    `?q=a%20${encodeURIComponent(bai)}` +
    `&size=${INSPIRE_PAGE_SIZE}` +
    `&sort=mostrecent` +
    `&fields=${fields}`;

  let page = 1;
  let total = Infinity;
  const allHits: InspireHit[] = [];
  const pageCap = 10;

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
    if (page > pageCap) {
      if (allHits.length < total && warnings) {
        warnings.push(
          `InspireHEP pagination cap hit for ${bai}: fetched ${allHits.length} of ${total} — raise pageCap or tighten the query`,
        );
      }
      break;
    }
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

/**
 * Fetch an ORCID works list and extract Publication[] + a put-code side-map.
 *
 * - Anonymous Public API endpoint (no OAuth required).
 * - MUST send Accept: application/json (Pitfall 1 — default is XML).
 * - HTTP 404 → warning + empty result (ORCID-03).
 * - Empty `group: []` (HTTP 200) is silent — legitimate empty profile (Pitfall 7).
 * - The returned `lookup` gives plan 17-03 the (orcid, put-code) needed to fetch
 *   per-work details for rows that survive DOI dedup.
 */
async function fetchOrcid(
  orcid: string,
  ownerName: string,
): Promise<{ publications: Publication[]; lookup: OrcidLookupEntry[] }> {
  const url = `https://pub.orcid.org/v3.0/${orcid}/works`;
  if (isVerbose) process.stderr.write(`  GET ${url}\n`);
  const res = await fetchWithRetry(url, { headers: { Accept: "application/json" } });
  if (res.status === 404) {
    process.stderr.write(`  Warning: ORCID profile not public or empty: ${orcid}\n`);
    return { publications: [], lookup: [] };
  }
  if (!res.ok) throw new Error(`ORCID ${res.status} for ${orcid}`);

  const data = (await res.json()) as OrcidWorksResponse;
  const publications: Publication[] = [];
  const lookup: OrcidLookupEntry[] = [];

  for (const group of data.group ?? []) {
    const extracted = orcidGroupToPublication(group, ownerName);
    if (!extracted) continue;
    publications.push(extracted.publication);
    lookup.push({ publicationId: extracted.publication.id, orcid, putCode: extracted.putCode });
  }

  return { publications, lookup };
}

/**
 * Fetch a single ORCID work's full detail, keyed by (orcid, put-code).
 * Used by enrichOrcidAuthors to populate the full author list on ORCID-only
 * publications (ORCID-06).
 *
 * Returns null on HTTP 404 — possible if the profile changed between the
 * works-list fetch and this detail fetch; we keep the placeholder authors.
 */
async function fetchOrcidWorkDetail(
  orcid: string,
  putCode: number,
): Promise<OrcidWorkDetail | null> {
  const url = `https://pub.orcid.org/v3.0/${orcid}/work/${putCode}`;
  if (isVerbose) process.stderr.write(`  GET ${url}\n`);
  const res = await fetchWithRetry(url, { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`ORCID work detail ${res.status} for ${orcid}/${putCode}`);
  return (await res.json()) as OrcidWorkDetail;
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
 * Map an InspireHEP `thesis_info.degree_type` to a human-readable prefix.
 * Unknown values fall through to plain "Thesis".
 */
function thesisLabel(degreeType?: string): string {
  // Inspire returns degree_type inconsistently — "phd" from /literature/{id},
  // "PhD" from the search endpoint. Lowercase before matching.
  switch (degreeType?.toLowerCase()) {
    case "phd":      return "PhD Thesis";
    case "master":   return "Master's Thesis";
    case "bachelor": return "Bachelor's Thesis";
    case "diploma":  return "Diploma Thesis";
    case "habilitation": return "Habilitation Thesis";
    default:         return "Thesis";
  }
}

/**
 * Parse a 4-digit year from an Inspire date string (YYYY, YYYY-MM, or YYYY-MM-DD).
 * Returns NaN on empty/malformed input.
 */
function yearFromInspireDate(date: string | undefined): number {
  if (!date) return NaN;
  return parseInt(date.slice(0, 4), 10);
}

/**
 * Transform a raw InspireHEP hit into a Publication object.
 *
 * Year resolution ladder (first match wins):
 *   1. publication_info[0].year         — published papers
 *   2. preprint_date YYYY               — arXiv preprints
 *   3. thesis_info.defense_date YYYY    — theses (no publication_info / preprint_date)
 *   4. earliest_date YYYY               — Inspire's catch-all
 *   5. current year — last resort, pushes a warning when `warnings` is provided
 *
 * Journal rendering:
 *   - publication_info present → "{journal_title} {volume} ({year}) {artid}"
 *   - thesis_info present      → "{PhD|Master's|…} Thesis, {institution}"
 *   - otherwise                → "Preprint"
 */
export function inspireHitToPublication(
  hit: InspireHit,
  warnings?: string[],
): Publication {
  const meta = hit.metadata;
  const arxivId = meta.arxiv_eprints?.[0]?.value; // bare, e.g. "2603.11236"
  const pi = meta.publication_info?.[0];
  const ti = meta.thesis_info;

  // Year resolution: publication_info → preprint_date → thesis_info.defense_date → earliest_date → current year
  const parsedPreprintYear = yearFromInspireDate(meta.preprint_date);
  const parsedThesisYear = yearFromInspireDate(ti?.defense_date);
  const parsedEarliestYear = yearFromInspireDate(meta.earliest_date);
  const hasYear =
    pi?.year !== undefined ||
    Number.isFinite(parsedPreprintYear) ||
    Number.isFinite(parsedThesisYear) ||
    Number.isFinite(parsedEarliestYear);
  const year: number =
    pi?.year ??
    (Number.isFinite(parsedPreprintYear)
      ? parsedPreprintYear
      : Number.isFinite(parsedThesisYear)
        ? parsedThesisYear
        : Number.isFinite(parsedEarliestYear)
          ? parsedEarliestYear
          : new Date().getFullYear());

  const thesisJournal = ti
    ? [thesisLabel(ti.degree_type), ti.institutions?.[0]?.name]
        .filter(Boolean)
        .join(", ")
    : "";

  const journal: string =
    (pi
      ? [pi.journal_title, pi.journal_volume, pi.year ? `(${pi.year})` : "", pi.artid]
          .filter(Boolean)
          .join(" ")
      : "") ||
    thesisJournal ||
    "Preprint";

  // DOI preference: material==="publication" over "bibmatch"
  const doi =
    meta.dois?.find((d) => d.material === "publication")?.value ?? meta.dois?.[0]?.value;

  // Title: prefer non-arXiv-sourced title (Pitfall 9)
  const rawTitle =
    meta.titles.find((t) => t.source !== "arXiv")?.title ??
    meta.titles[0]?.title ??
    "Untitled";
  const cleanTitle = stripBibTeX(rawTitle).normalize("NFC");

  if (!hasYear && warnings) {
    const displayId = arxivId ?? `inspire-${meta.control_number}`;
    warnings.push(
      `Missing year for inspirehep ${displayId} "${cleanTitle}" — defaulted to ${year}`,
    );
  }

  const pub: Publication = {
    id: arxivId ?? `inspire-${meta.control_number}`,
    authors: meta.authors.map((a) => a.full_name.normalize("NFC")),
    title: cleanTitle,
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
 * Convert a single ORCID works-list group into a Publication, or return null if
 * the group should be dropped (non-publication type, no work-summary, missing title).
 *
 * Extraction follows ORCID-05:
 *   - id preference: DOI → arXiv → `orcid-{put-code}`
 *   - title from work-summary[0].title.title.value
 *   - year from work-summary[0].publication-date.year.value, else current year
 *   - journal from work-summary[0].journal-title.value, else "Preprint"
 *   - doi/arxiv extracted from GROUP-level external-ids (Pattern 2: union)
 *
 * authors is seeded with [ownerName] as a placeholder; the caller or a later
 * enrichment pass replaces it with the real contributor list.
 */
function orcidGroupToPublication(
  group: OrcidGroup,
  ownerName: string,
): { publication: Publication; putCode: number } | null {
  const ws = group["work-summary"]?.[0];
  if (!ws) return null;

  // ORCID-04: filter work types
  if (ws.type !== "journal-article" && ws.type !== "conference-paper") return null;

  // Pattern 2: use GROUP-level external-ids (union), NOT work-summary[0]
  const groupIds = group["external-ids"]?.["external-id"] ?? [];
  const doi = groupIds.find((e) => e["external-id-type"] === "doi")?.["external-id-value"];
  const arxiv = groupIds.find((e) => e["external-id-type"] === "arxiv")?.["external-id-value"];

  const putCode = ws["put-code"];
  if (typeof putCode !== "number") return null; // malformed response

  const id = doi ?? arxiv ?? `orcid-${putCode}`;

  const yearStr = ws["publication-date"]?.year?.value;
  const parsedYear = yearStr ? parseInt(yearStr, 10) : NaN;
  const year = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();

  const journal = ws["journal-title"]?.value?.normalize("NFC") ?? "Preprint";

  const rawTitle = ws.title?.title?.value;
  if (!rawTitle) return null; // schema requires title
  const title = rawTitle.normalize("NFC");

  const publication: Publication = {
    id,
    authors: [ownerName], // placeholder; enrichment pass (17-03) replaces for ORCID-only rows
    title,
    journal,
    year,
    topic_tags: [],
    source: "orcid" as const,
    ...(arxiv ? { arxiv } : {}),
    ...(doi ? { doi } : {}),
  };

  return { publication, putCode };
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
 * DEDUP-03: Normalize a DOI for comparison. Lowercases, strips
 * https?://(dx.)?doi.org/ prefix variants, trims whitespace.
 * Existing stored DOIs are "bare" (no prefix) per shared.ts doiId regex,
 * but normalisation is defensive for future ORCID data.
 */
export function normalizeDoi(doi: string): string {
  return doi
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .trim();
}

/**
 * DEDUP-01/02/04/05: Cross-source DOI dedup.
 * Input MUST be ordered by source priority (high → low): manual, inspire, orcid, arxiv.
 * First-seen wins. Entries without a DOI pass through unchanged.
 * Returns [deduped, droppedCount].
 */
export function dedupByDoi(entries: Publication[]): [Publication[], number] {
  const seen = new Map<string, Publication>();
  const out: Publication[] = [];
  let dropped = 0;
  for (const p of entries) {
    if (!p.doi) {
      out.push(p);
      continue;
    }
    const key = normalizeDoi(p.doi);
    if (seen.has(key)) {
      dropped++;
      continue;
    }
    seen.set(key, p);
    out.push(p);
  }
  return [out, dropped];
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
 * Sort publications deterministically (SYNC-10, SYNC-13).
 *
 * Sort order matches getPublicationsByAuthor in src/content/accessors/publications.ts:
 *   1. year desc
 *   2. arXiv ID desc (localeCompare) — within same year, for entries with arXiv IDs
 *   3. no-arXiv entries last within a year bucket
 *
 * Dedup is applied at the call site BEFORE mergePublications — see main() pipeline.
 * Accepts a single pre-concatenated array (priority order already established by caller).
 */
export function mergePublications(entries: Publication[]): Publication[] {
  const merged = [...entries];
  merged.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (a.arxiv && b.arxiv) return b.arxiv.localeCompare(a.arxiv);
    if (a.arxiv) return -1;
    if (b.arxiv) return 1;
    return 0;
  });
  return merged;
}

/**
 * For every ORCID-only survivor of cross-source dedup, replace the placeholder
 * author list with the full credit-name list from the ORCID per-work detail
 * endpoint (ORCID-06).
 *
 * Concurrency matches ORCID-07 (runBatched defaults: ≤5 in flight, 2s pause).
 *
 * Non-ORCID survivors pass through unchanged. ORCID rows whose put-code is not in
 * the lookup map (e.g. because they came from a prior cached run — should not happen
 * in the current pipeline, but defensive) also pass through unchanged.
 *
 * If the detail endpoint returns null or the contributors list is empty/unnamed,
 * the placeholder authors are preserved (schema requires authors.length >= 1).
 */
export async function enrichOrcidAuthors(
  survivors: Publication[],
  lookupByPubId: Map<string, { orcid: string; putCode: number }>,
): Promise<Publication[]> {
  const toEnrich = survivors.filter(
    (p) => p.source === "orcid" && lookupByPubId.has(p.id),
  );
  if (toEnrich.length === 0) return survivors;

  const tasks = toEnrich.map((p) => async (): Promise<[string, Publication]> => {
    const entry = lookupByPubId.get(p.id)!;
    const detail = await fetchOrcidWorkDetail(entry.orcid, entry.putCode);
    if (!detail) return [p.id, p];

    const authors =
      detail.contributors?.contributor
        ?.map((c) => c["credit-name"]?.value?.normalize("NFC"))
        .filter((n): n is string => !!n && n.length > 0) ?? [];

    if (authors.length === 0) return [p.id, p]; // keep placeholder
    return [p.id, { ...p, authors }];
  });

  const enriched = await runBatched(tasks);
  const byId = new Map(enriched);
  return survivors.map((p) => byId.get(p.id) ?? p);
}

// ---------------------------------------------------------------------------
// J. Per-member sync worker
// ---------------------------------------------------------------------------

type MemberSyncResult = {
  slug: string;
  name: string;
  inspirePubs: Publication[];
  arxivPubs: Publication[];
  orcidPubs: Publication[];
  orcidLookup: OrcidLookupEntry[]; // side-map for 17-03 enrichment pass
  warnings: string[];
};

async function syncMember(
  person: PersonWithSyncIds,
  runInspire: boolean,
  runArxiv: boolean,
  runOrcid: boolean,
): Promise<MemberSyncResult> {
  const result: MemberSyncResult = {
    slug: person.slug,
    name: person.name,
    inspirePubs: [],
    arxivPubs: [],
    orcidPubs: [],
    orcidLookup: [],
    warnings: [],
  };

  if (!person.inspirehep_id && !person.orcid_id) {
    result.warnings.push(`skipped ${person.slug}: no sync IDs`);
    return result;
  }

  if (runInspire) {
    if (person.inspirehep_id) {
      const hits = await fetchInspireHEP(person.inspirehep_id, result.warnings);
      if (hits.length === 0) {
        result.warnings.push(
          `No InspireHEP results for ${person.name} (${person.inspirehep_id})`,
        );
      }
      result.inspirePubs = hits.map((hit) => inspireHitToPublication(hit, result.warnings));
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

  if (runOrcid) {
    if (person.orcid_id) {
      // HTTP 200 with empty group: no warning (research Pitfall 7 / STATE.md 16-03 contextual warnings).
      // The 404 warning is emitted inside fetchOrcid (ORCID-03).
      const { publications, lookup } = await fetchOrcid(person.orcid_id, person.name);
      result.orcidPubs = publications;
      result.orcidLookup = lookup;
    } else {
      result.warnings.push(`skipping ORCID for ${person.name}: no orcid_id`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// K. main()
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Guard: cannot skip all sources
  if (flags["no-arxiv"] && flags["no-inspire"] && flags["no-orcid"]) {
    process.stderr.write("No sources enabled\n");
    process.exit(1);
  }

  // Read people and validate BAIs BEFORE any network I/O (SYNC-06)
  const people = readPeople();
  validateBAIs(people);

  const runInspire = !flags["no-inspire"];
  const runArxiv   = !flags["no-arxiv"];
  const runOrcid   = !flags["no-orcid"];

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
  const tasks = targetPeople.map((p) => () => syncMember(p, runInspire, runArxiv, runOrcid));
  const memberResults = await runBatched(tasks);

  // Emit per-member progress lines (stdout) and drain warnings (stderr)
  const allWarnings: string[] = [];
  for (const r of memberResults) {
    const inspireCell = runInspire ? String(r.inspirePubs.length) : "skipped";
    const arxivCell   = runArxiv   ? String(r.arxivPubs.length)   : "skipped";
    const orcidCell   = runOrcid   ? String(r.orcidPubs.length)   : "skipped";
    process.stdout.write(
      `${r.slug} — InspireHEP: ${inspireCell}, arXiv: ${arxivCell}, ORCID: ${orcidCell}\n`,
    );
    for (const w of r.warnings) {
      process.stderr.write(`Warning: ${w}\n`);
      allWarnings.push(w);
    }
  }

  // Intra-source dedup by arXiv ID (SYNC-09)
  const allInspire = dedupByArxivId(memberResults.flatMap((r) => r.inspirePubs));
  const allOrcid   = dedupByArxivId(memberResults.flatMap((r) => r.orcidPubs));
  const allArxiv   = dedupByArxivId(memberResults.flatMap((r) => r.arxivPubs));
  const manualEntries = readManualEntries();

  // Concat in source-priority order: manual, inspire, orcid, arxiv.
  // Priority order matters for BOTH arXiv-ID cross-dedup AND DOI cross-dedup
  // (first-seen-wins). Manual comes first so hand-curated entries are never dropped.
  const priorityOrdered = [...manualEntries, ...allInspire, ...allOrcid, ...allArxiv];

  // Cross-source dedup by arXiv ID (existing behaviour — catches inspire+arxiv dupes).
  const postArxivDedup = dedupByArxivId(priorityOrdered);

  // Cross-source dedup by DOI (new — catches inspire+orcid and orcid+arxiv DOI matches).
  // CRITICAL: must run BEFORE the sort in mergePublications; the sort scrambles
  // source order and would break first-seen-wins precedence.
  const [postDoiDedup, dedupedCount] = dedupByDoi(postArxivDedup);

  // ORCID-06: enrich full author lists on ORCID-only survivors (runs AFTER dedup
  // so we never waste detail calls on rows that lost to InspireHEP/arXiv).
  // Build the lookup from every member's orcidLookup; first-seen wins on duplicate
  // publication ids (if two members share an ORCID-only paper via their profiles).
  const lookupByPubId = new Map<string, { orcid: string; putCode: number }>();
  for (const r of memberResults) {
    for (const entry of r.orcidLookup) {
      if (!lookupByPubId.has(entry.publicationId)) {
        lookupByPubId.set(entry.publicationId, { orcid: entry.orcid, putCode: entry.putCode });
      }
    }
  }
  const enriched = await enrichOrcidAuthors(postDoiDedup, lookupByPubId);

  // Final sort (year desc, arxiv desc, no-arxiv last). Dedup + enrichment complete.
  const merged = mergePublications(enriched);

  // Build _meta block (CONTEXT.md §_meta block shape)
  const meta: PublicationsMeta = {
    synced_at: new Date().toISOString(),
    sources: [
      ...(runInspire ? (["inspirehep"] as const) : []),
      ...(runOrcid   ? (["orcid"]      as const) : []),
      ...(runArxiv   ? (["arxiv"]      as const) : []),
    ],
    counts: {
      inspirehep: allInspire.length,
      arxiv:      allArxiv.length,
      manual:     manualEntries.length,
      orcid:      allOrcid.length,
      deduped:    dedupedCount,
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
        ` (${added} added, ${removed} removed, ${unchanged} unchanged, ${dedupedCount} deduped, ${allWarnings.length} warnings)\n` +
        `Would write ${json.length} bytes to ${outputPath}\n`,
    );
    return;
  }

  writeFileSync(outputPath, json);

  // SYNC-15: final summary line captured by GitHub Action step summary (Phase 10)
  process.stdout.write(
    `Sync complete: ${merged.length} publications` +
      ` (${added} added, ${removed} removed, ${unchanged} unchanged, ${dedupedCount} deduped, ${allWarnings.length} warnings)\n`,
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
export { fetchInspireHEP, fetchArXiv, fetchWithRetry, fetchOrcid, orcidGroupToPublication, runBatched, xmlParser, BAI_REGEX };
// 09-02 extraction layer (inline-exported on their declarations above)
// stripBibTeX, inspireHitToPublication, arxivEntryToPublication,
// dedupByArxivId, normalizeDoi, dedupByDoi, readManualEntries, mergePublications
export type { InspireHit, ArXivEntry, PersonWithSyncIds };
