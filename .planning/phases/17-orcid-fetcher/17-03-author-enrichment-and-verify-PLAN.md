---
phase: 17-orcid-fetcher
plan: 03
type: execute
wave: 3
depends_on: ["17-02"]
files_modified:
  - scripts/sync-publications.ts
  - scripts/sync-publications.test.ts
  - content/publications.json
autonomous: true

must_haves:
  truths:
    - "ORCID-only entries (no DOI collision with InspireHEP or arXiv) have their authors populated from the per-work detail endpoint (ORCID-06)"
    - "Per-work detail fetches run AFTER dedupByDoi so dedup-losers never hit the detail endpoint (research Pattern 1 Option B)"
    - "Per-work detail fetches use runBatched (≤5 in flight, 2s pause) — ORCID-07"
    - "Running pnpm sync-publications writes content/publications.json with ≥1 entry where source === 'orcid'"
    - "Tomas Ferreira Chase's SiPM paper (DOI 10.1016/j.nima.2020.164490) is in content/publications.json with source: 'orcid', full 11-author list, year 2020, correct journal"
    - "Running pnpm sync-publications --no-orcid produces output with no 'orcid' in _meta.sources and no source:'orcid' entries"
    - "ORCID 404 for a person does not abort the sync — warning logged, other sources still write"
  artifacts:
    - path: "scripts/sync-publications.ts"
      provides: "fetchOrcidWorkDetail network wrapper, enrichOrcidAuthors pure-ish async pass, main() pipeline wire-in between dedupByDoi and mergePublications"
      contains: "enrichOrcidAuthors"
    - path: "scripts/sync-publications.test.ts"
      provides: "Vitest suites for enrichOrcidAuthors (author merge, placeholder fallback, non-ORCID passthrough, fixture-driven SiPM 11-author case)"
      contains: "enrichOrcidAuthors"
    - path: "content/publications.json"
      provides: "Post-Phase-17 snapshot including the SiPM paper from ORCID and real _meta.counts.orcid / _meta.counts.deduped values"
      contains: '"source": "orcid"'
  key_links:
    - from: "scripts/sync-publications.ts:enrichOrcidAuthors"
      to: "/v3.0/{orcid}/work/{putCode}"
      via: "fetchOrcidWorkDetail using runBatched"
      pattern: "/work/\\$\\{putCode\\}"
    - from: "scripts/sync-publications.ts:main()"
      to: "enrichOrcidAuthors"
      via: "called between dedupByDoi and mergePublications"
      pattern: "enrichOrcidAuthors\\(postDoiDedup"
    - from: "content/publications.json:SiPM entry"
      to: "source: 'orcid'"
      via: "survives DOI dedup as ORCID-only, author list populated from detail endpoint"
      pattern: '"doi": "10\\.1016/j\\.nima\\.2020\\.164490"'
---

<objective>
Implement the two-stage Pattern 1 (Option B from research) author enrichment: after
`dedupByDoi` has reduced the publication set to survivors, fetch the per-work detail
endpoint for every `source === "orcid"` row that remains, replace the placeholder
author list (`[person.name]`) with the full `contributors.contributor[].credit-name.value`
list, and re-insert the enriched entry into the pipeline before the final sort.

Then run the full three-source sync against the live API, verify that Tomas's SiPM
paper appears in `content/publications.json` with `source: "orcid"` and 11 authors,
verify `--no-orcid` produces a pre-v1.3-identical output shape, and commit the
updated `content/publications.json`.

Purpose: Deliver ORCID-06 (per-work detail fetch for ORCID-only entries) and all
four Phase 17 Success Criteria. This is the last functional plan in Phase 17 — after
it lands, ORCID-01 through ORCID-07 are complete and `content/publications.json`
carries real ORCID data through to the display-layer work in Phase 18.

Output:
- `fetchOrcidWorkDetail` network wrapper (hits `/v3.0/{orcid}/work/{putCode}`)
- `enrichOrcidAuthors` async pass consuming the lookup side-map from 17-02
- `main()` rewired to call `enrichOrcidAuthors` between `dedupByDoi` and `mergePublications`
- Unit tests using the SiPM detail fixture
- Committed `content/publications.json` with ≥1 `source: "orcid"` entry + the SiPM paper
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
@.planning/phases/17-orcid-fetcher/17-02-SUMMARY.md
@scripts/sync-publications.ts
@scripts/sync-publications.test.ts
@scripts/fixtures/orcid-work-sipm.json
@content/publications.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement fetchOrcidWorkDetail + enrichOrcidAuthors</name>
  <files>scripts/sync-publications.ts</files>
  <action>
    In `scripts/sync-publications.ts`, add the per-work detail fetch + enrichment pass.

    **Types (extend the ORCID type block added in 17-02, near the top of section H):**

    ```typescript
    interface OrcidContributor {
      "credit-name"?: { value: string } | null;
      // NOTE: contributor-orcid / contributor-attributes exist but we don't read them.
    }

    interface OrcidWorkDetail {
      contributors?: { contributor?: OrcidContributor[] | null } | null;
      // Detail endpoint also returns everything the summary has; we only use contributors.
    }
    ```

    **Network wrapper (add to section H right after `fetchOrcid`):**

    ```typescript
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
    ```

    **Enrichment pass (add to section I extraction helpers, near the bottom):**

    ```typescript
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
    ```

    **Wire into `main()` between `dedupByDoi` and `mergePublications` (around lines 684–687):**

    Current code (line 684–687):
    ```typescript
    const [postDoiDedup, dedupedCount] = dedupByDoi(postArxivDedup);

    // Final sort (year desc, arxiv desc, no-arxiv last). Dedup is complete at this point.
    const merged = mergePublications(postDoiDedup);
    ```

    Replace with:
    ```typescript
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
    ```

    **Do NOT** change `dedupByDoi`, `mergePublications`, the `_meta` block, or the
    summary line — they're already correct and continue to work unchanged (enrichment
    only replaces the `authors` array on a subset of entries; it does not add or remove
    entries, reorder them, or change source/DOI fields).

    **Do NOT** add a per-member warning for "enrichment failed on N entries" — the
    detail-endpoint 404 case is rare and not user-actionable. A verbose-mode stderr
    message from `fetchOrcidWorkDetail` is enough.

    **Gotchas:**
    - The return type of the inner task function is `[string, Publication]` (tuple).
      `new Map(enriched)` then works as expected. If TS complains about inference, widen
      the task type to `() => Promise<[string, Publication]>` explicitly.
    - `contributors.contributor` can be `null` in the response; the optional chaining
      (`detail.contributors?.contributor?.map(...)`) handles that. Do NOT default it to
      `[]` before the map — let the final `filter(...) ?? []` handle the nullish case.
    - Preserve source-priority order: we iterate `survivors` (post-dedup, still in
      priority order) and splice enriched entries back into THAT order — we do NOT sort
      or reorder inside `enrichOrcidAuthors`.
  </action>
  <verify>
    `pnpm tsc --noEmit` passes cleanly.

    `grep -n "export async function enrichOrcidAuthors" scripts/sync-publications.ts`
    returns exactly one match.

    `grep -n "enrichOrcidAuthors(postDoiDedup" scripts/sync-publications.ts` returns
    exactly one match (wired into main()).

    `grep -n "/v3.0/\${orcid}/work/\${putCode}" scripts/sync-publications.ts` returns
    exactly one match (inside `fetchOrcidWorkDetail`).

    Full test suite still passes: `pnpm vitest run scripts/sync-publications.test.ts`
    — count unchanged from end of 17-02 (no tests added yet; Task 2 adds them).

    Dry-run against Tomas exits 0:
    `pnpm sync-publications --dry-run --member tomas-ferreira-chase` — the progress line
    shows the real ORCID count AND the command completes (no errors from enrichment).
  </verify>
  <done>
    `fetchOrcidWorkDetail` and `enrichOrcidAuthors` are implemented and wired into
    `main()` between `dedupByDoi` and `mergePublications`. The pipeline type-checks and
    existing tests still pass. A dry-run against Tomas completes without errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Vitest coverage for enrichOrcidAuthors (fixture-driven)</name>
  <files>scripts/sync-publications.test.ts</files>
  <action>
    Add a new describe block to `scripts/sync-publications.test.ts` covering
    `enrichOrcidAuthors`. Import it from `./sync-publications`.

    **`enrichOrcidAuthors` cannot hit the real network in tests** — mock `globalThis.fetch`
    with `vi.spyOn(globalThis, 'fetch')` at the start of each test and return a Response
    whose `.json()` resolves to either the imported SiPM fixture or an inline stub.

    **Cases:**

    1. `fixture-driven: SiPM enrichment yields 11 authors`
       - Build a `survivors` array with a single ORCID publication matching the SiPM
         paper shape (DOI `10.1016/j.nima.2020.164490`, source `"orcid"`, authors
         `["Tomas Ferreira Chase"]` placeholder).
       - Build a `lookup` map with that pub id → `{ orcid: "0009-0001-0286-2136", putCode: 156875914 }`.
       - Mock `fetch` to return the SiPM fixture (import from `./fixtures/orcid-work-sipm.json`).
       - Call `await enrichOrcidAuthors(survivors, lookup)`.
       - Assert the result has exactly one entry, `authors.length === 11`, and
         `authors` includes `"Tomás Ferreira Chase"` (NFC-normalized with accent) AND
         `"Mariano Barella"` (first contributor in the fixture).

    2. `empty contributors list falls back to placeholder`
       - `survivors` = one ORCID pub with placeholder authors `["Owner"]`.
       - Mock `fetch` to return `{ contributors: { contributor: [] } }`.
       - Assert the result's authors is still `["Owner"]` (placeholder preserved —
         schema requires min 1 author).

    3. `contributors with null credit-name are filtered, placeholder preserved if all null`
       - Mock fetch returns `{ contributors: { contributor: [{ "credit-name": null }, { "credit-name": null }] } }`.
       - Assert the publication's authors remains the placeholder `["Owner"]`.

    4. `partial null credit-names are skipped, valid names kept`
       - Mock fetch returns `{ contributors: { contributor: [{ "credit-name": { value: "Alice" } }, { "credit-name": null }, { "credit-name": { value: "Bob" } }] } }`.
       - Assert authors === `["Alice", "Bob"]` (order preserved, nulls dropped).

    5. `non-ORCID survivors pass through unchanged`
       - `survivors` = `[{ source: "inspirehep", id: "arxiv-foo", authors: ["X"], ... }, { source: "orcid", id: "orcid-only", authors: ["Owner"], ... }]`.
       - `lookup` = one entry for `orcid-only`.
       - Mock fetch returns a fixture with one contributor named `"Real"`.
       - Assert the inspirehep row is byte-identical in the output; the orcid row has
         authors `["Real"]`.

    6. `ORCID survivor not in lookup passes through unchanged`
       - `survivors` = one ORCID publication.
       - `lookup` = empty Map.
       - Assert fetch was NEVER called; the publication is unchanged.

    7. `detail 404 falls back to placeholder`
       - Mock fetch to return `new Response('{}', { status: 404 })`.
       - Assert the publication's authors is unchanged (placeholder preserved); the
         test does NOT throw.

    Restore the spy after each test (`vi.restoreAllMocks()` in an `afterEach`).

    **Fixture import note:** if TS complains about `import x from "./fixtures/..." with { type: "json" }`,
    use `JSON.parse(readFileSync("scripts/fixtures/orcid-work-sipm.json", "utf-8"))` at
    the top of the describe block. Check whether vitest.config allows JSON imports;
    mirror whatever pattern 17-02 used successfully.

    **Do NOT** write a full `main()` integration test — that's a task for Task 3's
    manual/live verification. Unit tests here cover the enrichment function in
    isolation; the live sync in Task 3 is the integration gate.
  </action>
  <verify>
    `pnpm vitest run scripts/sync-publications.test.ts` passes; test count rose by
    ~7 vs end of 17-02.

    `grep -n '"Tomás Ferreira Chase"' scripts/sync-publications.test.ts` returns at
    least one match (SiPM fixture test explicitly asserts the accent-preserved name).

    `grep -n 'authors.length.*11\|toHaveLength(11)\|.length).toBe(11)' scripts/sync-publications.test.ts`
    returns at least one match (explicit 11-author assertion).

    `grep -n 'non-ORCID survivors' scripts/sync-publications.test.ts` returns a match.
  </verify>
  <done>
    `enrichOrcidAuthors` has unit coverage for the SiPM 11-author happy path, the
    placeholder fallback when contributors are null/empty, non-ORCID passthrough,
    missing-lookup passthrough, and detail-404 fallback. All tests pass.
  </done>
</task>

<task type="auto">
  <name>Task 3: Live end-to-end sync + commit updated content/publications.json</name>
  <files>
    content/publications.json
    scripts/sync-publications.ts
    scripts/sync-publications.test.ts
  </files>
  <action>
    Run the full three-source sync against the live API, verify the four Phase 17
    success criteria physically hold, and commit the resulting `content/publications.json`.

    **Step 3a: Pre-flight verification of the --no-orcid path (Success Criterion 3)**

    Make a quick backup of the current `content/publications.json`:
    ```bash
    cp content/publications.json /tmp/pubs-pre-phase17.json
    ```

    Run `pnpm sync-publications --no-orcid` and wait for it to finish.

    Inspect the resulting `content/publications.json`:
    - Confirm `_meta.sources` does NOT contain `"orcid"` — expected
      `["inspirehep","arxiv"]` (or whichever subset matches the current flag state).
    - Confirm there are zero entries with `source: "orcid"` in `publications[]`:
      ```bash
      jq '[.publications[] | select(.source == "orcid")] | length' content/publications.json
      ```
      must print `0`.
    - Confirm `_meta.counts.orcid` is `0`.
    - Confirm the publication ID set is IDENTICAL to `/tmp/pubs-pre-phase17.json`:
      ```bash
      diff <(jq -S '.publications | map(.id) | sort' content/publications.json) \
           <(jq -S '.publications | map(.id) | sort' /tmp/pubs-pre-phase17.json)
      ```
      must produce no output (empty diff).

    If anything fails here, STOP and diagnose before proceeding — Success Criterion 3
    is blocking.

    **Step 3b: Full three-source sync (Success Criteria 1, 2)**

    Run `pnpm sync-publications` (no flags, all three sources enabled). Wait for
    completion. Expected stdout indicators:
    - `Syncing N member(s)...` where N is the count of people with any sync ID.
    - Per-member progress lines with `ORCID: K` cells — at least some should have K > 0.
    - Final line: `Sync complete: N publications (A added, R removed, U unchanged, D deduped, W warnings)` —
      both A and D should be positive (new ORCID entries added, some deduped against
      existing InspireHEP/arXiv rows).

    Verify Success Criterion 1:
    ```bash
    jq '[.publications[] | select(.source == "orcid")] | length' content/publications.json
    ```
    must print a positive integer (≥ 1).

    Verify Success Criterion 2 (SiPM paper):
    ```bash
    jq '.publications[] | select(.doi == "10.1016/j.nima.2020.164490")' content/publications.json
    ```
    must return an object with:
    - `"source": "orcid"`
    - `"year": 2020`
    - `"journal"` starting with `"Nuclear Instruments and Methods"`
    - `"authors"` array with length exactly 11
    - `"authors"` includes both `"Mariano Barella"` and `"Tomás Ferreira Chase"` (NFC accent)

    Verify `_meta` shape:
    ```bash
    jq '._meta' content/publications.json
    ```
    - `sources` includes `"orcid"` (and preferably in the order `["inspirehep","orcid","arxiv"]` per main() line 693–695).
    - `counts.orcid > 0` and `counts.deduped >= 0`.

    **Step 3c: 404 resilience (Success Criterion 4)**

    Pick one person in `content/people.json` and temporarily change their `orcid_id`
    to `"0000-0000-0000-0000"` (a guaranteed-404 ORCID). Do NOT commit this change.

    Run `pnpm sync-publications --dry-run` (`--dry-run` keeps the on-disk JSON clean).

    Confirm:
    - The sync completes successfully (exit 0, no fatal error).
    - stderr contains: `Warning: ORCID profile not public or empty: 0000-0000-0000-0000`
    - The per-member progress line for that person shows `ORCID: 0` (not an error).
    - The `Sync complete (dry-run): ...` summary line is emitted.

    Revert the `content/people.json` change immediately (restore the original
    `orcid_id`). Re-run the full `pnpm sync-publications` one more time to regenerate
    the real publications.json (in case the 404 test subtly affected it — it shouldn't
    have in dry-run mode, but regenerate for safety).

    **Step 3d: Gates**

    Run in order:
    - `pnpm validate-content` — must pass (Zod validation of the new publications.json).
    - `pnpm tsc --noEmit` — zero errors.
    - `pnpm vitest run` — entire test suite green.
    - `pnpm build` — 45 static routes (or whatever the current count is); no errors.

    If any gate fails, STOP and fix before committing. Do NOT commit a broken
    publications.json.

    **Step 3e: Commit**

    Atomic commit:
    ```
    feat(17-03): fetch ORCID per-work details + enrich ORCID-only author lists

    - fetchOrcidWorkDetail: /v3.0/{orcid}/work/{putCode} with Accept: application/json
    - enrichOrcidAuthors: runBatched pass after dedupByDoi, fills credit-names for
      ORCID-only survivors (ORCID-06, Option B from 17-RESEARCH.md)
    - Wired into main() between dedupByDoi and mergePublications (preserves sort order)
    - Vitest: SiPM fixture 11-author case + null-contributor/placeholder fallbacks
    - content/publications.json regenerated: +N ORCID entries, M deduped, SiPM paper
      now live with source: "orcid"
    ```

    **Do NOT** amend, squash, or rebase — use a fresh commit. The updated
    `content/publications.json` goes in the SAME commit as the code + tests so the
    snapshot and the code that produced it move together atomically.

    **Do NOT** skip the `--no-orcid` verification step — it is Success Criterion 3 and
    it's easy to get wrong (e.g., if a code path accidentally writes `"orcid"` to
    `_meta.sources` when `runOrcid` is false, the test fails loudly here).
  </action>
  <verify>
    All four Success Criteria physically hold:

    1. `jq '[.publications[] | select(.source == "orcid")] | length' content/publications.json`
       prints a positive integer.

    2. `jq '.publications[] | select(.doi == "10.1016/j.nima.2020.164490") | {source, year, authorsCount: (.authors | length), journal: (.journal[:30])}' content/publications.json`
       prints `{"source":"orcid","year":2020,"authorsCount":11,"journal":"Nuclear Instruments and Methods"}`.

    3. `pnpm sync-publications --no-orcid` (quick re-run) + `jq '._meta.sources' content/publications.json`
       does NOT contain `"orcid"` AND `jq '[.publications[] | select(.source == "orcid")] | length' content/publications.json`
       returns `0`. After verification, re-run full `pnpm sync-publications` to restore
       the three-source output.

    4. Temporary-404 dry-run completed with a warning and no abort.

    All build gates pass:
    - `pnpm validate-content`
    - `pnpm tsc --noEmit`
    - `pnpm vitest run`
    - `pnpm build`

    Final atomic commit landed with message prefix `feat(17-03):` and includes both
    code and the updated content/publications.json.

    `git status` is clean.
  </verify>
  <done>
    `content/publications.json` contains real ORCID data including Tomas's SiPM paper
    with `source: "orcid"` and 11 authors; `--no-orcid` produces pre-v1.3-equivalent
    output; ORCID 404s are non-fatal; all build gates pass; the updated JSON is
    committed atomically with the code that produced it.
  </done>
</task>

</tasks>

<verification>
End-of-plan gates (all must pass before declaring Phase 17 complete):

1. **SC1 — ORCID entries present:** `jq '[.publications[] | select(.source == "orcid")] | length' content/publications.json` ≥ 1
2. **SC2 — SiPM paper live:** `jq '.publications[] | select(.doi == "10.1016/j.nima.2020.164490")' content/publications.json` shows
   source: "orcid", year: 2020, authors.length = 11, journal startsWith "Nuclear Instruments and Methods"
3. **SC3 — --no-orcid parity:** ran `--no-orcid`, _meta.sources excludes "orcid", zero source:"orcid" entries; publication ID set equals pre-Phase-17 snapshot
4. **SC4 — 404 resilience:** dry-run with fake ORCID produced a warning and no abort
5. **Typechecks:** `pnpm tsc --noEmit` green
6. **Tests:** `pnpm vitest run` green; count rose by ~7 vs end of 17-02
7. **Content validation:** `pnpm validate-content` green
8. **Build:** `pnpm build` green
9. **Git:** atomic `feat(17-03):` commit landed with code + tests + content/publications.json
</verification>

<success_criteria>
All four Phase 17 ROADMAP success criteria are physically satisfied:

1. Running `pnpm sync-publications` writes `content/publications.json` with ≥ 1
   entry where `source === "orcid"`.
2. Tomas Ferreira Chase's SiPM paper (DOI `10.1016/j.nima.2020.164490`) appears with
   `source: "orcid"`, full 11-contributor author list, year 2020, and the correct
   Nuclear Instruments journal string.
3. Running `pnpm sync-publications --no-orcid` produces output with no `"orcid"` in
   `_meta.sources` and zero `source: "orcid"` entries — structurally identical to
   pre-v1.3 sync.
4. A 404 from ORCID for one person emits a warning and does not abort the sync;
   `content/publications.json` is still written with the remaining sources' data.

All seven ORCID requirements (ORCID-01 through ORCID-07) are complete and exercised
by live API calls in Task 3.
</success_criteria>

<output>
After completion, create `.planning/phases/17-orcid-fetcher/17-03-SUMMARY.md`
summarising:
- The two new functions (`fetchOrcidWorkDetail`, `enrichOrcidAuthors`) — placement + LOC
- The wire-in diff in `main()`
- Test coverage delta (N new cases)
- Live sync statistics: N ORCID entries added, M deduped, W warnings
- SiPM paper confirmation (line/index in content/publications.json, author list check)
- Any deviations (e.g., if a person's 404 surfaced during the real sync and needed
  handling)
- Final state: Phase 17 is DONE; all 7 ORCID requirements complete; ready for
  `/gsd:verify-phase 17` and then Phase 18 (Display Layer).

Use the template at `/home/tomas/.claude/get-shit-done/templates/summary.md`.
</output>
