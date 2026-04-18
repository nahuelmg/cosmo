---
phase: 03-layout-shell
plan: 01
subsystem: layout-shell
tags: [next-intl, accessibility, a11y, skip-link, radix-ui, tailwind-v4]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: NextIntlClientProvider, OKLCH design tokens, locale layout scaffold
  - phase: 02-content-layer
    provides: routing.locales ("es" | "en") Locale type pattern
provides:
  - @radix-ui/react-dialog dependency for future mobile nav drawer
  - layout translation namespace (skipToContent, openMenu, closeMenu) in both locales
  - --header-height: 56px design token in globals.css @theme block
  - #main-content rule with scroll-margin-top + outline:none
  - <main id="main-content" tabIndex={-1}> landmark wrapping every page's children
  - SkipLink server component (sr-only default, visible on keyboard focus)
affects: [03-03, 03-04, 03-05, 04-core-pages, 06-a11y-polish]

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-dialog@^1.1.15"
  patterns:
    - "Accessibility skip-link pattern (sr-only default, focus:not-sr-only teleport to fixed top-left)"
    - "Focus target with tabIndex={-1} for keyboard focus movement (not just scroll) on #-anchor activation"
    - "Locale type narrowed from routing.locales in layout components (type Locale = (typeof routing.locales)[number])"
    - "--header-height token as single source of truth for sticky header height / scroll offset"

key-files:
  created:
    - "src/components/layout/SkipLink.tsx"
  modified:
    - "src/app/[locale]/layout.tsx"
    - "src/app/globals.css"
    - "messages/es.json"
    - "messages/en.json"
    - "package.json"
    - "pnpm-lock.yaml"

key-decisions:
  - "--header-height set to 56px to match Tailwind h-14 (14 × 0.25rem × 4) — downstream header plan uses h-14 utility, token prevents drift"
  - "#main-content uses outline:none — tabIndex={-1} focus target relies on content as visual confirmation, not full-page outline"
  - "SkipLink focus indicator via focus:ring-2 focus:ring-accent-ring (box-shadow), honours 01-02 no-border policy"
  - "SkipLink focus:z-[100] sits above the Phase 3 z-index ladder (header z-30, overlay z-40, drawer z-50)"
  - "SkipLink.locale prop narrowed to ('es' | 'en') via routing.locales — plain string rejected getTranslations namespace overload"

patterns-established:
  - "Skip link: first focusable element in <body>, href='#main-content', async server component with getTranslations"
  - "Main landmark: <main id='main-content' tabIndex={-1}> inside NextIntlClientProvider, wrapping {children}"
  - "Layout-scoped translations: messages/{es,en}.json 'layout' namespace for skip link + menu aria-labels"

# Metrics
duration: 4 min
completed: 2026-04-17
---

# Phase 3 Plan 1: Layout-Shell Foundation Summary

**Keyboard-accessible <main id="main-content"> landmark with bilingual SkipLink, --header-height design token, and Radix Dialog installed for the mobile-nav plan.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-18T01:50:51Z
- **Completed:** 2026-04-18T01:54:53Z
- **Tasks:** 3
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- Installed `@radix-ui/react-dialog@^1.1.15` so the Header/MobileNav plan (03-04) can import the focus-trap primitive with zero install lag in its parallel wave.
- Added matching `layout` namespace (`skipToContent`, `openMenu`, `closeMenu`) to `messages/es.json` and `messages/en.json` — every downstream plan is translation-complete from its first commit.
- Added `--header-height: 56px` design token inside the existing `@theme` block in `globals.css`, and attached `scroll-margin-top: var(--header-height); outline: none;` to `#main-content`. Anchor jumps to the landmark now stop below the sticky header rather than behind it.
- Created `src/components/layout/SkipLink.tsx` as a pure async server component. It uses `getTranslations({ locale, namespace: 'layout' })` so the label swaps between "Saltar al contenido principal" and "Skip to main content". Styling is sr-only until focus, then teleports to `focus:fixed focus:top-4 focus:left-4 focus:z-[100]` with a box-shadow focus ring (`focus:ring-2 focus:ring-accent-ring`) — no borders, respects the 01-02 no-border policy.
- Restructured `src/app/[locale]/layout.tsx` so `<SkipLink locale={locale} />` is the first child inside `NextIntlClientProvider` and `<main id="main-content" tabIndex={-1}>` wraps `{children}`. The `hasLocale → notFound → setRequestLocale → render` order (locked in 01-04) is preserved.
- `pnpm typecheck` and `pnpm build` both succeed. `curl http://localhost:3000/es` returns HTML containing `id="main-content"` and "Saltar al contenido principal"; `curl /en` returns "Skip to main content".

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Radix Dialog and add layout.* translations** — `06c9f62` (chore)
2. **Task 2: Add --header-height token and scroll-margin-top in globals.css** — `bc6b2e2` (feat)
3. **Task 3: Create SkipLink and wrap layout children in `<main>`#main-content** — `8c46cbe` (feat)

## Files Created/Modified

- `src/components/layout/SkipLink.tsx` — Server component skip link, sr-only until keyboard focus, targets `#main-content`
- `src/app/[locale]/layout.tsx` — Now imports and renders `<SkipLink>` as first child inside `NextIntlClientProvider`, wraps `{children}` in `<main id="main-content" tabIndex={-1}>`
- `src/app/globals.css` — Added `--header-height: 56px` to the design-token `@theme` block and a `#main-content` rule (`scroll-margin-top`, `outline:none`)
- `messages/es.json` — Added `layout` namespace after `footer` with the three keys
- `messages/en.json` — Added matching `layout` namespace
- `package.json` + `pnpm-lock.yaml` — `@radix-ui/react-dialog` entry under `dependencies`

## Decisions Made

- **`--header-height: 56px`** — chosen to match Tailwind's `h-14` utility (14 × 0.25rem × 4 = 56px). The header plan (03-04) can express the same height with `h-14` without drift from the token; the CSS token is the source of truth for the scroll offset.
- **`outline: none` on `#main-content`** — the native focus ring from `tabIndex={-1}` would draw an outline around the entire page section, which is noisy. The content itself (heading inside `<main>`) is the visual confirmation that focus moved; no ring needed on the landmark.
- **SkipLink focus ring via `focus:ring-2 focus:ring-accent-ring`** — respects the 01-02 no-border policy (focus indicator as box-shadow, never CSS border).
- **SkipLink `focus:z-[100]`** — sits above the Phase 3 z-index ladder (header z-30, mobile overlay z-40, drawer z-50 per RESEARCH.md) so the chip is never occluded.
- **Locale type narrowing via `routing.locales`** — matched the existing pattern in `src/app/[locale]/page.tsx` (`type Locale = (typeof routing.locales)[number]`) instead of importing the content-domain `Locale` type. Keeps layout components free of cross-domain imports.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Narrowed SkipLink's `locale` prop type to `"es" | "en"`**

- **Found during:** Task 3 (Create SkipLink)
- **Issue:** The plan's exemplar code typed `locale: string`. `pnpm typecheck` rejected this at the `getTranslations({ locale, namespace: 'layout' })` call site: the function's namespace-aware overload demands a narrowed literal union (`"es" | "en"`), not a plain `string`.
- **Fix:** Imported `routing` from `@/i18n/routing` and derived `type Locale = (typeof routing.locales)[number]`, then typed `SkipLinkProps.locale: Locale`. This matches the pattern already used in `src/app/[locale]/page.tsx`, so no new convention was introduced. The layout call site passes `locale` obtained from `await params`, which is already narrowed by the `hasLocale(routing.locales, locale)` guard that runs before it.
- **Files modified:** `src/components/layout/SkipLink.tsx`
- **Verification:** `pnpm typecheck` passes (exit 0); `pnpm build` succeeds with SSG for `/es` and `/en`.
- **Committed in:** `8c46cbe` (Task 3 commit — fix inline with the component creation)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for typecheck to pass. No scope creep — used an existing project pattern rather than introducing a new one. All plan artifacts delivered as specified.

## Issues Encountered

None — all tasks completed on first pass after the single blocking deviation above was fixed inline.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Ready for downstream Phase 3 plans:**
- **03-03 (LocaleToggle)** and **03-04 (Header + MobileNav)** can consume `openMenu` / `closeMenu` translation keys and `--header-height` token immediately. Radix Dialog is installed so the mobile drawer can `import * as Dialog from '@radix-ui/react-dialog'` without a package-install step blocking the parallel wave.
- **03-05 (Footer)** can rely on the `<main id="main-content" tabIndex={-1}>` wrapper — the footer will render as a sibling of `<main>` inside `NextIntlClientProvider` (i.e., after `{children}` inside the provider, same nesting level as `<SkipLink>` and `<main>`).
- The HomePage's inner `<main>` in `src/app/[locale]/page.tsx` was intentionally left intact per the plan. Two nested `<main>` elements trigger an a11y warning but not a build failure. The Header plan (03-04) or the Core Pages phase (04) will normalize page wrappers to a non-`<main>` element.

**Groundwork for Phase 3 success criteria:** Success Criterion 5 (skip link present and functional) is now fully met; criteria 1–4 (header/footer layout scaffolding) have the `<main>` landmark and design token they depend on. I18N-01 (layout-level translations) is satisfied for the `layout` namespace.

**No blockers.**

---
*Phase: 03-layout-shell*
*Completed: 2026-04-17*
