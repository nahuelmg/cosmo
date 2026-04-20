---
phase: 16-schema-sync-infrastructure
plan: 03
type: execute
wave: 2
depends_on: ["16-01"]
files_modified:
  - scripts/sync-publications.ts
  - scripts/sync-publications.test.ts
autonomous: true

must_haves:
  truths:
    - "scripts/sync-publications.ts accepts a --no-orcid flag (parseArgs options) with default false"
    - "When --no-arxiv, --no-inspire, and --no-orcid are all passed, the script writes 'No sources enabled' to stderr and exits 1"
    - "When --no-orcid is passed with InspireHEP + arXiv enabled, the script exits 0 and writes a valid content/publications.json"
    - "A stub fetchOrcid(orcid: string): Promise<Publication[]> exists and returns [] — Phase 17 replaces the body"
    - "syncMember accepts a runOrcid boolean parameter and invokes fetchOrcid(person.orcid_id) only when runOrcid is true"
    - "MemberSyncResult.orcidPubs: Publication[] is populated per-member"
    - "Per-member progress line format: `{slug} — InspireHEP: N, arXiv: N, ORCID: N` (or 'skipped' when a source is disabled)"
    - "normalizeDoi(doi): lowercases, strips https?://(dx.)?doi.org/ prefix, trims whitespace"
    - "dedupByDoi(entries) keeps first-seen DOI and returns [Publication[], droppedCount] — entries without DOI pass through unchanged"
    - "Cross-source dedup pipeline: dedupByArxivId per source → concat in priority order (manual, inspire, orcid, arxiv) → dedupByArxivId (existing cross-source) → dedupByDoi (new) → sort"
    - "DOI dedup runs BEFORE the final sort so source-priority order is preserved (InspireHEP > ORCID > arXiv)"
    - "_meta.counts includes orcid (ORCID entry count post-intra-source-dedup) and deduped (count of DOI duplicates dropped)"
    - "_meta.sources includes 'orcid' when runOrcid is true"
    - "Final summary line includes `${dedupedCount} deduped` segment"
    - "Vitest unit tests prove normalizeDoi strips prefixes/casing, dedupByDoi keeps InspireHEP over ORCID over arXiv, and no-DOI entries pass through"
    - "pnpm test, pnpm tsc --noEmit, and pnpm build all pass"
  artifacts:
    - path: "scripts/sync-publications.ts"
      provides: "Extended CLI (--no-orcid), fetchOrcid stub, DOI dedup pipeline, updated progress/summary output, updated _meta block"
      contains: "dedupByDoi"
    - path: "scripts/sync-publications.test.ts"
      provides: "Unit tests for normalizeDoi, dedupByDoi, and mergePublications-with-orcid (if signature extended)"
      contains: "dedupByDoi"
  key_links:
    - from: "scripts/sync-publications.ts main() pipeline"
      to: "dedupByDoi"
      via: "post-arxiv-dedup, pre-sort call on priority-ordered merged array"
      pattern: "dedupByDoi\\("
    - from: "scripts/sync-publications.ts syncMember"
      to: "fetchOrcid stub"
      via: "runOrcid ? fetchOrcid(person.orcid_id) : []"
      pattern: "fetchOrcid\\("
    - from: "scripts/sync-publications.ts main() _meta block"
      to: "PublicationsMetaSchema"
      via: "safeParse of fileData with counts.orcid and counts.deduped set"
      pattern: "orcid:\\s*allOrcid.length|deduped:\\s*dedupedCount"
---

<objective>
Wire the three-source sync pipeline in `scripts/sync-publications.ts`: add the `--no-orcid` CLI flag, ship a stub `fetchOrcid()` that returns `[]`, implement `normalizeDoi` + `dedupByDoi`, rewire the dedup pipeline so DOI dedup runs BEFORE the final sort (precedence InspireHEP > ORCID > arXiv), extend `_meta.counts` with `orcid` + `deduped`, update progress and summary output, and prove correctness with Vitest.

Purpose: This plan delivers the runtime behaviour behind Phase 16's goal — the sync script accepts an `--no-orcid` flag, the `ORCID` cell appears in per-member progress, and DOI-based cross-source dedup is provably correct. Phase 17 will replace `fetchOrcid`'s body with real ORCID API calls without touching any other code.

Output: `scripts/sync-publications.ts` updated, new unit tests added, `pnpm sync-publications --no-orcid --dry-run` runs cleanly and prints ORCID cells + deduped count, `pnpm sync-publications --no-arxiv --no-inspire --no-orcid` exits 1, all tests green.
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/16-schema-sync-infrastructure/16-RESEARCH.md
@.planning/phases/16-schema-sync-infrastructure/16-01-SUMMARY.md

@scripts/sync-publications.ts
@scripts/sync-publications.test.ts
@src/content/schemas/publications.schema.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add --no-orcid flag, stub fetchOrcid, and extend syncMember/MemberSyncResult for ORCID</name>
  <files>scripts/sync-publications.ts</files>
  <action>
All edits in `scripts/sync-publications.ts`. Follow the exact file shape; do not restructure regions you're not told to touch.

1. Update the CLI doc-comment at the top of the file (line 4) from:
   ```
   * CLI: pnpm sync-publications [--dry-run] [--member <slug>] [--no-arxiv] [--no-inspire] [--verbose]
   ```
   to include `[--no-orcid]`:
   ```
   * CLI: pnpm sync-publications [--dry-run] [--member <slug>] [--no-arxiv] [--no-inspire] [--no-orcid] [--verbose]
   ```

2. `parseArgs` options (lines 35–45): add `"no-orcid": { type: "boolean", default: false }` after `"no-inspire"`. Preserve existing alignment.

3. Add a stub `fetchOrcid` near the other fetchers (e.g., after `fetchArXiv`, before `fetchInspireHEP` — wherever is cleanest in the fetcher section). Signature MUST match Phase 17's expected shape so Phase 17 only changes the body:
   ```ts
   /**
    * Phase 16 stub — returns []. Phase 17 replaces the body with a real
    * https://pub.orcid.org/v3.0/{orcid}/works fetch + per-work detail expansion.
    * Signature frozen per 16-RESEARCH.md so Phase 17 is a body-only swap.
    */
   async function fetchOrcid(_orcid: string): Promise<Publication[]> {
     return [];
   }
   ```
   The unused `_orcid` parameter is intentional — Phase 17 will use it.

4. `MemberSyncResult` (lines 499–505): add `orcidPubs: Publication[]`.
   ```ts
   type MemberSyncResult = {
     slug: string;
     name: string;
     inspirePubs: Publication[];
     arxivPubs: Publication[];
     orcidPubs: Publication[];
     warnings: string[];
   };
   ```

5. `syncMember` (lines 507–552):
   - Add `runOrcid: boolean` parameter AFTER `runArxiv`.
   - Initialise `orcidPubs: []` in the `result` literal.
   - Add a block mirroring the `runArxiv` block. It must:
     - Check `person.orcid_id` exists (reuse the pattern from `runArxiv`).
     - Call `await fetchOrcid(person.orcid_id)` — the stub returns `[]`, so no warning is pushed for "no results" in Phase 16. Do NOT add a warning for empty results in the stub (the real fetcher in Phase 17 will handle that contextually). Do add the "skipping ORCID for X: no orcid_id" warning when `orcid_id` is missing, mirroring the arXiv variant.
     - Assign to `result.orcidPubs`.

   Example:
   ```ts
   if (runOrcid) {
     if (person.orcid_id) {
       // Phase 16 stub — returns []. Phase 17 wires the real fetch.
       result.orcidPubs = await fetchOrcid(person.orcid_id);
     } else {
       result.warnings.push(`skipping ORCID for ${person.name}: no orcid_id`);
     }
   }
   ```

6. Do NOT yet modify `main()` — that lives in Task 2 (must be sequenced so Task 1 compiles independently).

Between tasks, run `pnpm tsc --noEmit`. It may still fail because `main()` hasn't been updated to call `syncMember` with four args — that's expected; finish Task 2 to close the gap.
  </action>
  <verify>
- `parseArgs` options object contains `"no-orcid"`.
- `fetchOrcid` declared once, returns `[]`, has exactly the signature `async function fetchOrcid(_orcid: string): Promise<Publication[]>`.
- `MemberSyncResult` has `orcidPubs: Publication[]`.
- `syncMember` takes `runOrcid` as 4th argument and populates `orcidPubs`.
  </verify>
  <done>
- `--no-orcid` is a real parseArgs option.
- Stub `fetchOrcid` exists with the frozen signature.
- `MemberSyncResult.orcidPubs` is populated per-member.
- No other regions of the file touched in this task.
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire main() pipeline — guard, progress line, DOI dedup, _meta, summary</name>
  <files>scripts/sync-publications.ts</files>
  <action>
All edits in `scripts/sync-publications.ts`. This task owns `main()` from the all-sources guard down through the final summary line, plus the two new helpers (`normalizeDoi`, `dedupByDoi`).

1. Add `normalizeDoi` and `dedupByDoi` as EXPORTED functions, placed near `dedupByArxivId` (for locality and test discovery):

```ts
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
```

2. Update the all-sources-skipped guard (lines 560–565). Current:
   ```ts
   if (flags["no-arxiv"] && flags["no-inspire"]) {
     process.stderr.write(
       "No sources enabled — pass only one of --no-arxiv / --no-inspire\n",
     );
     process.exit(1);
   }
   ```
   Replace with:
   ```ts
   if (flags["no-arxiv"] && flags["no-inspire"] && flags["no-orcid"]) {
     process.stderr.write("No sources enabled\n");
     process.exit(1);
   }
   ```
   The simpler message matches CLI-02 exactly ("No sources enabled").

3. Declare `runOrcid` alongside the existing run flags:
   ```ts
   const runInspire = !flags["no-inspire"];
   const runArxiv   = !flags["no-arxiv"];
   const runOrcid   = !flags["no-orcid"];
   ```

4. Update the `tasks` line (around line 593) to pass `runOrcid`:
   ```ts
   const tasks = targetPeople.map((p) => () => syncMember(p, runInspire, runArxiv, runOrcid));
   ```

5. Update the per-member progress loop (lines 598–606). Add `orcidCell` and extend the stdout write:
   ```ts
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
   ```

6. Rewire the dedup + merge pipeline (lines 608–621). Current:
   ```ts
   const allInspire = dedupByArxivId(memberResults.flatMap((r) => r.inspirePubs));
   const allArxiv = dedupByArxivId(memberResults.flatMap((r) => r.arxivPubs));
   const manualEntries = readManualEntries();
   const preMerged = mergePublications(manualEntries, allInspire, allArxiv);
   const merged = dedupByArxivId(preMerged);
   ```

   Replace with:
   ```ts
   // Intra-source dedup by arXiv ID
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

   // Final sort (year desc, arxiv desc, no-arxiv last). Dedup is complete at this point.
   const merged = mergePublications(postDoiDedup);
   ```

   Note the change to `mergePublications`. Two acceptable options — pick whichever is cleaner:

   **Option A (recommended — minimal churn):** Refactor `mergePublications` to accept a single pre-concatenated array and only sort. Old signature `(manualEntries, inspireEntries, arxivEntries)` becomes `(entries: Publication[])`. Body collapses to:
   ```ts
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
   ```
   This requires updating the corresponding test in `scripts/sync-publications.test.ts` (Task 3).

   **Option B:** Keep old multi-arg signature and extend with optional `orcidEntries`. Works but leaves dedup concatenation inconsistent — we'd still have to concat manually in main() to apply DOI dedup before sort, making the function parameters vestigial. Prefer Option A.

7. Update the `_meta` block (lines 623–636). Current:
   ```ts
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
     },
     warnings: allWarnings,
   };
   ```
   Change to:
   ```ts
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
   ```

8. Update both summary lines (dry-run and final) to include `dedupedCount`.

   Dry-run summary (around line 670):
   ```ts
   process.stdout.write(
     `Sync complete (dry-run): ${merged.length} publications` +
       ` (${added} added, ${removed} removed, ${unchanged} unchanged, ${dedupedCount} deduped, ${allWarnings.length} warnings)\n` +
       `Would write ${json.length} bytes to ${outputPath}\n`,
   );
   ```

   Final summary (around line 680):
   ```ts
   process.stdout.write(
     `Sync complete: ${merged.length} publications` +
       ` (${added} added, ${removed} removed, ${unchanged} unchanged, ${dedupedCount} deduped, ${allWarnings.length} warnings)\n`,
   );
   ```

9. Run `pnpm tsc --noEmit`. Fix any TypeScript errors surfaced by the `mergePublications` signature change (expected in the test file — covered in Task 3).

10. Manual dry-run verification (requires completed schema plan 16-01):
    ```
    pnpm sync-publications --no-orcid --dry-run
    ```
    Confirm:
    - Per-member lines match `{slug} — InspireHEP: N, arXiv: N, ORCID: skipped` (ORCID disabled).
    - Final line reads `Sync complete (dry-run): ... 0 deduped, ... warnings` (dedup is a no-op on current data — arXiv entries lack DOIs).

    ```
    pnpm sync-publications --no-arxiv --no-inspire --no-orcid
    ```
    Confirm exit code is 1 and stderr contains `No sources enabled`.

    ```
    pnpm sync-publications --dry-run
    ```
    Confirm ORCID cell reads `ORCID: 0` (stub returns []) and no crash.
  </action>
  <verify>
- `pnpm tsc --noEmit` passes cleanly after Task 3's test updates (will fail after this task alone if mergePublications signature changed — expected).
- Manual dry-run with `--no-orcid` exits 0 and prints the three-cell progress line.
- Manual run of `--no-arxiv --no-inspire --no-orcid` exits 1 with `No sources enabled`.
- `_meta.counts` in the produced output includes `orcid` and `deduped` integers.
- `_meta.sources` in the produced output includes `"orcid"` when runOrcid is true.
  </verify>
  <done>
- DOI dedup pipeline in place, running BEFORE the final sort.
- CLI guard, progress line, summary line, and `_meta` block all extended per CLI-01..04, DEDUP-01..05.
- Dry-run verification passes (script exits 0 when at least one source enabled; exits 1 when all three disabled).
  </done>
</task>

<task type="auto">
  <name>Task 3: Vitest unit tests — normalizeDoi, dedupByDoi, mergePublications signature</name>
  <files>scripts/sync-publications.test.ts</files>
  <action>
Open `scripts/sync-publications.test.ts` and add the Phase 16 tests. Import `normalizeDoi` and `dedupByDoi` from `./sync-publications`.

1. If Task 2 refactored `mergePublications` to single-arg signature, update existing `mergePublications` tests to pass a single pre-concatenated array. Preserve the intent of each test (sort order, year bucketing, arxiv-absent handling). Do NOT delete old tests — adapt them.

2. Add `normalizeDoi` test suite:
   ```ts
   describe("normalizeDoi", () => {
     it("lowercases DOIs", () => {
       expect(normalizeDoi("10.1103/PhysRevD.108.103512")).toBe("10.1103/physrevd.108.103512");
     });
     it("strips https://doi.org/ prefix", () => {
       expect(normalizeDoi("https://doi.org/10.1234/ABC")).toBe("10.1234/abc");
     });
     it("strips http://dx.doi.org/ prefix", () => {
       expect(normalizeDoi("http://dx.doi.org/10.1234/ABC")).toBe("10.1234/abc");
     });
     it("trims whitespace", () => {
       expect(normalizeDoi("  10.1234/abc  ")).toBe("10.1234/abc");
     });
     it("handles already-normalised DOIs", () => {
       expect(normalizeDoi("10.1016/j.nima.2020.164490")).toBe("10.1016/j.nima.2020.164490");
     });
   });
   ```

3. Add `dedupByDoi` test suite covering DEDUP-02, DEDUP-04, DEDUP-05:
   ```ts
   describe("dedupByDoi", () => {
     // Use the minimal Publication shape. Re-use an existing test fixture helper if one exists;
     // otherwise inline the minimal required fields per PublicationSchema.
     const basePub = (overrides: Partial<Publication>): Publication => ({
       id: "x", authors: ["A"], title: "T", journal: "J", year: 2024,
       topic_tags: [], source: "manual",
       ...overrides,
     });

     it("keeps InspireHEP over ORCID over arXiv when DOIs match", () => {
       // Input must be in priority order: inspire → orcid → arxiv
       const inspire = basePub({ id: "i", source: "inspirehep", doi: "10.1234/test" });
       const orcid   = basePub({ id: "o", source: "orcid",      doi: "10.1234/test" });
       const arxiv   = basePub({ id: "a", source: "arxiv",      doi: "10.1234/test" });
       const [deduped, dropped] = dedupByDoi([inspire, orcid, arxiv]);
       expect(deduped.length).toBe(1);
       expect(deduped[0].source).toBe("inspirehep");
       expect(dropped).toBe(2);
     });

     it("normalises DOIs before comparison", () => {
       const a = basePub({ id: "a", source: "inspirehep", doi: "10.1234/TEST" });
       const b = basePub({ id: "b", source: "orcid",      doi: "https://doi.org/10.1234/test" });
       const [deduped, dropped] = dedupByDoi([a, b]);
       expect(deduped.length).toBe(1);
       expect(deduped[0].id).toBe("a");
       expect(dropped).toBe(1);
     });

     it("passes entries without DOI through unchanged (DEDUP-04)", () => {
       const a = basePub({ id: "a", source: "arxiv" /* no doi */ });
       const b = basePub({ id: "b", source: "arxiv" /* no doi */ });
       const [deduped, dropped] = dedupByDoi([a, b]);
       expect(deduped.length).toBe(2);
       expect(dropped).toBe(0);
     });

     it("reports dedupedCount accurately (DEDUP-05)", () => {
       const list = [
         basePub({ id: "1", source: "inspirehep", doi: "10.1/a" }),
         basePub({ id: "2", source: "orcid",      doi: "10.1/a" }), // dup
         basePub({ id: "3", source: "inspirehep", doi: "10.1/b" }),
         basePub({ id: "4", source: "arxiv",      doi: "10.1/b" }), // dup
         basePub({ id: "5", source: "inspirehep", doi: "10.1/c" }),
       ];
       const [, dropped] = dedupByDoi(list);
       expect(dropped).toBe(2);
     });
   });
   ```

4. Run the full test suite:
   ```
   pnpm test
   ```
   All new tests must pass. Existing `dedupByArxivId` and `mergePublications` tests must continue to pass (adjust `mergePublications` calls if Option A was used in Task 2).

5. Run the full build gate:
   ```
   pnpm tsc --noEmit
   pnpm test
   pnpm build
   ```
   All must exit 0.
  </action>
  <verify>
- `pnpm test` green; all new tests pass.
- `pnpm tsc --noEmit` exits 0.
- `pnpm build` exits 0 (runs validate-content on the existing content/publications.json which has the patched counts from 16-01).
- Coverage: normalizeDoi covered by ≥4 cases; dedupByDoi covered by precedence, normalisation, no-DOI pass-through, and count-accuracy cases.
  </verify>
  <done>
- Unit tests for `normalizeDoi` (≥4 cases) and `dedupByDoi` (≥4 cases) pass.
- Existing tests still pass (adapted to new mergePublications signature if Option A).
- `pnpm test`, `pnpm tsc --noEmit`, `pnpm build` all exit 0.
  </done>
</task>

</tasks>

<verification>
Phase-level gates satisfied after this plan (combined with 16-01):
- Success criterion 2: `--no-orcid` with two sources enabled exits 0; `--no-arxiv --no-inspire --no-orcid` exits 1 with `No sources enabled`.
- Success criterion 3: Per-member line includes ORCID cell; final summary includes deduped count.
- Success criterion 4: Unit tests prove InspireHEP > ORCID > arXiv DOI precedence and deduped count accuracy. Manual dry-run also demonstrates the full pipeline.

Combined with 16-02:
- Success criterion 5: Workflow runs all three sources by default; Phase 16 stub returns [] so no real ORCID API call fires.
</verification>

<success_criteria>
- `scripts/sync-publications.ts` has `--no-orcid` flag, `fetchOrcid` stub, `normalizeDoi`, `dedupByDoi`, extended `syncMember`, rewired `main()` pipeline, extended progress/summary/_meta.
- `scripts/sync-publications.test.ts` has passing tests for `normalizeDoi` + `dedupByDoi` (and updated `mergePublications` tests if signature changed).
- Manual dry-run: `pnpm sync-publications --no-orcid --dry-run` prints `ORCID: skipped` cells and `N deduped` in summary.
- Manual run: `pnpm sync-publications --no-arxiv --no-inspire --no-orcid` exits 1 with `No sources enabled`.
- `pnpm tsc --noEmit`, `pnpm test`, `pnpm build` all green.
</success_criteria>

<output>
After completion, create `.planning/phases/16-schema-sync-infrastructure/16-03-SUMMARY.md`
</output>
