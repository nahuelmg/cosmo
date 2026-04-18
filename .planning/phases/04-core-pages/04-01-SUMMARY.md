---
phase: 04-core-pages
plan: 01
subsystem: ui
tags: [lucide-react, next-intl, next-image, IntersectionObserver, carousel, i18n, react-hooks]

# Dependency graph
requires:
  - phase: 03-layout-shell
    provides: 'use client' pattern, EmailLink two-file pattern, Tailwind tokens (ink, surface, accent-ring)
  - phase: 02-content-layer
    provides: siteConfig shape (contactEmail, affiliations, satisfies pattern)
  - phase: 01-foundation
    provides: next-intl routing, check-translations CI gate, messages/ structure
provides:
  - lucide-react installed and resolvable (icons available to all Wave-2 page plans)
  - public/Portadas/portada_3.jpg (third carousel image slot populated)
  - siteConfig.address (BilingualString es/en), siteConfig.office (BilingualString), siteConfig.mapQuery (string)
  - messages/es.json and messages/en.json seeded with all 8 Phase-4 namespaces (home, people, research, publications, journalClub, outreach, contact, carousel)
  - src/components/home/HeroCarousel.tsx ('use client', auto-advance, prefers-reduced-motion, pause button)
  - src/components/contact/MapEmbed.tsx ('use client', IntersectionObserver lazy iframe, SSR fallback anchor)
affects:
  - 04-02 (Home page imports HeroCarousel, reads home.* and carousel.* keys)
  - 04-08 (Contact page imports MapEmbed, reads contact.* keys, uses siteConfig.address/office/mapQuery)
  - 04-03 through 04-07 (all read their respective namespace keys from messages/)
  - 05-seo (siteConfig.address feeds Schema.org JSON-LD postal address)

# Tech tracking
tech-stack:
  added: [lucide-react@1.8.0]
  patterns:
    - BilingualString inline interface in site.ts (compile-time only, consistent with existing SocialLink/Affiliation pattern)
    - HeroCarousel timing via setTimeout in useEffect with index/isPaused deps (avoids setInterval drift)
    - MapEmbed IntersectionObserver lazy-mount pattern (SSR-safe, key-less Google Maps embed)
    - Inline SVG glyphs for pause/play (2 glyphs; no lucide dependency, consistent with 03-04 hamburger decision)

key-files:
  created:
    - src/components/home/HeroCarousel.tsx
    - src/components/contact/MapEmbed.tsx
    - public/Portadas/portada_3.jpg
  modified:
    - package.json
    - pnpm-lock.yaml
    - src/config/site.ts
    - messages/es.json
    - messages/en.json

key-decisions:
  - "BilingualString interface declared inline in site.ts (not imported from content schemas) — keeps compile-time-only file filesystem-free"
  - "portada_3.jpg is a deliberate copy of portada_1.jpg placeholder; real image swap deferred to user per RESEARCH.md open-question #1"
  - "HeroCarousel uses setTimeout (not setInterval) to avoid drift; timer restarts on every index change"
  - "visibilitychange handler calls setIndex(i => i) on tab-return to force useEffect re-run without extra state"
  - "MapEmbed fallback anchor is always-rendered (not conditional) — ensures crawlability in prerender"
  - "Pause/play glyphs are inline SVGs (not lucide) — 2 glyphs only; consistent with 03-04 hamburger decision"

patterns-established:
  - "IntersectionObserver lazy-iframe: always render fallback anchor, conditionally mount iframe on intersect"
  - "Carousel timer: useEffect on [index, isPaused, slides.length] deps; clear on cleanup; check matchMedia inside effect"

# Metrics
duration: ~12min
completed: 2026-04-18
---

# Phase 4 Plan 01: Shared Prerequisites Summary

**lucide-react installed, siteConfig extended with address/office/mapQuery, 8 Phase-4 i18n namespaces seeded, HeroCarousel (auto-advance + prefers-reduced-motion) and MapEmbed (IntersectionObserver lazy iframe) delivered as Wave-1 shared leaves**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-18T00:00:00Z
- **Completed:** 2026-04-18T00:12:00Z
- **Tasks:** 3 / 3
- **Files modified:** 7

## Accomplishments

- Installed lucide-react@1.8.0 and verified import path; all 7 Wave-2 page plans can now import icons without install step
- Seeded all 8 Phase-4 UI-copy namespaces into both locale files — `pnpm check-translations` exits 0 with zero missing/invalid keys
- Delivered two 'use client' leaf components: HeroCarousel (WCAG-AA overlay, prefers-reduced-motion, document.hidden pause, explicit pause/play button) and MapEmbed (key-less Google Maps embed, SSR-crawlable fallback, IntersectionObserver lazy mount)

## Namespaces Added (for Wave-2 executor reference)

All keys are identical on both sides. Use these namespace names in `useTranslations(...)` calls:

| Namespace | Top-level keys |
|-----------|----------------|
| `home` | intro, highlightsTitle, highlight1-3 Title+Body, partnersTitle |
| `people` | title, pi, postdoc, phd, undergrad, past, researchInterests, selectedPublications, email, office, orcid, scholar, links, thesis, backToPeople |
| `research` | title, intro |
| `publications` | title, arxiv, doi, preprint |
| `journalClub` | title, intro, upcoming, past, paperLink, noUpcoming |
| `outreach` | title, intro, learnMore |
| `contact` | title, addressLabel, officeLabel, emailLabel, mapTitle, viewOnMaps, social, noSocial |
| `carousel` | controls, pause, play, goToSlide (with `{n}` param) |

## Task Commits

1. **Task 1: Install lucide-react, add portada_3, extend siteConfig** — `e88ce3d` (feat)
2. **Task 2: Seed Phase 4 UI-copy namespaces** — `c007902` (feat)
3. **Task 3: Build HeroCarousel and MapEmbed** — `665733b` (feat)

**Plan metadata:** _(this summary commit)_

## Files Created/Modified

- `package.json` — lucide-react@1.8.0 added to dependencies
- `pnpm-lock.yaml` — lockfile updated
- `public/Portadas/portada_3.jpg` — third carousel slot (deliberate portada_1 copy placeholder)
- `src/config/site.ts` — BilingualString interface + address, office, mapQuery fields added
- `messages/es.json` — 8 Phase-4 namespaces added (all Spanish values)
- `messages/en.json` — 8 Phase-4 namespaces added (all English values)
- `src/components/home/HeroCarousel.tsx` — created
- `src/components/contact/MapEmbed.tsx` — created

## Decisions Made

- **BilingualString inline interface in site.ts:** Keeps the developer-maintained file filesystem-free and compile-time-only, consistent with the existing SocialLink/Affiliation inline type pattern from decision 02-01.
- **portada_3.jpg is a portada_1 copy:** Deliberate placeholder per RESEARCH.md open-question #1; aspect ratio and file format are correct; user swaps the real image independently.
- **setTimeout not setInterval for carousel advance:** Avoids drift; restarted on each index change via useEffect deps.
- **visibilitychange re-triggers effect via setIndex(i => i):** Safe no-op state update forces useEffect re-run without introducing extra state variables.
- **MapEmbed fallback anchor always rendered (not gated on shouldLoad):** Ensures Google Maps link is crawlable in prerendered HTML and functional with JS disabled.
- **Inline SVG pause/play glyphs:** 2 glyphs only; importing lucide for them would be disproportionate; consistent with 03-04 hamburger/X inline SVG decision.

## Deviations from Plan

None — plan executed exactly as written. All implementation choices were pre-specified in the plan's action blocks or derivable from CONTEXT.md/RESEARCH.md decisions already locked.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for this plan. Note: the user will need to replace `public/Portadas/portada_3.jpg` with a real image before public launch (deferred per RESEARCH.md open-question #1).

## Next Phase Readiness

Wave-2 plans (04-02 through 04-08) may now proceed in full parallel:
- `import HeroCarousel from '@/components/home/HeroCarousel'` — ready
- `import MapEmbed from '@/components/contact/MapEmbed'` — ready
- `import { Atom, Waves, Sparkles, Cpu } from 'lucide-react'` — ready
- `siteConfig.address`, `siteConfig.office`, `siteConfig.mapQuery` — ready
- All 8 Phase-4 namespaces in both locale files — ready

No blockers. `pnpm install && pnpm tsc --noEmit && pnpm check-translations` all exit 0.

---
*Phase: 04-core-pages*
*Completed: 2026-04-18*
