---
phase: 15-interactive-polish-documentation
plan: "04"
subsystem: ui
tags: [tailwind, motion-safe, group-hover, scale, focus-visible, ring-offset, PersonCard, micro-interactions]

# Dependency graph
requires:
  - phase: 14-media-sizing
    provides: PersonCard with max-w-[240px], aspect-[4/5] wrapper, fill+object-cover pattern
  - phase: 15-interactive-polish-documentation
    provides: Phase 15 plans 01-03 (BTN-01, ring audit, carousel/nav micro-interactions)
provides:
  - PersonCard <Image> zooms to scale-[1.02] on hover over 200ms (motion-safe, MICRO-03 closed)
  - PersonCard outer Link focus ring has ring-offset-2 ring-offset-surface (BTN-02 sweep applied)
  - Initials placeholder branch intentionally exempt from zoom
affects:
  - future-polish: card-lift transition on outer Link uses bare hover: (not motion-safe) — flagged for potential future phase

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "motion-safe: prefix on every transform utility — zoom absent for prefers-reduced-motion users"
    - "group-hover on child Image triggered by group class on parent Link — no JS needed"
    - "scale-[1.02] arbitrary value for subtle zoom (1.05 too aggressive per CONTEXT.md)"
    - "ring-offset-surface matches page background so focus ring is readable on light-cream surface"

key-files:
  created: []
  modified:
    - src/components/people/PersonCard.tsx

key-decisions:
  - "Initials placeholder branch deliberately exempt from zoom — scaling letters reads as a glitch (RESEARCH.md component-specific finding)"
  - "Card-lift transition (transition-transform duration-150 hover:-translate-y-0.5) preserved unchanged on outer Link — independent transition on different element, both render together on hover"
  - "Card-lift uses bare hover: (not motion-safe) — noted as potential future polish item, NOT in this phase scope"
  - "duration-200 for image zoom per MICRO-03 spec; card-lift remains duration-150 — two intentionally different durations"

patterns-established:
  - "MICRO-03 pattern: motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02] on child Image inside group Link"
  - "ring-offset-2 ring-offset-surface added alongside ring-2 ring-accent-ring on focus-visible: sites on light backgrounds"

# Metrics
duration: 5min
completed: 2026-04-20
---

# Phase 15 Plan 04: PersonCard Motion + Ring Offset Summary

**PersonCard photo zooms to scale-[1.02] over 200ms on hover (motion-safe, group-hover), with focus ring upgraded to include ring-offset-2 ring-offset-surface; initials placeholder and card-lift preserved unchanged**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-20T02:00:00Z
- **Completed:** 2026-04-20T02:05:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02]` to `<Image>` className (photo branch only) — closes MICRO-03
- Added `focus-visible:ring-offset-2 focus-visible:ring-offset-surface` to outer Link focus ring — completes BTN-02 ring-offset sweep for PersonCard
- Verified initials placeholder `<div>` branch is unchanged (no zoom on letters per RESEARCH.md)
- Verified pre-existing card-lift `transition-transform duration-150 hover:-translate-y-0.5` on outer Link is preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: PersonCard — image zoom on hover + ring offset** - `512660e` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/components/people/PersonCard.tsx` — Image zoom + ring offset additions; placeholder branch and card-lift unchanged

## Decisions Made

- **Initials placeholder exempt:** scaling initials letters reads as a glitch, not a polished interaction. Only the `<Image>` branch receives MICRO-03 zoom. Documented explicitly per plan requirement.
- **Card-lift preserved exactly:** `transition-transform duration-150 hover:-translate-y-0.5` on the outer `<Link>` is a separate transition on a separate element. Both transitions (card lifts, photo zooms) fire together on hover — this is the intended "two-layer" effect.
- **Card-lift uses bare `hover:` (not `motion-safe:`):** This pre-existing pattern was NOT changed in this plan (out of scope for phase 15). Flagged for potential future polish phase. The new image zoom is correctly gated with `motion-safe:`.
- **`ring-offset-surface` correct token:** PersonCard sits on `bg-surface-alt` card background, but the ring offset reads against the surrounding page (`bg-surface` light-cream). `ring-offset-surface` is correct per CONTEXT.md "ring-offset-surface on light backgrounds".

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `scale-[1.02]` arbitrary value resolved cleanly in Tailwind v4 build. All three gates (typecheck, test, build) passed on first run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MICRO-03 (PersonCard image zoom) closed.
- BTN-02 ring-offset sweep now covers PersonCard.
- Phase 15 Wave 1B complete (plans 01-04 all committed).
- Potential future item: card-lift transition on outer Link uses bare `hover:` (not `motion-safe:`) — should be addressed in a future polish pass if reduced-motion compliance is tightened across all interactive elements.

---
*Phase: 15-interactive-polish-documentation*
*Completed: 2026-04-20*
