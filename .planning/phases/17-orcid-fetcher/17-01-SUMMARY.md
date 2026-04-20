---
phase: 17-orcid-fetcher
plan: 01
subsystem: testing
tags: [orcid, vitest, fixtures, retry, http-503, fetch]

# Dependency graph
requires: []
provides:
  - scripts/fixtures/orcid-works-tomas.json — live ORCID works-list response (5 works, 8907 bytes)
  - scripts/fixtures/orcid-work-sipm.json — live per-work detail for SiPM paper (3960 bytes)
  - fetchWithRetry retries on HTTP 503 in addition to 429
  - vitest coverage of 503 retry happy-path and exhausted-retries fallthrough
affects:
  - 17-02 (extraction tests import orcid-works-tomas.json)
  - 17-03 (enrichment tests import orcid-work-sipm.json; relies on 503 retry handling)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixture files under scripts/fixtures/ for ground-truth ORCID API shapes"
    - "vi.spyOn(globalThis, 'fetch') with mockResolvedValueOnce for fetch retry tests"

key-files:
  created:
    - scripts/fixtures/orcid-works-tomas.json
    - scripts/fixtures/orcid-work-sipm.json
  modified:
    - scripts/sync-publications.ts
    - scripts/sync-publications.test.ts

key-decisions:
  - "503 retry added to shared fetchWithRetry wrapper rather than per-service config — keeps wrapper simple; arXiv/InspireHEP also benefit"
  - "Fixtures copied verbatim with cp to preserve byte-exact encoding (UTF-8 accented chars)"

patterns-established:
  - "scripts/fixtures/: home for verbatim API response captures used as test ground-truth"

# Metrics
duration: 20min
completed: 2026-04-20
---

# Phase 17 Plan 01: Fixtures and 503 Retry Summary

**Two verbatim ORCID API fixtures landed under scripts/fixtures/ and fetchWithRetry extended to retry on HTTP 503 (ORCID burst-exceed), with vitest coverage proving the new retry path**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-20T19:06:44Z
- **Completed:** 2026-04-20T19:26:11Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created `scripts/fixtures/` directory with two verbatim ORCID JSON responses captured during 17-RESEARCH.md; both contain the SiPM ground-truth markers (put-code 156875914, DOI 10.1016/j.nima.2020.164490, "Tomás Ferreira Chase" contributor in UTF-8)
- Extended `fetchWithRetry` retry predicate from `429` to `(429 || 503)` and updated log message to use dynamic status code; updated JSDoc to mention 503
- Added two vitest cases covering 503 retry: happy-path (503 then 200, exactly 2 fetch calls) and exhausted-retries fallthrough (all 503, returns final 503 after maxRetries+1 calls)
- Full test suite went from 76 to 78 tests, all green

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy ORCID fixtures into scripts/fixtures/** - `af2a6ea` (test)
2. **Task 2: Extend fetchWithRetry to also retry on HTTP 503** - `c755f57` (feat)
3. **Task 3: Add vitest case proving 503 retry behaviour** - `7df2be0` (test)

## Files Created/Modified

- `scripts/fixtures/orcid-works-tomas.json` - Live ORCID works-list for 0009-0001-0286-2136 (5 works, 8907 bytes); contains SiPM put-code 156875914
- `scripts/fixtures/orcid-work-sipm.json` - Per-work detail for SiPM paper (3960 bytes); contains DOI, contributors including "Tomás Ferreira Chase"
- `scripts/sync-publications.ts` - fetchWithRetry: predicate `(429 || 503)`, dynamic log status, JSDoc updated
- `scripts/sync-publications.test.ts` - Added fetchWithRetry describe block with 2 new tests; added `vi`, `afterEach`, `fetchWithRetry` to imports

## Decisions Made

- Extended the shared `fetchWithRetry` wrapper rather than introducing per-service retry config — ORCID returns 503 on burst-exceed, but arXiv/InspireHEP also emit 503 on downtime where a brief retry is correct behaviour. Single predicate change covers all three services with zero risk.
- Fixtures copied with `cp` (not Read/Write tools) to preserve verbatim encoding including UTF-8 accented characters in contributor names.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `scripts/fixtures/orcid-works-tomas.json` ready for 17-02 extraction tests
- `scripts/fixtures/orcid-work-sipm.json` ready for 17-03 enrichment tests
- `fetchWithRetry` 503 handling is a solved problem for both downstream plans
- No blockers

---
*Phase: 17-orcid-fetcher*
*Completed: 2026-04-20*
