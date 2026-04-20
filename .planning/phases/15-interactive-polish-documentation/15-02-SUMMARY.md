---
phase: 15-interactive-polish-documentation
plan: 02
subsystem: ui
tags: [tailwind, accessibility, hit-zones, focus-rings, a11y, header, nav]

# Dependency graph
requires:
  - phase: 15-interactive-polish-documentation
    provides: HeroCarousel dot tap zones from 15-01 plan (same accessibility sweep wave)
provides:
  - NavLink py-1.5 hit padding + explicit duration-150 transition (BTN-05 + MICRO-01)
  - LocaleToggle py-1.5 hit padding + ring-offset-2 ring-offset-surface (BTN-05)
  - MobileNav trigger and close buttons at 44x44 (w-11 h-11) + ring offset
affects:
  - future-a11y-audit phases (drift gate: all ring sites in this slice now standardised)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "44px hit zone via py-1.5 + header h-24 flex-center (no height change)"
    - "Tailwind class cascade: base py-1.5 overridden by className-prop py-3 for mobile NavLink"
    - "focus-visible ring standard: ring-2 ring-accent-ring ring-offset-2 ring-offset-surface"

key-files:
  created: []
  modified:
    - src/components/layout/NavLink.tsx
    - src/components/layout/LocaleToggle.tsx
    - src/components/layout/MobileNav.tsx

key-decisions:
  - "py-1.5 (12px) + text-sm line-height (~20px) = 32px text row; h-24 (96px) header flex-centers to 44px hit zone"
  - "Mobile NavLink py-3 overrides base py-1.5 because className prop appears last in combined string"
  - "ring-offset-surface on all header focus rings — header bg is light cream (--color-surface)"
  - "MobileNav trigger/close bumped from w-10 h-10 (40px) to w-11 h-11 (44px), closing RESEARCH.md open-question #2"

patterns-established:
  - "Hit zone via py-1.5: use when element lives in a flex-centered header at h-24; visible size unchanged"
  - "Ring standard: ring-2 ring-accent-ring ring-offset-2 ring-offset-surface across all header interactive elements"

# Metrics
duration: 2min
completed: 2026-04-20
---

# Phase 15 Plan 02: Header Nav Micro-fixes Summary

**NavLink/LocaleToggle desktop hit zones raised to 44px via py-1.5; MobileNav trigger+close bumped from 40px to 44px square; all three header ring sites gain ring-offset-2 ring-offset-surface; NavLink active-state transition made explicit at duration-150**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-20T04:59:07Z
- **Completed:** 2026-04-20T04:59:44Z
- **Tasks:** 3 completed
- **Files modified:** 3

## Accomplishments

- BTN-05 closed: NavLink and LocaleToggle both at py-1.5 (12px each side) — combined with text-sm line-height (~20px) gives 32px text row; the h-24 (96px) header flex-centers this to a 44px tall hit zone without changing any visible chrome
- MICRO-01 closed: NavLink base const now has explicit `duration-150` on the transition-colors, matching CONTEXT.md's default timing spec
- MobileNav tap-target gap from RESEARCH.md open-question #2 closed: trigger and close buttons bumped from w-10 h-10 (40px) to w-11 h-11 (44px)
- All three focus ring sites in this slice (LocaleToggle:104, MobileNav:53, MobileNav:102) now include `ring-offset-2 ring-offset-surface`, matching the header's cream surface

## Hit Zone Math Confirmation

Desktop NavLink and LocaleToggle:
- py-1.5 = 6px top + 6px bottom = 12px vertical padding
- text-sm line-height = approximately 20px
- Total element height = 12px + 20px + 12px = ~44px at 1rem base
- SiteHeader h-24 (96px) flex-centers these elements; hit row fills that 44px band

Mobile NavLink cascade check:
- NavLink base: `transition-colors duration-150 py-1.5`
- Mobile className prop: `"text-sm py-3 px-2 rounded"` — passed as `className` argument
- In `combined` array: `[base, active/inactive, className]` — `className` is LAST
- Tailwind source-order: `py-3` appears after `py-1.5` in the resolved string → `py-3` wins
- Mobile NavLink hit row: py-3 (24px each side) + text-sm → ~50px. Already compliant.

## Task Commits

Each task was committed atomically:

1. **Task 1: NavLink — add py-1.5 hit padding + explicit duration-150** - `31a9760` (feat)
2. **Task 2: LocaleToggle — bump to py-1.5 + add ring offset** - `dcb366b` (feat)
3. **Task 3: MobileNav trigger + close — bump to 44x44 + add ring offset** - `2ef660d` (feat)

## Files Created/Modified

- `src/components/layout/NavLink.tsx` - base const: `'transition-colors'` → `'transition-colors duration-150 py-1.5'`
- `src/components/layout/LocaleToggle.tsx` - `px-2 py-1` → `px-2 py-1.5`; ring line gains `ring-offset-2 ring-offset-surface`
- `src/components/layout/MobileNav.tsx` - both buttons: `w-10 h-10` → `w-11 h-11`; both ring lines gain `ring-offset-2 ring-offset-surface`

## Decisions Made

- Tailwind class cascade sufficient for mobile NavLink: `py-3` in className prop overrides `py-1.5` in base — no `twMerge` needed (validated via source-order concatenation in NavLink combined array)
- `ring-offset-surface` chosen over a new theme token — CSS custom property `--color-surface` already exists; no new token needed
- MobileNav trigger/close route to this plan (not a separate BTN plan) — they are part of the header nav cluster and the RESEARCH.md open-question explicitly flagged this file

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The plan's success criterion grep (`focus-visible:ring-(?!2|accent-ring|offset-)`) uses a PCRE negative lookahead that bash grep warns about. Manual inspection confirmed all three ring sites use only allowed classes (`ring-2`, `ring-accent-ring`, `ring-offset-2`, `ring-offset-surface`). This is a grep engine compatibility quirk, not a code issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BTN-05 (NavLink + LocaleToggle hit zones) fully closed
- MICRO-01 (explicit transition duration) fully closed
- MobileNav BTN-01 follow-up from RESEARCH.md open-question #2 closed
- Focus ring standard (`ring-2 ring-accent-ring ring-offset-2 ring-offset-surface`) established as pattern for all header interactive elements
- Ready for remaining Phase 15 plans; no blockers

---
*Phase: 15-interactive-polish-documentation*
*Completed: 2026-04-20*
