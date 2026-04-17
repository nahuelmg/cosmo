---
phase: 01-foundation
plan: 02
subsystem: foundation/design-system
tags: [design-system, oklch, tailwind-v4, typography, source-serif-4, source-sans-3, ui-ux-pro-max]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 16 scaffold with Tailwind v4 installed
provides:
  - Locked warm-academic design system in MASTER.md (palette, typography, spacing, shadows, components)
  - OVERRIDES.md documenting all 17 raw-to-override changes with CONTEXT.md citations
affects: [01-04]

# Tech tracking
tech-stack:
  added: [Source Serif 4, Source Sans 3]
  patterns:
    - "OKLCH design tokens throughout — no hex values retained in MASTER.md"
    - "Two-tier surface hierarchy (surface + surface-alt) with whitespace-only dividers"
    - "next/font/google delivery with greek,latin,latin-ext subsets for both families"
    - "Override log pattern: OVERRIDES.md records every deviation from raw tool output"

key-files:
  created:
    - design-system/cosmology-group-uba/MASTER.md
    - design-system/cosmology-group-uba/OVERRIDES.md
  modified: []

key-decisions:
  - "Warm-academic palette: hue 45° muted terracotta accent, ivory surfaces (hue 80–85°), warm near-black ink (hue 60°)"
  - "Source Serif 4 + Source Sans 3 — Adobe type siblings with matched x-height, both variable, both OFL, both ship Greek on Google Fonts"
  - "No-border policy: all hierarchy via typography and whitespace; no --border-* tokens; focus rings via box-shadow only"
  - "Two-tier surface: primary oklch(0.995 0.003 85) + alt oklch(0.978 0.008 80); no third tier"
  - "Type scale ratio 1.2: H1 = 2rem (32px), body = 1rem with line-height 1.5"
  - "Shadow ceiling at --shadow-md: --shadow-lg and --shadow-xl removed as contrary to Nature long-form aesthetic"

patterns-established:
  - "Override gate pattern: raw ui-ux-pro-max output is never committed as-is; OVERRIDES.md records every deviation"
  - "OKLCH-first tokens: all palette values in OKLCH triples; conversion to hex is always downstream"
  - "Font delivery via next/font/google (Plan 01-04); MASTER.md references font families by name, not CSS @import"

# Metrics
duration: ~30min
completed: 2026-04-17
---

# Phase 1 Plan 02: Design System — Warm-Academic Override Summary

**Locked warm-academic design system: Source Serif 4 + Source Sans 3 with Greek subsets, OKLCH ivory-surface palette, muted terracotta accent at hue 45°, no borders, ratio-1.2 type scale**

## Performance

- **Duration:** ~30 min (Task 1 in prior session; Task 3 in continuation session)
- **Started:** 2026-04-17T17:34:53Z (Task 1)
- **Completed:** 2026-04-17T21:05:07Z (Task 3)
- **Tasks:** 3 (Task 1: generate raw, Task 2: decision checkpoint, Task 3: apply overrides)
- **Files modified:** 2

## Accomplishments

- Generated raw ui-ux-pro-max design system output and persisted to `design-system/cosmology-group-uba/MASTER.md`
- Applied all 17 approved overrides: warm OKLCH palette, Source Serif 4 + Source Sans 3 (Greek-verified), removed borders/heavy shadows, added ratio-1.2 type scale
- Wrote `OVERRIDES.md` documenting every raw→override entry with specific CONTEXT.md citations so all deviations are auditable

## Task Commits

1. **Task 1: Generate raw ui-ux-pro-max output** — `cc072b1` (feat)
2. **Task 2: Decision checkpoint** — (no commit; user decision gate)
3. **Task 3: Apply warm-academic overrides** — `0f3d978` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `design-system/cosmology-group-uba/MASTER.md` — Complete locked design system: warm-academic palette (OKLCH), Source Serif 4 + Source Sans 3 typography with Greek subset, two-tier surfaces, ratio-1.2 type scale, components without borders
- `design-system/cosmology-group-uba/OVERRIDES.md` — Audit log of all 17 overrides applied to raw ui-ux-pro-max output, each citing the specific CONTEXT.md constraint that motivated it

## Decisions Made

1. **Warm-academic palette at hue 45°:** Accent is `oklch(0.52 0.12 45)` — muted terracotta, not saturated orange. Sits squarely in the warm band (30°–80°) while reading editorial rather than tech-startup. Chroma 0.12 (muted vs raw 0.20 saturated).

2. **Source Serif 4 + Source Sans 3 font pair:** Adobe type siblings chosen for (a) verified Greek subset on Google Fonts, (b) matched x-height enabling clean serif/sans pairing, (c) variable font axes reducing file requests. Crimson Pro (no Greek) and Atkinson Hyperlegible (no Greek) retired.

3. **No-border policy enforced throughout:** Removed `border` declarations from `.btn-secondary` and `.input`. Removed `--border-*` tokens entirely. Focus rings use `box-shadow` only. Shadow ceiling set at `--shadow-md` — `--shadow-lg` and `--shadow-xl` removed.

4. **Two-tier surface (ivory primary + alt):** Primary `oklch(0.995 0.003 85)` / alt `oklch(0.978 0.008 80)`. Both warm (hue 80–85°) vs raw cool near-white (`#F8FAFC`, hue ~210°). Exactly two tiers as CONTEXT.md requires.

5. **Type scale ratio 1.2:** H1=2rem, H2=1.875rem, H3=1.625rem, H4=1.375rem, body=1rem (lh 1.5). Restrained editorial scale — not hero-splash. Body at 16px, secondary at 15px (`0.9375rem`).

6. **Font delivery via next/font/google:** CSS `@import` replaced with a delivery note. Actual font loading deferred to Plan 01-04 (`src/app/fonts.ts`) which will specify `subsets: ['latin', 'latin-ext', 'greek']` and variable font axes.

## Deviations from Plan

None — plan executed exactly as written. The 17 overrides were the planned work, not deviations from it. All overrides were approved by the user at the Task 2 checkpoint before being applied.

## Issues Encountered

None — the override gate worked as designed. Raw ui-ux-pro-max output was misaligned in 17 ways (as anticipated by RESEARCH.md Open Questions #1–3); all were caught at the checkpoint and corrected in Task 3.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- MASTER.md is locked and ready for Plan 01-04 to translate mechanically into `globals.css` OKLCH tokens via Tailwind v4 `@theme` directives.
- Font families identified; Plan 01-04 will implement `next/font/google` with `subsets: ['latin', 'latin-ext', 'greek']` and wire variable font axes.
- No blockers. No concerns.

---
*Phase: 01-foundation*
*Completed: 2026-04-17*
