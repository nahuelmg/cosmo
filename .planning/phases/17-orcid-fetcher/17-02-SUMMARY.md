---
phase: 17-orcid-fetcher
plan: "02"
subsystem: api
tags: [orcid, publications, typescript, vitest, extraction, purecodepoint, doi, arxiv]

# Dependency graph
requires:
  - phase: 17-01
    provides: orcid-works-tomas.json fixture, fetchWithRetry 503 retry wrapper
  - phase: 16-03
    provides: dedupByDoi pipeline, MemberSyncResult shape, fetchOrcid stub
provides:
  - "Real fetchOrcid(orcid, ownerName) fetching https://pub.orcid.org/v3.0/{orcid}/works"
  - "Pure orcidGroupToPublication(group, ownerName) extractor: ORCID-04 filter, ORCID-05 id preference, Pattern 2 group-level ids, NFC normalization"
  - "OrcidExternalId, OrcidLookupEntry exported interfaces; OrcidWorkSummary, OrcidGroup, OrcidWorksResponse internal interfaces"
  - "Extended MemberSyncResult.orcidLookup: OrcidLookupEntry[] for 17-03 enrichment pass"
  - "13 new vitest cases: edge cases + fixture-driven SiPM + fetchOrcid 404"
affects:
  - 17-03 (enrichment pass reads orcidLookup side-map; 404 contract locked in by test)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern 2 (group-level external-id union): always extract DOI/arXiv from OrcidGroup.external-ids, NOT work-summary[0].external-ids"
    - "Pitfall 7 compliance: HTTP 200 with empty group[] is silent; only 404 emits a warning inside fetchOrcid"
    - "Single export surface: orcidGroupToPublication declared without export keyword; trailing export{} list is the only export surface (Phase 16 pattern)"
    - "OrcidGroupShape type alias via Parameters<typeof fn>[0] for test literals without exporting the interface"

key-files:
  created: []
  modified:
    - scripts/sync-publications.ts
    - scripts/sync-publications.test.ts

key-decisions:
  - "fetchOrcid 404 warning path uses process.stderr.write (not console.warn) for consistency with all other warnings in the file"
  - "orcidGroupToPublication returns { publication, putCode } tuple (not just Publication) so fetchOrcid can build OrcidLookupEntry without a second parse"
  - "JSON fixture loaded via JSON.parse(readFileSync(...)) in tests rather than import ... with { type: json } to avoid TS isolatedModules friction"
  - "OrcidGroup not exported — test files use Parameters<typeof orcidGroupToPublication>[0] as OrcidGroupShape type alias"

patterns-established:
  - "Pattern 2: group-level external-id union for DOI/arXiv extraction (not per-work-summary)"
  - "Pitfall 7: no warning on HTTP 200 empty group[]; warning only on 404 inside fetch function"

# Metrics
duration: 25min
completed: 2026-04-20
---

# Phase 17 Plan 02: fetch-orcid-and-extraction Summary

**Real ORCID works-list fetch + extraction: fetchOrcid returns Publication[]+OrcidLookupEntry[], orcidGroupToPublication filters by type, extracts DOI/arXiv from group-level union ids, normalises Unicode, and seeds placeholder authors — 5 ORCID works for tomas-ferreira-chase in live dry-run**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-20T17:30:00Z
- **Completed:** 2026-04-20T17:55:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced Phase 16 `fetchOrcid` stub with real implementation: GET `https://pub.orcid.org/v3.0/{orcid}/works`, Accept: application/json, 404 → warning + empty, 200 empty group → silent (Pitfall 7)
- Added `orcidGroupToPublication` pure extractor: ORCID-04 type filter (journal-article | conference-paper only), ORCID-05 id preference (DOI → arXiv → orcid-{putCode}), Pattern 2 group-level external-id union, NFC title+journal normalization, Preprint/current-year fallbacks
- Extended `MemberSyncResult` with `orcidLookup: OrcidLookupEntry[]` side-map for 17-03 enrichment
- Added 13 new vitest cases (78 → 91 total across all test files): 10 edge-case unit tests, 2 fixture-driven tests (Tomas works list + SiPM DOI assertion), 1 fetchOrcid 404 mock test
- Live dry-run confirmed: `tomas-ferreira-chase — InspireHEP: 4, arXiv: 3, ORCID: 5`

## Task Commits

1. **Task 1: Implement fetchOrcid + orcidGroupToPublication + response types** - `17fd27d` (feat)
2. **Task 2: Vitest coverage for orcidGroupToPublication + fetchOrcid 404** - `610534f` (test)

**Plan metadata:** (pending)

## Files Created/Modified
- `scripts/sync-publications.ts` - Added OrcidExternalId/OrcidLookupEntry exports + 4 internal ORCID interfaces; real fetchOrcid implementation (+133/-8 lines vs stub); orcidGroupToPublication extractor; extended MemberSyncResult; syncMember ORCID branch consumes { publications, lookup }. Total: 900 lines (was 767).
- `scripts/sync-publications.test.ts` - Added orcidGroupToPublication/fetchOrcid/OrcidExternalId to imports; fixture loader via readFileSync; three new describe blocks (+202 lines).

## Decisions Made
- `orcidGroupToPublication` declared without `export` keyword — trailing `export {}` list is the single export surface, consistent with Phase 16 `fetchInspireHEP`/`fetchArXiv` pattern
- Function returns `{ publication, putCode }` tuple so `fetchOrcid` can build `OrcidLookupEntry` without re-parsing the group
- 404 warning uses `process.stderr.write` (not `console.warn`) for consistency with all other warning paths in the file
- JSON fixture loaded via `JSON.parse(readFileSync(...))` instead of `import with { type: "json" }` — avoids TypeScript `isolatedModules` + Vitest transform edge cases
- `OrcidGroup` not exported from sync-publications.ts; test file uses `Parameters<typeof orcidGroupToPublication>[0]` as a `OrcidGroupShape` type alias to construct test literals without polluting the export surface

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `orcidLookup: OrcidLookupEntry[]` side-map is populated in MemberSyncResult and ready for 17-03's enrichment pass
- `fetchOrcid` 404 contract is locked in by unit test (SC4 gate for 17-03 is satisfied)
- Live dry-run shows tomas-ferreira-chase returns 5 ORCID works; pipeline accepts them through dedupByDoi unchanged
- 17-03 should implement `fetchOrcidWorkDetail` + `enrichOrcidAuthors` consuming the lookup map; `OrcidWorkDetail` + `OrcidContributor` interfaces are 17-03's territory
- No blockers

---
*Phase: 17-orcid-fetcher*
*Completed: 2026-04-20*
