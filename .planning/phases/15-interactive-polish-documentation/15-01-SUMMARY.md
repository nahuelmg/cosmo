---
phase: 15-interactive-polish-documentation
plan: 01
subsystem: ui
tags: [tailwind, accessibility, wcag, tap-target, focus-ring, carousel, hero]

# Dependency graph
requires:
  - phase: 14-media-sizing
    provides: HeroCarousel component with Phase 6 image sizing pattern (fill+aspect)
provides:
  - HeroCarousel pause/play button with 44x44 outer chrome (BTN-02/BTN-03 closed)
  - HeroCarousel dot buttons with 44x44 hit area via p-[17px] padding-inside (BTN-01 pattern)
  - Unified ring-accent-ring + ring-offset-black/40 focus ring on all HeroCarousel controls
  - Zero ring-surface/70 occurrences in HeroCarousel.tsx (drift gate unblocked for 15-06)
affects:
  - 15-06-final-visual-sweep (cluster-width verification at multiple breakpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BTN-01 padding-inside: p-[17px] on <button> wrapping inner <span aria-hidden> for visible chrome — hit zone math: 17px × 2 + 10px = 44px"
    - "Focus ring on dark/image backgrounds: ring-accent-ring + ring-offset-2 ring-offset-black/40 (no new CSS token — below 2-places threshold)"
    - "gap-0 + padding-inside: adjacent 44px hit zones tile edge-to-edge without overlap"

key-files:
  created: []
  modified:
    - src/components/home/HeroCarousel.tsx

key-decisions:
  - "p-[17px] arbitrary value chosen over p-3 (12px): 12×2+10=34px (under 44); 17×2+10=44px (exact). Arbitrary value acceptable at single-use site."
  - "gap-2 → gap-0 on controls wrapper: with 44px padding-inside buttons, visible dot spacing = 34px center-to-center between adjacent dots' visible chrome; hit zones tile without overlap"
  - "Active-scale and transition classes moved from <button> to inner <span>: ensures scale animation applies to visible dot only, not the 44px hit box"
  - "ring-offset-black/40 used (not a new CSS token): appears in 2 places after this plan — at the 2-places tokenization threshold; left as utility per CONTEXT.md guidance"

patterns-established:
  - "BTN-01 padding-inside pattern: when button has explicit visible chrome smaller than 44px, wrap chrome in <span aria-hidden> and apply p-[Xpx] to button where X=(44-chrome-size)/2"
  - "Image-background focus ring: ring-accent-ring + ring-offset-2 + ring-offset-black/40 (no ring-surface/* on dark/image surfaces)"

# Metrics
duration: 15min
completed: 2026-04-20
---

# Phase 15 Plan 01: HeroCarousel Tap-Target + Focus-Ring Sweep Summary

**HeroCarousel pause/play bumped to 44x44 chrome (w-11 h-11) and dots restructured with p-[17px] padding-inside for 44x44 hit zones; all ring-surface/70 eliminated and replaced with ring-accent-ring + ring-offset-black/40 for image-background contrast.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-20T04:45:00Z
- **Completed:** 2026-04-20T04:59:31Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Pause/play button outer chrome: 24x24 → 44x44 (w-11 h-11), inner glyph stays 14x14 (w-3.5 h-3.5). BTN-02 + BTN-03 closed.
- Dot buttons restructured with p-[17px] wrapping a 10x10 visible inner span; hit area = 17×2+10 = 44px. BTN-01 pattern applied.
- Controls wrapper gap-2 → gap-0; 44px hit zones tile edge-to-edge (visible dot center-to-center ~44px).
- Zero ring-surface/70 remain in HeroCarousel.tsx; both controls use ring-accent-ring + ring-offset-2 ring-offset-black/40.
- pnpm typecheck, pnpm test (67/67), pnpm build all pass clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: Pause/play button — bump outer chrome to 44x44 and unify focus ring** - `221ad30` (feat)
2. **Task 2: Dot buttons — 44x44 hit area via p-[17px], gap-0 wrapper, unified focus ring** - `5026fa9` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/home/HeroCarousel.tsx` - Pause/play 44x44 chrome; dot buttons p-[17px] padding-inside pattern; gap-0 controls wrapper; unified ring-accent-ring focus rings

## Pixel Measurements (per plan output spec)

| Control | Outer hit area | Visible chrome | How achieved |
|---|---|---|---|
| Pause/play button | 44×44 px (w-11 h-11) | 14×14 px glyph (w-3.5 h-3.5) | Direct sizing on `<button>` |
| Dot buttons (×3) | 44×44 px | 10×10 px inner span (w-2.5 h-2.5) | p-[17px] on `<button>`, chrome in `<span aria-hidden>` |

**p-[17px] arbitrary value resolution:** Resolved cleanly — Tailwind v4 accepted `p-[17px]` without issue. Build passes with no warnings. No substitution of p-4 (16px) was needed or considered; 17px is the exact value for 44px=17+10+17.

## Cluster-Width Visual Notes (for 15-06 final sweep)

Controls cluster total width with gap-0: 44px (pause/play) + 3 × 44px (dots) = 176px effective hit zone width. Visible chrome cluster: 14px + 3 × (10px + 34px padding centers) ≈ 44px visible, 176px total interactive band.

- **375px (mobile):** Controls positioned `bottom-4 right-4` — 176px cluster from right edge. At 375px viewport width this leaves 199px of carousel to the left. Comfortable fit, no overflow.
- **1024px / 1440px:** Same absolute positioning; proportionally more room. No visual concern.
- **Observation for 15-06:** The visible dot-to-dot spacing at gap-0 is purely from padding; dots appear to have ~34px visual gap between them (17px right edge of one + 17px left edge of next). This is wider than the old 8px (gap-2) appearance. Flag for 15-06 visual review: confirm dot spacing reads as intentional grouping, not excessive spread.

## Focus Ring

Zero `ring-surface/70` remain in HeroCarousel.tsx. Both `focus-visible:ring-*` lines use:
```
focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
```
This matches the CONTEXT.md "dark/image background" pattern exactly.

## Decisions Made

- **p-[17px] not p-3:** 12×2+10=34px (under 44); 17×2+10=44px (exact). Arbitrary value is single-use here and acceptable per project conventions.
- **gap-0 not gap-1/gap-2:** With padding-inside, gap-0 makes hit zones tile edge-to-edge. Any gap > 0 would create dead zones between 44px buttons, violating WCAG 2.5.5 for overlapping regions.
- **Active-scale on inner span, not button:** `active:scale-95` was moved from `<button>` to `<span aria-hidden>`. Scale on the 44px button box would be disorienting; scale on the 10px visible dot is the correct micro-interaction target.
- **ring-offset-black/40 not tokenized:** Appears in this plan's 2 sites (pause/play + dot buttons). At exactly the 2-places threshold — left as utility per the project's ">2 places" tokenization rule.

## Deviations from Plan

None - plan executed exactly as written. The p-[17px] approach specified in the plan worked as described. No fallback to p-4 needed.

## Issues Encountered

None. The regex in success criterion 1 (`grep -nE "focus-visible:ring-(?!2|accent-ring|offset-)"`) triggered a grep warning about `?` at the start of a character class (POSIX ERE does not support negative lookahead). Validated the actual state manually: only `ring-2`, `ring-accent-ring`, `ring-offset-2`, and `ring-offset-black/40` appear after `focus-visible:` — all correct.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 15-01 complete. HeroCarousel controls are tap-target compliant and focus-ring unified.
- Drift gate in 15-06 can now assert zero `ring-surface/70` across codebase (HeroCarousel was the last remaining site per RESEARCH.md audit).
- Visual cluster-width review flagged for 15-06: confirm gap-0 dot spacing (wider than old gap-2) reads correctly.

---
*Phase: 15-interactive-polish-documentation*
*Completed: 2026-04-20*
