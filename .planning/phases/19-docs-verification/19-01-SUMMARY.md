---
phase: 19-docs-verification
plan: 01
subsystem: docs
tags: [orcid, sync, documentation, dedup, publications]

# Dependency graph
requires:
  - phase: 17-orcid-sync
    provides: ORCID Works API integration (fetchOrcid, fetchOrcidWorkDetail, enrichOrcidAuthors)
  - phase: 18-display-layer
    provides: contact.orcid author-link pill (buildMemberOrcidMap, ORCID pill component)
provides:
  - Extended content/SYNC.md with five ORCID-specific sections closing DOC-01 (a)–(e)
affects:
  - Future maintainers adding ORCID to people.json
  - 19-02 (post-deploy verify — ORCID sync smoke test)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Docs-only plan: single atomic commit covers all five insertions; no code changes"

key-files:
  created: []
  modified:
    - content/SYNC.md

key-decisions:
  - "All five DOC-01 insertions committed atomically in a single task commit (Tasks 1 and 2 edited together in one pass); deviation documented below"
  - "DOI precedence table placed as ### subsection under ## Finding Your ORCID alongside the API section for proximity; slightly different from plan suggestion of Field Summary region but reads more naturally"
  - "_meta JSON block placed as ### subsection inside ## Field Summary for discoverability alongside the field table"

patterns-established:
  - "SYNC.md is the canonical maintainer reference for all sync mechanics; extend in-place rather than creating separate docs"

# Metrics
duration: 15min
completed: 2026-04-20
---

# Phase 19 Plan 01: Sync MD ORCID Extensions Summary

**content/SYNC.md extended with ORCID Works API endpoints, orcid_id vs contact.orcid dual-field guidance, DOI precedence rule (Manual > InspireHEP > ORCID > arXiv), three-source _meta JSON example, and five-row ORCID troubleshooting table — closing DOC-01 (a)–(e)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-20T22:10:00Z (estimated)
- **Completed:** 2026-04-20T22:26:04Z
- **Tasks:** 2 (all insertions in one editing pass)
- **Files modified:** 1 (content/SYNC.md only)

## Accomplishments

- Documented three ORCID-related API endpoints the sync script uses: works-list, per-work detail, and arXiv atom2 feed — including the Accept header pitfall (DOC-01 a)
- Clarified orcid_id (sync) vs contact.orcid (display pill) distinction with dual-field recommendation; updated diana-lopez-nacir example to show both fields set (DOC-01 b)
- Added DOI precedence rule Manual > InspireHEP > ORCID > arXiv with two-pass dedup explanation and rationale table (DOC-01 c)
- Added annotated three-source _meta JSON block using real 2026-04-20 sync data (DOC-01 d)
- Added five-row ORCID troubleshooting table covering all identified failure modes (DOC-01 e)

## Task Commits

1. **Tasks 1 + 2: All five DOC-01 insertions** - `c390d89` (docs)

**Plan metadata:** (to be committed after SUMMARY.md creation)

_Note: Plan tasks 1 and 2 were executed in the same editing pass and committed together in one atomic commit. See Deviations section._

## Sections Added/Modified in content/SYNC.md

| Section | Location | Line range (approx) | DOC-01 |
|---------|----------|---------------------|--------|
| Extended step 5 in `## Finding Your ORCID` + orcid_id vs contact.orcid note | lines 49–87 | ~49–88 | (b) |
| `### ORCID Works API: how the sync queries it` | Under `## Finding Your ORCID` | ~91–136 | (a) |
| `### DOI precedence and cross-source dedup` | Under `## Finding Your ORCID` | ~139–178 | (c) |
| `### _meta block: what the sync writes to publications.json` | Under `## Field Summary` | ~229–266 | (d) |
| `### ORCID-specific troubleshooting` | Under `## Operational Troubleshooting` | ~400–409 | (e) |
| Updated Field Summary table | `## Field Summary` table | ~216–221 | (b) support |
| Updated diana-lopez-nacir example | `### Example full entry` | line 288 | (b) support |

## Sample Grep Confirmations

DOC-01 (a) — API endpoints documented:
```
grep -n "pub.orcid.org/v3.0" content/SYNC.md  → 2 matches (works-list + work-detail)
grep -n "arxiv.org/a/" content/SYNC.md         → 1 match (atom2 feed)
grep -n "journal-article" content/SYNC.md      → 2 matches (API section + troubleshooting)
```

DOC-01 (b) — orcid_id vs contact.orcid:
```
grep -n "contact.orcid" content/SYNC.md        → 6 matches (note, table, example, prose)
```

DOC-01 (c) — DOI precedence:
```
grep -n "InspireHEP > ORCID > arXiv" content/SYNC.md  → 1 match
grep -n "deduped" content/SYNC.md                      → 4 matches
```

DOC-01 (d) — _meta JSON example:
```
grep -n '"counts"' content/SYNC.md             → 1 match (JSON block)
```

DOC-01 (e) — ORCID troubleshooting:
```
grep -nE 'ORCID profile not public' content/SYNC.md    → 1 match (troubleshooting row 1)
```

## Files Created/Modified

- `content/SYNC.md` — Extended with 179 net new lines; all five DOC-01 insertions; zero deletions to existing sections

## Decisions Made

- `_meta` JSON block placed inside `## Field Summary` (as `### _meta block` subsection) rather than adjacent to the DOI precedence section, for discoverability alongside the field reference table.
- DOI precedence `###` subsection placed under `## Finding Your ORCID` (co-located with the ORCID API section) rather than the plan's suggested "Field Summary region" — reads more naturally in proximity to the API discussion.
- Work-type filter documented in the ORCID API section (Insert A), not duplicated in troubleshooting — the troubleshooting table row 3 references the filter as root cause, avoiding redundancy.

## Deviations from Plan

### Minor Process Deviation

**1. Tasks 1 and 2 committed together in one atomic commit**

- **Why:** All five insertions (A through E) were made in a single contiguous editing pass. The plan split them into two tasks for logical separation, but the work naturally flowed together since all insertions are in the same file.
- **Impact:** Zero functional impact. All five DOC-01 sub-requirements are satisfied. The commit covers the complete intended scope of both tasks.
- **Committed in:** `c390d89`

---

**Total deviations:** 1 (minor process — single commit vs two)
**Impact on plan:** None — all plan requirements satisfied; single commit is more cohesive.

## Issues Encountered

None — file edits applied cleanly; validate-content passed on first run.

## User Setup Required

None — documentation-only plan; no external service configuration required.

## Next Phase Readiness

- DOC-01 is fully satisfied; REQUIREMENTS.md line 54 can be checked off
- Plan 19-02 (post-deploy verify, VERIFY-01) is the only remaining plan in Phase 19
- VERIFY-01 requires only a browser check of the live site + optional workflow_dispatch smoke test; no data changes needed (SiPM paper already in publications.json with source "orcid")
- 9-person people.json contact.orcid backfill still deferred from 18-01; not a Phase 19 blocker

---
*Phase: 19-docs-verification*
*Completed: 2026-04-20*
