---
phase: 04-core-pages
plan: 05
subsystem: ui
tags: [next.js, react, server-components, publications, bibliography, i18n, next-intl, tailwind]

# Dependency graph
requires:
  - phase: 04-01
    provides: messages/publications.* namespace (title, arxiv, doi, preprint keys)
  - phase: 02-01
    provides: content/publications.json + PublicationsSchema + Publication type
  - phase: 02-02
    provides: getAllYears() + getPublicationsByYear() accessor functions
  - phase: 03-05
    provides: layout owns <main>; pages return content only
provides:
  - Publications page RSC at /[locale]/publications (es/publicaciones + en/publications)
  - PublicationEntry server component (li with authors/title/journal/year + conditional arXiv/DOI links)
  - PublicationsYearGroup server component (H2 year heading + ol of entries)
  - Per-entry anchor scheme: id="pub-{id}" (shareable deep links)
  - PUBS-01 (year grouping, newest first) + PUBS-02 (per-entry fields) satisfied
  - I18N-02 satisfied for publications surface
affects:
  - 04-06 onwards (journal-club, outreach pages follow same pattern)
  - 05-* SEO phase (can reference #pub-{id} anchors in structured data)
  - Future PUBS-03 (filter controls) / PUBS-04 (URL-synced state) — both deferred

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Props-down server composition: page resolves translations once, passes labels object down to components
    - Year-grouped bibliography: getAllYears() drives outer map; getPublicationsByYear(year) drives inner component
    - Conditional link rendering: arxiv/doi optional fields hide cleanly when absent
    - Per-entry stable anchor: id="pub-{id}" for shareable URLs

key-files:
  created:
    - src/app/[locale]/publications/page.tsx
    - src/components/publications/PublicationEntry.tsx
    - src/components/publications/PublicationsYearGroup.tsx
  modified: []

key-decisions:
  - "No 'use client' on page or components — pure server rendering throughout"
  - "labels object built once in page.tsx (arxiv + doi strings), passed down to avoid per-entry t() calls"
  - "getAllYears() already returns descending order — no re-sort in page"
  - "max-w-4xl container (narrower than 6xl card grids) — one-column reading-flow for bibliography"
  - "PUBS-03 (filter controls) and PUBS-04 (URL-synced state) both explicitly deferred beyond Phase 4"
  - "Per-entry id=pub-{id} anchor gives Phase 5 SEO a stable fragment reference for structured data"

patterns-established:
  - "Bibliography server component: receive typed props, render typographic entry with optional links"
  - "Year-grouped RSC page: getAllYears() outer loop, getPublicationsByYear(year) per group"

# Metrics
duration: ~8min
completed: 2026-04-18
---

# Phase 4 Plan 05: Publications Page Summary

**Year-grouped bibliography RSC at /es/publicaciones + /en/publications — 3 years (2024/2025/2026), 13 entries, 10 arXiv links + 10 DOI links, both locales statically prerendered**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-18T~17:48Z
- **Completed:** 2026-04-18T~17:56Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- PublicationEntry server component renders authors / title / journal / year with conditional arXiv + DOI links; per-entry `id="pub-{id}"` anchor for shareable deep links
- PublicationsYearGroup server component wraps entries in an `<ol>` under an H2 year heading (accessible via `aria-labelledby`)
- Publications page aggregates both components; labels object built once from `getTranslations('publications')` and passed down — no per-entry translation calls
- Both locales statically prerendered at build time (41 total static pages, `/es/publications` + `/en/publications` confirmed)
- All 10 arXiv links built as `https://arxiv.org/abs/{id}`; all 10 DOI links as `https://doi.org/{doi}`; zero filter controls

## Task Commits

1. **Task 1: Build PublicationEntry and PublicationsYearGroup components** - `ddf62b0` (feat)
2. **Task 2: Build Publications page (/publications) with year-grouped list** - `b6569e6` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/publications/PublicationEntry.tsx` — `<li>` with typographic bibliography line + conditional arXiv/DOI anchor links; `id="pub-{id}"` for deep linking
- `src/components/publications/PublicationsYearGroup.tsx` — `<section aria-labelledby>` wrapping H2 year + `<ol list-none>` of entries
- `src/app/[locale]/publications/page.tsx` — Publications RSC; `getAllYears()` drives outer year map; labels resolved once; no `<main>`, no filter controls

## Decisions Made

- `labels` object built once in the page and passed as a prop — avoids calling `t()` inside every `PublicationEntry`, consistent with props-down server composition established in 04-02/04-03
- `max-w-4xl` container width (vs. `max-w-6xl` used for card grids) — matches a single-column reading-flow bibliography; narrower feels more like an academic CV/paper list
- Per-entry `id="pub-{id}"` anchor included as a free benefit — visitors can share links like `/publications#pub-2025-sigma8-...`; Phase 5 SEO can reference these in JSON-LD citation structured data
- PUBS-03 (filter controls by topic) and PUBS-04 (URL-synced filter state) are both explicitly deferred beyond Phase 4 — confirmed not present in shipped page

## Year Set Rendered

`getAllYears()` returned: **[2026, 2025, 2024]** (3 years, descending order)

- **2026:** 3 publications (2 with arXiv, 2 with DOI, 1 preprint-only)
- **2025:** 6 publications (6 with arXiv, 5 with DOI, 1 preprint-only arxiv-only)
- **2024:** 4 publications (2 with arXiv, 3 with DOI, 1 with neither — proceedings)

## Deferred Items (Explicitly Out of Scope)

- **PUBS-03:** Filter controls (topic / year dropdowns) — deferred beyond Phase 4 per REQUIREMENTS.md + ROADMAP.md scope adjustment 2026-04-18
- **PUBS-04:** URL-synced filter state (`?topic=&year=`) — deferred beyond Phase 4 alongside PUBS-03

No `<select>`, `<input>`, or `useSearchParams` exists in any file shipped in this plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript passed on first attempt. Build generated all 41 static pages cleanly. Both locale routes verified via curl (Publicaciones / Publications titles, arXiv/DOI link counts matching publications.json, zero filter elements).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Publications page is complete and statically prerendered — ready for 04-06 (Journal Club page)
- Per-entry anchor scheme `#pub-{id}` documented — Phase 5 SEO can add citation structured data pointing at these fragments
- PUBS-03/04 deferred cleanly — no stubs or disabled UI left behind; future phase starts from a clean slate
- `publications_selected` IDs in `content/people.json` still use stale `pub-YYYY-*` format (tracked in STATE.md pending todos); this affects PersonDetailPage selected-publications rendering, not the Publications page itself

---
*Phase: 04-core-pages*
*Completed: 2026-04-18*
