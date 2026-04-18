---
phase: 02-content-layer
plan: "04"
subsystem: content
tags: [zod, typescript, json, bilingual, content-layer, research, journal-club, outreach]

# Dependency graph
requires:
  - phase: 02-content-layer/02-01
    provides: shared.ts with bilingualString, canonicalString, optionalPhoto, localize, Locale — all imported by the three schemas

provides:
  - src/content/schemas/research.schema.ts — ResearchAreaSchema, ResearchSchema, ResearchArea, Research types
  - src/content/schemas/journal-club.schema.ts — JournalClubSessionSchema, JournalClubSchema, session types
  - src/content/schemas/outreach.schema.ts — OutreachActivitySchema, OutreachSchema, activity types
  - content/research.json — 4 validated research areas (dark-matter, gravitational-waves, early-universe, artificial-intelligence)
  - content/journal-club.json — 5 sessions (2 upcoming, 3 past across 2 academic years)
  - content/outreach.json — 4 activities (talk, school-visit, article, interview; 3 with link, 1 without)
  - src/content/accessors/research.ts — getResearchAreas, getResearchAreaById, getLocalizedResearchAreas
  - src/content/accessors/journal-club.ts — getJournalClub, getUpcomingSessions, getPastSessionsByYear, getLocalizedSession
  - src/content/accessors/outreach.ts — getOutreach, getOutreachByType, getLocalizedOutreach

affects:
  - 02-05-schema-gen (will generate .schema.json from all three schema files)
  - 03-layout-shell (may import accessor types for component prop types)
  - 04-core-pages (imports all 9 accessor exports for research, journal-club, outreach pages)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "z.strictObject() + superRefine for compound validation (id uniqueness, status-date consistency, past-requires-academic_year)"
    - "Parse-at-module-load pattern: const data = Schema.parse(rawJson) at top of accessor — throws on malformed JSON"
    - "Accessor returns sorted copies (never mutates) — sort done at call site, not data layer"
    - "getLocalizedX() functions collapse bilingual fields to strings — components never access .es/.en directly"

key-files:
  created:
    - src/content/schemas/research.schema.ts
    - src/content/schemas/journal-club.schema.ts
    - src/content/schemas/outreach.schema.ts
    - content/research.json
    - content/journal-club.json
    - content/outreach.json
    - src/content/accessors/research.ts
    - src/content/accessors/journal-club.ts
    - src/content/accessors/outreach.ts
  modified: []

key-decisions:
  - "journal-club.json has 5 sessions (2 upcoming, 3 past) — exceeds plan minimum of 3-4 to cover 2 academic years cleanly"
  - "outreach.json omits image on all 4 entries — no outreach images in public/ yet; Phase 4 will decide"
  - "JournalClubSessionSchema: export { JournalClubSessionSchema } form used (not export const) to match sibling plan 02-03 which already committed the schema"
  - "OutreachActivitySchema: inner const + export {} form used after duplicate-export error with export const + export {}"

patterns-established:
  - "superRefine for multi-field business rules: id uniqueness, conditional required fields (academic_year on past sessions), status-date consistency"
  - "Optional bilingual field pattern: bilingualString('label').optional() — getLocalizedSession handles undefined with ternary"

# Metrics
duration: 4min
completed: 2026-04-18
---

# Phase 2 Plan 04: Research, Journal Club, and Outreach Content Summary

**Three content types (research areas, journal club sessions, outreach activities) shipped end-to-end with Zod v4 schemas, bilingual JSON data, and typed accessors — 9 exports total, all parse-at-load with localize() integration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-18T00:19:36Z
- **Completed:** 2026-04-18T00:24:31Z
- **Tasks:** 3
- **Files modified:** 9 (all created)

## Accomplishments

- Research: 4 canonical areas (dark-matter, gravitational-waves, early-universe, artificial-intelligence) with full bilingual prose in ES/EN; sorted by `order` field via accessor
- Journal Club: 5 sessions (2 upcoming in 2026-05/06, 3 past across 2024-2025 and 2023-2024 academic years); superRefine enforces status-date consistency and academic_year presence on past sessions; 2 sessions include optional bilingual `notes` field
- Outreach: 4 activities across 4 distinct types (talk, school-visit, article, interview); 3 with `link` field, 1 without — proving OTRCH-03 link-absent rendering path; no images on any entry
- All 9 accessor exports parse at module load and expose list/filter/localize functions; `pnpm typecheck` and `pnpm lint` exit 0

## Research Area Titles

| ID | ES | EN |
|----|----|----|
| dark-matter | Materia Oscura | Dark Matter |
| gravitational-waves | Ondas Gravitacionales | Gravitational Waves |
| early-universe | Universo Temprano | Early Universe |
| artificial-intelligence | Inteligencia Artificial | Artificial Intelligence |

## Journal Club Summary

- **Total sessions:** 5
- **Upcoming:** 2 (2026-05-22, 2026-06-12)
- **Past by academic year:**
  - 2024-2025: 2 sessions (2025-04-10, 2024-09-19)
  - 2023-2024: 1 session (2023-11-23)
- **Sessions with notes:** 2 (jc-2026-05, jc-2025-04)

## Outreach Summary

- **Total activities:** 4
- **Type distribution:** talk (1), school-visit (1), article (1), interview (1)
- **With link:** 3 (otrch-planetario-2025, otrch-articulo-2024, otrch-podcast-2024)
- **Without link:** 1 (otrch-escuela-2025 — proves OTRCH-03 link-absent card path)

## Task Commits

Each task was committed atomically:

1. **Task 1: Research schema, JSON, and accessor** — `bb187be` (feat)
2. **Task 2: Journal club schema, JSON, and accessor** — `61988ae` (feat)
3. **Task 3: Outreach schema, JSON, and accessor** — `1e43bff` (feat)

**Plan metadata:** (docs commit — see below)

## All 9 Accessor Exports

| File | Export | Description |
|------|--------|-------------|
| research.ts | `getResearchAreas()` | All areas sorted by `order` ascending |
| research.ts | `getResearchAreaById(id)` | Single area lookup by canonical id |
| research.ts | `getLocalizedResearchAreas(locale)` | Areas with title/short_description/full_description resolved |
| journal-club.ts | `getJournalClub()` | All sessions unfiltered |
| journal-club.ts | `getUpcomingSessions()` | Upcoming sessions sorted by date ascending |
| journal-club.ts | `getPastSessionsByYear()` | Past sessions grouped by academic_year, each group sorted descending |
| journal-club.ts | `getLocalizedSession(session, locale)` | Single session with `notes` resolved (or undefined) |
| outreach.ts | `getOutreach()` | All activities sorted by date descending (newest first) |
| outreach.ts | `getOutreachByType(type)` | Activities filtered by type enum, newest first |
| outreach.ts | `getLocalizedOutreach(locale)` | Activities with title/description resolved |

## Files Created/Modified

- `src/content/schemas/research.schema.ts` — ResearchAreaSchema (strictObject), ResearchSchema (array + superRefine id uniqueness)
- `src/content/schemas/journal-club.schema.ts` — JournalClubSessionSchema, JournalClubSchema (id uniqueness + past-academic_year + status-date superRefine)
- `src/content/schemas/outreach.schema.ts` — OutreachActivitySchema, OutreachSchema (id uniqueness superRefine)
- `content/research.json` — 4 research areas with bilingual title/short_description/full_description and icon names
- `content/journal-club.json` — 5 sessions (2 upcoming, 3 past) with realistic cosmology papers and speakers
- `content/outreach.json` — 4 outreach activities with bilingual prose, Argentine science-outreach context
- `src/content/accessors/research.ts` — 3 exports, parses at load
- `src/content/accessors/journal-club.ts` — 4 exports, parses at load
- `src/content/accessors/outreach.ts` — 3 exports, parses at load

## Decisions Made

1. **5 journal-club sessions instead of plan's 3-4 minimum** — Added a third past session to cover a second academic year (2023-2024) cleanly. The getPastSessionsByYear() return now has 2 year keys which better exercises the grouping logic Phase 4 will use.

2. **No images on any outreach entry** — Plan explicitly says "Safer: omit image for all entries" since no outreach images exist in public/ yet. Consistent with research entries (no image field).

3. **Outreach types chosen: talk, school-visit, article, interview** — These 4 match the Argentine science-outreach context described in CONTEXT.md. The `workshop` and `video` enum values remain available for Phase 4 to populate.

4. **OutreachActivitySchema: inner const + export {} pattern** — TypeScript TS2323 error (cannot redeclare exported variable) appeared when using `export const X = z.strictObject(...)` followed by `export { X }`. Fixed by removing the `export` keyword from the const declaration and keeping only the explicit re-export.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate export error in outreach.schema.ts**

- **Found during:** Task 3 verification (pnpm typecheck)
- **Issue:** Plan template shows both `const OutreachActivitySchema = z.strictObject(...)` and `export { OutreachActivitySchema }`. Using `export const` on the declaration plus `export {}` re-export caused TS2323 "cannot redeclare exported variable".
- **Fix:** Changed `export const OutreachActivitySchema` to `const OutreachActivitySchema` (removed `export` keyword from declaration; kept `export { OutreachActivitySchema }` re-export).
- **Files modified:** `src/content/schemas/outreach.schema.ts`
- **Verification:** `pnpm typecheck` exits 0 after fix.
- **Committed in:** `1e43bff` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required fix for TypeScript compilation. No scope creep.

## Issues Encountered

None beyond the auto-fixed duplicate export. All three schema validations, accessor parse-at-load probes, and end-to-end verification passed cleanly on first attempt.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Plan 02-05 (schema-gen prebuild script) can now generate JSON schemas for all five content/*.json files — all three schemas from this plan plus people.schema.ts and publications.schema.ts from sibling plans 02-02 and 02-03.

Plans 02-02 and 02-03 (sibling Wave 2 plans) have zero file overlap with this plan — no merge conflicts expected.

Phase 3 (layout shell) and Phase 4 (core pages) can import any of the 9 accessor exports directly.

---
*Phase: 02-content-layer*
*Completed: 2026-04-18*
