---
phase: 04-core-pages
plan: 02
subsystem: ui
tags: [next-intl, react, tailwind, server-components, carousel, i18n, home-page]

# Dependency graph
requires:
  - phase: 04-01
    provides: HeroCarousel component, portada_1/2/3 images, home.* and carousel.* i18n namespaces, siteConfig with tagline/affiliations
  - phase: 03-05
    provides: layout owns single <main> landmark — page must not add its own
provides:
  - src/app/[locale]/page.tsx: full Home RSC replacing Phase 1 placeholder
  - src/components/home/Highlights.tsx: 3-card highlights grid server component
  - src/components/home/PartnerStrip.tsx: typographic partner-institution strip server component
  - HOME-01..07 and I18N-02 satisfied for the Home surface
affects: [04-03, 04-04, 04-05, 04-06, 04-07, 05-seo, 06-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Props-down server composition: page resolves all data (translations + siteConfig), passes as props to server-component leaves — no useTranslations inside Highlights/PartnerStrip"
    - "HOME-05 paragraph split: t('intro').split('\\n\\n').filter(Boolean).map(p => <p>) — semantic paragraphs from message string"
    - "Named re-export pattern: export { HeroCarousel } alongside export default allows both import styles"

key-files:
  created:
    - src/components/home/Highlights.tsx
    - src/components/home/PartnerStrip.tsx
  modified:
    - src/app/[locale]/page.tsx
    - src/components/home/HeroCarousel.tsx

key-decisions:
  - "Named export added to HeroCarousel.tsx alongside default export — plan imports { HeroCarousel }; default export retained for Next.js app router page compatibility"
  - "home.intro already had 2 \\n\\n-separated paragraphs in both locales from 04-01 seed — no rewrite needed; plan's sub-step 1 was pre-satisfied"
  - "intro section class order: 'mx-auto max-w-3xl space-y-4 px-6 py-16' — space-y-4 comes before px-6/py-16 in Tailwind v4 output; verification regexes must match actual class order"

patterns-established:
  - "Semantic paragraph pattern: split message string on \\n\\n → filter empties → map to <p> (HOME-05 compliant; no whitespace-pre-line)"
  - "Server-component leaves: page resolves translations + siteConfig, passes resolved strings to Highlights and PartnerStrip — leaves stay server-renderable with no client coupling"
  - "Partner strip text-only: siteConfig.affiliations rendered as linked text (no logos) per Phase 4 open-question #4 recommendation"

# Metrics
duration: ~15min
completed: 2026-04-18
---

# Phase 4 Plan 02: Home Page Summary

**Full Home RSC with hero carousel + 2-paragraph intro (HOME-05 compliant) + 3-card highlights grid + linked partner institution strip, all bilingual via next-intl**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-18T00:00:00Z
- **Completed:** 2026-04-18T00:15:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Built Highlights and PartnerStrip as pure server components receiving pre-resolved props from the page — no client coupling
- Rewrote page.tsx replacing Phase 1 Greek-probe placeholder with full Home RSC composing HeroCarousel + intro + Highlights + PartnerStrip
- HOME-05 verified: 2 semantic `<p>` elements in intro section (Spanish and English), no `whitespace-pre-line`
- pnpm build passes with 9 static pages including /es and /en; no SSR fallback warnings

## Slides Used

The carousel renders these images from `public/Portadas/`:
1. `/Portadas/portada_1.jpg` — width 1920, height 820
2. `/Portadas/portada_2.png` — width 1920, height 820
3. `/Portadas/portada_3.jpg` — width 1920, height 820 (deliberate copy of portada_1 per 04-01 decision)

All `alt=""` (decorative — overlay text carries semantic content).

## home.intro Values (Verbatim)

**Spanish (es):** (2 paragraphs, 1 `\n\n` separator)
```
Somos un grupo de investigación en cosmología teórica y observacional radicado en el Departamento de Física de la FCEN, UBA.\n\nNuestro trabajo conecta modelos del universo temprano con datos de relevamientos de gran escala, explorando la naturaleza de la materia oscura, la energía oscura y la estructura a gran escala del cosmos.
```

**English (en):** (2 paragraphs, 1 `\n\n` separator)
```
We are a theoretical and observational cosmology research group based in the Department of Physics at FCEN, UBA.\n\nOur work connects models of the early universe with data from large-scale surveys, exploring the nature of dark matter, dark energy, and the large-scale structure of the cosmos.
```

Both were already correctly structured by 04-01 seed — no copy change needed.

## HOME-05 Paragraph Count Verification

| Locale | Raw JSON paragraphs (jq+awk) | Rendered `<p>` count |
|--------|------------------------------|----------------------|
| es     | 2                            | 2                    |
| en     | 2                            | 2                    |

Rendered HTML confirms 2 semantic `<p>` elements in the intro `<section class="mx-auto max-w-3xl space-y-4 px-6 py-16">`. No `whitespace-pre-line` in either locale output.

## Reduced-Motion Verification

Visual-only (not axe-confirmed). The HeroCarousel's `useEffect` checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before setting the `setTimeout` — same pattern from 04-01. Functional correctness is code-review verified; DevTools emulation confirms carousel stays on slide 0 when reduced-motion is active.

## Task Commits

1. **Task 1: Build Highlights and PartnerStrip server components** — `42cd1f7` (feat)
2. **Task 2: Replace Home page with full hero + intro + highlights + partners** — `81c6741` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/components/home/Highlights.tsx` — 3-card highlights grid, RSC, aria-labelledby="home-highlights", bg-surface-alt cards
- `src/components/home/PartnerStrip.tsx` — typographic partner strip, RSC, border-t separator, linked affiliations
- `src/app/[locale]/page.tsx` — full Home RSC; replaces Phase 1 placeholder; composes HeroCarousel + intro + Highlights + PartnerStrip
- `src/components/home/HeroCarousel.tsx` — added named `export { HeroCarousel }` alongside existing default export

## Decisions Made

- **HeroCarousel named export:** Added `export { HeroCarousel }` to HeroCarousel.tsx because the plan uses named-import style `{ HeroCarousel }`. The `export default function HeroCarousel` declaration creates a named binding that can be re-exported. Default export retained for backward compatibility.
- **home.intro not rewritten:** Both locale files already contained 2 `\n\n`-separated paragraphs (seeded correctly in 04-01). Plan's sub-step 1 was pre-satisfied; verified with `jq + awk` paragraph count returning `2` for each locale.
- **Verification note on class order:** Tailwind v4 emits `space-y-4` before padding utilities in the class string. Regex-based `<p>` count verification must match the actual class attribute order (`mx-auto max-w-3xl space-y-4 px-6 py-16`), not the order they appear in JSX source.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added named export to HeroCarousel**

- **Found during:** Task 2 (Replace Home page)
- **Issue:** Plan imports HeroCarousel as `{ HeroCarousel }` (named import), but HeroCarousel.tsx only had a default export. TypeScript would fail to resolve the named import.
- **Fix:** Added `export { HeroCarousel };` at the bottom of HeroCarousel.tsx — the function identifier is in scope because `export default function HeroCarousel` creates a named binding.
- **Files modified:** `src/components/home/HeroCarousel.tsx`
- **Verification:** `pnpm tsc --noEmit` exits 0; `pnpm build` succeeds.
- **Committed in:** `81c6741` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical — named export needed for named import)
**Impact on plan:** Necessary fix for TypeScript to resolve the named import the plan specified. No scope creep.

## Issues Encountered

- **Dev server 404 on first start:** The initial `pnpm dev` instance started before file writes completed and served stale routes returning 404. Resolved by killing the first instance and starting a fresh server after writes — second start served correct HTML at 54KB.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Home page is feature-complete for Phase 4 scope (HOME-01..07, I18N-02)
- HeroCarousel, Highlights, and PartnerStrip are stable components ready to be referenced by future phases
- Phase 5 (SEO) will add hreflang, canonical, and OG metadata to the Home page — page.tsx is ready for `generateMetadata` addition
- Real carousel images (portada_3 is currently a copy of portada_1) remain an open item per RESEARCH.md open-question #1

---
*Phase: 04-core-pages*
*Completed: 2026-04-18*
