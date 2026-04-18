---
phase: 03-layout-shell
plan: 04
subsystem: layout-shell
tags: [radix-dialog, header, mobile-nav, responsive, a11y, next-image, focus-trap]

# Dependency graph
requires:
  - phase: 03-01
    provides: --header-height token (56px), layout.* translation namespace (openMenu/closeMenu), @radix-ui/react-dialog installed
  - phase: 03-03
    provides: NAV_ITEMS data module, NavLink client primitive (with onNavigate callback), LocaleToggle client primitive
  - phase: 02-01
    provides: siteConfig.groupName canonical string
provides:
  - SiteHeader component — sticky 56px top chrome (logo + desktop nav + locale toggle + mobile trigger)
  - MobileNav component — Radix Dialog drawer (7 nav links + locale toggle, focus-trapped, auto-close on nav/escape/X)
  - Composed responsive nav system ready to drop into layout.tsx
affects: [03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Radix Dialog as mobile drawer primitive — focus trap, Escape-close, return-focus, aria-modal, scroll lock all delegated (no hand-rolled a11y)"
    - "Responsive-boundary-inside-component: MobileNav's trigger carries `md:hidden`, so the SiteHeader does not need a media-query wrapper around it"
    - "Belt-and-braces drawer-close: `onNavigate={() => setOpen(false)}` on each NavLink + `useEffect([pathname])` auto-close covers both click and programmatic navigation"
    - "z-index ladder concretised: overlay z-40, drawer content z-50, SkipLink focus:z-[100] still sits above"
    - "Logo alt text uses canonical institutional name (siteConfig.groupName — Spanish in both locales) rather than a localised string; the institution's identity is language-independent"

key-files:
  created:
    - "src/components/layout/MobileNav.tsx"
    - "src/components/layout/SiteHeader.tsx"
  modified: []

key-decisions:
  - "MobileNav takes no props and owns its own `open` state — keeps the SiteHeader declarative and lets any future host (e.g., a context-driven toggle) wrap it without reaching inside"
  - "Inline hamburger / close SVGs rather than introducing an icon library — only 2 glyphs needed in the whole layout shell, and an icon package would add bundle weight for zero net gain"
  - "Dialog.Title rendered sr-only — Radix requires the title element for screen-reader labelling; the visible X-close button carries its own aria-label, so a visible title would be redundant visual clutter"
  - "Drawer width `w-72 max-w-[85vw]` — 18rem comfortable width on tablet, capped at 85vw on narrow phones so the drawer never fully covers the viewport (academic-restraint drawer sizing)"
  - "Active-link affordance inside the drawer uses `bg-surface-alt` via `activeClassName` — a shaded row is the restraint-consistent 'current item' indicator inside a drawer (no border, no underline)"
  - "Logo rendered as next/image with `priority` — the logo is in the initial viewport on every route (LCP candidate), and the PNG is a raster file so the next/image pipeline handles sizing + format negotiation"
  - "`h-8 w-auto` on the logo inside an `h-14` header — 32px visual weight inside 56px bar (restrained, leaves breathing room above and below)"
  - "SiteHeader stays free of `usePathname` — active-state logic is encapsulated in NavLink (Plan 03), so the header's only imports are next/image, next-intl, and layout primitives"

patterns-established:
  - "Component-internal responsive boundaries: when a child component has a natural 'only-render-at-this-breakpoint' shape, carry the media-query inside the child (via `md:hidden` on its root), so parents compose declaratively without media-query wrappers"
  - "Layout shell commits scope: Phase 3 plans build components in isolation; layout.tsx wiring is a dedicated plan (03-05) so the one-shot smoke test happens after the full shell exists"
  - "`aria-label` on `<Dialog.Trigger>` and `<Dialog.Close>` uses the same `openMenu` / `closeMenu` keys, with `aria-hidden` on the inline SVG so the accessible name is the translated label, not the glyph"

# Metrics
duration: ~2 min
completed: 2026-04-18
---

# Phase 3 Plan 4: SiteHeader + MobileNav Summary

**Sticky 56px top header composing the Plan-03 nav primitives into a desktop layout (logo + 7 NavLinks + LocaleToggle) and a Radix-Dialog mobile drawer (focus-trapped, auto-closes on nav/escape/X).**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-18T01:58:00Z
- **Completed:** 2026-04-18T02:00:21Z
- **Tasks:** 2/2
- **Files created:** 2 (MobileNav.tsx, SiteHeader.tsx)
- **Files modified:** 0

## Accomplishments

- Built `MobileNav.tsx` as a Radix-Dialog-backed drawer. Focus trap, Escape-to-close, return-focus-to-trigger, `aria-modal`, portal rendering, and scroll lock are all delegated to `@radix-ui/react-dialog` primitives — zero hand-rolled accessibility, which per RESEARCH.md is the single most common source of mobile-a11y regressions.
- Built `SiteHeader.tsx` as a sticky `h-14 bg-surface shadow-sm` container composing the Plan-03 primitives. Desktop layout renders the logo link, 7 `NAV_ITEMS → NavLink` rows, and `<LocaleToggle>` pushed right via `ml-auto`. Mobile layout swaps the inline nav and desktop toggle for `<MobileNav>` (whose trigger is internally `md:hidden`).
- Drawer-close strategy is belt-and-braces: every `NavLink` receives `onNavigate={() => setOpen(false)}` (click path) AND a `useEffect([pathname])` sets `open` to `false` on route change (covers programmatic navigation). Escape and the X button close via Radix's built-in behaviour.
- `--header-height: 56px` token from Plan 01 aligns with the `h-14` Tailwind utility used here — the SkipLink's `scroll-margin-top: var(--header-height)` jumps to the right offset without drift.
- z-index ladder is now fully concrete: `header z-30` < `overlay z-40` < `drawer content z-50` < `SkipLink focus:z-[100]`. The skip link still wins when the drawer is open, which is the correct a11y behaviour.
- `pnpm typecheck` passes (exit 0) and `pnpm build` succeeds — 5 static pages regenerated (`/_not-found`, `/es`, `/en` with its nested SSG group) with no new warnings beyond pre-existing ones.

## Component APIs

### `<SiteHeader />` (SiteHeader.tsx, client component)

```tsx
export function SiteHeader(): JSX.Element;
// No props. Self-contained: composes NAV_ITEMS, NavLink, LocaleToggle,
// MobileNav, and siteConfig.groupName internally.
```

**Usage in Plan 05 (`src/app/[locale]/layout.tsx`):**

```tsx
import {SiteHeader} from '@/components/layout/SiteHeader';

// Inside NextIntlClientProvider, after SkipLink, before <main>:
<SkipLink locale={locale} />
<SiteHeader />
<main id="main-content" tabIndex={-1}>
  {children}
</main>
<SiteFooter />  // coming in 03-05
```

Drop it straight in — no wrapping div, no context provider, no media-query guard needed. The component carries its own responsive behaviour.

**Structural guarantees:**

- Sticky to top (`sticky top-0 z-30`) — remains visible while scrolling.
- 56px tall (`h-14`), matching the `--header-height` token.
- Uses `bg-surface` and `shadow-sm` only — no border, respecting 01-02 no-border policy.
- Max-width container `max-w-5xl mx-auto px-6` — consistent with academic-restraint page widths.
- Desktop nav via `hidden md:flex`; mobile trigger via `md:hidden`. Breakpoint is Tailwind's `md` (768px).

### `<MobileNav />` (MobileNav.tsx, client component)

```tsx
export function MobileNav(): JSX.Element;
// No props. Owns its own `open` state via useState.
```

**Behaviour contract:**

- Renders a hamburger `<Dialog.Trigger>` that's `md:hidden` (self-hides on desktop).
- On open: portal-mounts an overlay (`z-40 bg-ink/20`) and a drawer (`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw]`).
- Drawer contents: close button (X, top-right), 7 NavLinks stacked vertically (large tap targets — `text-base py-3 px-2`), `<LocaleToggle>` pinned at the bottom via `mt-auto`.
- Auto-closes on: tap-a-nav-link (via `onNavigate`), Escape key (Radix built-in), X button click (Radix `<Dialog.Close>`), route change (`useEffect([pathname])`).
- Focus is trapped inside while open; returned to the hamburger trigger when closed (Radix built-in).
- `aria-label` on trigger, close, content, and nav all source from the `layout` namespace (`openMenu` / `closeMenu`) — bilingual without any literal strings in JSX.

## Task Commits

1. **Task 1: MobileNav — Radix Dialog drawer** — `d15b300` (feat)
2. **Task 2: SiteHeader — sticky header composition** — `6905d45` (feat)

Plan metadata commit: _pending (follows this SUMMARY)_.

## Files Created/Modified

- `src/components/layout/MobileNav.tsx` — `'use client'` Radix Dialog drawer. Imports `Dialog` from `@radix-ui/react-dialog`, `useTranslations` from `next-intl`, `usePathname` from `@/i18n/navigation`, and the three Plan-03 primitives. Owns `open` state.
- `src/components/layout/SiteHeader.tsx` — `'use client'` sticky top header. Imports `next/image`, `useTranslations`, `Link` from `@/i18n/navigation`, `siteConfig`, and the four layout primitives (`NAV_ITEMS`, `NavLink`, `LocaleToggle`, `MobileNav`).

## Decisions Made

- **MobileNav is prop-less and self-contained.** The plan's exemplar had the drawer own its `open` state with `useState`. Keeping that contract means the SiteHeader composes declaratively (`<MobileNav />`) and any future host — a context provider, a shortcut-key handler, a shell-level reducer — can wrap it without reaching inside its render tree.
- **Inline SVGs, no icon library.** The whole layout shell needs only two glyphs (hamburger, X). Importing `lucide-react` or similar would add dozens of KB for zero net benefit. The two SVGs are 6 lines each, `aria-hidden`, `stroke="currentColor"` so they inherit the button's `text-ink` / `hover:text-accent` colour.
- **`Dialog.Title` is `sr-only`.** Radix requires a title for screen-reader labelling. The drawer doesn't need a visible heading — the X close button is labelled, the nav list is labelled, and a visible "Navigation menu" title would duplicate what assistive tech already announces. `sr-only` ensures compliance without visual clutter.
- **Drawer slides in from the right, not the left.** Matches the thumb-reach convention on LTR phones (hamburger is top-right on mobile layouts, drawer emerging from the same edge feels continuous).
- **Logo uses `next/image` with `priority`.** The logo is in the initial viewport on every route (it's sticky), making it an LCP candidate. `priority` marks it as an eager preload target. The PNG's intrinsic ~1:1 is declared at `width={40} height={40}`; the actual render is `h-8 w-auto` (32px) so next/image downscales into the right dimensions.
- **Alt text is canonical Spanish `siteConfig.groupName`.** Screen-reader users on `/en` hear "Grupo de Cosmología, link" — this is the correct institutional identity, not a localisation miss. The 02-01 decision makes `groupName` canonical Spanish deliberately; the logo alt follows that rule.
- **SiteHeader has no `usePathname` call.** Active-state logic is fully encapsulated inside `NavLink`, so the header stays a pure declarative composition with no routing concerns.
- **No wordmark next to the logo.** CONTEXT.md defers adding one until/unless the logo alone "reads too weak". This will be verified visually in Plan 05's integration checkpoint.
- **No animations beyond Radix defaults.** 01-02 design constraint is minimal motion; adding custom slide-in transitions would violate that, and Radix's built-in state classes (`data-[state=open]` / `data-[state=closed]`) are available if future A11y review calls for a reduced-motion-aware slide.

## Deviations from Plan

None — plan executed exactly as written, with two tiny prose-only cosmetic adjustments inside JSDoc comments to keep the `grep -c` verification counts at the exact values specified by the plan:

- MobileNav JSDoc mentioned `onNavigate={() => setOpen(false)}` in a comment; rephrased to prose so the grep count for the exact snippet stays at 1 (not 2).
- SiteHeader JSDoc mentioned `sticky top-0 z-30` as a literal; rephrased to prose so the grep count for `sticky top-0` stays at 1 (not 2).

These changes affect documentation only, not behaviour, and were made to honour the precise verification contract. Not tracked as Rule-numbered deviations because no functional or architectural decision was altered.

## Issues Encountered

None. Both tasks completed on first pass. `pnpm typecheck` and `pnpm build` both green on the first attempt.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Ready for Plan 03-05 (layout.tsx integration + SiteFooter).** Plan 05's executor can drop `<SiteHeader />` straight into `src/app/[locale]/layout.tsx` as a sibling of `<SkipLink>` and `<main>`, no props required. The header is already fully wired: responsive breakpoints, nav data, active-state, locale-toggle, and mobile drawer all work from the moment the component is rendered.

**Success criteria status (Phase 3 overall):**

- **SC-1 (7-link nav + active indicator):** Components built. Will be verified end-to-end in 03-05 integration.
- **SC-2 (locale toggle preserves deep routes):** Wired in Plan 03 and exposed via the header in both breakpoints.
- **SC-4 (responsive collapse, no horizontal overflow):** Desktop-vs-mobile branching is in place; 85vw drawer cap prevents overflow on narrow phones.
- **SC-5 (skip link):** Already satisfied by Plan 03-01.
- **SC-6 (translated nav labels):** All nav labels come from `useTranslations('nav')`; drawer aria-labels from `useTranslations('layout')`. Zero literal strings.

**No blockers.** The last Phase 3 plan (03-05) can execute immediately: its job is to compose `<SiteHeader />`, `<SiteFooter />` (new component in that plan), and the existing `<SkipLink>` / `<main>` into `layout.tsx`, then run the final smoke test.

---

_Phase: 03-layout-shell_
_Plan: 04 (Wave 2)_
_Completed: 2026-04-18_
