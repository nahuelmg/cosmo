# Phase 9: Sync Script — Research

**Researched:** 2026-04-19
**Domain:** Node.js CLI script — InspireHEP + arXiv APIs, XML parsing, schema evolution, concurrency control
**Overall confidence:** HIGH — all API shapes live-verified, all project internals read from source

---

## Summary

Phase 9 writes `scripts/sync-publications.ts`, a CLI tool that fetches publications from InspireHEP (by BAI) and arXiv (by ORCID via atom2 feed), merges them with existing manual entries, validates in-memory with Zod, and atomically writes `content/publications.json` with a `_meta` block.

Key discoveries that affect planning:

1. **arXiv ORCID queries do NOT use the standard API** (`export.arxiv.org/api/query`). The only working ORCID endpoint is `https://arxiv.org/a/{ORCID}.atom2`, which returns all papers in a single response (no pagination). The standard API's `search_query` field does not index ORCID.

2. **File shape change breaks two consumers**: the accessor (`src/content/accessors/publications.ts`) and `validate-content.mjs` both call `PublicationsSchema.parse(rawJSON)` where `rawJSON` is now a wrapped object, not a bare array. Both must be updated in the same commit that changes the file shape.

3. **fast-xml-parser is already installed** at exact version `5.7.1` (our test install); 09-01 should update it to `^5.7.1` in package.json. The `isArray` callback's `jpath` argument uses dot-notation paths like `feed.entry` (verified by introspection).

4. **tsx runs `.ts` files in CJS mode by default** — top-level await is not supported. The script must use `async function main() { ... } main().catch(...)` pattern.

5. **All 13 current publications are manual entries** (no `source` field, defaults to `"manual"`). They must be read from the existing file and preserved pass-through in every sync run.

**Primary recommendation:** Use `PublicationsFileSchema` (approach b) — wrap the existing array schema rather than mutating it. This keeps the accessor and schema consumers simpler to update.

---

## APIs

### A. InspireHEP Literature API

**Live-verified on 2026-04-19.**

**Endpoint:**
```
GET https://inspirehep.net/api/literature
```

**Query parameters:**
| Param | Value | Notes |
|-------|-------|-------|
| `q` | `a E.Calzetta.1` | BAI author query. Both `a:` and `author:` prefixes work. `author.bai:` does NOT work (returns 0). |
| `size` | `1..1000` | Max 1000. Requesting 1001 returns HTTP 400. |
| `page` | integer | 1-based. Default 1. |
| `sort` | `mostrecent` | Recommended for stable ordering. |
| `fields` | comma-separated | Request only needed fields to reduce payload. |

**Recommended fields param:**
```
arxiv_eprints,titles,authors,publication_info,preprint_date,dois,control_number,abstracts
```

**Response shape (verified):**
```json
{
  "hits": {
    "total": 126,
    "hits": [
      {
        "id": "3128846",
        "metadata": {
          "control_number": 3128846,
          "titles": [
            { "source": "arXiv", "title": "A First-Principles Thermodynamic..." }
          ],
          "authors": [
            {
              "full_name": "Calzetta, Esteban",
              "ids": [{ "schema": "INSPIRE BAI", "value": "E.Calzetta.1" }]
            }
          ],
          "arxiv_eprints": [
            { "categories": ["quant-ph"], "value": "2603.11236" }
          ],
          "preprint_date": "2026-03-11",
          "publication_info": [
            {
              "journal_title": "Phys.Rev.D",
              "journal_volume": "89",
              "artid": "083012",
              "journal_issue": "8",
              "year": 2021
            }
          ],
          "dois": [
            { "material": "publication", "source": "arXiv", "value": "10.1103/PhysRevD.103.056018" }
          ],
          "abstracts": [
            { "source": "arXiv", "value": "We study the fundamental..." }
          ]
        }
      }
    ]
  },
  "links": {
    "self": "https://inspirehep.net/api/literature/?q=...&size=3&page=1",
    "next": "https://inspirehep.net/api/literature/?q=...&size=3&page=2",
    "prev": "...",
    "bibtex": "...",
    "json": "..."
  }
}
```

**Key extraction rules:**
- **arXiv ID:** `metadata.arxiv_eprints[0].value` (bare, e.g. `"2603.11236"`)
- **Title:** `metadata.titles[0].title` (prefer the non-arXiv source title if multiple)
- **Year:** `metadata.publication_info[0].year` if present; else `parseInt(metadata.preprint_date)` (preprint_date can be `"2026-03-11"`, `"2011-03"`, or `"1961"` — always split on `-` and take index 0)
- **Journal:** Build from `publication_info[0]`: `"${journal_title} ${journal_volume} (${year}) ${artid}"`. Use `"Preprint"` if no `publication_info`.
- **DOI:** `metadata.dois[0].value` where `material === "publication"` (prefer over `material === "bibmatch"`)
- **Authors:** `metadata.authors.map(a => a.full_name)` — already NFC-normalized strings
- **Abstract:** `metadata.abstracts[0].value` (optional field on `PublicationSchema`)
- **Publication ID:** Use arXiv ID if available (e.g. `"2603.11236"`); fallback to `"inspire-${control_number}"` for papers with no arXiv eprint

**Pagination strategy:**
```
page 1: read hits.total -> compute total_pages = ceil(hits.total / size)
pages 2..N: fetch https://...&page=N until page > total_pages
```
Alternatively: follow `links.next` until absent. Either works; page arithmetic is simpler.

**Rate limits (verified):**
- Headers advertised: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (exposed via CORS but values not returned in body — rate limit enforced server-side)
- From official docs: **15 requests per 5-second window** per IP. Exceeding returns HTTP 429.
- With max 5 concurrent + 2s inter-batch pause, a 15-member group (15 requests) completes without hitting limits.

**Empty result behavior:** Returns HTTP 200 with `hits.total: 0` and `hits.hits: []` for unknown BAIs. No HTTP 404. Treat as warning (empty contribution), continue.

---

### B. arXiv API — ORCID Author Feed

**Live-verified on 2026-04-19.**

**CRITICAL:** The standard arXiv API (`export.arxiv.org/api/query`) does NOT support ORCID in `search_query`. ORCID must be queried via the author feed endpoint:

```
GET https://arxiv.org/a/{ORCID}.atom2
```

Example: `https://arxiv.org/a/0000-0002-7970-7855.atom2`

**Behavior:**
- Returns HTTP 200 + Atom XML with ALL papers linked to that ORCID (no pagination, no `max_results` param)
- Returns HTTP 404 if the ORCID is not registered on arXiv → treat as warning, skip
- No `<opensearch:totalResults>` element — count entries client-side

**atom2 response shape (verified):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Simeon Warner's articles on arXiv</title>
  <link rel="describes" href="https://orcid.org/0000-0002-7970-7855"/>
  <updated>2026-04-19T00:00:00-04:00</updated>
  <id>https://arxiv.org/a/0000-0002-7970-7855</id>

  <entry>
    <id>http://arxiv.org/abs/1305.1476v1</id>
    <updated>2013-05-07T07:42:52-04:00</updated>
    <published>2013-05-07T07:42:52-04:00</published>
    <title>ResourceSync: Leveraging Sitemaps for Resource Synchronization</title>
    <summary>Many applications need up-to-date copies...</summary>
    <author>
      <!-- ONE <author> per entry; <name> is a COMMA-DELIMITED STRING of all authors -->
      <name>Bernhard Haslhofer, Simeon Warner, Carl Lagoze, Martin Klein</name>
    </author>
    <link href="http://arxiv.org/abs/1305.1476v1" rel="alternate" type="text/html"/>
    <link href="http://arxiv.org/pdf/1305.1476v1" rel="related" type="application/pdf" title="pdf"/>
    <arxiv:primary_category xmlns:arxiv="http://arxiv.org/schemas/atom" term="cs.DL" .../>
    <category term="cs.DL" scheme="http://arxiv.org/schemas/atom" label="Digital Libraries (cs.DL)"/>
  </entry>
  <!-- more entries... -->
</feed>
```

**KEY DIFFERENCE from standard API:**
- `<author><name>` in atom2 contains a **single comma-delimited string** of all authors (e.g. `"Haslhofer, S. Warner, C. Lagoze"`)
- Standard API has one `<author>` element per author with a separate `<name>` child each

**Key extraction rules:**
- **arXiv ID:** `<id>` = `http://arxiv.org/abs/1305.1476v1` → extract last path segment, strip version suffix: `entry.id.split('/abs/')[1].replace(/v\d+$/, '')` → `"1305.1476"`
- **Year:** `<published>` first 4 chars: `parseInt(entry.published.slice(0, 4))` → `2013`
- **Title:** `<title>` text content
- **Authors:** Split `entry.author[0].name` by `", "` (comma-space) → `["Bernhard Haslhofer", "Simeon Warner", ...]`
- **Abstract:** `<summary>` text content
- **Journal:** Use `"Preprint"` always (atom2 has `<arxiv:journal_ref>` in some entries but it's free-text — not reliably parseable. The InspireHEP record for the same paper will have structured publication_info if published.)
- **source:** `"arxiv"`

**Rate limiting:**
- arXiv docs: "incorporate a 3 second delay" between requests when calling multiple times
- atom2 is a single fetch per ORCID — for a 15-member group with 8 ORCID-enabled members, that's 8 requests. Space them 3s apart.

---

## Libraries

### C. fast-xml-parser@5.7.1 — `isArray` Configuration

**Status:** Already installed in `devDependencies` at `5.7.1` (exact). 09-01 must update to `"^5.7.1"` in package.json.

**CJS/ESM:** Package has both `require` → `lib/fxp.cjs` and `import` → `src/fxp.js`. tsx (CJS mode) uses the `require` path — no interop issues.

**jpath values (verified by introspection):**
When fast-xml-parser calls `isArray(tagName, jpath, isLeaf, isAttr)`, the `jpath` for arXiv atom2 is:
```
"feed.entry"           # the entry list (may be single entry)
"feed.entry.author"    # the author element (always 1 in atom2, but needs array for uniform access)
"feed.entry.link"      # link elements (2 per entry: html + pdf)
"feed.entry.category"  # category elements (1 or more per entry)
```

**Verified working config:**
```typescript
import { XMLParser } from "fast-xml-parser";

const ATOM2_ALWAYS_ARRAY = new Set([
  "feed.entry",
  "feed.entry.author",
  "feed.entry.link",
  "feed.entry.category",
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (_tagName: string, jpath: string) => ATOM2_ALWAYS_ARRAY.has(jpath),
});

// Usage:
const result = parser.parse(xmlString);
// result.feed.entry   -> Publication[] (always array, even if 1 entry)
// entry.author        -> always array length 1 in atom2
// entry.author[0].name -> "Lastname, F., Lastname, G." (comma-delimited string)
// entry.link          -> array of {  "@_href": "...", "@_rel": "..." }
// entry.category      -> array of { "@_term": "cs.DL", "@_scheme": "..." }
// entry.id            -> "http://arxiv.org/abs/1305.1476v1"
// entry.published     -> "2013-05-07T07:42:52-04:00"
// entry.title         -> "Paper Title"
// entry.summary       -> "Abstract text"
```

**Tested with single-entry and multi-entry feeds — both produce arrays.** (HIGH confidence)

---

### D. Concurrency-Limited Queue (Hand-Rolled)

No additional dependency needed. The locked decision is max 5 parallel, 2s inter-batch pause, exponential backoff on 429. `p-limit` is not in the project and should not be added.

**Pattern: Batched Promise.all with sequential batches**

```typescript
/**
 * Run tasks in batches of `concurrency`, with `batchPauseMs` between batches.
 * Retries tasks that return HTTP 429 with exponential backoff.
 */
async function runBatched<T>(
  tasks: (() => Promise<T>)[],
  concurrency = 5,
  batchPauseMs = 2000,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((t) => t()));
    results.push(...batchResults);
    if (i + concurrency < tasks.length) {
      await sleep(batchPauseMs);
    }
  }
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**Exponential backoff wrapper for HTTP 429:**
```typescript
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
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 429 && attempt < maxRetries) {
      const delay = baseDelayMs * 2 ** attempt;
      const capped = Math.min(delay, 30_000);
      if (isVerbose) process.stderr.write(`429 — retry ${attempt + 1}/${maxRetries} in ${capped}ms\n`);
      await sleep(capped);
      attempt++;
      continue;
    }
    return response; // caller handles 5xx, 404, etc.
  }
}
```

**Notes:**
- `AbortSignal.timeout(10_000)` is Node 20 built-in — verified working. Throws `TimeoutError` (not `AbortError`) on timeout.
- Cap at 30s matches the locked 429 backoff spec. Base 2s, doublings: 2s → 4s → 8s → 30s (capped).
- 5xx after all retries exhausted: let the caller throw/handle → becomes fatal per CONTEXT.md failure table.

---

### E. `node:util` parseArgs Configuration

**Verified working on Node 20.20.2.** Zero dependency.

```typescript
import { parseArgs } from "node:util";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "dry-run":    { type: "boolean", default: false },
    "member":     { type: "string"                  },  // no default — undefined if omitted
    "no-arxiv":   { type: "boolean", default: false },
    "no-inspire": { type: "boolean", default: false },
    "verbose":    { type: "boolean", default: false },
  },
  strict: true,  // throws on unknown flags
});

// Types:
// values["dry-run"]    -> boolean
// values["member"]     -> string | undefined
// values["no-arxiv"]   -> boolean
// values["no-inspire"] -> boolean
// values["verbose"]    -> boolean
```

**Verified output for `--dry-run --member calzetta --verbose`:**
```json
{
  "values": {
    "dry-run": true,
    "member": "calzetta",
    "verbose": true,
    "no-arxiv": false,
    "no-inspire": false
  }
}
```

---

### F. AbortSignal.timeout + fetch

```typescript
// Node 20 native — no polyfill needed
const response = await fetch(url, {
  signal: AbortSignal.timeout(10_000),
  headers: { "User-Agent": "cosmo-sync/1.0 (academic group site)" },
});

// On timeout: throws TimeoutError { name: "TimeoutError", code: 23 }
// Catch pattern:
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
} catch (err: unknown) {
  if (err instanceof Error && err.name === "TimeoutError") {
    throw new Error(`Request timed out: ${url}`);
  }
  throw err;
}
```

---

## Project Internals

### G. Schema Exports (read from source)

**File:** `src/content/schemas/publications.schema.ts`

```typescript
export const PublicationSchema = z.strictObject({
  id:          z.string().min(1),                            // stable kebab or arXiv ID string
  authors:     z.array(canonicalString).min(1),             // "Last, F." style strings
  title:       canonicalString,                              // z.string().min(1)
  journal:     z.string().min(1),
  year:        z.number().int().min(1900).max(2100),
  arxiv:       arxivId.optional(),                          // /^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/
  doi:         doiId.optional(),                            // /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i
  topic_tags:  z.array(z.string().min(1)).optional().default([]),
  source:      z.enum(["manual","inspirehep","arxiv"]).default("manual"),
  abstract:    z.string().optional(),
});

export const PublicationsSchema = z.array(PublicationSchema).superRefine((pubs, ctx) => {
  // duplicate id check
});

export type Publication = z.infer<typeof PublicationSchema>;
export type Publications = z.infer<typeof PublicationsSchema>;
```

**File:** `src/content/schemas/people.schema.ts` (post-07-02)

```typescript
export const PersonSchema = z.strictObject({
  slug:                    slugString,
  name:                    canonicalString,
  inspirehep_id:           z.string().regex(/^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/).optional(),
  orcid_id:                orcidId.optional(),     // /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/
  display_name_normalized: z.string().min(1),       // ASCII-fold + lowercase, e.g. "esteban calzetta"
  // ... bilingual fields, contact, social_links, etc.
});
```

**BAI regex (from `inspirehep_id` in PersonSchema, verified):**
```
/^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/
```
Matches: `E.Calzetta.1`, `S.J.Landau.1`, `Tomas.F.Chase.1`, `D.LopezNacir.1`
Rejects: `INSPIRE-00140145` (fails — numeric ID format)

**File:** `src/content/schemas/shared.ts`

```typescript
export function normalizeName(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
// Purpose: MATCHING-TIME normalization for getPublicationsByAuthor
// NOT storage-time. NFC normalization of author strings for storage is a separate concern.
```

**File:** `src/content/accessors/publications.ts` (critical lines)

```typescript
import rawPublications from "../../../content/publications.json";
import { PublicationsSchema, type Publication } from "../schemas/publications.schema";

// Parse once at module load — throws at import time if invalid
const publications: Publication[] = PublicationsSchema.parse(rawPublications);
```

This line **imports the entire JSON file** and parses it directly as a bare array. After Phase 9 changes the file to `{ _meta, publications: [...] }`, this line breaks. The accessor must be updated.

**Sort order in accessor (must match sync script):**
```typescript
// getPublicationsByAuthor sort in publications.ts:
.sort((a, b) => {
  if (b.year !== a.year) return b.year - a.year;
  if (a.arxiv && b.arxiv) return b.arxiv.localeCompare(a.arxiv);
  if (a.arxiv) return -1;  // a has arxiv, b doesn't → a comes first
  if (b.arxiv) return 1;
  return 0;
});
```

The sync script's deterministic sort (SYNC-10: year desc, arXiv ID desc) must match this. The accessor also sorts by year desc but without the arXiv-first tiebreaker in `getPublications()` — that's ok, `getPublications()` just does `b.year - a.year`. The sync-level sort is what determines byte-for-byte idempotence.

---

### H. `validate-content.mjs` — Impact Analysis

**File:** `scripts/validate-content.mjs`

```javascript
import { PublicationsSchema } from "../src/content/schemas/publications.schema.ts";
// ...
{ name: "publications.json", schema: PublicationsSchema },
// ...
const result = schema.safeParse(raw);
```

`raw` is `JSON.parse(readFileSync("content/publications.json"))`.

After Phase 9 wraps the file as `{ _meta: {...}, publications: [...] }`:
- `PublicationsSchema.safeParse({ _meta, publications })` → **FAILS** — schema expects array, gets object

`validate-content.mjs` **MUST be updated** to use the wrapper schema (whichever approach the planner picks) when parsing `publications.json`.

---

### I. Current `content/publications.json` Shape

- **Format:** Bare JSON array (`[...]`)
- **Entry count:** 13
- **Source distribution:** ALL 13 are `source: "manual"` (the field is absent in the JSON; Zod applies `.default("manual")` at parse time)
- **No `_meta` block** — this is a v1.0 file

Manual entries in the file (sample IDs):
```
2026-lambda-cdm-h0-tension-reanalysis
2026-dark-matter-halo-ml-emulator
2026-gw-neutron-star-cosmo
... (13 total)
```

**Manual entry preservation strategy:** At sync time, read existing `content/publications.json` with `fs.readFileSync` + `JSON.parse` (not via Zod import). Filter entries where `source === "manual"` OR `source` is absent. Concat with freshly fetched inspirehep/arxiv entries before dedup+sort. `counts.manual` = number of such entries in the final merged output.

---

## Normalization Strategy

Two distinct normalization concerns — do NOT conflate them:

| Concern | Function | When | Purpose |
|---------|----------|------|---------|
| **Storage NFC** | `value.normalize("NFC")` | At extraction time in sync script | Canonical Unicode storage for author strings from external APIs |
| **Matching NFD+strip** | `normalizeName(v)` from `shared.ts` | At query time in accessor | Author name fuzzy-matching via `getPublicationsByAuthor` |

**Why NFC for storage:** InspireHEP and arXiv may return author strings in different Unicode normalization forms. Storing NFC ensures consistent byte output across sync runs (supports byte-for-byte idempotence test SC2).

**Why NFD+strip for matching:** `normalizeName` in `shared.ts` does NFD decomposition + strip combining marks + lowercase to enable fuzzy matching of `"Ahumada Acuña"` → `"ahumada acuna"` against person's `display_name_normalized`.

**BibTeX strip from titles:** InspireHEP JSON API titles are mostly pre-cleaned (verified across 50+ titles — no LaTeX markup found in practice). Implement a defensive minimal strip:

```typescript
function stripBibTeX(title: string): string {
  // Remove outer braces: {Title} → Title
  let cleaned = title.replace(/^\{(.+)\}$/, "$1");
  // Remove \command{text} patterns: \textit{foo} → foo
  cleaned = cleaned.replace(/\\[A-Za-z]+\{([^}]*)\}/g, "$1");
  // Remove remaining standalone braces
  cleaned = cleaned.replace(/[{}]/g, "");
  return cleaned.trim();
}
```

---

## Schema Strategy

### Recommendation: Option (b) — Introduce `PublicationsFileSchema`

**Firm recommendation with evidence.**

**Option (a): Extend `PublicationsSchema` to file-level object**
- `PublicationsSchema` changes from `z.array(...)` to `z.object({ _meta, publications: z.array(...) })`
- Breaking: all callers of `PublicationsSchema.parse(raw)` expecting an array break
- Callers that break: (1) accessor `publications.ts`, (2) `validate-content.mjs`
- `Publications` type changes from `Publication[]` to `{ _meta: ..., publications: Publication[] }`
- All pages using `Publications` type must be updated

**Option (b): Introduce `PublicationsFileSchema` wrapping existing schema**
- `PublicationsSchema` stays as `z.array(PublicationSchema)` — unchanged
- New `PublicationsFileSchema = z.object({ _meta: MetaSchema, publications: PublicationsSchema })`
- `Publications` type stays as `Publication[]` — no downstream type breakage
- Callers that must still be updated: (1) accessor (must unwrap `.publications`), (2) `validate-content.mjs` (must parse with `PublicationsFileSchema`, then access `.publications`)
- But callers using the `Publications` type (pages) are unaffected

**Why (b) is better:** Only two files need updating (accessor + validate script), versus potentially many page files that use the `Publications` type. The `PublicationSchema` and `PublicationsSchema` remain stable for any external tooling. The sync script introduces `PublicationsFileSchema` and uses it for the write-gate safeParse.

**Proposed additions to `publications.schema.ts`:**
```typescript
export const PublicationsMetaSchema = z.object({
  synced_at: z.string(),  // ISO-8601 UTC
  sources:   z.array(z.enum(["inspirehep", "arxiv"])),
  counts: z.object({
    inspirehep: z.number().int().min(0),
    arxiv:      z.number().int().min(0),
    manual:     z.number().int().min(0),
  }),
  warnings: z.array(z.string()),
});

export const PublicationsFileSchema = z.object({
  _meta:        PublicationsMetaSchema,
  publications: PublicationsSchema,   // reuses existing array + superRefine
});

export type PublicationsMeta  = z.infer<typeof PublicationsMetaSchema>;
export type PublicationsFile  = z.infer<typeof PublicationsFileSchema>;
```

**Accessor update (`src/content/accessors/publications.ts`):**
```typescript
// Before:
import rawPublications from "../../../content/publications.json";
const publications: Publication[] = PublicationsSchema.parse(rawPublications);

// After:
import rawFile from "../../../content/publications.json";
import { PublicationsFileSchema } from "../schemas/publications.schema";
const { publications } = PublicationsFileSchema.parse(rawFile);
// publications is still Publication[] — all downstream functions unchanged
```

**`validate-content.mjs` update:**
```javascript
// Change one line:
import { PublicationsFileSchema } from "../src/content/schemas/publications.schema.ts";
// ...
{ name: "publications.json", schema: PublicationsFileSchema },
```

---

## Determinism Checklist

For success criterion SC2 (byte-for-byte identical output on identical upstream data):

1. **NFC normalization of all string fields** before comparison/storage — same Unicode form each run
2. **Intra-source dedup by arXiv ID** — prevents duplicate entries when multiple group members co-authored the same paper (e.g. Planck/Euclid collaborations)
3. **Deterministic sort before serialization:**
   ```typescript
   merged.sort((a, b) => {
     if (b.year !== a.year) return b.year - a.year;
     // arXiv ID desc (localeCompare) — matches accessor's getPublicationsByAuthor sort
     if (a.arxiv && b.arxiv) return b.arxiv.localeCompare(a.arxiv);
     if (a.arxiv) return -1;  // arxiv-having papers before arxiv-less
     if (b.arxiv) return 1;
     return 0;
   });
   ```
4. **`JSON.stringify(data, null, 2)` with trailing newline** — 2-space indent per SYNC-12, trailing `\n` for POSIX compatibility
5. **`_meta.synced_at` from clock** — this DOES change each run, but is in `_meta`, not in the publications array. The byte-for-byte test (SC2) compares only when "identical upstream data" — meaning `_meta.synced_at` will differ, but the `publications` array is what matters for the git diff guard in Phase 10.

**Intra-run dedup implementation:**
```typescript
// Dedup within each source by arXiv ID
function dedupByArxivId(entries: RawEntry[]): RawEntry[] {
  const seen = new Map<string, RawEntry>();
  for (const entry of entries) {
    const key = entry.arxiv ?? `no-arxiv-${entry._inspireId ?? entry._rawTitle}`;
    if (!seen.has(key)) seen.set(key, entry);
  }
  return [...seen.values()];
}
```

No cross-source dedup (SYNC-13, locked decision v1.1).

---

## Publication ID Generation

Not specified in REQUIREMENTS or CONTEXT. Must be decided by planner. Research recommendation:

| Entry type | ID strategy | Example |
|------------|-------------|---------|
| Has arXiv ID | Use bare arXiv ID as-is | `"2603.11236"`, `"gr-qc/9209007"` |
| InspireHEP-only (no arXiv) | `"inspire-{control_number}"` | `"inspire-891007"` |
| Manual (pass-through) | Preserve existing ID | `"2026-lambda-cdm-h0-tension-reanalysis"` |

**Rationale:** arXiv IDs are globally stable, unique, and already accepted by `arxivId` schema regex. Using them directly as publication IDs is deterministic and collision-free across runs. The `PublicationSchema.id` field is `z.string().min(1)` with no format constraint — arXiv IDs with dots pass validation.

**Warning:** The schema comment says "Do NOT derive from DOI or arXiv" — but that guidance is for hand-curated entries where human-readable slugs are preferred. For automated sync, stable machine-derived IDs from arXiv are the correct approach. The planner should confirm this interpretation.

---

## Pitfalls

### Pitfall 1: tsx CJS mode — no top-level await

**What goes wrong:** `scripts/sync-publications.ts` uses `await` at the top level → tsx throws: `Top-level await is currently not supported with the "cjs" output format`

**Verified:** Reproduced by running `npx tsx /tmp/test.ts` with TLA.

**Fix:** Wrap all async code in `async function main()`:
```typescript
async function main(): Promise<void> {
  // all sync logic here
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
```

`.mts` extension enables ESM mode and TLA, but using `async main()` in `.ts` is simpler and consistent with the project's existing script pattern.

### Pitfall 2: arXiv ORCID query via search_query doesn't work

**What goes wrong:** `https://export.arxiv.org/api/query?search_query=au:0000-0001-8908-2347` returns `totalResults: 0` even for valid ORCIDs.

**Verified:** Multiple ORCID formats tested — all return empty.

**Fix:** Use `https://arxiv.org/a/{ORCID}.atom2`. This is the only working ORCID endpoint.

### Pitfall 3: atom2 author format is CSV string, not per-author elements

**What goes wrong:** Code expects `entry.author.map(a => a.name)` → fails because `entry.author[0].name` is `"Last, F., Other, G., Third, H."` not three separate author objects.

**Verified:** atom2 uses a single `<author><name>` with comma-delimited authors.

**Fix:**
```typescript
const authorsStr: string = entry.author[0].name;  // "Last, F., Middle, G."
const authors: string[] = authorsStr.split(", ").map(a => a.normalize("NFC"));
// Note: splitting on ", " may break names like "van der Berg, J." — use heuristic or keep as-is
```

**Better approach for cosmology papers:** Author strings like `"Calzetta, E."` and `"Di Sarcina, P."` split correctly on `", "`. Edge case: names with commas in the surname (e.g., `"O'Brien, K."`) are rare and acceptable for v1.1.

### Pitfall 4: fast-xml-parser jpath uses compound dot notation, not tag names

**What goes wrong:** `isArray: (name) => name === "entry"` doesn't work — only the `jpath` arg reliably identifies nodes. `name === "entry"` would match `entry` anywhere in the XML.

**Verified:** Actual jpath values are `"feed.entry"`, `"feed.entry.author"`, etc.

**Fix:** Use a `Set` of jpaths as shown in the Libraries section.

### Pitfall 5: validate-content.mjs breaks after file shape change

**What goes wrong:** `PublicationsSchema.safeParse({ _meta, publications })` fails because the schema expects an array.

**Verified:** Line 107 of `validate-content.mjs` uses `{ name: "publications.json", schema: PublicationsSchema }` — the raw JSON is parsed directly.

**Fix:** Update `validate-content.mjs` to use `PublicationsFileSchema` for publications.json.

### Pitfall 6: Accessor breaks after file shape change

**What goes wrong:** `PublicationsSchema.parse(rawPublications)` where `rawPublications` is now `{ _meta, publications }` → ZodError at module load → Next.js build fails.

**Verified:** Line 25 of `src/content/accessors/publications.ts`: `const publications = PublicationsSchema.parse(rawPublications)`.

**Fix:** Update import to use `PublicationsFileSchema` and destructure `.publications`.

### Pitfall 7: `--member` writes to publications.json (corruption risk)

**What goes wrong:** `--member calzetta` run replaces the full publications.json with only that one member's papers.

**Fix (per CONTEXT.md):** Write to `scripts/tmp/sync-{slug}.json` (git-ignored). Must add `scripts/tmp/` to `.gitignore`.

### Pitfall 8: InspireHEP pagination cap

**What goes wrong:** `size=1001` returns HTTP 400: `"Maximum search page size of 1000 results exceeded."`

**Verified:** Live test confirmed.

**Fix:** Use `size=1000`. For prolific authors with >1000 papers, paginate: page 1, 2, 3... until `hits.hits.length < size`.

### Pitfall 9: InspireHEP returns duplicate titles (multiple sources)

**What goes wrong:** The same paper appears multiple times in `titles[]` with different `source` values (e.g., `"arXiv"` and `"journal"`).

**Fix:** Use the first title (`titles[0].title`) or prefer a non-arXiv source if available:
```typescript
const title = metadata.titles.find(t => t.source !== "arXiv")?.title
           ?? metadata.titles[0]?.title
           ?? "Untitled";
```

### Pitfall 10: BAI validation — regex must be tested at startup, not during fetch

**What goes wrong:** A person's `inspirehep_id` is `"INSPIRE-00140145"` (numeric ID, not BAI). The script starts fetching other members while the bad ID causes a confusing 0-results response later.

**Fix per SYNC-06:** At startup, before any HTTP requests, validate ALL `inspirehep_id` values against the BAI regex. Exit 1 immediately if any fail:
```typescript
const BAI_REGEX = /^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/;
const badIds = people
  .filter(p => p.inspirehep_id && !BAI_REGEX.test(p.inspirehep_id))
  .map(p => `${p.slug}: "${p.inspirehep_id}"`);
if (badIds.length > 0) {
  console.error("BAI format error — fix before retrying:\n" + badIds.join("\n"));
  process.exit(1);
}
```

---

## Quick Reference

### Fetch InspireHEP All Pages for One Member

```typescript
async function fetchInspireHEP(bai: string, verbose: boolean): Promise<InspireHit[]> {
  const SIZE = 200;
  const fields = "arxiv_eprints,titles,authors,publication_info,preprint_date,dois,control_number,abstracts";
  const base = `https://inspirehep.net/api/literature?q=a%20${encodeURIComponent(bai)}&size=${SIZE}&sort=mostrecent&fields=${fields}`;

  let page = 1;
  let total = Infinity;
  const allHits: InspireHit[] = [];

  while (allHits.length < total) {
    const url = `${base}&page=${page}`;
    if (verbose) process.stderr.write(`  GET ${url}\n`);
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`InspireHEP ${res.status} for ${bai}`);
    const data = await res.json() as InspireResponse;
    total = data.hits.total;
    allHits.push(...data.hits.hits);
    if (verbose) process.stderr.write(`  fetched ${allHits.length} of ${total} total\n`);
    page++;
  }

  return allHits;
}
```

### Fetch arXiv atom2 for One Member

```typescript
async function fetchArXiv(orcid: string, verbose: boolean): Promise<ArXivEntry[]> {
  const url = `https://arxiv.org/a/${orcid}.atom2`;
  if (verbose) process.stderr.write(`  GET ${url}\n`);
  const res = await fetchWithRetry(url);
  if (res.status === 404) {
    process.stderr.write(`Warning: arXiv ORCID not registered: ${orcid}\n`);
    return [];
  }
  if (!res.ok) throw new Error(`arXiv ${res.status} for ORCID ${orcid}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);
  return (parsed?.feed?.entry ?? []) as ArXivEntry[];
}
```

### Convert InspireHEP Hit to Publication

```typescript
function inspireHitToPublication(hit: InspireHit): Publication {
  const meta = hit.metadata;
  const arxivId = meta.arxiv_eprints?.[0]?.value;  // bare e.g. "2603.11236"
  const pi = meta.publication_info?.[0];
  const year: number = pi?.year
    ?? parseInt(meta.preprint_date?.split("-")[0] ?? "0", 10)
    || new Date().getFullYear();
  const journal: string = pi
    ? [pi.journal_title, pi.journal_volume, pi.year ? `(${pi.year})` : "", pi.artid]
        .filter(Boolean).join(" ")
    : "Preprint";
  const doi = meta.dois?.find(d => d.material === "publication")?.value
           ?? meta.dois?.[0]?.value;

  return {
    id: arxivId ?? `inspire-${meta.control_number}`,
    authors: meta.authors.map(a => a.full_name.normalize("NFC")),
    title: stripBibTeX(
      meta.titles.find(t => t.source !== "arXiv")?.title ?? meta.titles[0]?.title ?? "Untitled"
    ).normalize("NFC"),
    journal,
    year,
    ...(arxivId ? { arxiv: arxivId } : {}),
    ...(doi ? { doi } : {}),
    topic_tags: [],
    source: "inspirehep" as const,
    ...(meta.abstracts?.[0]?.value ? { abstract: meta.abstracts[0].value } : {}),
  };
}
```

### Convert arXiv atom2 Entry to Publication

```typescript
function arxivEntryToPublication(entry: ArXivEntry): Publication {
  // entry.id = "http://arxiv.org/abs/1305.1476v1"
  const arxivId = entry.id.split("/abs/")[1].replace(/v\d+$/, "");  // "1305.1476"
  const year = parseInt(entry.published.slice(0, 4), 10);
  // entry.author[0].name = "Last, F., Other, G." (comma-delimited)
  const authors = (entry.author[0]?.name ?? "")
    .split(", ")
    .map(a => a.normalize("NFC"))
    .filter(a => a.length > 0);

  return {
    id: arxivId,
    authors,
    title: (entry.title as string).normalize("NFC"),
    journal: "Preprint",
    year,
    arxiv: arxivId,
    topic_tags: [],
    source: "arxiv" as const,
    ...(entry.summary ? { abstract: String(entry.summary) } : {}),
  };
}
```

### Merge + Dedup + Sort

```typescript
function mergePublications(
  manualEntries: Publication[],
  inspireEntries: Publication[],
  arxivEntries: Publication[],
): Publication[] {
  // Intra-source dedup by arXiv ID (prevents co-authored papers appearing N times)
  const dedup = (entries: Publication[]): Publication[] => {
    const seen = new Set<string>();
    return entries.filter(p => {
      const key = p.arxiv ?? p.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const merged = [
    ...manualEntries,
    ...dedup(inspireEntries),
    ...dedup(arxivEntries),
  ];

  // Deterministic sort: year desc, arXiv ID desc, no-arXiv last
  merged.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (a.arxiv && b.arxiv) return b.arxiv.localeCompare(a.arxiv);
    if (a.arxiv) return -1;
    if (b.arxiv) return 1;
    return 0;
  });

  return merged;
}
```

### Write Gate + File Write

```typescript
import { writeFileSync, readFileSync, existsSync } from "node:fs";

// Read existing to get manual entries and compute diff
const existingFile = existsSync("content/publications.json")
  ? JSON.parse(readFileSync("content/publications.json", "utf-8"))
  : { publications: [] };
const existingPubs: Publication[] = Array.isArray(existingFile)
  ? existingFile                        // v1.0 bare array
  : existingFile.publications ?? [];    // v1.1+ wrapped

// ... fetch + merge ...

const meta: PublicationsMeta = {
  synced_at: new Date().toISOString(),
  sources: [...(ran_inspire ? ["inspirehep"] : []), ...(ran_arxiv ? ["arxiv"] : [])] as ("inspirehep"|"arxiv")[],
  counts: {
    inspirehep: merged.filter(p => p.source === "inspirehep").length,
    arxiv:      merged.filter(p => p.source === "arxiv").length,
    manual:     merged.filter(p => p.source === "manual").length,
  },
  warnings,
};

const fileData = { _meta: meta, publications: merged };
const result = PublicationsFileSchema.safeParse(fileData);

if (!result.success) {
  console.error("Schema validation failed:");
  console.error(result.error.issues.map(i => `  ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}

if (!dryRun) {
  writeFileSync("content/publications.json", JSON.stringify(fileData, null, 2) + "\n");
}
```

### `_meta.counts.manual` Computation

Manual entries come from the existing `content/publications.json` entries where `source === "manual"` (explicit) or where `source` is absent (all 13 current entries have no `source` field — they default to `"manual"` at Zod parse time, but are stored without the field).

**Read strategy:** Read existing file with `JSON.parse` (not Zod), filter by `p.source === "manual" || !p.source`, preserve these as pass-through. Their IDs are human-readable slugs from v1.0.

### `--member` Output Sink

Recommendation: write to `scripts/tmp/sync-{slug}.json` (git-ignored). Add `scripts/tmp/` to `.gitignore`. Also print a note to stdout pointing to the file.

---

## State of the Art

| Old approach | Current approach | Impact |
|--------------|-----------------|--------|
| arXiv ORCID via `au:` search_query | `https://arxiv.org/a/{ORCID}.atom2` | atom2 has different XML structure |
| `arxiv_id` field on PersonSchema | `orcid_id` field (07-02 decision) | arXiv queries use ORCID, not name-slug |
| Bare array `publications.json` | Wrapped `{ _meta, publications }` | Accessor + validator must be updated |

---

## Open Questions

1. **ID generation — planner must decide:** The research recommends using bare arXiv IDs as publication IDs. The schema comment says "Do NOT derive from DOI or arXiv" but this guidance was written for manual entries. For sync entries, confirm that arXiv IDs as IDs is acceptable. Alternative: generate slugs from year + first-author surname + first title word.

2. **atom2 author splitting edge cases:** Some author names may contain `, ` within them (rare in physics). The CSV-split on `", "` is a best-effort. Flag for v1.2 if real papers have affected names.

3. **InspireHEP ORCID queries not supported:** InspireHEP `q=a orcid:0000-...` returns 0 results (verified). Only BAI queries work. This matches the locked decision but confirms there's no fallback if a member has ORCID but no BAI.

---

## Sources

### Primary (HIGH confidence — live verified)
- InspireHEP API: `https://inspirehep.net/api/literature?q=a+E.Calzetta.1` — multiple requests, response shapes verified
- arXiv atom2: `https://arxiv.org/a/0000-0002-7970-7855.atom2` — structure verified
- `src/content/schemas/publications.schema.ts` — read directly
- `src/content/schemas/people.schema.ts` — read directly
- `src/content/schemas/shared.ts` — read directly
- `src/content/accessors/publications.ts` — read directly
- `scripts/validate-content.mjs` — read directly
- `content/publications.json` — read directly (13 manual entries)
- `package.json` — read directly (fast-xml-parser 5.7.1 installed)
- Node 20: `parseArgs` and `AbortSignal.timeout` — live tested

### Secondary (MEDIUM confidence)
- InspireHEP API rate limit (15 req/5s): from official REST API docs at `github.com/inspirehep/rest-api-doc`
- arXiv rate limit (3s interval): from `info.arxiv.org/help/api/user-manual.html`
- arXiv ORCID not in search_query: from `groups.google.com/g/arxiv-api/c/ikHqgP_bYYs`

### Tertiary (LOW confidence)
- BibTeX title LaTeX markup prevalence: assumption based on 50+ sampled InspireHEP JSON titles — no LaTeX found. Defensive strip still recommended.

---

## Metadata

**Confidence breakdown:**
- API shapes: HIGH — live verified from real endpoints
- Library config: HIGH — fast-xml-parser isArray tested with actual arXiv atom2 XML
- Project internals: HIGH — all files read from source
- Schema strategy: HIGH — both consumers identified and breaking changes documented
- Pitfalls: HIGH — most verified by live test or source code inspection

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (30 days — InspireHEP and arXiv APIs are stable)

---

## RESEARCH COMPLETE
