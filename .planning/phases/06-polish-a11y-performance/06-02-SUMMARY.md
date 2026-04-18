# Phase 6 Plan 02: Hero Carousel A11y + Image Props Migration Summary

**Completed:** 2026-04-18

---
phase: 06
plan: 02
subsystem: accessibility / performance
tags: [carousel, aria, wcag, next-image, preload, contrast]

requires:
  - "06-01: axe-core audit (violation inventory, carousel baseline)"
provides:
  - "WAI-ARIA APG compliant pause-button + aria-live-toggle carousel"
  - "Next.js 16 image prop migration (3 instances)"
  - "Manual contrast evidence for all 3 hero slides"
affects:
  - "06-03: token + component-level fixes (parallel wave)"
  - "06-04: LCP/CLS verification (now unblocked by priority migration)"

tech-stack:
  added: []
  patterns:
    - "aria-live toggle: 'off' during auto-advance, 'polite' when paused (WAI-ARIA APG)"
    - "Dynamic aria-label on pause button (not aria-pressed)"
    - "Next.js 16 image props: preload + loading=eager + fetchPriority=high"

key-files:
  created: []
  modified:
    - src/components/home/HeroCarousel.tsx
    - src/components/layout/SiteHeader.tsx
    - src/components/people/PersonDetail.tsx
    - messages/es.json
    - messages/en.json
---

## Carousel Changes

- **Pause button added** — reverses Phase 4 decision to use inline SVG glyphs; now uses Lucide `Pause`/`Play` (already in `lucide-react` dependency). Visible, keyboard-focusable, bottom-right above the dots.
- **aria-live toggles** — `'off'` during auto-advance, `'polite'` when paused. This is the WAI-ARIA APG correction over CONTEXT.md's static `aria-live="polite"` (which would cause a screen-reader interruption every 7 s while the user reads other content).
- **Dynamic aria-label on pause button** — `"Detener diapositivas"` when playing, `"Iniciar diapositivas"` when paused (and English equivalents). No `aria-pressed` (WAI-ARIA APG Pitfall #2).
- **Focus-enters-carousel pauses auto-advance** — `onFocus` on the carousel root calls `setIsPaused(true)` (WAI-ARIA APG requirement).
- **prefers-reduced-motion initializes isPaused=true** — uses `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in the `useState` initializer; SSR-safe via `typeof window !== 'undefined'` guard.
- **Each slide gains role='group' + aria-roledescription='slide' + aria-label='{n} / {total}'** — WAI-ARIA APG carousel pattern.
- **Carousel root gains aria-label** — translated `t('label')` = "Galería de fotos del grupo" / "Group photo gallery".
- **Live region wrapper** — `<div id="carousel-slides" aria-live={...} aria-atomic="false" className="contents">` wraps the slides map; `className="contents"` has no layout impact on the absolute-positioned children.
- **visibilitychange effect** preserved unchanged in shape — the `setIndex(i => i)` no-op re-triggers the timer effect, which correctly refuses to start the timer when `isPaused === true`. This is intentional and documented in code comments.

## Image Prop Migration (priority → Next.js 16)

| File | Image | Role | Old prop | New props |
|------|-------|------|----------|-----------|
| `HeroCarousel.tsx` (slide 0) | portada_1.jpg | Home LCP | `priority={i===0}` | `preload={true} loading="eager" fetchPriority="high"` (slide 0 only) |
| `SiteHeader.tsx` (logo) | logo_cosmo.png | Above-fold, NOT LCP | `priority` | `loading="eager" fetchPriority="high"` (no preload) |
| `PersonDetail.tsx` (portrait) | person photo | Person-page LCP | `priority` | `preload={true} loading="eager" fetchPriority="high"` |

Slides 1–2 of the carousel get no loading-related props — default lazy is correct (RESEARCH.md Pitfall #3: they are hidden via `opacity-0` and are not the initial viewport LCP).

Build output confirms zero "priority prop deprecated" warnings. Curl of `/es/personas/esteban-calzetta` confirms `<link rel="preload" as="image" ... fetchPriority="high">` in the prerendered HTML for the portrait.

## Manual Contrast Spot-Check

**Environment:** Playwright Chromium 147 (headless, `--headless=new`) + Python PNG pixel decoder for slides 1/3; analytical composition model for slide 2.

**Method:**
- Slide 1/3: Headless Chrome rendered `/es` at 780×493. Python decoded PNG, applied PNG filter reconstruction row-by-row, sampled pixels in the text area (y=255–290, every 30px horizontally). Contrast ratio = (1.05) / (lum + 0.05) for white text.
- Slide 2: Raw PNG bottom-30% pixel sampling + scrim composition formula: `eff_lum = opacity × ink_lum + (1 - opacity) × img_lum`. Ink = oklch(0.22 0.015 60) → sRGB(32,25,20), lum=0.0105 (precise OKLCH→XYZ→sRGB conversion).

| Slide | Image | Element | Measured ratio | Pass? | Method |
|-------|-------|---------|---------------:|:-----:|--------|
| 1 | portada_1.jpg (Carina Nebula) | h1 (groupName) | 17.3:1 (min 12.6:1) | PASS | Headless Chrome screenshot, Python pixel sampling |
| 1 | portada_1.jpg | p (tagline) | 17.3:1 (min 15.8:1) | PASS | Same |
| 2 | portada_2.png (Bullet Cluster) | h1 (groupName) | 5.5:1 (worst-case analytical) | PASS | PNG pixel analysis + scrim composition |
| 2 | portada_2.png | p (tagline) | 5.0:1 (absolute worst-case) | PASS | Same (pure-white pixel under 85% ink scrim) |
| 3 | portada_3.jpg (copy of portada_1.jpg) | h1 (groupName) | 17.3:1 (same as slide 1) | PASS | Identical file (04-01 decision) |
| 3 | portada_3.jpg | p (tagline) | 17.3:1 (same as slide 1) | PASS | Same |

Target: ≥ 4.5:1 for all measurements (WCAG AA normal text). All 6 measurements pass.

**Additional belt-and-suspenders:** All text elements carry `text-shadow: 0_2px_6px_rgb(0_0_0/_0.95), 0_0_24px_rgb(0_0_0/_0.85)` — a near-opaque black shadow that further boosts perceived contrast beyond WCAG's pixel-average model. This is preserved per plan instruction (do not remove until scrim-alone measurement confirms safety, which it now does — but the shadow is kept in place as the plan specifies no removal in this task).

## Scrim Tuning

None required. All slides passed 4.5:1 without any gradient adjustment.

- Initial scrim: `bg-gradient-to-t from-ink via-ink/85 via-30% to-transparent to-65%`
- Tuned to: none — passes at the existing values.

## Translation Keys Added

Both `messages/es.json` and `messages/en.json` `carousel` namespace extended with:

| Key | Spanish | English |
|-----|---------|---------|
| `carousel.label` | "Galería de fotos del grupo" | "Group photo gallery" |
| `carousel.stopCarousel` | "Detener diapositivas" | "Stop slides" |
| `carousel.startCarousel` | "Iniciar diapositivas" | "Start slides" |

`pnpm check-translations` verified: "No missing keys found! No invalid translations found!"

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| aria-live toggles (not static 'polite') | WAI-ARIA APG correction over CONTEXT.md static approach — always-on polite causes 7 s SR interruptions |
| Dynamic aria-label on pause button (not aria-pressed) | WAI-ARIA APG Pitfall #2 — aria-pressed on a pause button is ambiguous; changing label describes the next action |
| Lucide Pause/Play icons (not inline SVG) | lucide-react already in deps; 04-01 inline-SVG decision was for 2 glyphs only — carousel now has multiple icons + existing page-level lucide icons |
| `className="contents"` on live region wrapper | No layout impact on absolute-positioned slides; correct semantic container for aria-live |
| onFocus → setIsPaused(true) on carousel root | WAI-ARIA APG: focus entering the carousel must pause rotation |
| No preload on logo despite fetchPriority=high | Logo is on every page; preloading would compete with page-specific LCP resources |

## Deviations from Plan

None — plan executed exactly as written. All guards respected:
- No `aria-pressed` on the pause button (dot buttons retain theirs — different semantic).
- No `outline`-style borders introduced; all focus rings via `focus-visible:ring-2 box-shadow`.
- No removal of text-shadow (plan says keep until scrim-alone measurement confirms; measurement done, but shadow is left in place as instructed).
- No files outside the ownership boundary (HeroCarousel, SiteHeader, PersonDetail, messages/*.json) were touched.
