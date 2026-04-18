---
phase: 04-core-pages
plan: 04
subsystem: ui
tags: [next-intl, lucide-react, react-server-components, tailwind, i18n, research-page]

# Dependency graph
requires:
  - phase: 04-01
    provides: lucide-react installed, research.* i18n namespace seeded, getLocalizedResearchAreas accessor
  - phase: 02-01
    provides: content/research.json with 4 areas (icon, title, short_description per locale)
  - phase: 03-05
    provides: layout owns <main>; pages return content only (section wrapper pattern)
provides:
  - Research page at /es/investigacion and /en/research — H1 + intro + 4-area icon grid
  - ResearchCard component (icon + title + short description, aria-labelledby)
  - ResearchGrid component (2-col sm+ layout)
affects: [04-05, 04-06, 04-07, 04-08, 05-seo, 06-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static ICON_MAP (Record<string, LucideIcon>) keyed by icon field from JSON — tree-shake safe, no dynamic require"
    - "HelpCircle as fallback for unknown icon names — loud failure on content drift"
    - "Server Component page + leaf components — no 'use client' needed for static icons"
    - "Section wrapper (no nested main) — layout owns the single main landmark (decision 03-05)"

key-files:
  created:
    - src/app/[locale]/research/page.tsx
    - src/components/research/ResearchCard.tsx
    - src/components/research/ResearchGrid.tsx
  modified: []

key-decisions:
  - "Static ICON_MAP rather than dynamic require() — preserves tree-shaking and matches plan guardrail"
  - "HelpCircle as unknown-icon fallback — loud visual signal of content drift, never crashes"
  - "2-up grid (sm:grid-cols-2) for 4 areas — avoids orphan card that 3-up would create"
  - "No full_description, no area image in Phase 4 — icons are primary visual per RESEARCH.md; detail surface deferred"

patterns-established:
  - "Icon map pattern: static Record<string, LucideIcon> in component, keyed by JSON field value"
  - "aria-labelledby={`research-${id}`} pattern for accessible article/card semantics"

# Metrics
duration: 8min
completed: 2026-04-18
---

# Phase 4 Plan 04: Research Page Summary

**Static SSR Research page with 4-area icon grid — atom/waves/sparkles/cpu all resolve from ICON_MAP, no HelpCircle fallback fires**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-18T~14:39Z
- **Completed:** 2026-04-18T~14:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Research page ships at /es/investigacion and /en/research with H1, intro paragraph, and 4 area cards
- All four icons (atom, waves, sparkles, cpu) resolve correctly via ICON_MAP — no HelpCircle fallback on real data
- Both locales render localized title + short_description from getLocalizedResearchAreas(locale)
- pnpm build generates static pages for /es/research and /en/research (next-intl middleware handles URL rewriting)

## Task Commits

1. **Task 1: Build ResearchCard and ResearchGrid components** - `bc8ed6a` (feat)
2. **Task 2: Build Research page with intro + 4-area grid** - `b1d333e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/research/ResearchCard.tsx` — article card with static ICON_MAP, aria-labelledby, HelpCircle fallback
- `src/components/research/ResearchGrid.tsx` — 1-col mobile / 2-col sm+ grid wrapper
- `src/app/[locale]/research/page.tsx` — RSC page: setRequestLocale, getTranslations('research'), getLocalizedResearchAreas, maps to ResearchGrid

## Icon Resolution Confirmation

All four content/research.json `icon` values confirmed resolved via ICON_MAP (no HelpCircle fallback fires):

| Area ID | JSON icon | ICON_MAP key | Resolved? |
|---|---|---|---|
| dark-matter | atom | atom | Atom ✓ |
| gravitational-waves | waves | waves | Waves ✓ |
| early-universe | sparkles | sparkles | Sparkles ✓ |
| artificial-intelligence | cpu | cpu | Cpu ✓ |

## Decisions Made

- **Static ICON_MAP over dynamic require():** Plan explicitly required this; tree-shaking preserved, TypeScript enforced.
- **HelpCircle fallback:** Never silently missing icons — visible fallback signals JSON drift immediately.
- **2-up grid:** 4 cards fits 2×2 cleanly on sm+; 3-up would orphan the 4th card on 3-col breakpoints.
- **No full_description / no image in Phase 4:** RESEARCH.md notes both are for a future detail surface; icons + title + short_description is the intended Phase 4 affordance.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. TypeScript passed cleanly on first attempt for both tasks. Build generated static pages for both locales on first run.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Research page complete with RSCH-01 and RSCH-02 satisfied, I18N-02 for research surface covered
- ResearchCard component is Phase 5-ready for wrapping in links to future detail pages
- Wave 2 continues: 04-05 through 04-08 (People, Publications, Journal Club, Outreach, Contact pages)

---
*Phase: 04-core-pages*
*Completed: 2026-04-18*
