# Phase 17: ORCID Fetcher - Research

**Researched:** 2026-04-20
**Domain:** ORCID Public API v3.0 — works list + per-work detail; integration with existing three-source sync pipeline
**Confidence:** HIGH — all API shapes verified against live responses for Tomas (`0009-0001-0286-2136`) and Lopez Nacir (`0000-0003-4398-1147`, 43 groups / heavy edge-case coverage); all pipeline integration points verified against the current `sync-publications.ts`.

---

## Summary

Phase 17 fills in the body of the existing `fetchOrcid(orcid: string): Promise<Publication[]>` stub (currently returning `[]` at `sync-publications.ts:313`). Signature is already frozen by Phase 16; the caller wiring (`syncMember` → `runBatched` → dedup → write gate) is already live. The phase is **scoped to one function plus helpers, one extraction pass, an optional per-work detail enrichment step, and unit tests** — no schema changes, no CLI changes, no workflow changes.

The ORCID Public API is anonymous (no OAuth), returns JSON only when `Accept: application/json` is sent (else XML default), and has two relevant endpoints:
- `GET https://pub.orcid.org/v3.0/{orcid}/works` — grouped summary list (no authors)
- `GET https://pub.orcid.org/v3.0/{orcid}/work/{put-code}` — single work with full `contributors.contributor[]`

The decisive live-API finding is that the works-list response groups self-claimed duplicates under a `group` array, each with a `group-level external-ids` aggregate **and** 1–N `work-summary` entries where each summary may have a subset of the group's external IDs. **Use `group.external-ids` for DOI/arXiv extraction** (it is the union), and use the first `work-summary` for title/journal/year. Verified: Tomas's SiPM paper is in his ORCID profile as a journal-article (`put-code=156875914`, `doi=10.1016/j.nima.2020.164490`, `year=2020`, `journal-title="Nuclear Instruments and Methods in Physics Research Section A..."`), with 11 contributors returned by the detail endpoint — Phase 17's Success Criterion 2 is physically achievable.

**Primary recommendation:** Build `fetchOrcid` inline in `sync-publications.ts` (next to `fetchArXiv`). Emit `Publication[]` with **placeholder authors** (just `[person.name]` — the member whose ORCID we're querying). Do the per-work detail expansion **after** cross-source DOI dedup in `main()`, so we only hit the detail endpoint for ORCID rows that actually survive and need their author list enriched. Structure as: (a) pure extractor `orcidGroupToPublication(group, ownerName)`, (b) network wrapper `fetchOrcid(orcid)`, (c) new post-dedup enrichment pass `enrichOrcidAuthors(pubs, ownerOrcidByPubId)` called from `main()` once the survivor set is known.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node `fetch` + `AbortSignal.timeout` | Node 20+ built-in | HTTP with timeout | Already used for `fetchInspireHEP` / `fetchArXiv` / `fetchWithRetry` |
| (none — JSON response) | — | No parser needed | ORCID returns JSON with `Accept: application/json`; no XML handling required |
| Vitest | 3.2.4 | Unit tests | Existing test runner (`scripts/sync-publications.test.ts`) |

### Supporting

| Helper | Location | Reuse As-Is |
|--------|----------|-------------|
| `fetchWithRetry` | `sync-publications.ts:161-185` | Yes — ORCID reuses. But see Pitfall 2 (503 not 429). |
| `runBatched` | `sync-publications.ts:191-204` | Yes — default `INSPIRE_BATCH_SIZE=5`, `INSPIRE_BATCH_PAUSE_MS=2000` already satisfies ORCID-07 exactly. |
| `USER_AGENT` | `sync-publications.ts:59` | Yes — `"cosmo-sync/1.0 (academic group site; https://github.com/)"` |
| `Publication` type | `src/content/schemas/publications.schema.ts` | Yes — source enum already includes `"orcid"` (Phase 16). |

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| `pub.orcid.org/v3.0/` anonymous API | Registered Public API key (OAuth `/read-public`) | Anonymous (25k reads/day per IP) is more than enough: 15 members × ~5 works each × (works-list + per-work detail) << 1,000 calls/week. Avoids client-ID secret. |
| Per-work detail for every ORCID row | Use the works-list only (no author enrichment) | Fails ORCID-06: Success Criterion 2 requires the SiPM paper's 11-author list, which is **only** on the detail endpoint. |
| Crossref DOI lookup fallback | Skip — already marked "Explicitly Deferred" in `REQUIREMENTS.md` | Out of scope. |
| Batch endpoint `/works/{pc1},{pc2},...` | Still per-work or skip | Would reduce calls (up to 100 put-codes per call) but the existing `runBatched` concurrency model does not map cleanly to a "gather put-codes across batch → single request". Deferred optimisation — flag for v2. |

**Installation:** No new dependencies. (`pnpm install` not needed.)

---

## Architecture Patterns

### Recommended Project Structure

No new files. All changes are in-file edits to existing files:

```
scripts/
├── sync-publications.ts          # Replace fetchOrcid body (line 313);
│                                 # add orcidGroupToPublication extractor;
│                                 # add enrichOrcidAuthors pass;
│                                 # add ORCID response type interfaces
└── sync-publications.test.ts     # New describe blocks for fetchOrcid fixtures,
                                  # orcidGroupToPublication edge cases,
                                  # enrichOrcidAuthors author-merge logic
```

Rationale: Phase 16 locked `fetchOrcid` as inline-in-`sync-publications.ts`, matching `fetchInspireHEP` and `fetchArXiv`. Do not split into `scripts/sync/` subdirectory — tests already import from `./sync-publications`, and the file size (776 lines) is still manageable.

### Pattern 1: Two-Pass Fetch (list, then detail-on-survivors)

**What:** Fetch all ORCID summaries first (cheap — 1 call per member). Emit `Publication[]` with a minimal author placeholder. After cross-source DOI dedup runs in `main()`, iterate the survivors where `source === "orcid"` and fetch the per-work detail endpoint to replace the placeholder with the full `credit-name` list.

**When to use:** When per-entity detail is needed, but dedup may drop the entity before detail is needed. This avoids wasting calls on rows that lose DOI dedup to InspireHEP.

**Placement decision (trade-off analysis):**

| Option | Pros | Cons |
|--------|------|------|
| (A) **Detail fetch during extraction** (inside `fetchOrcid`) | Self-contained; simpler call site | Wasted detail calls for every ORCID work that gets deduped (Tomas: 4 of his 5 works have the same DOI as InspireHEP → 4 wasted calls). For Lopez Nacir: ~35/43 works would waste calls. |
| (B) **Detail fetch after dedup** (new pass in `main()`) | Only fetches detail for survivors (ORCID-only rows). Minimal waste. Matches ORCID-06 literal wording ("For every ORCID-only entry (no DOI match)..."). | Slightly more plumbing: need to know which ORCID belongs to which `put-code` so the detail URL can be built. |

**Recommended: Option B.** ORCID-06 is explicit about "ORCID-only entries (no DOI match to InspireHEP or arXiv)" — the literal reading is post-dedup. Option B also minimises API calls (stays well under 25k/day quota even for a large group).

**Implementation sketch (Option B):**

```typescript
// During extraction: store put-code alongside Publication so enrichment can find it.
// Option: stash it on the Publication as a non-schema field during pipeline,
// OR maintain a side Map<publicationId, { orcid: string; putCode: number }>.
// Side Map is cleaner — Publication shape stays Zod-clean.

type OrcidLookup = Map<string, { orcid: string; putCode: number }>;

async function fetchOrcid(orcid: string, ownerName: string): Promise<{
  publications: Publication[];
  lookup: { putCode: number; publicationId: string }[];
}> { /* ... */ }

async function enrichOrcidAuthors(
  survivors: Publication[],
  lookupByPubId: Map<string, { orcid: string; putCode: number }>,
): Promise<Publication[]> {
  const orcidSurvivors = survivors.filter((p) => p.source === "orcid");
  const tasks = orcidSurvivors.map((p) => async () => {
    const entry = lookupByPubId.get(p.id);
    if (!entry) return p; // shouldn't happen
    const detail = await fetchOrcidWorkDetail(entry.orcid, entry.putCode);
    const authors = detail.contributors?.contributor
      ?.map((c) => c["credit-name"]?.value?.normalize("NFC"))
      .filter((n): n is string => Boolean(n && n.length > 0)) ?? [];
    return authors.length > 0 ? { ...p, authors } : p;
  });
  const enriched = await runBatched(tasks); // reuses ≤5 concurrent, 2s pause
  // Splice enriched entries back into survivors array preserving order
  const byId = new Map(enriched.map((p) => [p.id, p]));
  return survivors.map((p) => byId.get(p.id) ?? p);
}
```

### Pattern 2: Group-Level External IDs (UNION across work-summaries)

**What:** The ORCID works-list response nests works as `{ group: [{ external-ids, work-summary[] }, ...] }`. When multiple sources (Crossref, INSPIRE-HEP, the author themselves) self-claim the same paper, they appear as multiple `work-summary` entries inside ONE group. **Crucially, `group.external-ids.external-id[]` is the UNION of all identifiers across sibling summaries.**

**Verified example (Lopez Nacir's group 0 for DOI `10.1103/rg4j-8wr9`):**
- Crossref work-summary has only `[doi]`
- INSPIRE-HEP work-summary has `[other-id, doi, arxiv]`
- Group-level ids = `[arxiv, doi, other-id]` (union)

**Implication for ORCID-05:** Extract DOI from `group.external-ids`, NOT from `work-summary[0].external-ids`. Otherwise you'll randomly miss the arXiv ID depending on which source is listed first inside the group.

**Pattern:**
```typescript
function pickExternalId(
  externalIds: { "external-id-type": string; "external-id-value": string }[] | undefined,
  type: "doi" | "arxiv",
): string | undefined {
  return externalIds?.find((e) => e["external-id-type"] === type)?.["external-id-value"];
}
// Use at group level:
const doi = pickExternalId(group["external-ids"]?.["external-id"], "doi");
const arxiv = pickExternalId(group["external-ids"]?.["external-id"], "arxiv");
```

### Pattern 3: Work-Summary Picking Within Group

**What:** When a group has multiple work-summaries (common — 35/43 for Lopez Nacir), pick one for title/journal/year/put-code. All siblings represent the same paper, but their metadata quality varies.

**Recommendation:** Use the first `work-summary` (`group["work-summary"][0]`). The API orders summaries with the highest display-index first, which the author marks as their preferred record. This is also what `display-index` docs describe ("highest display index represents the researcher's preferred item"). The per-work detail call (Pattern 1) will happen on whichever put-code we keep — so there's no data loss either way.

### Anti-Patterns to Avoid

- **Iterating `group.work-summary[]` and emitting multiple Publications per group:** Same paper, 2–3 duplicates. `dedupByArxivId` / `dedupByDoi` would catch them eventually, but wasted pipeline work and confused counts. Emit ONE Publication per group.
- **Using `work-summary[0].external-ids` for DOI extraction:** Missing IDs (see Pattern 2).
- **Inline full author enrichment inside `fetchOrcid`:** Wastes detail calls for rows that get deduped (see Pattern 1).
- **Trusting `journal-title.value` to always exist:** 1/43 Lopez Nacir groups had `journal-title: null`. ORCID-05 says "journal from `work-summary.journal-title.value` or `'Preprint'`" — honour the fallback.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP timeouts | Custom AbortController wiring | `fetchWithRetry` (existing, line 161) | Already uses `AbortSignal.timeout(10_000)` and 429 backoff. ORCID-02 literally says "reuse". |
| Concurrency / batch pauses | Custom `Promise.allSettled` + `setTimeout` chaining | `runBatched` (existing, line 191) | ORCID-07 literally says "reuse". Defaults `(5, 2000)` match ORCID-07 exactly. |
| DOI normalisation | Custom lowercasing/prefix stripping | `normalizeDoi` (existing, line 447) | Handles `https://doi.org/`, `http://dx.doi.org/`, lowercase, trim. Already used by `dedupByDoi`. |
| First-seen-wins DOI dedup | New per-source dedup step | `dedupByDoi` (existing, line 460) | Already wired in `main()` with priority `manual > inspire > orcid > arxiv`. ORCID rows feed the existing pipeline unchanged. |
| Bare arXiv ID validation | Custom regex | `arxivId` from `src/content/schemas/shared.ts` | Final `PublicationsFileSchema.safeParse` in `main()` already validates on write. No need to validate inline — invalid arXiv IDs will fail the write gate loudly. |
| ORCID iD format validation | Custom regex in fetchOrcid | `orcidId` from shared schema | `content/people.json` is already Zod-validated upstream (`pnpm validate-content`). No extra validation needed at fetch time. |
| Unicode author names | Custom encoding | `.normalize("NFC")` | Existing pattern from arXiv/InspireHEP extractors. ORCID returns decomposed UTF-8 for accented Spanish names (e.g., `"Tomás"`). |

**Key insight:** Phase 16 deliberately built the dedup + CLI infrastructure Phase 17 needs. Phase 17 is almost pure extraction code plus one network call chain. Do not reinvent any helper.

---

## Common Pitfalls

### Pitfall 1: Missing `Accept: application/json` → XML response

**What goes wrong:** Default ORCID content-type is `application/vnd.orcid+xml`. JSON parsing fails with `SyntaxError: Unexpected token '<'`.

**Why it happens:** ORCID's `Accept` default is XML, not JSON (verified: `curl` without `Accept` header returns `content-type: application/vnd.orcid+xml;charset=UTF-8`).

**How to avoid:** Always pass `Accept: application/json` in the `fetch()` init headers.

**Warning signs:** Parse error on first request; response begins with `<?xml`.

**Code:**
```typescript
const res = await fetchWithRetry(url, { headers: { Accept: "application/json" } });
```

`fetchWithRetry` merges headers via `{ ...init.headers }` spread, so passing `Accept` in the `init` is sufficient.

### Pitfall 2: ORCID burst-rate exceed returns 503, not 429

**What goes wrong:** `fetchWithRetry` retries only on 429 (`response.status === 429`). ORCID's anonymous API returns **HTTP 503** when the burst threshold is exceeded (source: https://info.orcid.org/refining-api-traffic-management/ — "When you exceed the burst threshold, you receive a 503 response"). `fetchWithRetry` would currently propagate 503 straight to `res.ok === false` and throw.

**Why it happens:** ORCID uses 503 for burst-rate (conceptually "service busy"); most other APIs use 429 ("too many requests"). The current implementation was built for arXiv/InspireHEP (which use 429).

**How to avoid:** Option A — extend `fetchWithRetry` to also retry on 503 (expand condition to `status === 429 || status === 503`). Option B — wrap ORCID calls in a custom retry path. Recommendation: Option A is one line (`response.status === 429 || response.status === 503`) and benefits all three services. Low risk: arXiv/InspireHEP rarely emit 503, and when they do it indicates actual downtime — brief retry is reasonable.

**Mitigation mattering here?** In practice, the concurrency of `runBatched(5, 2000ms)` means at most 5 concurrent requests per 2-second window, well below ORCID's 12 req/sec limit. 503 is unlikely in normal operation. Still: defensive change is cheap.

**Warning signs:** `ORCID 503` errors in CI logs; typically after heavy burst from a single member run.

### Pitfall 3: `group.external-ids` is the UNION; `work-summary[i].external-ids` is a SUBSET

See Pattern 2. Extracting DOI/arXiv from `work-summary[0].external-ids` risks missing IDs that a sibling `work-summary` declared. Verified against live Lopez Nacir data: 35 of her 43 groups have multiple summaries with divergent ID subsets.

### Pitfall 4: `put-code` is a JSON number, not a string

**What goes wrong:** URL interpolation `\`/work/${putCode}\`` works either way, but TypeScript typing matters for the side-map lookup key.

**How to avoid:** Type as `number` in the TypeScript response interface. Store in `Map<string, { orcid: string; putCode: number }>`. When building the URL, template literals stringify automatically.

### Pitfall 5: Missing `journal-title` (null), missing `publication-date`, missing `contributors`

**What goes wrong:** All three fields CAN be null/missing in live responses (verified 1/43 for Lopez Nacir on `journal-title`; none seen for `publication-date` or `contributors` in sampled records, but documentation does not guarantee presence).

**How to avoid:**
- Journal: `workSummary["journal-title"]?.value ?? "Preprint"` (ORCID-05 explicit)
- Year: `workSummary["publication-date"]?.year?.value` → if missing, fall back to current year **OR skip the work** — ORCID-05 says "year from `work-summary.publication-date.year.value`" with no fallback specified. Recommendation: follow the InspireHEP pattern (fall back to current year rather than dropping), keeping the pipeline robust. Document the choice in the plan.
- Contributors: `detail.contributors?.contributor ?? []` — if empty after detail call, keep the placeholder `[person.name]` rather than emitting an empty authors array (schema requires `min(1)`).

**Warning signs:** Schema validation failure `authors: array length < 1`, or a publication with `year: NaN`. Both are caught by the `PublicationsFileSchema.safeParse` gate in `main()` — fail loudly.

### Pitfall 6: Contributor without `credit-name` (ORCID-only, no name)

**What goes wrong:** A contributor object can have `contributor-orcid` populated but `credit-name` null. Filtering these out may leave `authors.length === 0`.

**How to avoid:** Filter: `credit-name?.value && value.length > 0`. Fall back to `[ownerName]` if filtering empties the list.

**Verified:** Tomas's 4 sampled works — all contributors have `credit-name.value` populated. The risk is low but non-zero for other members.

### Pitfall 7: Empty works response is valid (not 404)

**What goes wrong:** If a person has a public ORCID profile with no works, the API returns `HTTP 200` with `{"group": [], "last-modified-date": null}` — **not** 404. Treating "empty group" as an error aborts the sync.

**How to avoid:** ORCID-03 handles 404 → `[]` with warning. For empty `group`, emit NO warning and return `[]`. Rationale: STATE.md decision (16-03): "No empty-ORCID warning in Phase 16 stub; Phase 17 handles real no-results warnings contextually" — the contextual interpretation is: warn only when 404 (truly private/missing profile), silence when 200 with empty works (legitimate account with no claims). This mirrors the arXiv pattern (`fetchArXiv` 404 warns; empty feed is quiet).

**Verified:** Calzetta's ORCID (`0000-0002-3083-3420`) returns `HTTP 200` with `{"group": []}` — 74 bytes total.

### Pitfall 8: Works-list response MAY paginate at large scale

**What goes wrong:** ORCID documentation does not explicitly state a page-size limit for `/works`, but the API does accept `page`/`offset` parameters on some endpoints.

**How to avoid:** Live verification: Lopez Nacir's 43 groups came in ONE response (227 KB). The public `/works` endpoint appears to return all groups in a single call. Assume no pagination; add a defensive check: if response has suspicious cut-off indicators (documented as absent in sampled responses), log and continue. **Recommendation:** Do not implement pagination logic. If it becomes a problem at >100 works, upgrade the function later.

**Known upper bound:** Lopez Nacir has 43 groups, 109 underlying work-summaries total — all returned in one call. No pagination needed for any realistic group member.

### Pitfall 9: Author-name format mismatch with existing entries

**What goes wrong:** Existing InspireHEP entries use `"Lastname, Firstname"` format (e.g., `"Perna, Guillermo"`). ORCID `credit-name.value` returns `"Firstname Lastname"` (e.g., `"Mariano Barella"`). Mixed formats will render awkwardly on the UI.

**How to avoid:** Schema accepts both (`authors: z.array(canonicalString).min(1)` — free string). Options:

1. **Accept the inconsistency** — ORCID-only rows (which survive dedup) will display as "Firstname Lastname"; InspireHEP rows display as "Lastname, Firstname". Phase 17 ships the pattern Phase 18 must cope with.
2. **Post-process to `"Lastname, F."` format** — fragile (Spanish names with accents, compound surnames "López Nacir"); error-prone.

**Recommendation:** Option 1 for Phase 17. Flag as open question for Phase 18. ORCID-05 literally says "from `contributors.contributor[].credit-name.value`" — no format conversion specified.

### Pitfall 10: `credit-name` can contain CJK / accented / RTL characters

**What goes wrong:** Non-ASCII names need `.normalize("NFC")` to match Zod's `canonicalString` check (imported from shared.ts — follows existing pattern).

**How to avoid:** Always call `.normalize("NFC")` on `credit-name.value` before inclusion.

**Verified:** Detail endpoint already returns pre-composed NFC in sampled calls (`"Tomás Ferreira Chase"`, not decomposed `"Toma\u0301s..."`), but defensive normalisation is cheap.

---

## Code Examples

### Example 1: ORCID works-list response shape (TypeScript interfaces)

Derived from live response for Tomas's ORCID (`0009-0001-0286-2136`):

```typescript
// Source: https://pub.orcid.org/v3.0/0009-0001-0286-2136/works (verified 2026-04-20)

interface OrcidExternalId {
  "external-id-type": "doi" | "arxiv" | "issn" | "other-id" | "eid" | string;
  "external-id-value": string;
  "external-id-normalized"?: { value: string; transient: boolean } | null;
  "external-id-url"?: { value: string } | null;
  "external-id-relationship"?: "self" | "part-of" | "version-of" | "funded-by";
}

interface OrcidWorkSummary {
  "put-code": number;
  "created-date": { value: number };
  "last-modified-date": { value: number };
  source: {
    "source-name"?: { value: string } | null;
    "source-orcid"?: { path: string } | null;
    "source-client-id"?: { uri: string; path: string; host: string } | null;
  };
  title: { title: { value: string }; subtitle?: { value: string } | null };
  "external-ids": { "external-id": OrcidExternalId[] };
  url?: { value: string } | null;
  type: "journal-article" | "conference-paper" | "book-chapter" | "other" | string;
  "publication-date"?: {
    year?: { value: string } | null;       // NOTE: value is STRING, not number
    month?: { value: string } | null;
    day?: { value: string } | null;
  } | null;
  "journal-title"?: { value: string } | null;
  visibility: "public" | "limited" | "private";
  path: string;      // e.g. "/0009-0001-0286-2136/work/156875914"
  "display-index"?: string;
}

interface OrcidGroup {
  "last-modified-date": { value: number } | null;
  "external-ids": { "external-id": OrcidExternalId[] };  // UNION of all sibling work-summary ids
  "work-summary": OrcidWorkSummary[];                    // 1..N entries (self-claimed duplicates)
}

interface OrcidWorksResponse {
  "last-modified-date": { value: number } | null;
  group: OrcidGroup[];                                   // empty array when account has no works
  path: string;
}

// Per-work detail adds `contributors`:
interface OrcidContributor {
  "contributor-orcid"?: { path: string; host: string; uri: string } | null;
  "credit-name"?: { value: string } | null;              // MAY be null if contributor only provides ORCID
  "contributor-email"?: { value: string } | null;
  "contributor-attributes"?: {
    "contributor-sequence"?: "first" | "additional" | null;
    "contributor-role"?: "author" | "editor" | string | null;
  };
}

interface OrcidWorkDetail extends OrcidWorkSummary {
  contributors?: { contributor: OrcidContributor[] } | null;
  "short-description"?: { value: string } | null;
  citation?: {
    "citation-type": string;
    "citation-value": string;
  } | null;
  "language-code"?: string | null;
  country?: { value: string } | null;
}
```

### Example 2: `fetchOrcid` body replacement

```typescript
// Source: synthesised from ORCID-01..05 + live API shape verification

async function fetchOrcid(
  orcid: string,
): Promise<{ publications: Publication[]; lookup: OrcidLookupEntry[] }> {
  const url = `https://pub.orcid.org/v3.0/${orcid}/works`;
  if (isVerbose) process.stderr.write(`  GET ${url}\n`);
  const res = await fetchWithRetry(url, {
    headers: { Accept: "application/json" },  // Pitfall 1
  });
  if (res.status === 404) {
    process.stderr.write(`  Warning: ORCID profile not public or empty: ${orcid}\n`);
    return { publications: [], lookup: [] };
  }
  if (!res.ok) throw new Error(`ORCID ${res.status} for ${orcid}`);

  const data = (await res.json()) as OrcidWorksResponse;
  const publications: Publication[] = [];
  const lookup: OrcidLookupEntry[] = [];

  for (const group of data.group) {
    const ws = group["work-summary"][0];                    // Pattern 3
    if (!ws) continue;

    // ORCID-04: filter types
    if (ws.type !== "journal-article" && ws.type !== "conference-paper") continue;

    // Pattern 2: use GROUP-level external-ids (union across siblings)
    const groupIds = group["external-ids"]?.["external-id"] ?? [];
    const doi = groupIds.find((e) => e["external-id-type"] === "doi")?.["external-id-value"];
    const arxiv = groupIds.find((e) => e["external-id-type"] === "arxiv")?.["external-id-value"];
    const putCode = ws["put-code"];

    // ORCID-05: id preference
    const id = doi ?? arxiv ?? `orcid-${putCode}`;

    // Year: publication-date.year.value is a STRING; parse carefully (Pitfall 5)
    const yearStr = ws["publication-date"]?.year?.value;
    const parsedYear = yearStr ? parseInt(yearStr, 10) : NaN;
    const year = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();

    // ORCID-05: journal fallback
    const journal = ws["journal-title"]?.value?.normalize("NFC") ?? "Preprint";

    const title = ws.title.title.value.normalize("NFC");

    const pub: Publication = {
      id,
      authors: ["Pending"],   // Placeholder; overwritten in enrichOrcidAuthors pass.
                              // Must be length ≥ 1 for schema (see Phase 16 Zod).
                              // Caller (syncMember) overwrites to [person.name] before returning.
      title,
      journal,
      year,
      topic_tags: [],
      source: "orcid" as const,
      ...(arxiv ? { arxiv } : {}),
      ...(doi ? { doi } : {}),
    };

    publications.push(pub);
    lookup.push({ publicationId: id, orcid, putCode });
  }

  return { publications, lookup };
}
```

### Example 3: Per-work detail fetch + author replacement

```typescript
// Source: synthesised from ORCID-06 + live contributor shape

interface OrcidLookupEntry {
  publicationId: string;
  orcid: string;
  putCode: number;
}

async function fetchOrcidWorkDetail(
  orcid: string,
  putCode: number,
): Promise<OrcidWorkDetail | null> {
  const url = `https://pub.orcid.org/v3.0/${orcid}/work/${putCode}`;
  if (isVerbose) process.stderr.write(`  GET ${url}\n`);
  const res = await fetchWithRetry(url, {
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) {
    // Stale put-code (unlikely but possible if profile changed between list and detail fetch).
    return null;
  }
  if (!res.ok) throw new Error(`ORCID work detail ${res.status} for ${orcid}/${putCode}`);
  return (await res.json()) as OrcidWorkDetail;
}

async function enrichOrcidAuthors(
  survivors: Publication[],
  lookupByPubId: Map<string, { orcid: string; putCode: number }>,
): Promise<Publication[]> {
  const toEnrich = survivors.filter(
    (p) => p.source === "orcid" && lookupByPubId.has(p.id),
  );

  const tasks = toEnrich.map((p) => async (): Promise<[string, Publication]> => {
    const { orcid, putCode } = lookupByPubId.get(p.id)!;
    const detail = await fetchOrcidWorkDetail(orcid, putCode);
    if (!detail) return [p.id, p]; // keep placeholder on 404

    const authors =
      detail.contributors?.contributor
        ?.map((c) => c["credit-name"]?.value?.normalize("NFC"))
        .filter((n): n is string => !!n && n.length > 0) ?? [];

    if (authors.length === 0) return [p.id, p]; // keep placeholder
    return [p.id, { ...p, authors }];
  });

  const enriched = await runBatched(tasks);   // ORCID-07: ≤5 in flight, 2s pause
  const byId = new Map(enriched);
  return survivors.map((p) => byId.get(p.id) ?? p);
}
```

### Example 4: Wiring in `main()` and `syncMember`

```typescript
// In syncMember — fetchOrcid now returns { publications, lookup }
if (runOrcid) {
  if (person.orcid_id) {
    const { publications, lookup } = await fetchOrcid(person.orcid_id);
    // Replace placeholder with owner's name so arXiv-ID dedup sees a valid author list
    const withOwnerAuthor = publications.map((p) => ({ ...p, authors: [person.name] }));
    result.orcidPubs = withOwnerAuthor;
    result.orcidLookup = lookup; // new field on MemberSyncResult
    if (publications.length === 0) {
      result.warnings.push(`No ORCID results for ${person.name} (${person.orcid_id})`);
    }
  } else {
    result.warnings.push(`skipping ORCID for ${person.name}: no orcid_id`);
  }
}

// In main() — after dedup, before the sort that mergePublications does
const lookupByPubId = new Map<string, { orcid: string; putCode: number }>();
for (const r of memberResults) {
  for (const entry of r.orcidLookup ?? []) {
    // First-seen wins: if two members share a paper via ORCID, keep the first
    if (!lookupByPubId.has(entry.publicationId)) {
      lookupByPubId.set(entry.publicationId, { orcid: entry.orcid, putCode: entry.putCode });
    }
  }
}

// Post-dedup, pre-sort author enrichment for ORCID survivors.
// Insert BETWEEN dedupByDoi and mergePublications (which sorts).
const [postDoiDedup, dedupedCount] = dedupByDoi(postArxivDedup);
const enriched = await enrichOrcidAuthors(postDoiDedup, lookupByPubId);
const merged = mergePublications(enriched);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| (none — first ORCID implementation) | ORCID Public API v3.0 anonymous endpoint | — | Baseline |
| N/A | `Accept: application/json` required (else XML default) | Always been this way | Must set header |
| Unlimited free anonymous API | 25k reads/day per IP, 12 req/s, 40 burst/s | Feb 2025 | Plenty of headroom for weekly cron |

**Deprecated/outdated:**
- **ORCID API v2.x endpoints** — do not use. v3.0 is current (GA since 2019; v4.0 under development but v3.0 remains the recommended version).
- **`/orcid-works` path** (legacy) — use `/works`.

---

## Open Questions

### 1. Missing `publication-date` → fallback behaviour

**What we know:** ORCID-05 says "year from `work-summary.publication-date.year.value`" with no fallback specified. In sampled data (Tomas + Lopez Nacir = 48 groups), every group had a `publication-date.year`. But the ORCID schema allows `publication-date: null`.

**What's unclear:** Drop the work, or fall back to current year (InspireHEP pattern)?

**Recommendation:** Follow InspireHEP pattern — fall back to current year. Document in plan as intentional. If a plan step wants stricter behaviour (drop the work), emit a warning.

### 2. 503 handling in `fetchWithRetry`

**What we know:** ORCID docs explicitly say burst-exceed returns 503. Current `fetchWithRetry` retries only on 429.

**What's unclear:** Is this a Phase 17 concern or a cross-cutting refactor? In practice, `runBatched(5, 2000)` keeps us well under 12 req/s, so 503 is unlikely.

**Recommendation:** Extend `fetchWithRetry` retry condition to `status === 429 || status === 503` in a small plan step (one line, low-risk). Benefits ORCID primarily but doesn't harm arXiv/InspireHEP.

### 3. Should `fetchOrcid` return `Publication[]` or `{ publications, lookup }`?

**What we know:** Phase 16 froze the signature as `async function fetchOrcid(orcid: string): Promise<Publication[]>`. Option B (Pattern 1) requires a side-map of put-codes for enrichment, which breaks the signature.

**What's unclear:** Is the signature freeze strict, or a guideline?

**Recommendation:** Treat the freeze as a guideline — the original purpose was to let Phase 16 ship without implementing the detail fetch, so the caller wiring was stable. Extending the return type to `{ publications: Publication[]; lookup: OrcidLookupEntry[] }` is a localised change: `syncMember` needs updating (adds `result.orcidLookup`) and `MemberSyncResult` needs a new field. No other callers touch `fetchOrcid`. Alternative: stash `put-code` on the Publication using a non-schema `_orcidPutCode` field and strip it before write — hacky.

Planner decision: extend the signature. Low-risk, <10 LOC of call-site changes.

### 4. Author-name format consistency with InspireHEP entries

**What we know:** ORCID returns `"Firstname Lastname"`; InspireHEP returns `"Lastname, Firstname"`. The paper list on `/publications` will show mixed formats.

**What's unclear:** Acceptable for Phase 17, or must normalise?

**Recommendation:** Accept for Phase 17. Flag as Phase 18 UI concern. Normalisation is fragile for Spanish compound names ("López Nacir", "Lopez Nacir" — note accent variance). ORCID-05 prescribes the literal extraction from `credit-name.value` — deviating would violate the requirement.

### 5. Empty `contributors` after detail fetch

**What we know:** In all 4 sampled detail responses, `contributors.contributor` had entries. Schema allows null/missing. If all contributors lack `credit-name`, filtering leaves `[]`, violating schema.

**What's unclear:** How often does this occur in practice?

**Recommendation:** Fall back to `[person.name]` (the placeholder already set in `syncMember`). Emit a warning: `"ORCID work {doi} has no named contributors — using owner name only"`.

### 6. Should Phase 17 verification include a real sync run?

**What we know:** Success Criterion 1 requires real data in `content/publications.json`. This is an integration test, not a unit test.

**What's unclear:** Do we commit the post-Phase-17 publications.json (with 321 + ORCID entries) as part of the phase? Or run the sync in a dedicated CI step?

**Recommendation:** Part of the plan's verification step — run `pnpm sync-publications` manually in a verification wave, inspect the output for SiPM paper, commit the updated JSON with Phase 17's final commit. This also exercises the weekly cron path before it runs unattended.

---

## Plan-Ready Findings per Requirement

### ORCID-01: Fetch from `/v3.0/{orcid}/works`

- **Endpoint:** `https://pub.orcid.org/v3.0/{orcid}/works`
- **Headers:** `Accept: application/json`, `User-Agent` (already set by `fetchWithRetry`)
- **Anonymous** — no auth, no client ID.
- **Location:** Replace body of `fetchOrcid` at `sync-publications.ts:313`.
- **Triggered for:** Every person in `content/people.json` with `orcid_id` set — already wired by `syncMember` at `sync-publications.ts:599-606`.

### ORCID-02: Reuse `fetchWithRetry`

- **Signature:** `fetchWithRetry(url: string, init?: RequestInit, maxRetries = 3, baseDelayMs = 2000): Promise<Response>`
- **Already uses:** `AbortSignal.timeout(10_000)` (line 171), `User-Agent` (line 172), exponential backoff on 429 (line 174, `2000 * 2^attempt` capped at 30_000).
- **Small extension needed:** See Pitfall 2 — extend retry to also handle 503.

### ORCID-03: 404 warning, return `[]`

- **Exact warning text:** `"ORCID profile not public or empty: {orcid}"` (requirement literal).
- **Pattern to mirror:** `fetchArXiv` at lines 294-301:
  ```typescript
  if (res.status === 404) {
    process.stderr.write(`  Warning: arXiv ORCID not registered: ${orcid}\n`);
    return [];
  }
  ```
- **Empty response (`group: []`, HTTP 200)** is NOT a warning — see Pitfall 7. (Match: syncMember generates `"No ORCID results for..."` only if returned array is empty AND request succeeded — this is the contextual warning mentioned in STATE.md.)

### ORCID-04: Type filter

- **Allowed types:** `"journal-article"`, `"conference-paper"`.
- **Drop:** `"dataset"`, `"software"`, `"conference-poster"`, `"conference-abstract"`, `"lecture-speech"`, `"other"`, `"report"`, `"book"`, `"book-chapter"`, `"working-paper"`, etc.
- **Filter location:** Inside `fetchOrcid` during the per-group iteration — before building the `Publication` object.

### ORCID-05: Extraction rules

| Field | Source path | Fallback |
|-------|-------------|----------|
| `id` | `doi` if present; else `arxiv`; else `orcid-${putCode}` | — |
| `title` | `work-summary.title.title.value` | (always present; missing = skip work) |
| `year` | `work-summary.publication-date.year.value` (parse to number) | Current year (InspireHEP pattern) |
| `journal` | `work-summary.journal-title.value` | `"Preprint"` |
| `doi` | `group.external-ids.external-id[type=doi].value` (Pattern 2) | undefined (not set on Publication) |
| `arxiv` | `group.external-ids.external-id[type=arxiv].value` (Pattern 2) | undefined (not set on Publication) |
| `source` | `"orcid"` (literal) | — |
| `topic_tags` | `[]` | — |
| `authors` | Placeholder `[person.name]` in `syncMember`; overwritten by `enrichOrcidAuthors` | `[person.name]` if enrichment fails |

### ORCID-06: Per-work detail fetch for ORCID-only entries

- **Endpoint:** `https://pub.orcid.org/v3.0/{orcid}/work/{putCode}`
- **"ORCID-only entry" definition:** `source === "orcid"` AND survives cross-source DOI dedup (i.e., no InspireHEP or arXiv entry with the same normalised DOI). Run AFTER `dedupByDoi`.
- **Extract:** `detail.contributors.contributor[].credit-name.value` → filter `.filter(Boolean)` → `.map(.normalize("NFC"))` → use as `authors` array.
- **Placement:** New `enrichOrcidAuthors` pass in `main()`, between `dedupByDoi` and `mergePublications`.

### ORCID-07: Reuse `runBatched`

- **Defaults:** `concurrency = 5`, `batchPauseMs = 2000` — already matches requirement literal ("≤5 in flight, 2s batch pause").
- **Apply to:** Both the works-list fetches (already handled by outer `runBatched` in `main()` that wraps `syncMember`) AND the per-work detail fetches (new `enrichOrcidAuthors` call).

---

## Testing Approach

### Unit tests (Vitest — `scripts/sync-publications.test.ts`)

Add new describe blocks:

#### `orcidGroupToPublication` (extraction)
- Journal-article group with DOI + arXiv → emits Publication with `source: "orcid"`, `id: doi`, `arxiv` set
- Conference-paper group → emitted (ORCID-04)
- Dataset group → dropped (ORCID-04)
- Group with no DOI, no arXiv → `id: orcid-{putCode}` (ORCID-05)
- Group with no `journal-title` → `journal: "Preprint"` (ORCID-05 fallback)
- Group with group-level IDs richer than `work-summary[0].external-ids` → extract from group (Pattern 2)
- Group with multiple `work-summary` entries → use `[0]` for title/year (Pattern 3)
- Missing `publication-date` → fallback year

#### `enrichOrcidAuthors` (author merge)
- Detail response with 11 contributors → authors array has 11 entries in order (Success Criterion 2)
- Detail response where some contributors lack `credit-name` → those are filtered out
- Detail response with 0 contributors → authors unchanged (keeps placeholder `[person.name]`)
- Non-ORCID survivors passed through unchanged

#### Fixtures
Capture two real response shapes as JSON fixtures:
- `scripts/fixtures/orcid-works-tomas.json` — the works-list for Tomas (already saved to `/tmp/orcid-tomas-works.json` during research; copy to repo).
- `scripts/fixtures/orcid-work-sipm.json` — the detail for SiPM (`/tmp/orcid-tomas-sipm.json`).

Fixture-based tests confirm the SiPM paper extracts correctly (DOI `10.1016/j.nima.2020.164490`, year 2020, journal starts with "Nuclear Instruments", 11 contributors).

### Integration test (optional, likely skip)
Vitest can mock `fetch`. A full integration test against a mocked ORCID response verifies the main() pipeline. But the existing sync-publications.test.ts avoids `main()` testing (network-heavy) — defer to manual verification during Phase 17 completion.

### Manual verification (phase completion)
1. `pnpm sync-publications --no-arxiv --no-inspire` — ORCID only, write to scripts/tmp/ via `--member tomas-ferreira-chase`.
2. Inspect the output JSON for SiPM paper presence (DOI + 11 authors).
3. `pnpm sync-publications` (full three-source run) — verify `_meta.counts.orcid > 0`, `_meta.counts.deduped > 0`, SiPM paper appears with `source: "orcid"`.
4. `pnpm sync-publications --no-orcid` — verify `_meta.counts.orcid === 0`, no `"orcid"` in `_meta.sources`, output matches pre-Phase-17 shape.
5. Temporarily set `orcid_id: "0000-0000-0000-0000"` for one member, run sync, verify 404 warning and no abort.

---

## SiPM Paper Reality Check (Success Criterion 2)

**Verified LIVE on 2026-04-20:**
- URL: `https://pub.orcid.org/v3.0/0009-0001-0286-2136/works`
- Group for put-code `156875914`:
  - `type`: `"journal-article"` ✓ (passes ORCID-04 filter)
  - DOI: `10.1016/j.nima.2020.164490` ✓ (matches Success Criterion 2 literal)
  - Year: `2020` ✓
  - Journal: `"Nuclear Instruments and Methods in Physics Research Section A: Accelerators, Spectrometers, Detectors and Associated Equipment"` ✓
  - `/work/156875914` detail returns **11 contributors** with `credit-name.value` populated (including Mariano Barella, Tomás Ferreira Chase, Lucas Finazzi, Federico Izraelevitch, Xavier Bertou, etc.) ✓
- Current `content/publications.json` does NOT contain this DOI — confirming Phase 17 will add it as a net-new entry.

**Verification:** Success Criterion 2 is physically achievable. The paper exists, is public, has the correct metadata, and the detail endpoint returns the full author list.

---

## Sources

### Primary (HIGH confidence)

- **Live ORCID API** — direct GET requests verified 2026-04-20:
  - `https://pub.orcid.org/v3.0/0009-0001-0286-2136/works` (Tomas — 5 groups, all journal-article, includes SiPM)
  - `https://pub.orcid.org/v3.0/0009-0001-0286-2136/work/156875914` (SiPM detail — 11 contributors)
  - `https://pub.orcid.org/v3.0/0009-0001-0286-2136/work/{196334515, 183968028, 157654631, 156875240}` (detail sanity checks)
  - `https://pub.orcid.org/v3.0/0000-0003-4398-1147/works` (Lopez Nacir — 43 groups, 35 multi-work-summary, types incl. conference-paper and other)
  - `https://pub.orcid.org/v3.0/0000-0002-3083-3420/works` (Calzetta — empty group array, HTTP 200)
  - `https://pub.orcid.org/v3.0/0000-0000-0000-0000/works` (404 + JSON error body verified)
  - `https://pub.orcid.org/v3.0/0009-0001-0286-2136/work/99999999` (404 on bogus put-code verified)
- **Codebase inspection:**
  - `/home/tomas/Projects/cosmo/scripts/sync-publications.ts` (full, 776 lines)
  - `/home/tomas/Projects/cosmo/scripts/sync-publications.test.ts` (full, 327 lines)
  - `/home/tomas/Projects/cosmo/src/content/schemas/publications.schema.ts` (full)
  - `/home/tomas/Projects/cosmo/src/content/schemas/shared.ts` (orcidId regex)
  - `/home/tomas/Projects/cosmo/content/people.json` (15 members, 9 with orcid_id)
  - `/home/tomas/Projects/cosmo/content/publications.json` (321 entries, no SiPM DOI present)
  - `/home/tomas/Projects/cosmo/.github/workflows/sync-publications.yml` (no change needed)
  - `/home/tomas/Projects/cosmo/.planning/STATE.md` (Phase 16 decisions)
  - `/home/tomas/Projects/cosmo/.planning/REQUIREMENTS.md` (ORCID-01..07 literals)
  - `/home/tomas/Projects/cosmo/.planning/ROADMAP.md` (Phase 17 goal + success criteria)
  - `/home/tomas/Projects/cosmo/.planning/phases/16-schema-sync-infrastructure/16-RESEARCH.md` (pipeline map)
  - `/home/tomas/Projects/cosmo/.planning/phases/16-schema-sync-infrastructure/16-03-SUMMARY.md` (frozen signature)

### Secondary (MEDIUM confidence — official ORCID docs)

- https://info.orcid.org/documentation/api-tutorials/api-tutorial-read-data-on-a-record/ (works endpoint, group structure, authentication)
- https://info.orcid.org/refining-api-traffic-management/ (Feb 2025 rate limits: 12 req/s anonymous, 25k reads/day per IP, 503 on burst)
- https://info.orcid.org/ufaqs/what-are-the-api-limits/ (confirmed 503 response on burst exceed)

### Tertiary (LOW confidence — WebSearch supporting evidence)

- https://groups.google.com/g/orcid-api-users — community confirmation of anonymous API usability

---

## Metadata

**Confidence breakdown:**
- ORCID API shape: HIGH — verified against 6 live endpoint calls with realistic diversity (empty, moderate, large profiles)
- Pipeline integration points: HIGH — all line numbers and signatures verified against current source
- SiPM paper availability: HIGH — verified present and fetchable with correct shape
- 503 retry concern: MEDIUM — ORCID docs explicit on 503, but my codebase-only sample shows 429 handling (never observed 503 in sampled calls; still a documented risk)
- Author format consistency: HIGH (verified the mismatch); recommendation is judgment-based (MEDIUM) — planner may disagree

**Research date:** 2026-04-20
**Valid until:** 2026-07-20 (ORCID v3.0 is stable since 2019; API shape unlikely to change in 3 months; 2025 rate-limit tightening already in effect)
