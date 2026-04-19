---
phase: 13-design-tokens-layout-rhythm
plan: "01"
subsystem: ui
tags: [tailwind-v4, css-tokens, typography, design-system, globals-css]

# Dependency graph
requires:
  - phase: design-system
    provides: MASTER.md type-scale spec that determined the 36px/40px values
provides:
  - "--text-4xl: 2.25rem (36px) token in @theme"
  - "--text-5xl: 2.5rem (40px) token in @theme"
  - "h1 { line-height: 1.2 } scoped rule in @layer base"
affects:
  - 13-02 (H1 class migration will apply text-4xl/text-5xl)
  - 13-03 (card sizing plan depends on token foundation)
  - 13-04 (MASTER.md docs reference these canonical values)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@theme block owns all numeric design tokens; @theme inline reserved for font variable pass-through"
    - "Scoped heading rules in @layer base (h1 only for line-height; h2+ get utility classes per context)"

key-files:
  created: []
  modified:
    - src/app/globals.css

key-decisions:
  - "Scoped line-height: 1.2 to h1 only (not h1,h2,h3,h4) — H3 renders at text-2xl where tight leading hurts readability"
  - "Placed --text-5xl immediately after --text-4xl with inline comments distinguishing page H1 vs hero H1"

patterns-established:
  - "Token comments: include px value and usage context (e.g., '/* 36px — inner page H1s */')"
  - "@layer base heading rules: shared properties in h1,h2,h3,h4 block; display-only overrides in separate scoped rules"

# Metrics
duration: 5min
completed: 2026-04-19
---

# Phase 13 Plan 01: Token Update Summary

**Tailwind v4 type-scale tokens bumped (--text-4xl 2rem -> 2.25rem) and --text-5xl 2.5rem added; h1 scoped to line-height 1.2 via @layer base**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-19T22:17:00Z
- **Completed:** 2026-04-19T22:22:07Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Bumped `--text-4xl` from `2rem` (32px) to `2.25rem` (36px) for inner page H1 sizing
- Added `--text-5xl: 2.5rem` (40px) so the hero H1 utility stops falling through to Tailwind's default 48px
- Added `h1 { line-height: 1.2 }` scoped inside `@layer base` — isolated from h2/h3/h4 to prevent tight leading cascading into display-size-inappropriate headings
- `pnpm build` exits 0 — 45 static pages generated, TypeScript clean

## Token Before / After

**Before (grep output):**
```
36:  --text-4xl:  2rem;
```
(no --text-5xl defined; fell through to Tailwind default 3rem/48px)

**After (grep output):**
```
36:  --text-4xl:  2.25rem; /* 36px — inner page H1s */
37:  --text-5xl:  2.5rem;  /* 40px — hero H1 (HeroCarousel only) */
```

**h1 line-height rule added:**
```
72:  h1 {
73:    line-height: 1.2; /* leading-tight — display sizing per CONTEXT.md */
74:  }
```

## Build Result

```
pnpm build — exit 0
✓ Compiled successfully in 4.0s
✓ TypeScript passed
✓ 45 static pages generated
```

## Task Commits

1. **Task 1: Update --text-4xl and add --text-5xl in @theme** - `25f1a55` (feat)
2. **Task 2: Add leading-tight for h1 via @layer base** - `8a7d491` (style)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `/home/tomas/Projects/cosmo/src/app/globals.css` — Bumped --text-4xl, added --text-5xl, added h1 line-height rule in @layer base

## Decisions Made

- **Scope line-height to h1 only:** Applied `line-height: 1.2` exclusively to `h1` in `@layer base`, not to the shared `h1, h2, h3, h4` block. Rationale: H3 renders at `text-2xl` (below display threshold) where tight leading degrades readability. H2s that need tight leading will receive `leading-tight` utility class per-instance in Plan 02.
- **Inline comments on tokens:** Added `/* 36px — inner page H1s */` and `/* 40px — hero H1 (HeroCarousel only) */` to distinguish semantic usage at a glance.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Token foundation ready for Plan 02 (H1 class migration: swap arbitrary `text-[36px]` or old `text-4xl` for the corrected utilities)
- `text-5xl` utility now resolves to 40px — HeroCarousel H1 migration can proceed without risk of 48px overshoot
- No blockers

---
*Phase: 13-design-tokens-layout-rhythm*
*Completed: 2026-04-19*
