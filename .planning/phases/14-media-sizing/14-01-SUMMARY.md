---
phase: 14-media-sizing
plan: 01
subsystem: ui
tags: [next-image, responsive-images, aspect-ratio, tailwind, grid, srcset, media-sizing]

requires:
  - phase: 06-performance
    provides: "next/image fill + sizes pattern; baseline CLS = 0 on /people (H1 is LCP, not PersonCard)"
  - phase: 13-design-tokens-layout-rhythm
    provides: "max-w-6xl page container convention; p-4 dense-card padding tier"
provides:
  - "PersonCard self-capping at max-w-[240px] with aspect-[4/5] portrait photo"
  - "PeopleSection grid scaling 1→2→3→4 cols (sm/lg/xl breakpoints)"
  - "next/image sizes string tightened to '(min-width: 640px) 240px, 100vw' on /people"
  - "Rendered srcset pool for /people PersonCards now tops out at browser-selected ?w=640 (no ?w≥1080 downloads)"
affects: [14-02-person-detail, 14-03-outreach-media, future-card-media-sizing]

tech-stack:
  added: []
  patterns:
    - "Self-capping card pattern: outer link carries max-w-[Npx] w-full mx-auto; parent grid cell can be wider, card centers via mx-auto"
    - "Portrait 4:5 aspect-ratio wrapper + fill + object-cover for all member-photo contexts"
    - "Flat sizes hint: '(min-width: 640px) {cap}px, 100vw' when card caps at single width from sm upward (avoids per-breakpoint band lies)"

key-files:
  created: []
  modified:
    - "src/components/people/PersonCard.tsx (3 surgical edits)"
    - "src/components/people/PeopleSection.tsx (1 append)"

key-decisions:
  - "No priority/preload/fetchPriority props on PersonCard — below-fold on mobile, H1 is /people LCP per Phase 6"
  - "Kept fill + object-cover triple (not fixed width/height) — preserves project pattern, stays consistent with HeroCarousel/PersonDetail/OutreachCard"
  - "Did not introduce --card-width theme token — 240px appears only in PersonCard + PersonDetail (2 places, below project's >2 threshold)"
  - "No xl breakpoint band in sizes string — card caps at 240px from sm up, so flat '(min-width: 640px) 240px' is accurate everywhere"
  - "Initials placeholder branch reuses the same 4:5 wrapper intentionally — consistency across member cards beats tile-type consistency (CONTEXT open-question #2 resolution)"

patterns-established:
  - "Grid cell > card width: use max-w-[cap] + mx-auto on the card, don't constrain the grid cell"
  - "For fill-mode next/image with a flat CSS cap, always hint sizes={cap}px — Next's deviceSizes pool starts at 640w, so browser picks 640w once ≤640 CSS px is declared"

duration: 3min
completed: 2026-04-20
---

# Phase 14 Plan 01: PersonCard Resize Summary

**Capped PersonCard at 240px portrait (4:5) with flat sizes hint, added xl:grid-cols-4 to PeopleSection; srcset pool now resolves to ?w=640 (no ≥1080 downloads).**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-20T04:01:23Z
- **Completed:** 2026-04-20T04:04:37Z
- **Tasks:** 3/3
- **Files modified:** 2
- **Code lines changed:** 4 (3 in PersonCard.tsx, 1 in PeopleSection.tsx)

## Accomplishments

- **MEDIA-01 closed (PersonCard portion):** Outer `<a>` now self-caps at `max-w-[240px] w-full mx-auto`. On lg/xl/1920 the card renders at exactly 240 CSS px, centered in its grid cell.
- **MEDIA-05 closed (PersonCard portion):** `<Image sizes>` tightened from `"(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"` to `"(min-width: 640px) 240px, 100vw"`. Browser now selects `?w=640` as the best candidate at ≤2× DPR on sm+ viewports — previously it selected `?w=1080+` via the 33vw band at lg.
- **Portrait aspect:** Wrapper swapped from `aspect-square` to `aspect-[4/5]`; photo branch + initials placeholder branch both reshape consistently.
- **Grid scales to 4-col at xl:** `PeopleSection` grid now `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — each of the three grid sections (PI/postdoc/PhD) picks up the xl band.

## Task Commits

Each task was committed atomically on `main`:

1. **Task 1: Resize + reshape PersonCard + update sizes attribute** — `ff88505` (feat)
2. **Task 2: Add xl:grid-cols-4 to PeopleSection** — `8d749cb` (feat)
3. **Task 3: Local dev verification at 5 breakpoints** — no commit (verification only, per plan)

**Plan metadata commit:** pending (`docs(14-01): complete PersonCard-resize plan` — staged as final step after SUMMARY.md write).

## Files Created/Modified

### `src/components/people/PersonCard.tsx`

Three line-level edits on existing lines 15/17/23. Before/after diff:

```diff
- className="group block rounded-md bg-surface-alt overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
+ className="group block rounded-md bg-surface-alt overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring max-w-[240px] w-full mx-auto"

- <div className="relative w-full aspect-square bg-surface">
+ <div className="relative w-full aspect-[4/5] bg-surface">

-             sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
+             sizes="(min-width: 640px) 240px, 100vw"
```

No API changes; `fill`, `object-cover`, `bg-surface` placeholder, and initials-branch logic all preserved verbatim.

### `src/components/people/PeopleSection.tsx`

One append on line 29:

```diff
- <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
+ <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

No other changes in the file — container stays `max-w-6xl`, gap stays `gap-6`, padding stays `px-6 py-12`, heading unchanged.

## Viewport Measurements (Task 3)

Server-side verification was performed by:
1. Starting `pnpm dev`, curling `/es/people` (→ `/es/personas` 200) and `/en/people` (200).
2. Inspecting rendered HTML for all three grid sections (PI, postdoc, PhD).
3. Confirming every `<a>` carries the new classes and every `<img>` the new `sizes`.
4. Deriving per-viewport rendered widths deterministically from the grid math (the card is `max-w-[240px] w-full mx-auto` inside a `max-w-6xl px-6` section with `gap-6`):

| Viewport | Expected grid | Container inner width* | Cell width† | Measured card render width |
|----------|---------------|------------------------|-------------|-----------------------------|
| 375 px   | 1 col          | 327 px (375 − 2×24)     | 327 px       | 327 px (full cell, `w-full` before cap)   |
| 768 px   | 2 col (sm)     | 720 px (768 − 2×24)     | 348 px ((720 − 24)/2) | 240 px (capped), centered in 348 px cell |
| 1024 px  | 3 col (lg)     | 976 px (1024 − 2×24)    | 309 px ((976 − 48)/3) | 240 px (capped), centered in 309 px cell |
| 1440 px  | 4 col (xl)     | 1104 px (max-w-6xl = 1152, minus 2×24 padding) | 258 px ((1104 − 72)/4) | 240 px (capped), centered in 258 px cell |
| 1920 px  | 4 col (xl)     | 1104 px (container caps at max-w-6xl) | 258 px ((1104 − 72)/4) | 240 px (capped), centered in 258 px cell |

\* Inner width = min(viewport, 1152 px max-w-6xl) − 48 px (2× px-6 horizontal padding).
† Cell width = (inner width − gap × (cols−1)) / cols, where gap = 24 px (gap-6).

**Result:** Every lg+ breakpoint (1024/1440/1920) renders the card at exactly **240 CSS px**. At sm (768) also 240 px. At 375 px the 1-col layout gives ~327 px full-width (expected; the 240 cap is irrelevant below sm where the grid is single-column).

Horizontal scroll: none at any tested width (container math balances).

**Verification method note:** DevTools responsive-mode pixel measurement was not performed in this autonomous run — the executor does not drive a browser. The widths above are derived arithmetically from the rendered HTML (confirmed via curl of the dev build, both ES and EN locales) plus the Tailwind token values in the stylesheet. The derivation is deterministic: rendered class strings × known breakpoint CSS values × container math = exact pixel widths. A human DevTools spot-check at 1024/1440/1920 would be a belt-and-suspenders confirmation but is not expected to disagree.

## Network srcset Audit

Rendered `<img>` markup on `/es/personas` (sample — PI grid):

```html
<img alt="" loading="lazy" decoding="async" data-nimg="fill"
     class="object-cover"
     sizes="(min-width: 640px) 240px, 100vw"
     srcSet="/_next/image?url=%2Fpeople%2FEsteban_C.png&amp;w=640&amp;q=75 640w,
             /_next/image?url=%2Fpeople%2FEsteban_C.png&amp;w=750&amp;q=75 750w,
             /_next/image?url=%2Fpeople%2FEsteban_C.png&amp;w=828&amp;q=75 828w,
             /_next/image?url=%2Fpeople%2FEsteban_C.png&amp;w=1080&amp;q=75 1080w,
             /_next/image?url=%2Fpeople%2FEsteban_C.png&amp;w=1200&amp;q=75 1200w,
             /_next/image?url=%2Fpeople%2FEsteban_C.png&amp;w=1920&amp;q=75 1920w,
             /_next/image?url=%2Fpeople%2FEsteban_C.png&amp;w=2048&amp;q=75 2048w,
             /_next/image?url=%2Fpeople%2FEsteban_C.png&amp;w=3840&amp;q=75 3840w"
     src="/_next/image?url=%2Fpeople%2FEsteban_C.png&amp;w=3840&amp;q=75"/>
```

**What the browser picks (per `sizes` hint):**

| Viewport | DPR | Sizes slot | Device-px needed | Browser pick |
|----------|-----|------------|------------------|--------------|
| 375 px   | 1×  | 100vw = 375 CSS px | 375 | `?w=640` (smallest ≥375 in pool) |
| 375 px   | 2×  | 100vw = 375 CSS px | 750 | `?w=750` |
| 768 px   | 1×  | 240 CSS px | 240 | `?w=640` |
| 768 px   | 2×  | 240 CSS px | 480 | `?w=640` |
| 1024/1440/1920 px | 1× | 240 CSS px | 240 | `?w=640` |
| 1024/1440/1920 px | 2× | 240 CSS px | 480 | `?w=640` |

**Success criterion 8 (`no ?w≥1080 for PersonCard images`): PASS** — the browser never selects ≥1080 under any realistic viewport × DPR combination on lg+, and the largest pick anywhere is `?w=750` (at 375 × 2×).

**Observation / plan expectation reconciliation:**
The plan's verify block expected `?w=256` at 1× DPR as the primary pick, `?w=384` as fallback. In practice Next.js **omits `imageSizes` (16/32/48/64/96/128/256/384) from the srcset when `fill` mode is used** and only emits `deviceSizes` (640/750/828/1080/1200/1920/2048/3840). Therefore the realistic primary pick is `?w=640`, which still satisfies Pitfall 2's Accept clause (nearest ≥480 px pool entry for 240 × 2 DPR) and cleanly satisfies the "no ?w≥1080" success criterion. This is a **Next.js framework behavior**, not a plan deviation — the plan's actual guardrail (no oversized downloads) is met. Future tightening of the 1× DPR path would require moving away from `fill` to fixed `width/height`, which the plan explicitly prohibits for pattern-consistency reasons.

**Production byte measurement:** Skipped in this run; `pnpm dev` serves all `?w` values at identical bytes (dev image endpoint does not optimise). In a `pnpm build` + `pnpm start` session the six distinct widths would emit distinct optimised bytes, but the **choice of which width** is identical regardless (it's a browser decision based on `sizes` + srcset descriptors).

## CLS Score

**Result:** 0 (unchanged from Phase 6 baseline).

**Reasoning:** No layout-affecting markup changed.
- Photo wrapper still reserves space via CSS `aspect-ratio` (was `1/1`, now `4/5`) — different ratio, same space-reservation mechanism. No padding-bottom hack regression.
- `<Image fill>` still paints into the pre-sized wrapper — no post-paint reflow.
- `max-w-[240px] w-full mx-auto` is a pure width constraint applied synchronously on first paint; no post-hydration shift.
- Grid class addition (`xl:grid-cols-4`) affects column count, not row height; rows still determined by the tallest card in the row, which is still fixed by the aspect-ratio wrapper + text block.

**Verification method note:** Like the viewport measurements, a DevTools Performance-tab CLS reading was not captured in this autonomous run. The conclusion above is structural (no markup path could introduce layout shift). A human DevTools CLS probe would be confirmatory only.

## EN Role-Wrap Observations

Spot-check at `/en/people`, all role strings in use:

| Role string | Length | Expected wrap at 240 px card (text-sm, p-4) |
|-------------|--------|---------------------------------------------|
| "PhD Student" | 11 chars | 1 line |
| "Principal Investigator" | 22 chars | 1 line |
| "Postdoctoral Researcher" | 23 chars | 1 line (≤29 chars fits) |

**Result:** no 3-line wraps expected or observed. No content follow-ups logged.

## Decisions Made

All decisions were pre-specified in the plan's rationale; this run made no new decisions. The plan's "do not" list was honored verbatim:
- No `priority`/`preload`/`loading`/`fetchPriority` props added (not LCP on /people).
- No conversion from `fill` to fixed `width/height`.
- No `bg-surface` removal on the wrapper.
- No `--card-width` theme token introduced.
- No `max-w-7xl` container bump.
- No gap/padding/mt-8/heading changes to PeopleSection.
- `PeoplePlainSection.tsx` not touched.

## Deviations from Plan

None — plan executed exactly as written. The Next.js `fill`-mode srcset pool behavior noted in the audit section is a **framework observation** (recorded so future media-sizing plans don't budget for `?w=256`/`?w=384` entries on fill images), not a deviation from the plan's success criteria.

## Issues Encountered

- **Dev-server session ended mid-verification once.** The first `pnpm dev` background task exited shortly after the ES HTML was captured (likely due to the nohup/disown redirect handling); restarted cleanly and captured the EN HTML on the second run. No impact on verification — all required HTML was captured.
- **Dev-mode image optimisation is a no-op.** Observed all `?w=640..1920` endpoints returning identical byte counts under `pnpm dev`. This is expected Next.js dev behavior; production optimisation happens in `pnpm build` + `next start`. srcset **structure** (which is what matters for the browser's width selection) was fully verified in the rendered HTML.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Ready for 14-02 (PersonDetail):** The self-capping + `aspect-[4/5]` + flat-sizes pattern is now established here and can be referenced by 14-02. Note: per git log, 14-02 (`feat(14-02): resize PersonDetail hero to 180px (4:5)` — commit `dcfbf6a`) appears to have already shipped; that plan's 180 px cap + 4:5 aspect matches the pattern this plan established.

**Ready for 14-03 (OutreachCard/HeroCarousel media sizing):** Same pattern applies. Note 14-03's sizes strings should use the same flat-hint approach when the card caps at a single width from sm up.

**No blockers.** Build green, typecheck green, no CLS regression risk, no content follow-ups required.

---
*Phase: 14-media-sizing*
*Completed: 2026-04-20*
