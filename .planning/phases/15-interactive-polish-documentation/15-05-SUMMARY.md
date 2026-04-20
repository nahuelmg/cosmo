---
phase: 15-interactive-polish-documentation
plan: 05
subsystem: ui
tags: [tailwind, accessibility, focus-ring, wcag, keyboard-navigation]

# Dependency graph
requires:
  - phase: 15-interactive-polish-documentation
    provides: "15-01..04 ring-offset sweep on HeroCarousel, NavLink/LocaleToggle/MobileNav, SourceFilter/PublicationEntry, PersonCard"
provides:
  - "ring-offset-2 + ring-offset-surface added to 8 remaining focus-visible:ring-accent-ring sites across 7 files"
  - "MICRO-05 ring-offset half fully closed across all focus-visible:ring-* sites in src/"
affects:
  - 15-06-BTN-06 (drift gate will scan for ring-offset-surface completeness)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ring-offset-surface on light/neutral backgrounds; ring-offset-black/40 on dark/image backgrounds (HeroCarousel — handled 15-01)"

key-files:
  created: []
  modified:
    - src/components/home/PartnerStrip.tsx
    - src/components/contact/ContactDetails.tsx
    - src/components/contact/MapEmbed.tsx
    - src/components/journal-club/SessionRow.tsx
    - src/components/layout/SiteFooter.tsx
    - src/components/layout/SiteHeader.tsx
    - src/components/outreach/OutreachCard.tsx

key-decisions:
  - "WCAG 2.5.5 AAA inline-text exception: PartnerStrip, ContactDetails social, SessionRow paper-link, SiteFooter EmailLink, OutreachCard learn-more receive no padding bumps"
  - "SkipLink.tsx intentionally untouched — uses focus: not focus-visible:, Phase 3 deliberate pattern (sr-only chip is keyboard-only by definition)"
  - "SiteFooter dormant social link (empty list) updated for codebase parity"

patterns-established:
  - "All focus-visible:ring-* sites in src/ now use ring-accent-ring + ring-offset-2 + ring-offset-surface (or ring-offset-black/40 for dark/image contexts)"

# Metrics
duration: 5min
completed: 2026-04-20
---

# Phase 15 Plan 05: Distributed Ring-Offset Sweep Summary

**`focus-visible:ring-offset-2 focus-visible:ring-offset-surface` appended to all 8 remaining focus-ring sites across 7 files, closing MICRO-05 ring-offset half across every `focus-visible:ring-*` site in `src/`**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-20T02:01:00Z
- **Completed:** 2026-04-20T02:06:00Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- Applied `focus-visible:ring-offset-2 focus-visible:ring-offset-surface` to 8 sites across 7 files (mechanical sweep)
- SkipLink.tsx left untouched — `focus:ring-` pattern is deliberate Phase 3 choice (keyboard-only sr-only chip)
- Zero inline-text link padding bumps — WCAG 2.5.5 AAA inline exception applied per planner decision
- All build gates pass: `pnpm typecheck`, `pnpm test` (67/67), `pnpm build` (45/45 static pages)

## Task Commits

1. **Task 1: Apply ring-offset-2 ring-offset-surface to all 8 remaining sites** - `6a9c148` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/home/PartnerStrip.tsx` — partner link: ring-offset-surface added (inline link, no padding bump)
- `src/components/contact/ContactDetails.tsx` — social link: ring-offset-surface added (inline exception)
- `src/components/contact/MapEmbed.tsx` — fallback anchor: ring-offset-surface added (full-container fill, ≥44px)
- `src/components/journal-club/SessionRow.tsx` — paper link: ring-offset-surface added (inline exception)
- `src/components/layout/SiteFooter.tsx` — EmailLink + dormant social link: ring-offset-surface added (2 sites, parity)
- `src/components/layout/SiteHeader.tsx` — logo Link: ring-offset-surface added (64×64 hit zone, ≥44px)
- `src/components/outreach/OutreachCard.tsx` — learn-more link: ring-offset-surface added (inline exception)

## Decisions Made

- WCAG 2.5.5 AAA inline-text exception applied: five inline-text links (PartnerStrip, ContactDetails social, SessionRow paper-link, SiteFooter EmailLink, OutreachCard learn-more) deliberately exempt from 44×44 tap-target rule — no padding bumps added
- SiteHeader logo and MapEmbed fallback already exceed 44px (64×64 logo, full-container fallback) — no padding needed
- SiteFooter dormant social link (currently empty list in siteConfig) updated for codebase parity with the rest

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Combined with 15-01..04, EVERY `focus-visible:ring-*` site in `src/` (19 sites total) now uses `ring-accent-ring + ring-offset-2 + ring-offset-{surface|black/40}`
- 15-06 drift gate can now scan for `focus-visible:ring-accent-ring(?!.*ring-offset-)` and expect zero hits
- SkipLink.tsx Phase 3 pattern preserved; no regressions

---
*Phase: 15-interactive-polish-documentation*
*Completed: 2026-04-20*
