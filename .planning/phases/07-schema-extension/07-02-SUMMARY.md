---
phase: 07-schema-extension
plan: 02
subsystem: database
tags: [zod, json-schema, inspirehep, orcid, people-json, content-validation]

# Dependency graph
requires:
  - phase: 07-01
    provides: PersonSchema with inspirehep_id/arxiv_id/display_name_normalized fields; JSON Schema regen pipeline; SYNC.md maintainer guide
provides:
  - BAI regex widened to accept multi-segment InspireHEP names (S.J.Landau.1, Tomas.F.Chase.1)
  - arxiv_id field on PersonSchema replaced with orcid_id (orcidId shared helper reused)
  - content/SYNC.md updated with ORCID lookup instructions replacing arXiv author ID section
  - tomas-ferreira-chase populated with inspirehep_id + orcid_id (DATA-09 partial)
  - pnpm validate-content green on full people.json roster
affects: [09-sync-script]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "skip-with-reason policy for missing IDs: schema optionals + SUMMARY blockers list, not people.json annotations"
    - "ORCID as portable author identifier: supported by arXiv + InspireHEP as query key"
    - "BAI regex: /^[A-Z][A-Za-z-]*(\\.[A-Za-z-]+)+\\.\\d+$/ — handles both single and multi-segment surnames"

key-files:
  created:
    - .planning/phases/07-schema-extension/07-02-SUMMARY.md
  modified:
    - src/content/schemas/people.schema.ts
    - content/SYNC.md
    - content/people.schema.json
    - content/people.json

key-decisions:
  - "BAI regex widened from /^[A-Z]\\.[A-Za-z-]+\\.\\d+$/ to /^[A-Z][A-Za-z-]*(\\.[A-Za-z-]+)+\\.\\d+$/ — catches real data (Tomas.F.Chase.1, S.J.Landau.1 were rejected by old pattern)"
  - "arxiv_id replaced by orcid_id on PersonSchema: ORCID is portable across arXiv + InspireHEP; arXiv author-page slugs have no stable regex and most group members lack them. PublicationSchema.arxiv (paper IDs) unaffected."
  - "Google Scholar user IDs deferred to Phase 11 display layer or v1.2 milestone — Scholar has no public API, useful as profile link only"
  - "DATA-09/10 partial: only tomas-ferreira-chase populated this cycle; remaining 13 members are follow-up data commits before Phase 9 E2E test"

patterns-established:
  - "skip-with-reason policy: missing IDs are tracked in SUMMARY blockers_remaining, not in people.json"
  - "ORCID as portable author identifier for arXiv + InspireHEP author-keyed queries"
  - "BAI regex must accommodate multi-segment initials — test with real roster before locking regex"

# Metrics
duration: 15min
completed: 2026-04-19
---

# Phase 7 Plan 02: Schema Extension 02 Summary

**BAI regex widened for multi-segment names + arxiv_id swapped to orcid_id on PersonSchema; tomas-ferreira-chase IDs populated; validate-content green**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-19T00:00:00Z
- **Completed:** 2026-04-19
- **Tasks:** 3 (Task 1 pre-committed; schema deviations + data population this session)
- **Files modified:** 4

## Accomplishments

- Fixed latent BAI regex bug — old pattern rejected `S.J.Landau.1` (an example in our own SYNC.md) and `Tomas.F.Chase.1`; new pattern accepts all valid multi-segment BAIs
- Replaced `arxiv_id` field with `orcid_id` on PersonSchema — ORCID is the portable identifier the group actually has; both arXiv and InspireHEP support ORCID-keyed author queries
- Updated SYNC.md with accurate ORCID lookup instructions; updated Field Summary table
- Populated `inspirehep_id` + `orcid_id` for `tomas-ferreira-chase`; all other members left unchanged (schema tolerates absent optionals)
- SC2 spot-check verified: `E.Calzetta.1` on any entry passes strictObject validation

## Task Commits

1. **Task 1: populate display_name_normalized** - `9b3c38e` (data) — pre-committed before this session
2. **Schema deviations: BAI regex + arxiv_id→orcid_id** - `97612b6` (fix)
3. **Task 3: tomas-ferreira-chase IDs** - `e2a6b80` (data)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/content/schemas/people.schema.ts` — BAI regex widened; `arxiv_id` field replaced with `orcid_id`; `arxivId` import removed
- `content/SYNC.md` — "Finding Your arXiv Author ID" section replaced with "Finding Your ORCID"; Field Summary table updated; opening paragraph updated; BAI regex example updated
- `content/people.schema.json` — regenerated via `pnpm generate-schemas` to reflect new PersonSchema shape
- `content/people.json` — `inspirehep_id` + `orcid_id` inserted on `tomas-ferreira-chase` entry only

## Decisions Made

1. **BAI regex widened** — Old regex `/^[A-Z]\.[A-Za-z-]+\.\d+$/` was a latent bug from 07-01. Real data revealed `Tomas.F.Chase.1` and `S.J.Landau.1` (the SYNC.md example) both fail it. New regex `/^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/` accepts multi-segment names while still rejecting lowercase first character, double-dots, missing digit suffix, and alphanumeric digit suffix.

2. **arxiv_id → orcid_id** — Most group members have no claimed arXiv author-page slug (the old `arxiv_id` format); the original regex (`arxivId` paper-ID helper) would have rejected valid author IDs anyway. ORCID is stable, universally supported, and both arXiv and InspireHEP accept ORCID as an author-query parameter. Field repurposed rather than adding a second field. `PublicationSchema.arxiv` (paper IDs) is a separate concern and unaffected.

3. **DATA-09/10 partial** — Maintainer provided IDs only for `tomas-ferreira-chase` this cycle. Remaining 13 members are a follow-up data commit; schema tolerates absent optionals so Phase 7 is complete.

4. **Google Scholar deferred** — Maintainer provided `goZIS6UAAAAJ` for tomas-ferreira-chase. Scholar has no public API → useful as a profile link only, not a sync source. `scholar_id?` field addition deferred to Phase 11 display layer or v1.2 milestone.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] BAI regex widened to accept multi-segment InspireHEP names**

- **Found during:** Task 3 (apply IDs to people.json) — maintainer-provided BAI `Tomas.F.Chase.1` fails old regex; SYNC.md example `S.J.Landau.1` also fails
- **Issue:** Old regex `/^[A-Z]\.[A-Za-z-]+\.\d+$/` requires exactly one dot between initial and surname — multi-initial or multi-part names (e.g. `S.J.Landau.1`) were rejected
- **Fix:** Regex replaced with `/^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/`; error message updated with multi-part examples
- **Files modified:** `src/content/schemas/people.schema.ts`, `content/people.schema.json`
- **Verification:** Node regex test confirms all 4 accept cases pass and all 4 reject cases still fail
- **Committed in:** `97612b6`

**2. [Rule 1 - Bug] arxiv_id field replaced with orcid_id on PersonSchema**

- **Found during:** Task 3 (apply IDs to people.json) — maintainer checkpoint revealed group members have ORCID but not arXiv author-page slugs; existing `arxivId` helper validates paper IDs, not author slugs
- **Issue:** `arxiv_id` field reused paper-ID regex that would have rejected every valid arXiv author ID; most group members have no such slug anyway
- **Fix:** Field replaced with `orcid_id` using the existing `orcidId` shared helper; `arxivId` import removed; SYNC.md updated
- **Files modified:** `src/content/schemas/people.schema.ts`, `content/SYNC.md`, `content/people.schema.json`
- **Verification:** `pnpm validate-content` passes; `pnpm typecheck` passes; `orcid_id` present in generated schema; `arxiv_id` absent
- **Committed in:** `97612b6`

---

**Total deviations:** 2 auto-fixed (both Rule 1 — latent bugs from 07-01 surfaced by real data)
**Impact on plan:** Both fixes required for correctness. No scope creep; SC2 still verified as planned.

## Issues Encountered

None beyond the two schema deviations above, which were handled automatically.

## Blockers Resolved

- **DATA-09 (partial):** `inspirehep_id` populated for `tomas-ferreira-chase` (`Tomas.F.Chase.1`)
- **DATA-10 reconceived as orcid_id coverage:** `orcid_id` populated for `tomas-ferreira-chase` (`0009-0001-0286-2136`) — 1 entry populated so far

## Blockers Remaining (hand-off checklist for Phase 9 prep)

The following members still need IDs before Phase 9 end-to-end sync testing. These can be filled in a follow-up data-only commit (no schema changes needed).

**PIs (5 remaining):**
- `esteban-calzetta` — needs `inspirehep_id`, `orcid_id`
- `diana-lopez-nacir` — needs `inspirehep_id`, `orcid_id`
- `susana-landau` — needs `inspirehep_id`, `orcid_id`
- `cecilia-scannapieco` — needs `inspirehep_id`, `orcid_id`
- `nahuel-miron-granese` — needs `inspirehep_id`, `orcid_id`

**Postdocs (2 remaining):**
- `juan-manuel-armaleo` — needs `inspirehep_id`, `orcid_id`
- `javier-badia` — needs `inspirehep_id`, `orcid_id`

**PhDs (5 remaining):**
- `matias-leizerovitch` — needs `inspirehep_id`, `orcid_id`
- `gonzalo-santa-cruz` — needs `inspirehep_id`, `orcid_id`
- `augusto-chantada` — needs `inspirehep_id`, `orcid_id`
- `guadalupe-ahumada-acuna` — needs `inspirehep_id`, `orcid_id`
- `juan-pablo-elia` — needs `inspirehep_id`, `orcid_id`

**Undergrads:** `inspirehep_id` / `orcid_id` optional — can populate when they publish.

Phase 9 sync script will log `INFO: skipping inspirehep for <name> (no inspirehep_id)` for each skipped member. Functional for the members who do have IDs; no crash.

## Deferred Additions (noted, not in this plan)

- **Google Scholar user ID (`scholar_id?`)** — maintainer provided `goZIS6UAAAAJ` for `tomas-ferreira-chase`. Scholar has no public API → useful as a profile link only, not as a sync source. Schema addition belongs in Phase 11 display layer or v1.2 milestone, not v1.1 sync.

## Next Phase Readiness

- Phase 7 (Schema Extension) is complete: PersonSchema is stable, `pnpm validate-content` passes, JSON Schemas regenerated
- Phase 8 (Accessor layer) can proceed immediately — PersonSchema shape is locked
- Phase 9 (Sync Script) can be built now; E2E test requires remaining 13 members to be populated (follow-up data commit, not a code blocker)
- The `CI-08` concern (branch protection bypass for github-actions[bot]) remains open for Phase 10

---
*Phase: 07-schema-extension*
*Completed: 2026-04-19*
