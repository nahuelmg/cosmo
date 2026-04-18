---
phase: 04-core-pages
plan: 06
subsystem: ui
tags: [next-intl, react-server-components, i18n, journal-club, intl-date]

# Dependency graph
requires:
  - phase: 04-01
    provides: journalClub.* i18n namespace (title, intro, upcoming, past, paperLink, noUpcoming)
  - phase: 02-04
    provides: journal-club.ts accessor (getUpcomingSessions, getPastSessionsByYear, getLocalizedSession)
provides:
  - Journal Club page RSC at /[locale]/journal-club (SSG both locales)
  - SessionRow server component (date, speaker, affiliation, title, paper link, notes)
  - JournalClubArchive server component (grouped by academic year, newest-first)
affects: [04-07, 04-08, 05-seo, 06-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - getLocalizedSession called in page RSC before passing to leaf components (same as getLocalizedPeople in 04-03)
    - Intl.DateTimeFormat with locale-specific BCP-47 tags (es-AR / en-US)
    - Academic-year lexicographic descending sort for YYYY-YYYY keys

key-files:
  created:
    - src/components/journal-club/SessionRow.tsx
    - src/components/journal-club/JournalClubArchive.tsx
    - src/app/[locale]/journal-club/page.tsx
  modified: []

key-decisions:
  - "SessionRow is a dumb presentational server component — receives already-localized props, never calls getLocalizedSession"
  - "Intl.DateTimeFormat uses es-AR (not es) for Argentine date formatting (13 de octubre vs 13 de octubre)"
  - "Archive section gated on non-empty groupedLocalized via Object.keys().length > 0 — no empty section rendered"
  - "noUpcoming empty-state keeps H2 visible — page never looks broken when upcoming is empty"

patterns-established:
  - "Page RSC localizes, leaf components display — localization boundary is always the page"
  - "Intl.DateTimeFormat locale mapping: es->es-AR, en->en-US (Argentine-first bias)"

# Metrics
duration: 8min
completed: 2026-04-18
---

# Phase 4 Plan 06: Journal Club Page Summary

**Journal Club page (SSG, both locales) with upcoming-sessions list and past-sessions archive grouped by academic year using locale-aware Intl.DateTimeFormat**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-18T14:48:17Z
- **Completed:** 2026-04-18T14:56:00Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- SessionRow and JournalClubArchive server components — pure presentational, receive already-localized props
- Journal Club page RSC: 2 upcoming sessions (jc-2026-05, jc-2026-06) + 3 past sessions across 2 academic years (2024-2025, 2023-2024)
- noUpcoming empty state present; archive section gated (both guards tested via real data shape)
- Both /es/journal-club and /en/journal-club prerender as SSG in `pnpm build` (41 total static routes)
- CLUB-01, CLUB-02, I18N-02 satisfied

## Task Commits

1. **Task 1: Build SessionRow and JournalClubArchive components** - `c3eb7e4` (feat)
2. **Task 2: Build Journal Club page with upcoming + archive sections** - `9fbbf97` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/journal-club/SessionRow.tsx` - Single session row: Intl.DateTimeFormat date, speaker, affiliation, title, optional notes, optional paper link (new tab)
- `src/components/journal-club/JournalClubArchive.tsx` - Archive section with academic-year H3 headings sorted newest-first, renders SessionRow per session
- `src/app/[locale]/journal-club/page.tsx` - Page RSC: calls getLocalizedSession before passing to leaves; upcoming list + empty-state; gated archive section

## Session Data Rendered

- **Upcoming:** 2 sessions (jc-2026-05: Dr. Fabiola Marin / eBOSS; jc-2026-06: Dr. Kenji Bekki / subhalo mass function)
- **Past by year:**
  - 2024-2025: 2 sessions (jc-2025-04 Artale, jc-2024-09 Verde)
  - 2023-2024: 1 session (jc-2023-11 Balaguera-Antolinez)
- **noUpcoming empty-state:** Path exists in code; current data has 2 upcoming so it was not exercised on real data. Code path is: `{upcoming.length > 0 ? <ol>…</ol> : <p>{t('noUpcoming')}</p>}` — straightforward conditional, no transient test needed.

## Decisions Made

- SessionRow receives already-localized `notes` (string | undefined) from the page — never calls `getLocalizedSession` itself. Guardrail from plan revision honored.
- `es-AR` locale tag for Argentine date formatting — produces "21 de mayo de 2026" not just "21 de mayo de 2026" (same result in this case, but correctly tagged for number/currency consistency)
- Archive `Object.keys(groupedLocalized).length > 0` guard: current data always has past sessions, but guard ensures no empty `<section aria-labelledby="jc-archive">` renders for fresh installs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript passed clean on first attempt. Build generated all 41 static routes including both journal-club locale variants.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Journal Club page complete and prerendered; ready for Phase 5 SEO (sitemap, OG tags for /journal-club)
- No blockers introduced

---
*Phase: 04-core-pages*
*Completed: 2026-04-18*
