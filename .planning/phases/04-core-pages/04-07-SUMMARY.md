---
phase: 04-core-pages
plan: 07
subsystem: ui
tags: [next-intl, server-components, next-image, intl-datetimeformat, outreach, i18n, conditional-rendering]

# Dependency graph
requires:
  - phase: 04-01
    provides: outreach.* message namespace (title, intro, learnMore keys) seeded in Wave 1
  - phase: 02-01
    provides: outreach.schema.ts + getLocalizedOutreach accessor via content barrel
  - phase: 03-05
    provides: layout constraint — <main> owned by layout; pages return content only

provides:
  - OutreachCard server component (image/type/title/date/description/optional link)
  - OutreachGrid server component (3-up desktop / 2-up tablet / 1-up mobile responsive)
  - Outreach page RSC at /[locale]/outreach → /es/divulgacion and /en/outreach
  - OTRCH-01 (intro), OTRCH-02 (activity grid), OTRCH-03 (optional links hide cleanly)
  - I18N-02 for outreach surface

affects:
  - 04-08 (Contact page — last remaining Wave 2 plan)
  - 05-SEO (outreach page included in sitemap/meta)
  - 06-Polish (outreach card layout participates in accessibility audit)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conditional rendering via short-circuit evaluation (activity.link && <a>) — no disabled states, no dead placeholders
    - Intl.DateTimeFormat with locale-keyed locale string (es-AR / en-US) for localized date display
    - Server component activity cards with props-down localized data from page RSC

key-files:
  created:
    - src/components/outreach/OutreachCard.tsx
    - src/components/outreach/OutreachGrid.tsx
    - src/app/[locale]/outreach/page.tsx
  modified: []

key-decisions:
  - "activity.link && <a>: no disabled state, no 'Coming soon', no dead affordance — card reads cleanly as information card when link absent (OTRCH-03)"
  - "activity.image && <div>: no placeholder box when image absent — card height adapts to content"
  - "activity.type rendered as raw enum value (talk/workshop/school-visit/etc.) as uppercase text tag — no translation in Phase 4; polish deferred"
  - "max-w-6xl container matches people-card grid width for 3-up layout visual consistency"

patterns-established:
  - "Conditional-render guard: activity.link ? <a>...</a> : null — exact same pattern reusable for any optional URL field"

# Metrics
duration: 7min
completed: 2026-04-18
---

# Phase 4 Plan 07: Outreach Page Summary

**Outreach page with 4-activity grid, locale-aware dates (Intl.DateTimeFormat), and clean conditional link/image rendering via short-circuit evaluation**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-18T14:43:24Z
- **Completed:** 2026-04-18T14:50:35Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- OutreachCard server component with optional image block, type tag, localized date via `Intl.DateTimeFormat`, title, description, and conditional link — OTRCH-02 + OTRCH-03
- OutreachGrid responsive 3-up/2-up/1-up grid wrapper passing learnMoreLabel down
- Outreach page RSC at `/[locale]/outreach` prerendered statically to `/es/divulgacion` and `/en/outreach` — OTRCH-01 (H1 + intro) complete
- Build succeeded: both locales statically prerendered (SSG)

## Task Commits

1. **Task 1: Build OutreachCard and OutreachGrid components** - `9fbbf97` (feat)
2. **Task 2: Build Outreach page with intro and activity grid** - `4d7cc13` (feat)

**Plan metadata:** (docs commit follows)

## Activity Counts (for verification record)

- **Total activities rendered:** 4 (all entries from content/outreach.json)
- **Activities with images:** 0 of 4 (no image field present in current content — image conditional path exists, not yet exercised by data)
- **Activities with links:** 3 of 4 (otrch-planetario-2025, otrch-articulo-2024, otrch-podcast-2024 have link; otrch-escuela-2025 has no link → renders without link element, OTRCH-03 exercised)
- **Verified:** `curl -s http://localhost:3000/en/outreach | python3 -c "import sys; html=sys.stdin.read(); print(html.count('href=\"https://'))"` → 3

## Files Created/Modified

- `src/components/outreach/OutreachCard.tsx` — Server component: image (conditional), type tag, localized date, title, description, optional link (conditional)
- `src/components/outreach/OutreachGrid.tsx` — Server component: responsive 3-up/2-up/1-up grid wrapper
- `src/app/[locale]/outreach/page.tsx` — RSC page: setRequestLocale, getTranslations('outreach'), getLocalizedOutreach(locale), section (not main)

## Decisions Made

- `activity.link && <a>`: no disabled state, no placeholder — card reads cleanly without a link affordance (OTRCH-03 requirement honored exactly)
- `activity.image && <div>`: no placeholder box — card adapts height without the image slot
- `activity.type` rendered as raw enum uppercase text tag without translation — Phase 4 scope; localization deferred to polish
- `max-w-6xl` container matches people-card grid for visual consistency with 3-up layout

## Deviations from Plan

None — plan executed exactly as written. Both components matched the plan DOM specification verbatim; TypeScript passed clean on first attempt; build prerendered both locales without errors.

## Issues Encountered

- `.next/dev/types/validator.ts` reported a pre-existing journal-club type error (stale dev cache); `pnpm tsc --noEmit` with `grep "src/"` confirmed zero errors in src/ — not caused by this plan.
- Plan verify step `grep -c '<article '` (with trailing space) returned 1 due to Next.js SSR omitting space before class attribute; actual `<article` count is 4 (correct). The underlying behaviour is correct; the grep pattern in the plan is sensitive to HTML serialization format.

## Next Phase Readiness

- Outreach surface (OTRCH-01..03, I18N-02) fully satisfied in both locales
- 04-08 (Contact page) is the last remaining Wave 2 plan before Phase 4 is complete
- No blockers introduced; no new todos

---
*Phase: 04-core-pages*
*Completed: 2026-04-18*
