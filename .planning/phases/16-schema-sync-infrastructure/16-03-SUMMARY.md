---
phase: 16-schema-sync-infrastructure
plan: 03
subsystem: infra
tags: [typescript, vitest, publications, orcid, dedup, doi, sync-script]

# Dependency graph
requires:
  - phase: 16-01-schema-extension
    provides: orcid source enum + required orcid/deduped count fields in PublicationsMetaSchema
provides:
  - --no-orcid CLI flag wired to parseArgs (strict mode)
  - fetchOrcid stub with frozen Phase 17 signature returning []
  - normalizeDoi: lowercases + strips doi.org prefix variants + trims
  - dedupByDoi: cross-source first-seen-wins returning [Publication[], droppedCount]
  - Rewired main() pipeline: intra-source dedup → priority concat → arXiv-ID cross-dedup → DOI cross-dedup → sort
  - Per-member progress line extended with ORCID cell (count or "skipped")
  - Summary lines extended with dedupedCount segment
  - _meta.counts.orcid and _meta.counts.deduped set to real computed values
  - Unit tests: normalizeDoi (5 cases) + dedupByDoi (4 cases) + adapted mergePublications tests
affects:
  - 16-04-orcid-fetch (Phase 17 — replaces fetchOrcid body only, signature frozen)
  - sync-publications.ts pipeline (DOI dedup runs before sort — ordering is load-bearing)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DOI dedup before sort: dedupByDoi must run on priority-ordered array before mergePublications to preserve first-seen-wins precedence"
    - "Frozen stub signature: fetchOrcid(_orcid) body is Phase 16 stub; Phase 17 is a body-only swap"
    - "Single-arg mergePublications: accepts pre-concatenated priority-ordered array; caller controls concatenation order"
    - "Source-priority pipeline: manual > inspire > orcid > arxiv in concat order; feeds both arXiv-ID and DOI dedup"

key-files:
  created: []
  modified:
    - scripts/sync-publications.ts
    - scripts/sync-publications.test.ts

key-decisions:
  - "mergePublications refactored to single-arg (Option A) — removes vestigial 3-arg shape that would have required caller to pre-concat anyway for DOI dedup to work correctly"
  - "fetchOrcid placed between fetchArXiv and extraction helpers — logically grouped with network fetchers, before pure extraction layer"
  - "No 'empty ORCID results' warning in Phase 16 stub — stub always returns []; Phase 17 adds contextual warnings when real API returns no results"

patterns-established:
  - "Dedup-then-sort pipeline: apply all dedup steps before final sort so priority order is preserved through dedup decisions"

# Metrics
duration: 4min
completed: 2026-04-20
---

# Phase 16 Plan 03: Sync Pipeline Summary

**Three-source sync pipeline wired: --no-orcid flag, fetchOrcid stub, normalizeDoi + dedupByDoi helpers, DOI cross-source dedup before sort, ORCID cell in progress output, 9 new unit tests**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-20T16:59:31Z
- **Completed:** 2026-04-20T17:04:11Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- `--no-orcid` flag added to parseArgs; all-sources-disabled guard (`--no-arxiv --no-inspire --no-orcid`) exits 1 with `No sources enabled`
- `fetchOrcid(_orcid)` stub shipped with frozen Phase 17 signature; Phase 17 is a body-only swap
- `normalizeDoi` + `dedupByDoi` exported pure functions with full unit test coverage
- DOI dedup pipeline wired BEFORE `mergePublications` sort to preserve source-priority precedence (InspireHEP > ORCID > arXiv)
- Per-member progress lines now show three cells: `InspireHEP: N, arXiv: N, ORCID: N` (or "skipped")
- `_meta.counts.orcid` and `_meta.counts.deduped` are now real computed values (replace 16-01 placeholder zeros)
- `mergePublications` refactored to single pre-concatenated array signature (Option A)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add --no-orcid flag, stub fetchOrcid, extend syncMember/MemberSyncResult** - `cba7eae` (feat)
2. **Task 2: Wire main() pipeline — guard, progress, DOI dedup, _meta, summary** - `87a540e` (feat)
3. **Task 3: Vitest unit tests — normalizeDoi, dedupByDoi, mergePublications signature** - `a091c69` (test)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `scripts/sync-publications.ts` — `--no-orcid` parseArgs option, `fetchOrcid` stub, `normalizeDoi`, `dedupByDoi`, `mergePublications` single-arg refactor, extended `syncMember`/`MemberSyncResult`, rewired `main()` pipeline, updated `_meta` and summary output
- `scripts/sync-publications.test.ts` — `normalizeDoi` (5 cases) and `dedupByDoi` (4 cases) suites added; `mergePublications` tests adapted to single-arg signature

## Decisions Made

- `mergePublications` refactored to single-arg (Option A from plan): the 3-arg shape would have required the caller to pre-concatenate anyway for DOI dedup to work correctly, making the parameters vestigial. Single-arg is cleaner and removes the inconsistency.
- No "empty ORCID results" warning in the Phase 16 stub: the stub always returns `[]`; Phase 17 will add contextual no-results warnings when the real ORCID API is wired in.
- `fetchOrcid` placed after `fetchArXiv` in the file, logically grouped with network fetchers before the extraction helper section.

## Deviations from Plan

None — plan executed exactly as written. `mergePublications` Option A was explicitly recommended in the plan; no scope changes were required.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Sync pipeline foundation complete for Phase 17 (real ORCID API fetch):
  - `fetchOrcid` body is the only thing Phase 17 needs to change
  - `dedupByDoi` is already wired and tested; it will handle real ORCID DOI matches automatically
  - `_meta.counts.orcid` will naturally reflect real ORCID entry counts when Phase 17 ships real data
- `pnpm sync-publications --dry-run` shows `ORCID: 0` per member (stub) and `0 deduped` (no DOI collisions in current arXiv-only data)
- All three build gates green: `pnpm tsc --noEmit`, `pnpm test` (76/76), `pnpm build` (45 static pages)

---
*Phase: 16-schema-sync-infrastructure*
*Completed: 2026-04-20*
