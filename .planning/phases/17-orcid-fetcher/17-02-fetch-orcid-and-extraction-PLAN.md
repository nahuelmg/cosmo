---
phase: 17-orcid-fetcher
plan: 02
type: execute
wave: 2
depends_on: ["17-01"]
files_modified:
  - scripts/sync-publications.ts
  - scripts/sync-publications.test.ts
autonomous: true

must_haves:
  truths:
    - "fetchOrcid returns real Publication[] + OrcidLookupEntry[] from https://pub.orcid.org/v3.0/{orcid}/works"
    - "Works are filtered to type ∈ {journal-article, conference-paper} (ORCID-04)"
    - "DOI and arXiv IDs are extracted from GROUP-level external-ids (union), not from work-summary[0] (Pattern 2)"
    - "HTTP 404 produces warning 'ORCID profile not public or empty: {orcid}' and returns an empty result set (ORCID-03)"
    - "id preference is DOI → arXiv → orcid-{put-code} (ORCID-05)"
    - "journal-title falls back to 'Preprint'; missing publication-date falls back to current year"
    - "syncMember stores the put-code lookup alongside orcidPubs so 17-03 can enrich author lists"
    - "orcidPubs authors are seeded with [person.name] in syncMember (placeholder until 17-03 enrichment)"
    - "Per-member progress line shows the real ORCID count once the stub is replaced"
    - "runBatched is reused for ORCID fetches (ORCID-07 — ≤5 in flight, 2s pause)"
  artifacts:
    - path: "scripts/sync-publications.ts"
      provides: "fetchOrcid real implementation, orcidGroupToPublication extractor, OrcidWorksResponse/OrcidGroup/OrcidWorkSummary/OrcidExternalId type interfaces, OrcidLookupEntry type, extended MemberSyncResult with orcidLookup"
      contains: "https://pub.orcid.org/v3.0/"
    - path: "scripts/sync-publications.test.ts"
      provides: "Vitest suites for orcidGroupToPublication extraction edge cases + fetchOrcid end-to-end against Tomas fixture"
      contains: "orcidGroupToPublication"
  key_links:
    - from: "scripts/sync-publications.ts:fetchOrcid"
      to: "https://pub.orcid.org/v3.0/{orcid}/works"
      via: "fetchWithRetry with Accept: application/json header"
      pattern: "pub\\.orcid\\.org/v3\\.0"
    - from: "scripts/sync-publications.ts:orcidGroupToPublication"
      to: "Group-level external-ids (union of DOI/arXiv across siblings)"
      via: "group['external-ids']['external-id']"
      pattern: 'group\\["external-ids"\\]'
    - from: "scripts/sync-publications.ts:syncMember"
      to: "MemberSyncResult.orcidLookup"
      via: "fetchOrcid return destructuring"
      pattern: "orcidLookup"
---

<objective>
Replace the Phase 16 `fetchOrcid` stub with a real implementation that fetches, parses,
and extracts `Publication[]` from `https://pub.orcid.org/v3.0/{orcid}/works`, and wire
the side-channel put-code lookup that 17-03 will need for author enrichment.

This plan does NOT fetch per-work details and does NOT change the dedup pipeline shape
— it produces ORCID `Publication` objects with placeholder authors (`[person.name]`)
that flow through the existing `dedupByDoi` pipeline unchanged, and emits a side-map
`OrcidLookupEntry[]` so plan 17-03 can enrich authors for the rows that survive DOI dedup.

Purpose: Deliver ORCID-01..05 and ORCID-07 — the works-list fetch, filter, and extraction
half of the phase — without entangling it with the detail-fetch / author-merge logic,
which belongs to 17-03. Separating the two halves keeps each plan ≤50% context and
makes the two-stage Pattern 1 architecture (list first, detail after dedup) explicit.

Output:
- Real `fetchOrcid(orcid: string): Promise<{ publications: Publication[]; lookup: OrcidLookupEntry[] }>`
- New `orcidGroupToPublication(group, ownerName)` exported pure function
- New TypeScript interfaces for ORCID API response shapes
- Extended `MemberSyncResult` with `orcidLookup: OrcidLookupEntry[]`
- `syncMember` consumes the new return shape, seeds placeholder authors, and propagates the lookup
- Vitest suite covering extraction edge cases + one fixture-driven end-to-end test
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/17-orcid-fetcher/17-RESEARCH.md
@.planning/phases/17-orcid-fetcher/17-01-SUMMARY.md
@.planning/phases/16-schema-sync-infrastructure/16-03-SUMMARY.md
@scripts/sync-publications.ts
@scripts/sync-publications.test.ts
@scripts/fixtures/orcid-works-tomas.json
@src/content/schemas/publications.schema.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement fetchOrcid + orcidGroupToPublication + response types</name>
  <files>scripts/sync-publications.ts</files>
  <action>
    In `scripts/sync-publications.ts`, replace the Phase 16 `fetchOrcid` stub at
    lines 308–315 with a real implementation. Add the supporting ORCID response
    interfaces and the pure extractor function `orcidGroupToPublication`.

    **Types (add near the top of section H "Fetch layers", above `fetchInspireHEP`
    or grouped with existing `InspireHit`/`ArXivEntry` interfaces):**

    ```typescript
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
    ```

    Keep the interfaces minimal — pick only the fields we read. Do NOT type the
    fields we don't touch (contributors, source, visibility, etc.). 17-03 will add
    its own `OrcidWorkDetail` + `OrcidContributor` when it lands.

    **Pure extractor (add to section I "Extraction helpers", next to `inspireHitToPublication`):**

    ```typescript
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
    export function orcidGroupToPublication(
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
    ```

    **Network wrapper (replace the current stub body at ~line 313):**

    ```typescript
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
    ```

    **Update `MemberSyncResult` (line 544) to carry the lookup:**
    ```typescript
    type MemberSyncResult = {
      slug: string;
      name: string;
      inspirePubs: Publication[];
      arxivPubs: Publication[];
      orcidPubs: Publication[];
      orcidLookup: OrcidLookupEntry[]; // NEW
      warnings: string[];
    };
    ```

    Initialise `orcidLookup: []` in the `result` object inside `syncMember` (line 559).

    **Update the ORCID branch of `syncMember` (lines 599–606) to consume the new shape:**
    ```typescript
    if (runOrcid) {
      if (person.orcid_id) {
        const { publications, lookup } = await fetchOrcid(person.orcid_id, person.name);
        result.orcidPubs = publications;
        result.orcidLookup = lookup;
        if (publications.length === 0) {
          result.warnings.push(`No ORCID results for ${person.name} (${person.orcid_id})`);
        }
      } else {
        result.warnings.push(`skipping ORCID for ${person.name}: no orcid_id`);
      }
    }
    ```
    (This replaces the Phase 16 stub call. The empty-results warning matches the pattern
    established by `fetchInspireHEP` on line 577 and satisfies the 16-03 deferred-warning
    note. HTTP 200 with `group: []` falls through here silently only when the caller
    would otherwise never see it — but we DO want a warning for "account exists, no
    sync IDs" which is exactly this path.)

    Wait — re-read Pitfall 7: for a PUBLIC profile with `group: []` (Calzetta's case),
    ORCID returns HTTP 200. The research recommendation is to warn *contextually* here
    (distinguish from 404). The code above does produce the "No ORCID results" warning
    in that case, which is the correct behaviour per STATE.md 16-03 decision
    ("Phase 17 handles real no-results warnings contextually").

    **Update the `export {}` line at the bottom of the file (line 771) to include
    `orcidGroupToPublication` so the unit tests can import it:**
    ```typescript
    export { fetchInspireHEP, fetchArXiv, fetchWithRetry, runBatched, xmlParser, BAI_REGEX };
    // existing line 774 comment block mentions exports — keep it in sync
    ```
    Actually — `orcidGroupToPublication` is already declared with `export function` in
    the extractor block above, so no change to the trailing `export { ... }` list is
    needed. Just verify it's exported at declaration.

    **Do NOT touch** `dedupByDoi`, `mergePublications`, `main()`'s pipeline ordering, or
    the `_meta` block — that's 17-03's territory (and most of it is already correct from
    Phase 16).

    **Do NOT** implement `fetchOrcidWorkDetail` or `enrichOrcidAuthors` here — those belong
    to 17-03.

    **Do NOT** change the `runBatched` concurrency / pause defaults — they already
    satisfy ORCID-07 (INSPIRE_BATCH_SIZE=5, INSPIRE_BATCH_PAUSE_MS=2000).

    **Type-gotcha:** `Publication.arxiv` and `Publication.doi` are both optional on the
    schema. Use conditional spread (`...(arxiv ? { arxiv } : {})`) rather than setting
    them to `undefined` explicitly, so `JSON.stringify` omits them entirely rather than
    emitting `"arxiv": undefined` (which would be invalid JSON anyway).
  </action>
  <verify>
    `pnpm tsc --noEmit` passes cleanly.

    `grep -n "pub.orcid.org/v3.0" scripts/sync-publications.ts` returns at least one match
    inside `fetchOrcid`.

    `grep -n 'group\["external-ids"\]' scripts/sync-publications.ts` returns a match
    inside `orcidGroupToPublication`.

    `grep -n "orcidLookup: OrcidLookupEntry\[\]" scripts/sync-publications.ts` returns
    a match inside `MemberSyncResult`.

    `grep -n "export function orcidGroupToPublication" scripts/sync-publications.ts`
    returns exactly one match.

    The stub body at old line 313 (`return [];`) is gone — replaced by the real
    implementation. `grep -c "return \[\];" scripts/sync-publications.ts` returns fewer
    occurrences than before (the arXiv 404 branch still has one, but the ORCID stub
    body is gone).

    Existing test suite still passes: `pnpm vitest run scripts/sync-publications.test.ts`
    green (test count unchanged from end of 17-01).

    Running `pnpm sync-publications --dry-run --member tomas-ferreira-chase` exits 0
    and the progress line shows a non-zero ORCID count (e.g. `ORCID: 5`) — confirming
    the real fetch works end-to-end against the live API.
  </verify>
  <done>
    `fetchOrcid` issues a real HTTP GET against the ORCID v3.0 works endpoint, extracts
    Publications via `orcidGroupToPublication`, emits a put-code side-map, and is wired
    through `syncMember` into `MemberSyncResult.orcidLookup`. Typechecks and existing
    tests still green. A live dry-run against Tomas returns non-zero ORCID works.
  </done>
</task>

<task type="auto">
  <name>Task 2: Vitest coverage for orcidGroupToPublication + fetchOrcid (fixture-driven)</name>
  <files>scripts/sync-publications.test.ts</files>
  <action>
    Add two new describe blocks to `scripts/sync-publications.test.ts`, grouped at the
    end of the file after the existing test blocks.

    Update the import at the top of the file to add `orcidGroupToPublication` and
    `OrcidGroup`/`OrcidExternalId` types. `fetchOrcid` is NOT exported (intentional —
    it's an internal network wrapper); the fixture-driven test mocks `globalThis.fetch`
    instead and calls the sync pipeline entry, or exercises `orcidGroupToPublication`
    directly.

    **Describe block 1: `orcidGroupToPublication` pure-function edge cases**

    Build minimal hand-rolled `OrcidGroup` objects in-line (plain TypeScript literals —
    don't load fixtures for these cases, the JSON isn't the point):

    - `journal-article group with DOI + arXiv` → returned publication has
      `source: "orcid"`, `id === doi`, `arxiv` set, `doi` set, `authors: ["Owner"]`.
    - `conference-paper group` → returned publication has `source: "orcid"` (passes filter).
    - `dataset group` → returns `null` (filtered out by ORCID-04).
    - `other group` (type: "other") → returns `null`.
    - `group with no DOI and no arXiv` → `id === "orcid-{putCode}"` and the
      returned `publication.doi` is `undefined` (not present on the object).
    - `group with no journal-title` → `journal === "Preprint"` (ORCID-05 fallback).
    - `group with missing publication-date` → `year === new Date().getFullYear()`.
    - `group where work-summary[0].external-ids is EMPTY but group.external-ids has a DOI`
      → DOI is still extracted (proves Pattern 2 — union extraction).
    - `group with empty work-summary array` → returns `null`.
    - `group with title containing decomposed Unicode (e.g. "Toma\u0301s...")` →
      the returned title is NFC-normalised.

    **Describe block 2: fixture-driven end-to-end for Tomas's works list**

    - Import `orcidGroupToPublication` and load the fixture via
      `import worksFixture from "./fixtures/orcid-works-tomas.json" with { type: "json" }`
      (or the vitest-compatible `JSON.parse(readFileSync(...))` pattern if the import
      attribute syntax causes TS issues — mirror whatever works in the current test file).
    - Iterate `worksFixture.group` and call `orcidGroupToPublication(g, "Tomas Ferreira Chase")`
      for each.
    - Assert the SiPM paper is among the results:
      - At least one returned publication has `doi === "10.1016/j.nima.2020.164490"`.
      - That publication has `year === 2020`, `source === "orcid"`, `journal`
        starting with `"Nuclear Instruments and Methods"`, and `id === doi`.
      - `authors === ["Tomas Ferreira Chase"]` (placeholder — enrichment is 17-03's job).
    - Assert `non-journal-article/conference-paper` groups are dropped (count the
      returned publications, assert the filter held).

    **Do NOT** add a test for `fetchOrcid` itself — mocking `globalThis.fetch` in this
    phase adds complexity for little value. The `orcidGroupToPublication` fixture test
    already proves extraction works against real API shapes, and the live dry-run in
    Task 1's verify step proves the network layer works. A full `fetchOrcid` mock test
    becomes worthwhile in 17-03 when we're also testing the two-stage flow.

    **Sanity:** run the new tests with `pnpm vitest run scripts/sync-publications.test.ts`
    and confirm all pass. Total test count should rise by ~10 (nine extraction cases +
    one fixture case).
  </action>
  <verify>
    `pnpm vitest run scripts/sync-publications.test.ts` passes; test count rose by
    ~10 vs end of 17-01.

    Every new case shows up in test output with a clear name.

    One of the new cases explicitly asserts `doi === "10.1016/j.nima.2020.164490"`.

    One of the new cases explicitly asserts group-level external-ids extraction
    (dropping ids from work-summary[0] and proving the group-level union is still read).
  </verify>
  <done>
    `orcidGroupToPublication` has unit coverage for ORCID-04 filtering, ORCID-05 id
    preference + journal/year fallbacks, Pattern 2 group-level ID extraction, and
    Unicode handling. A fixture-driven test proves the real Tomas works-list response
    produces the SiPM paper with the correct DOI, year, journal, and source. Suite is
    green.
  </done>
</task>

</tasks>

<verification>
End-of-plan gates:
1. `pnpm tsc --noEmit` — zero errors.
2. `pnpm vitest run scripts/sync-publications.test.ts` — green; test count ≥ 88 (78 from 17-01 + ~10 new).
3. `pnpm sync-publications --dry-run --member tomas-ferreira-chase` — exits 0 and
   progress line shows `ORCID: N` with N > 0 (proves real fetch works end-to-end).
4. `grep 'pub.orcid.org/v3.0' scripts/sync-publications.ts` — at least one match.
5. Two atomic commits landed:
   1. `feat(17-02): implement fetchOrcid + orcidGroupToPublication + OrcidLookupEntry`
   2. `test(17-02): cover orcidGroupToPublication + fixture-driven SiPM extraction`
</verification>

<success_criteria>
- Running `pnpm sync-publications --dry-run --member tomas-ferreira-chase` emits a
  non-zero ORCID count on the progress line for Tomas — confirming live ORCID fetch
  and extraction work end-to-end.
- `orcidGroupToPublication` is a pure exported function with unit coverage for each
  of the ORCID-04, ORCID-05, Pattern 2 (group-level IDs), Pattern 3 (first summary),
  and Pitfall 5 (missing journal/date) cases.
- `MemberSyncResult.orcidLookup` carries the (publicationId, orcid, putCode) side-map
  needed by 17-03's enrichment pass.
- Existing 78 tests still pass; suite grew to ≥88.
- No changes to the dedup pipeline, `_meta` block, or CLI flags — those are already
  correct from Phase 16 and 17-03 owns the enrichment-layer wiring.
</success_criteria>

<output>
After completion, create `.planning/phases/17-orcid-fetcher/17-02-SUMMARY.md` summarising:
- `fetchOrcid` before/after (line count, new types added)
- `orcidGroupToPublication` coverage summary (cases + fixture)
- `MemberSyncResult` shape change
- Live dry-run result for Tomas (N works extracted, Y non-journal-article filtered)
- Any deviations (e.g., if `fetchOrcid` also needed to be exported for testing after all)

Use the template at `/home/tomas/.claude/get-shit-done/templates/summary.md`.
</output>
