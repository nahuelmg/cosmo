---
phase: 07-schema-extension
plan: 01
subsystem: schema
tags: [zod, json-schema, arxiv, inspirehep, typescript]

# Dependency graph
requires:
  - phase: 06-polish-a11y-performance
    provides: stable v1.0 codebase with working validate-content pipeline
provides:
  - Updated arxivId regex accepting pre-2007 format (category/NNNNNNN)
  - normalizeName helper for ASCII-fold author matching
  - PublicationSchema with source enum field (manual/inspirehep/arxiv) defaulting to manual
  - PersonSchema with optional inspirehep_id, optional arxiv_id, required display_name_normalized
  - publications_selected marked @deprecated v1.1
  - Regenerated JSON Schemas exposing new fields to VS Code IntelliSense
  - content/SYNC.md maintainer lookup guide for BAI, arXiv author ID, display_name_normalized
affects: [08-accessor, 09-sync-script, 11-display-layer]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "optional external-ID fields on PersonSchema (inspirehep_id, arxiv_id)"
    - "source-tagged publications via z.enum with .default('manual')"
    - "normalizeName helper for author-string matching exported from shared.ts"
    - "@see content/SYNC.md JSDoc cross-reference pattern for maintainer guidance"

key-files:
  created:
    - content/SYNC.md
  modified:
    - src/content/schemas/shared.ts
    - src/content/schemas/publications.schema.ts
    - src/content/schemas/people.schema.ts
    - content/publications.schema.json
    - content/people.schema.json

key-decisions:
  - "JSON Schemas regenerated in same phase commit sequence as Zod changes (Pitfall 1 honored)"
  - "display_name_normalized is REQUIRED (not optional) — Plan 07-02 owns populating it in people.json"
  - "publications_selected marked @deprecated v1.1 via JSDoc only — Zod shape unchanged; v1.2 removes it"
  - "arxiv_id on PersonSchema reuses shared arxivId validator (benefits automatically from pre-2007 regex)"

patterns-established:
  - "Shared arxivId validator covers both modern (YYMM.NNNNN) and pre-2007 (category/NNNNNNN) formats"
  - "Source provenance field on publications with .default('manual') preserves v1.0 backward compat"
  - "Maintainer guide (SYNC.md) lives in content/ alongside the data it documents"

# Metrics
duration: 2min
completed: 2026-04-19
---

# Phase 7 Plan 1: Schema Extension Summary

**Zod + JSON Schema atomic extension shipping pre-2007 arXiv regex, source-tagged publications, and optional inspirehep_id/arxiv_id/display_name_normalized person fields — backward-compatible with all v1.0 content**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-19T00:52:11Z
- **Completed:** 2026-04-19T00:54:49Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Extended `shared.ts`: `arxivId` regex now accepts pre-2007 format `[a-z-]+\/\d{7}` (e.g. `gr-qc/9209007`); `normalizeName` helper exported for Phase 11 author-string matching
- Extended `publications.schema.ts`: `source` enum (`manual|inspirehep|arxiv`) with `.default("manual")` — all 13 existing v1.0 entries parse without modification
- Extended `people.schema.ts`: optional `inspirehep_id` (BAI regex), optional `arxiv_id` (shared validator), required `display_name_normalized`; `publications_selected` marked `@deprecated v1.1`
- Regenerated `content/publications.schema.json` and `content/people.schema.json` — VS Code IntelliSense now shows all new fields
- Created `content/SYNC.md` (101 lines, 4 sections) — maintainer lookup guide for BAI, arXiv author ID, and `display_name_normalized` format

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Zod schemas** - `9c30f4b` (feat)
2. **Task 2: Regenerate JSON Schemas** - `e6b3324` (chore)
3. **Task 3: Create content/SYNC.md** - `6a851f8` (docs)

**Plan metadata:** (docs: complete plan — added after this summary)

## Files Created/Modified

- `src/content/schemas/shared.ts` — updated `arxivId` regex (pre-2007 aware); added `normalizeName` helper
- `src/content/schemas/publications.schema.ts` — added `source` enum field with `.default("manual")`
- `src/content/schemas/people.schema.ts` — added `arxivId` import; new `inspirehep_id`, `arxiv_id`, `display_name_normalized` fields; deprecated `publications_selected`
- `content/publications.schema.json` — regenerated: exposes `source` enum
- `content/people.schema.json` — regenerated: exposes `inspirehep_id`, `arxiv_id`, `display_name_normalized`
- `content/SYNC.md` — new maintainer lookup guide (BAI + arXiv author ID + display_name_normalized spec)

## Decisions Made

1. **JSON Schemas regenerated atomically with Zod changes** — Task 1 (feat) and Task 2 (chore) ship in the same phase, satisfying Pitfall 1. Running `pnpm generate-schemas` on a clean tree produces no diff.

2. **`display_name_normalized` is REQUIRED** — deliberately not optional. Every person in `people.json` must have it for Phase 11 matching to work correctly. Plan 07-02 owns populating it on all 15 existing entries. Until then, `pnpm validate-content` fails on `people.json` — this is the expected handoff state.

3. **`publications_selected` deprecation is JSDoc-only** — the Zod shape is unchanged so existing `people.json` entries with the field continue to parse. v1.2 will remove it. No migration needed now.

4. **`arxiv_id` on `PersonSchema` reuses shared `arxivId` validator** — same regex as publication-level `arxiv` field, so any fix to one automatically applies to the other.

## Deviations from Plan

None — plan executed exactly as written. The only "unexpected" outcome (only 2 of 5 JSON Schema files having a real diff) is correct behavior: `research`, `journal-club`, and `outreach` schemas have no Zod changes, so `generate-schemas` rewrites them identically.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. DATA-09/10 (populating real BAI + arXiv IDs in `people.json`) are owned by Plan 07-02.

## Next Phase Readiness

- **Plan 07-02 (ready to start):** Must populate `display_name_normalized` (required), and optionally `inspirehep_id` + `arxiv_id`, on all 15 entries in `content/people.json`. `pnpm validate-content` currently fails only on `display_name_normalized` — confirmed.
- **Phase 8 (accessor) / Phase 9 (sync script):** Schema is the prerequisite; both phases can begin once 07-02 restores `pnpm validate-content` to green.
- **Blockers remaining:** DATA-09/10 (human action — maintainer must look up and populate real BAI identifiers in 07-02).

---
*Phase: 07-schema-extension*
*Completed: 2026-04-19*
