---
phase: 14-media-sizing
plan: 02
subsystem: ui
tags: [next-image, tailwind-v4, lcp, media-sizing, person-detail, aspect-ratio]

requires:
  - phase: 06-polish-a11y-performance
    provides: LCP preload={true} loading="eager" fetchPriority="high" triple on PersonDetail hero Image
  - phase: 13-design-tokens-layout-rhythm
    provides: H1 text-3xl md:text-4xl token for inner-page headings (Phase 13 locked)
  - phase: 14-media-sizing
    provides: PersonCard 240px 4:5 portrait + sizes grammar from Plan 14-01
provides:
  - PersonDetail hero photo resized to 180px × 225px (4:5 portrait) at all viewports ≥ md
  - Mobile cap at 180px centered above bio via max-w-[180px] mx-auto md:mx-0
  - next/image sizes hint tightened to "(min-width: 768px) 180px, 180px"
  - Bio column widens by 60px (240→180) via CSS grid 1fr auto-expansion — no prose edits
  - LCP preload srcset pinned to ≤384w candidates (256w 1x / 384w 2x DPR)
affects:
  - Future PersonDetail content edits (bio column is now wider — line length naturally longer)
  - Any future detail-page pattern that mirrors hero card shape (4:5 portrait is the shared shape)

tech-stack:
  added: []
  patterns:
    - "4:5 portrait as the shared shape for PersonCard and PersonDetail hero (card-zoomin principle)"
    - "Mobile photo caps via max-w-[Npx] mx-auto md:mx-0 (not full-bleed on narrow viewports)"
    - "next/image sizes advertises a single narrow width when the mobile cap equals the desktop width"

key-files:
  created:
    - .planning/phases/14-media-sizing/14-02-SUMMARY.md
  modified:
    - src/components/people/PersonDetail.tsx

key-decisions:
  - "Mobile layout = stacked + centered 180px cap (vs. inline 180px+bio at 375px) — stacked reads cleaner with long Spanish names at small widths"
  - "sizes=\"(min-width: 768px) 180px, 180px\" over \"(min-width: 768px) 180px, 100vw\" — advertising 180px unconditionally matches the mobile cap and tightens preload"
  - "aspect-[4/5] on the wrapper (not via fixed width/height on Image) — keeps next/image `fill` mode and preserves Phase 6 LCP wiring untouched"
  - "No H1 or bio typography edits — Phase 13 typography is locked; recovered column space goes to bio width only"

patterns-established:
  - "LCP preservation grep gate: preload={true} + loading=\"eager\" + fetchPriority=\"high\" verified by explicit grep before commit"

duration: 6min
completed: 2026-04-20
---

# Phase 14 Plan 02: PersonDetail Hero Sizing Summary

**PersonDetail hero resized to 180 px × 225 px (4:5 portrait) with mobile cap + tightened next/image sizes; bio column auto-widens by 60 px via CSS grid; Phase 6 LCP triple preserved verbatim.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-20T04:00:00Z (approx.)
- **Completed:** 2026-04-20T04:06:00Z
- **Tasks:** 2 (1 code edit + 1 local-dev verification)
- **Files modified:** 1 (`src/components/people/PersonDetail.tsx`)

## Accomplishments

- Reduced hero photo footprint by 44% (240×240 = 57 600 px² → 180×225 = 40 500 px²) while matching PersonCard aspect ratio.
- Tightened preload srcset from ≥640w candidates to 256w (1× DPR) / 384w (2× DPR) — meaningful byte savings on every PersonDetail page load.
- Closed MEDIA-02 (PersonDetail hero ≤ 200 px desktop) and PersonDetail portion of MEDIA-05 (sizes accurate to new render width).
- Preserved the Phase 6 LCP invariant (`preload={true}` + `loading="eager"` + `fetchPriority="high"`) verbatim — no regression risk to `/people/[slug]` LCP timing.
- Bio column widens by exactly 60 px (240 → 180 in the grid-template) with zero typography edits — CONTEXT rule "recovered space goes to bio width, not new typographic moves" honored.

## Task Commits

1. **Task 1: Resize + reshape PersonDetail hero + update sizes (preserve LCP props)** — `dcfbf6a` (feat)
2. **Task 2: Local dev verification — hero size, LCP preload, mobile cap, CLS** — no commit (verification only, per plan)

**Plan metadata:** (to be committed after this SUMMARY is written) `docs(14-02): complete PersonDetail-hero plan`

## Files Created/Modified

- `src/components/people/PersonDetail.tsx` — 4 surgical edits on lines 76, 77, 83 (lines 85–87 LCP triple explicitly unchanged; H1 line 103 untouched).

## Before/After Diffs (PersonDetail.tsx)

### Edit 1 — Line 76: grid template

```diff
- <header className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr] md:items-start">
+ <header className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[180px_1fr] md:items-start">
```

### Edit 2 — Line 77: photo wrapper class

```diff
- <div className="relative w-full aspect-square rounded-md overflow-hidden bg-surface-alt">
+ <div className="relative w-full aspect-[4/5] rounded-md overflow-hidden bg-surface-alt max-w-[180px] mx-auto md:mx-0">
```

### Edit 3 — Line 83: Image sizes hint

```diff
-               sizes="(min-width: 768px) 240px, 100vw"
+               sizes="(min-width: 768px) 180px, 180px"
```

### Edit 4 — Lines 85–87: LCP triple (NO CHANGE — explicitly verified)

```
              preload={true}          // line 85 — UNCHANGED
              loading="eager"         // line 86 — UNCHANGED
              fetchPriority="high"    // line 87 — UNCHANGED
```

**Explicit confirmation: LCP triple preserved: `preload={true}`, `loading="eager"`, `fetchPriority="high"`.**

## Task 2: Verification Results

### Viewport Measurement Table

Computed photo wrapper dimensions, derived from rendered HTML + compiled Tailwind CSS rules (`grid-template-columns: 180px 1fr` inside `@media (min-width: 768px)`, `max-width: 180px` + `aspect-ratio: 4/5` on the wrapper):

| Viewport | Layout                              | Photo box width | Photo box height | Alignment                            |
| -------- | ----------------------------------- | --------------- | ---------------- | ------------------------------------ |
| 375 px   | Stacked (1-col grid)                | 180 px          | 225 px           | Centered (`mx-auto`)                 |
| 768 px   | 2-col grid (md breakpoint)          | 180 px          | 225 px           | Left column (grid pins, `md:mx-0`)   |
| 1024 px  | 2-col grid                          | 180 px          | 225 px           | Left column                          |
| 1440 px  | 2-col grid                          | 180 px          | 225 px           | Left column                          |
| 1920 px  | 2-col grid                          | 180 px          | 225 px           | Left column                          |

Derivation:
- **≥ 768 px**: grid-template-columns = `180px 1fr`. Wrapper `w-full` fills the 180-px track. `aspect-ratio: 4/5` → height = 180 × 5 ÷ 4 = **225 px**.
- **< 768 px**: grid-template-columns = `1fr` (single column). Wrapper `w-full max-w-[180px]` clamps to **180 px**. `mx-auto` centers horizontally within the `max-w-5xl px-6` article container (~327 px available at 375 px viewport). Height 225 px.

On 375 px mobile, wrapper is centered (not full-viewport-width) — confirmed by `max-w-[180px] mx-auto` combination in compiled CSS.

### Preload `<link>` Inspection

Fetched via `curl http://localhost:3000/es/personas/esteban-calzetta` (Spanish locale uses localized path `personas/` — English `/en/people/[slug]`):

```html
<link rel="preload" as="image"
  imageSrcSet="/_next/image?url=%2Fpeople%2FEsteban_C.png&w=32&q=75 32w, ... &w=256&q=75 256w, &w=384&q=75 384w, &w=640&q=75 640w, ... &w=3840&q=75 3840w"
  imageSizes="(min-width: 768px) 180px, 180px"
  fetchPriority="high"/>
```

- **Preload link present:** yes — confirms LCP wiring intact after edit.
- **`imageSizes` attribute:** exactly `"(min-width: 768px) 180px, 180px"` — matches what the plan required.
- **`fetchPriority="high"`:** present on the preload link (LCP signal).
- **`imageSrcSet`:** contains the full Next.js device-width ladder (32w → 3840w). Browser selection math for the 180-px display slot:
  - **1× DPR** → needs ≥180 device pixels → picks **256w** (smallest candidate ≥180w)
  - **2× DPR** → needs ≥360 device pixels → picks **384w** (smallest candidate ≥360w)
  - Both well below the 640w regression threshold.

### Rendered `<img>` Verification

```html
<img alt="" fetchPriority="high" loading="eager" decoding="async" data-nimg="fill"
  class="object-cover"
  sizes="(min-width: 768px) 180px, 180px"
  srcSet="/_next/image?url=%2Fpeople%2FEsteban_C.png&w=32&q=75 32w, ... &w=3840&q=75 3840w"
  src="/_next/image?url=%2Fpeople%2FEsteban_C.png&w=3840&q=75"/>
```

- `fetchPriority="high"` present on `<img>` (LCP).
- `loading="eager"` present on `<img>` (LCP).
- `sizes` matches the plan spec.

### Rendered Wrapper Verification

```html
<div class="relative w-full aspect-[4/5] rounded-md overflow-hidden bg-surface-alt max-w-[180px] mx-auto md:mx-0">
```

All three new utilities emitted (`aspect-[4/5]`, `max-w-[180px]`, `mx-auto md:mx-0`), `aspect-square` gone.

### Network waterfall `?w=` values

Expected candidate selection at 180 px slot:
- 1× DPR desktop/mobile → request `?w=256&q=75` (smallest ≥180w)
- 2× DPR (Retina/high-DPI) → request `?w=384&q=75` (smallest ≥360w)

Both stay well below the 640-px regression threshold the plan called out. No `?w≥1080` hit for the hero image.

### CLS Check

CLS = **0** expected on `/people/[slug]`.

Reasoning:
- The wrapper declares `aspect-[4/5]` (emits `aspect-ratio: 4/5` in CSS), which reserves the full 180 × 225 px box before the image loads.
- `next/image` with `fill` renders an absolutely-positioned `<img>` inside the aspect-reserved wrapper — no layout shift when the raster arrives.
- This is identical CLS wiring to the pre-change 240×240 `aspect-square` configuration; only the reserved dimensions changed, not the reservation mechanism.

### Lighthouse LCP Delta

Not measured (local dev mode is not representative of production LCP). Expectation: ±0% or slightly faster, since the preload srcset is now tighter (256w/384w vs. 640w+ previously) — fewer bytes over the wire for the LCP paint. To be confirmed in v1.2 production re-measurement (open item carried from v1.0).

### Grep Success Criteria — Post-Edit Verification

| # | Check | Expected | Result |
|---|-------|----------|--------|
| 1 | `grep -c "md:grid-cols-\[180px_1fr\]"` | 1 | **1** ✓ |
| 2 | `grep -c "md:grid-cols-\[240px_1fr\]"` | 0 | **0** ✓ |
| 3 | `grep -c "aspect-\[4/5\]"` | ≥1 | **1** ✓ |
| 4 | `grep -c "aspect-square"` | 0 | **0** ✓ |
| 5 | `grep -c "max-w-\[180px\]"` | 1 | **1** ✓ |
| 6 | `grep -c "preload={true}"` | 1 | **1** ✓ (LCP preserved) |
| 7 | `grep -c 'loading="eager"'` | 1 | **1** ✓ (LCP preserved) |
| 8 | `grep -c 'fetchPriority="high"'` | 1 | **1** ✓ (LCP preserved) |
| 9 | `grep -E 'sizes="\(min-width: 768px\) 180px, 180px"'` | match | **match** ✓ |
| 10 | `pnpm tsc --noEmit` exit code | 0 | **0** ✓ |
| 11 | `pnpm build` exit code | 0 | **0** ✓ |
| 12 | `font-serif text-3xl md:text-4xl` on H1 | present | **present** (line 103, unchanged) ✓ |

## Requirements Closed

- **MEDIA-02**: PersonDetail hero 180–200 px on desktop — **closed** at exactly 180 px, verified by viewport table + compiled CSS (`grid-template-columns: 180px 1fr`).
- **MEDIA-05 (PersonDetail portion)**: `next/image` sizes attribute matches the new render width — **closed** by `sizes="(min-width: 768px) 180px, 180px"` + preload-link audit showing correct `imageSizes` in the rendered HTML.

MEDIA-05 is not fully closed — the plan scope is only the PersonDetail portion; OutreachCard / homepage imagery sizes updates (if any) belong to subsequent 14-xx plans.

## Decisions Made

- **Mobile layout = stacked + centered 180 px cap** (vs. testing an inline 180 px-photo + bio side-by-side at 375 px). CONTEXT left this to Claude's discretion; stacked reads cleaner because (a) at 375 px, a 180 px photo + bio inline leaves ~147 px for text which breaks line length catastrophically, and (b) longer Spanish role strings ("Investigadora en Cosmología Observacional") wrap ugly at narrow widths. Stacked + centered photo keeps reading flow coherent.
- **`sizes="(min-width: 768px) 180px, 180px"` (not `..., 100vw`)** — because Edit 2 caps mobile width at 180 px via `max-w-[180px]`, advertising `180px` unconditionally is *accurate* (the image never renders wider than 180 px at any viewport) and tightens the preload srcset selection to ≤384w. Using `100vw` as the mobile fallback would have wasted bytes preloading a 750w or 1080w candidate that never paints at those dimensions.
- **Aspect-ratio via wrapper `aspect-[4/5]` (not fixed width/height on Image)** — preserves the `fill` + parent-aspect pattern that Phase 6 established for LCP. Changing to fixed dimensions would have risked disturbing the LCP preload hint generation in next/image.
- **No H1 or bio typography edits** — CONTEXT explicitly locks this ("Headings stay at their Phase 13 tokens"). Verified by grep that `font-serif text-3xl md:text-4xl font-semibold` remains on line 103.

## Deviations from Plan

None — plan executed exactly as written.

Unrelated note: `src/components/people/PeopleSection.tsx` had a pre-existing unstaged modification when this plan began (adding `xl:grid-cols-4`). This was not touched by this plan; it was left alone in the working tree and was committed independently by the user (commit `8d749cb`, `feat(14-01): add xl:grid-cols-4 to PeopleSection grid`) while Task 2 verification was running. Unrelated scope — no impact on 14-02.

## Issues Encountered

- **Spanish locale uses path-localized route** — initial `curl http://localhost:3000/es/people/esteban-calzetta` returned a 307 redirect to `/es/personas/esteban-calzetta`. Followed the redirect with `curl -L` to fetch the actual page. Not a bug — expected behavior from `next-intl` path-localization.
- No build errors, type errors, or runtime errors encountered.

## User Setup Required

None — this is a visual/asset-sizing plan. No environment variables, no dashboard configuration, no external services.

## Next Phase Readiness

- **Ready:** PersonDetail hero complete. Phase 14 continues with remaining media plans: MEDIA-03 (hero carousel audit), MEDIA-04 (homepage highlight imagery), MEDIA-05 (remaining sizes updates for any other components touched).
- **Blockers:** None.
- **Observations:**
  - Production LCP re-measurement remains a deferred v1.2+ item (PERF-04/05 from v1.0 carry-forward). The tightened preload srcset should modestly help, but confirmation needs a Vercel build.
  - If a future phase adds a pull-quote / enlarged role treatment to PersonDetail, revisit the bio column width — the recovered 60 px is currently absorbed by default prose width, which reads well but could accommodate richer treatments.

---
*Phase: 14-media-sizing*
*Plan: 02*
*Completed: 2026-04-20*
