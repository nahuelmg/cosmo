---
phase: 03-layout-shell
plan: 03
subsystem: layout-shell
tags: [next-intl, i18n, nav, client-component, suspense, locale-toggle]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: i18n routing with pathnames map (routing.ts) and navigation helpers (Link, usePathname, useRouter from @/i18n/navigation)
  - phase: 01-foundation
    provides: messages/{es,en}.json with nav.* namespace (home/people/research/publications/journalClub/outreach/contact)
provides:
  - NAV_ITEMS single source of truth (7 nav entries, typed href + labelKey unions)
  - NavLink client primitive with active-state styling and aria-current="page"
  - LocaleToggle client primitive with Suspense wrapper, query/param preservation across locale switches
affects: [03-04, 04-core-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nav items declared as readonly + as const for literal-string type inference downstream"
    - "Localized navigation hooks sourced from @/i18n/navigation; raw Next hooks (useParams, useSearchParams) from next/navigation — never mixed"
    - "Suspense boundary wraps any component calling useSearchParams to preserve static rendering"

key-files:
  created:
    - src/components/layout/nav-items.ts
    - src/components/layout/NavLink.tsx
    - src/components/layout/LocaleToggle.tsx
  modified: []

key-decisions:
  - "Import Link/usePathname/useRouter from @/i18n/navigation, not next/navigation — the i18n version returns/accepts internal pathname keys (/research), which is what active-state checks and router.replace both need"
  - "useParams and useSearchParams still come from next/navigation — next-intl does not re-export these and they return raw values that LocaleToggle threads through router.replace"
  - "aria-label strings are inlined (not routed through translations) — the wrapping verb phrase is tiny and the abbreviation itself (ES/EN) is language-agnostic; two extra translation keys would be overkill"
  - "LocaleToggle Suspense fallback is null — the 2-character button's single-paint absence is not a layout-shift concern"
  - "params cast to `any` inside router.replace — useParams returns Record<string, string | string[]> but next-intl's StrictParams is narrower; runtime values are correct, compile-time widening is reconciled with an eslint-disabled cast (documented in RESEARCH.md Open Question #4)"

patterns-established:
  - "NAV_ITEMS pattern: one module, readonly array, literal-union types for href + labelKey — downstream consumers get compile-time safety with zero runtime cost"
  - "NavLink pattern: exact-match for '/', startsWith for everything else — supports sub-routes (/people/[slug]) highlighting their top-level nav entry"
  - "LocaleToggle split pattern: Inner component calls the hooks, outer public component wraps Inner in Suspense — lets useSearchParams stay static-render-safe without polluting the consumer's boundary"
  - "Focus rings via focus-visible:ring-2 focus-visible:ring-accent-ring — box-shadow-based, honours 01-02 no-border policy"

# Metrics
duration: ~10 min
completed: 2026-04-17
---

# Phase 3 Plan 3: Nav Primitives Summary

**Three composable navigation primitives (NAV_ITEMS data module, NavLink active-state client, LocaleToggle Suspense-wrapped locale switcher) that the Plan 04 SiteHeader and MobileNav both consume.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 3/3
- **Files created:** 3
- **Files modified:** 0

## Accomplishments

- Single-source `NAV_ITEMS` array with literal-union typing — future nav-order changes are one-line edits, and downstream `useTranslations('nav')(labelKey)` calls type-check without casts.
- `NavLink` client component that reads `usePathname` from the i18n-aware navigation module — active state works identically on `/es/investigacion` and `/research` because the hook returns the internal key in both cases.
- `LocaleToggle` that correctly preserves dynamic route params (`/people/[slug]`) and query strings (`?year=2025`) across locale swaps, wrapped in `<Suspense>` so `useSearchParams()` does not force the route out of static rendering.
- `pnpm typecheck` and `pnpm build` both green — 5 static pages generated successfully (SSG intact).

## Component APIs

### `NAV_ITEMS` (nav-items.ts)

```ts
export interface NavItem {
  href: '/' | '/people' | '/research' | '/publications' | '/journal-club' | '/outreach' | '/contact';
  labelKey: 'home' | 'people' | 'research' | 'publications' | 'journalClub' | 'outreach' | 'contact';
}
export const NAV_ITEMS: readonly NavItem[];  // 7 entries in the order above
```

Server-safe module (no React imports, no `'use client'`). Used by any consumer — server or client — that needs the nav list.

### `NavLink` (NavLink.tsx, client component)

```ts
interface NavLinkProps {
  href: NavItem['href'];           // type-narrowed: only registered routes
  children: ReactNode;
  className?: string;
  activeClassName?: string;        // layered on top of `active` classes
  onNavigate?: () => void;         // MobileNav uses this to close the drawer
}
```

- Imports `Link` + `usePathname` from `@/i18n/navigation`.
- Active detection: `href === '/'` → exact match; else `pathname.startsWith(href)` (so `/people/ana` lights up the `/people` link).
- Active classes: `text-accent font-semibold`. Inactive: `text-ink-muted hover:text-ink`. Both get `transition-colors`.
- Sets `aria-current="page"` when active.

### `LocaleToggle` (LocaleToggle.tsx, client component)

```ts
interface LocaleToggleProps {
  className?: string;  // pass-through; consumer handles layout positioning
}
```

Public `LocaleToggle` wraps a private `LocaleToggleInner` in `<Suspense fallback={null}>`. Inner component:

- Reads `useLocale()` from `next-intl` → current locale (`'es' | 'en'`).
- Reads `usePathname()`, `useRouter()` from `@/i18n/navigation` → internal pathname + i18n router.
- Reads `useParams()`, `useSearchParams()` from `next/navigation` → dynamic segments + query string.
- On click: builds `query` object from `searchParams.forEach`, calls `router.replace({pathname, params: params as any, query}, {locale: otherLocale})`.
- Button text: `otherLocale.toUpperCase()` (`EN` on `/es`, `ES` on `/en`).
- `aria-label`: Spanish on `/es` (`"Cambiar a EN"`), English on `/en` (`"Switch to ES"`).
- Focus ring via `focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:rounded`.

## Import-Source Convention (Hard Rule for Plan 04 and Beyond)

This is the single correctness trap for the whole layout-shell phase. Mixing these up silently breaks active-state detection and/or route typing:

| Helper                     | Source                     | Why                                                                          |
| -------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `Link`                     | `@/i18n/navigation`        | Rewrites internal `href` to locale-appropriate path at render time.          |
| `usePathname`              | `@/i18n/navigation`        | Returns the **internal** pathname key (`/research`), not `/es/investigacion`. |
| `useRouter`                | `@/i18n/navigation`        | `.replace({pathname, params, query}, {locale})` signature accepts internal keys. |
| `redirect`, `getPathname`  | `@/i18n/navigation`        | Server-side counterparts of the above.                                       |
| `useParams`                | `next/navigation`          | Not re-exported by next-intl; returns raw dynamic segments.                  |
| `useSearchParams`          | `next/navigation`          | Not re-exported by next-intl; must be inside `<Suspense>`.                   |

**Do not** import `usePathname` or `useRouter` from `next/navigation` anywhere in the layout tree. The raw versions return localized paths and accept localized paths — incompatible with both the active-state check in `NavLink` and the `router.replace({pathname: internalKey})` call in `LocaleToggle`.

## Task Commits

1. **Task 1: nav-items.ts** — `b3ec38f` (feat)
2. **Task 2: NavLink.tsx** — `49e2989` (feat)
3. **Task 3: LocaleToggle.tsx** — `07ecd36` (feat)

Plan metadata commit: _pending (follows this SUMMARY)_.

## Files Created/Modified

- `src/components/layout/nav-items.ts` — `NAV_ITEMS` + `NavItem` type (server-safe).
- `src/components/layout/NavLink.tsx` — `'use client'` localized link with active-state styling and optional `onNavigate` callback.
- `src/components/layout/LocaleToggle.tsx` — `'use client'` Suspense-wrapped locale switcher that preserves pathname, dynamic params, and query string.

## Decisions Made

- **Drop `useTranslations` from LocaleToggle.** The plan's original snippet imported it for an `srLabel` dead-code computation; the plan text explicitly instructed "Cleanup the duplicated srLabel logic in the actual implementation." Removing the import keeps the file import-minimal and the bundle slightly smaller. aria-label is computed inline from `locale` + `otherLocale`.
- **Suspense fallback is `null`, not a skeleton.** The toggle is a two-character button; a skeleton would cost more layout-thrash than the missing paint.
- **`params as any` with an eslint-disable comment.** next-intl's `router.replace` types `params` more strictly than `useParams()` returns (narrower string-literal keys vs. `Record<string, string | string[]>`). RESEARCH.md Open Question #4 accepted the cast as a deliberate trade-off because runtime values are always correct and the alternative — rebuilding per-route param types — is significantly more machinery for zero runtime win.

## Deviations from Plan

None — plan executed exactly as written, with one noted cleanup (the dead `srLabel` block the plan itself instructed to remove). No Rule 1/2/3/4 triggers.

## Issues Encountered

None. One early false alarm: the first `pnpm typecheck` run surfaced a pre-existing error in `src/components/layout/SkipLink.tsx` (from the parallel Plan 03-01). The error cleared on a subsequent run after Plan 03-01 landed its fix commit (`8c46cbe`). My three files never contributed to any typecheck error; the full typecheck and build both pass green after all wave-1 plans finished.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready for Plan 04 (SiteHeader + MobileNav).** The three primitives compose exactly as Plan 04 expects:
  - `SiteHeader` imports `NAV_ITEMS` + `NavLink` + `LocaleToggle`, maps `NAV_ITEMS` to `<NavLink href={item.href}>{t(item.labelKey)}</NavLink>`.
  - `MobileNav` imports the same three plus passes `onNavigate={closeDrawer}` to each `NavLink` so taps close the drawer.
- **Import convention is enforced by verification greps.** Plan 04's executor should copy the same grep-based verify: `grep -c "from 'next/navigation'" SiteHeader.tsx` must return 0 for Link/Pathname/Router imports.
- **No blockers.** Wave 2 can proceed as soon as Plans 03-01 and 03-02 are both merged (03-01's `<main id="main-content">` wrap is needed by `SkipLink`; 03-02's EmailLink wrapper is needed by the Footer in Plan 05).

---

_Phase: 03-layout-shell_
_Plan: 03 (Wave 1)_
_Completed: 2026-04-17_
