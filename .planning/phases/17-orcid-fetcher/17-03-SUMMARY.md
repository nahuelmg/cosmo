---
phase: 17-orcid-fetcher
plan: "03"
subsystem: api
tags: [orcid, publications, sync, typescript, vitest, jq]

# Dependency graph
requires:
  - phase: 17-02
    provides: fetchOrcid, orcidGroupToPublication, OrcidLookupEntry, orcidLookup side-map on MemberSyncResult
  - phase: 16-03
    provides: dedupByDoi, mergePublications, PublicationsMetaSchema with orcid/deduped counts
provides:
  - fetchOrcidWorkDetail: per-work detail fetcher hitting /v3.0/{orcid}/work/{putCode}
  - enrichOrcidAuthors: async enrichment pass replacing placeholder author lists post-dedup
  - main() wire-in between dedupByDoi and mergePublications (ORCID-06 Option B)
  - 7 new vitest cases for enrichOrcidAuthors covering SiPM 11-author, null/empty fallbacks, passthrough, 404
  - content/publications.json with 15 ORCID-only entries + SiPM paper with full 11-author list
affects: [18-display-layer, any phase reading content/publications.json authors field]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Enrich-after-dedup: run per-work detail fetches AFTER dedupByDoi so dedup-losers never hit the detail endpoint"
    - "first-seen-wins lookup map: built from memberResults[].orcidLookup before enrichment pass"
    - "Placeholder preservation: enrichOrcidAuthors keeps original authors when detail returns null/404/empty contributors"

key-files:
  created: []
  modified:
    - scripts/sync-publications.ts
    - scripts/sync-publications.test.ts
    - src/content/accessors/publications.test.ts
    - content/publications.json

key-decisions:
  - "Enrichment runs AFTER dedupByDoi (Option B from 17-RESEARCH.md): avoids per-work detail calls on dedup-losers"
  - "lookupByPubId built with first-seen-wins semantics over memberResults: handles shared ORCID papers across profiles"
  - "404 from detail endpoint falls back to placeholder authors (no throw): profile may change between works-list and detail fetches"
  - "publications.test.ts validSources set updated to include 'orcid': existing test was missing the new source value"

patterns-established:
  - "Enrichment-after-dedup: two-phase approach keeps expensive network calls out of dedup-loser rows"
  - "runBatched for ORCID detail fetches: consistent with ORCID-07 concurrency rules (5 in flight, 2s pause)"

# Metrics
duration: 25min
completed: 2026-04-20
---

# Phase 17 Plan 03: Author Enrichment and Verify Summary

**fetchOrcidWorkDetail + enrichOrcidAuthors wired into sync pipeline: 15 ORCID-only publications live including Tomas's SiPM paper with full 11-author list; all 4 Phase 17 success criteria verified**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-20T20:40:00Z
- **Completed:** 2026-04-20T20:50:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `fetchOrcidWorkDetail` wraps `/v3.0/{orcid}/work/{putCode}` with 404-null return and fetchWithRetry
- `enrichOrcidAuthors` replaces placeholder author lists for ORCID-only post-dedup survivors using runBatched
- `main()` wired to call `enrichOrcidAuthors` between `dedupByDoi` and `mergePublications` (ORCID-06 Option B)
- 7 new vitest cases: SiPM 11-author fixture, empty/null contributors fallback, partial null, non-ORCID passthrough, missing-lookup passthrough, 404 fallback
- Live sync: 15 ORCID-only publications added, 36 deduped, SiPM paper live with 11 authors and `source: "orcid"`
- All four Phase 17 success criteria verified (SC1/SC2/SC3/SC4)

## Task Commits

1. **Task 1: Implement fetchOrcidWorkDetail + enrichOrcidAuthors** - `91e6ec5` (feat)
2. **Task 2: Vitest coverage for enrichOrcidAuthors** - `9199cc0` (test)
3. **Task 3: Live sync + regenerate content/publications.json** - `e71b486` (feat)

**Plan metadata:** (docs(17-03): complete author-enrichment-and-verify plan)

## Files Created/Modified

- `scripts/sync-publications.ts` — Added `fetchOrcidWorkDetail` (lines ~396-406), `enrichOrcidAuthors` (lines ~704-730), and main() wire-in (lines ~881-897). Total +88 lines.
- `scripts/sync-publications.test.ts` — Added `enrichOrcidAuthors` to imports; added 7-case describe block `enrichOrcidAuthors`. 46→53 tests in file; 91→98 total.
- `src/content/accessors/publications.test.ts` — Updated `validSources` set to include `"orcid"` (auto-fixed: bug).
- `content/publications.json` — Regenerated: 321→336 publications, 15 ORCID-only entries, 36 deduped, SiPM paper with full 11-author list.

## main() Wire-in Diff

Before (2 lines):
```typescript
const [postDoiDedup, dedupedCount] = dedupByDoi(postArxivDedup);

// Final sort (year desc, arxiv desc, no-arxiv last). Dedup is complete at this point.
const merged = mergePublications(postDoiDedup);
```

After (16 lines inserted between dedupByDoi and mergePublications):
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

## Test Coverage Delta

- **Before:** 91 total tests (46 in sync-publications.test.ts)
- **After:** 98 total tests (53 in sync-publications.test.ts)
- **New cases (7):**
  1. `fixture-driven: SiPM enrichment yields 11 authors` — asserts `authors.length === 11`, includes "Tomás Ferreira Chase" and "Mariano Barella"
  2. `empty contributors list falls back to placeholder` — `contributor: []` keeps original authors
  3. `contributors with null credit-name are filtered, placeholder preserved if all null` — all null → placeholder
  4. `partial null credit-names are skipped, valid names kept in order` — Alice/null/Bob → ["Alice","Bob"]
  5. `non-ORCID survivors pass through unchanged; ORCID row is enriched` — byte-identical inspirehep row
  6. `ORCID survivor not in lookup passes through unchanged; fetch never called` — empty Map → no fetch
  7. `detail 404 falls back to placeholder without throwing` — 404 response → placeholder preserved

## Live Sync Statistics

```
Sync complete: 336 publications (15 added, 0 removed, 321 unchanged, 36 deduped, 3 warnings)
```

**_meta block:**
```json
{
  "synced_at": "2026-04-20T20:45:58.468Z",
  "sources": ["inspirehep", "orcid", "arxiv"],
  "counts": {
    "inspirehep": 317,
    "arxiv": 73,
    "manual": 0,
    "orcid": 87,
    "deduped": 36
  },
  "warnings": [
    "No arXiv results for Esteban Calzetta (0000-0002-3083-3420)",
    "No arXiv results for Susana Landau (0000-0003-2645-9197)",
    "No arXiv results for Javier Badia (0000-0002-9095-9594)"
  ]
}
```

(87 total ORCID entries collected from all members; 36 deduped against InspireHEP/arXiv; 15 ORCID-only survivors)

## SC2 — SiPM Paper Confirmation

```bash
jq '.publications[] | select(.doi == "10.1016/j.nima.2020.164490") | {source, year, authorsCount: (.authors | length), journal: (.journal[:40])}' content/publications.json
```
Output:
```json
{
  "source": "orcid",
  "year": 2020,
  "authorsCount": 11,
  "journal": "Nuclear Instruments and Methods in Physi"
}
```

Full author list (11): Mariano Barella, Tomás Ignacio Burroni, Irina Carsen, Mónica Far, **Tomás Ferreira Chase**, Lucas Finazzi, Federico Golmar, Fernando Gomez Marlasca, Federico Izraelevitch, Pablo Levy, Gabriel Sanca

## SC3 — `--no-orcid` jq Assertions

After running `pnpm sync-publications --no-orcid`:

```bash
jq '._meta.sources | any(. == "orcid")' content/publications.json   # → false ✓
jq '[.publications[] | select(.source == "orcid")] | length' content/publications.json   # → 0 ✓
jq '._meta.counts.orcid' content/publications.json   # → 0 ✓
```

All three SC3 assertions passed. Full sync was then re-run to restore three-source output before committing.

## SC4 — 404 Resilience

Verified by vitest case in `scripts/sync-publications.test.ts` (added in plan 17-02 Task 2, describe block `fetchOrcid — 404 resilience`):
- Test: `"returns empty result and emits warning when ORCID profile returns 404"`
- Mocks `globalThis.fetch` to return HTTP 404
- Asserts `fetchOrcid` returns `{ publications: [], lookup: [] }` without throwing
- Asserts warning `/ORCID profile not public or empty: 0000-0000-0000-0000/` written to stderr

```bash
pnpm vitest run scripts/sync-publications.test.ts -t "returns empty result and emits warning"
# → 1 passed | 52 skipped ✓
```

## Decisions Made

1. **Enrichment-after-dedup (Option B):** Per-work detail fetches run AFTER `dedupByDoi` so dedup-losers never consume rate-limited ORCID detail calls. Chosen over Option A (enrich all, then dedup) for efficiency.
2. **First-seen-wins on lookupByPubId:** When two members share an ORCID-only paper, the first member's (orcid, putCode) tuple is used for enrichment. Defensively correct since both would produce the same per-work detail.
3. **404 → placeholder fallback (no throw):** Detail endpoint returning 404 between works-list and detail fetch is a normal transient condition; keeping the placeholder authors is safer than throwing and aborting the entire sync.
4. **validSources test bug fixed inline:** The existing test in `publications.test.ts` expected only `["manual","inspirehep","arxiv"]`; this was a pre-existing bug that would have failed as soon as any ORCID data landed in publications.json.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] publications.test.ts validSources missing "orcid"**
- **Found during:** Task 3 (Step 3d build gates — `pnpm vitest run`)
- **Issue:** `src/content/accessors/publications.test.ts` line 205 had `new Set(["manual", "inspirehep", "arxiv"])` — "orcid" was never added when ORCID source was introduced in Phase 16-17.
- **Fix:** Added `"orcid"` to the set; `new Set(["manual", "inspirehep", "arxiv", "orcid"])`.
- **Files modified:** `src/content/accessors/publications.test.ts`
- **Verification:** `pnpm vitest run` → 98 passed (was: 1 failed)
- **Committed in:** `e71b486` (Task 3 commit, alongside content/publications.json)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Pre-existing bug in test suite; no scope creep. Fix was necessary for all tests to pass.

## Issues Encountered

None beyond the auto-fixed test bug above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 17 is COMPLETE. All 7 ORCID requirements (ORCID-01 through ORCID-07) are implemented and verified.
- `content/publications.json` contains 336 publications including 15 ORCID-only entries and the SiPM paper with full 11-author list.
- Ready for `/gsd:verify-phase 17` and then Phase 18 (Display Layer — showing authors on publications pages).
- No blockers.

---
*Phase: 17-orcid-fetcher*
*Completed: 2026-04-20*
