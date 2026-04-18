---
phase: 03-layout-shell
verified: 2026-04-17T00:00:00Z
status: passed
score: 6/6 success criteria verified (SC-4 deferred-verified by construction)
requirements_covered:
  - id: NAV-01
    status: satisfied
  - id: NAV-02
    status: satisfied
  - id: NAV-03
    status: satisfied
  - id: NAV-04
    status: satisfied_by_construction
    note: "Runtime mobile-viewport verification deferred to live Vercel deploy; codebase structure is correct (Radix Dialog drawer + SiteHeader `hidden md:flex` / `md:hidden` responsive toggles)."
  - id: NAV-05
    status: satisfied
  - id: I18N-01
    status: satisfied
  - id: I18N-04
    status: satisfied
deferred_human_verification:
  - test: "Mobile drawer — 375px viewport, open/close/Escape/return-focus, no horizontal overflow"
    expected: "Hamburger trigger visible < md; inline nav hidden. Drawer opens with focus trapped; Escape closes and returns focus to trigger. No horizontal page overflow at 375px."
    why_human: "Local devtools responsive mode is unreliable for real touch and iOS Safari quirks (per 03-05 SUMMARY). Radix primitives provide focus trap / Escape / return-focus / aria-modal / scroll-lock by construction, so structural risk is low — verification deferred to live Vercel deploy (Phase 6 or earlier)."
  - test: "Active-route marker on dynamic segments (/people/[slug], /publications?year=2025)"
    expected: "NavLink for People stays active on /people/[slug]; NavLink for Publications stays active on a query-filtered URL."
    why_human: "Dynamic routes don't exist yet (Phase 4). NavLink implementation uses startsWith semantics which is correct by construction, but end-to-end confirmation must wait for Phase 4 pages."
---

# Phase 3: Layout Shell Verification Report

**Phase Goal (ROADMAP.md:75):** "Every page inherits a header with a working language toggle, a footer with institutional identity, and shared chrome (skip link, EmailLink) — ready to wrap the core pages."

**Verified:** 2026-04-17
**Status:** passed
**Re-verification:** No — initial verification.
**Verification method:** Structural inspection of source + prerendered `.next/server/app/{es,en}.html` from the most recent `pnpm build`.

## Goal Achievement

The phase goal is met. Every route in both locales inherits the complete shell: keyboard-revealed SkipLink, sticky SiteHeader with 7 localised NavLinks + working LocaleToggle (desktop) / MobileNav (mobile trigger), `<main id="main-content" tabIndex={-1} class="flex-1">` landmark, and institutional SiteFooter. The single most load-bearing Phase 3 gate — zero `mailto:` literal in prerendered HTML (NAV-03) — is verified directly against built output.

### Observable Truths (per ROADMAP.md:81–87 Success Criteria)

| # | Truth (Success Criterion)                                                                                                                                           | Status                | Evidence                                                                                                                                                                                                                                                                                                                                                                           |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Seven-link nav renders in both locales with active-route marker (NAV-01)                                                                                            | PASSED                | `nav-items.ts:19-27` exports exactly 7 items (home, people, research, publications, journal-club, outreach, contact). `SiteHeader.tsx:90-94` maps NAV_ITEMS into NavLinks. `NavLink.tsx:43-62` computes `isActive` (exact `/` / `startsWith` for others) and emits `aria-current="page"`. Prerendered HTML contains all 7 Spanish labels (es.html) and all 7 English labels (en.html); `aria-current="page"` appears in both locale HTMLs. |
| 2 | Locale toggle switches locales while preserving path + query params (NAV-02, I18N-04)                                                                               | PASSED                | `LocaleToggle.tsx:50-82` reads `usePathname()` + `useParams()` (stale-locale stripped line 72-73) + `useSearchParams()` (query dict built line 63-66) and forwards all three to `router.replace({pathname, params: restParams, query}, {locale: otherLocale})`. `useTransition` + `disabled={isPending}` (line 58, 75-81, 88-89) prevents double-click races. Human-verify in 03-05 confirmed the fix on `/es?debug=yes` → `/en?debug=yes`. Deep-route (`/people/[slug]`) is by construction — flagged for Phase 4 re-verification. |
| 3 | Footer renders group name, UBA/FCEN/CONICET affiliations, contact email via `<EmailLink>` (no raw `mailto:` in HTML), social links (NAV-03)                         | PASSED                | `SiteFooter.tsx:69-77` renders `siteConfig.groupName` h2 + three `footer.affiliation*` translations. `SiteFooter.tsx:47, 81-89` splits `siteConfig.contactEmail` on `@` and passes `user`/`domain` to `<EmailLink>`. `EmailLink.tsx:26-29` uses `dynamic(..., {ssr:false})`; `EmailLinkInner.tsx:26` assembles href via `['mai','lto'].join('')`. Empty `socialLinks` guarded at `SiteFooter.tsx:91` — renders nothing (academic restraint). **Verified against built output:** `grep -r 'mailto:' .next/server/app` → no matches; `grep -r 'cosmologia@df.uba.ar' .next/server/app` → 8 files, only as split `user`/`domain` RSC props (e.g. `\"user\":\"cosmologia\",\"domain\":\"df.uba.ar\"`), never as a concatenated URI. |
| 4 | Mobile viewport: nav collapses to menu, no horizontal overflow; desktop shows full nav (NAV-04)                                                                     | PASSED_BY_CONSTRUCTION | Desktop portion verified: `SiteHeader.tsx:88` inline `<nav>` carries `hidden md:flex`; `SiteHeader.tsx:98` locale toggle wrapper carries `hidden md:flex ml-auto`; `SiteHeader.tsx:103` mobile trigger wrapper carries `md:hidden ml-auto`. `MobileNav.tsx` uses Radix Dialog (`Dialog.Root/Trigger/Portal/Overlay/Content`) with `Dialog.Trigger` carrying `md:hidden` (line 46), providing focus trap, Escape-to-close, return-focus-to-trigger, aria-modal, scroll-lock by construction. Narrow-viewport runtime verification (touch events, iOS Safari, no horizontal overflow at 375px) **deferred to live Vercel deploy** per 03-05 SUMMARY:234 — deliberate deferral with low risk because Radix primitives handle all a11y-critical behaviours. |
| 5 | Tab-first skip link reveals "Skip to content" that focuses the main landmark (NAV-05)                                                                               | PASSED                | `SkipLink.tsx:32-49` renders `<a href="#main-content">` with `sr-only focus:not-sr-only` + `focus:fixed focus:top-4 focus:left-4 focus:z-[100]` — visually hidden until keyboard focus. `layout.tsx:52-54` places SkipLink as first child inside `<body>` so Tab reaches it first; `<main id="main-content" tabIndex={-1} className="flex-1">` receives focus (not just scroll) because `tabIndex={-1}` enables programmatic focus. `globals.css:76-79` sets `#main-content { scroll-margin-top: var(--header-height); outline: none; }` so the 56px sticky header doesn't cover the target. Prerendered HTML confirms landmark markup: `<main ... id="main-content" tabindex="-1" class="flex-1">`. Human-verify in 03-05 step 3 confirmed focus movement, not just scroll. |
| 6 | Nav labels, mobile menu toggle, locale toggle, footer microcopy translate in both locales (I18N-01)                                                                 | PASSED                | `messages/es.json` + `messages/en.json` both contain `layout.{skipToContent, openMenu, closeMenu}`, `nav.{home,people,research,publications,journalClub,outreach,contact}`, and `footer.{affiliationUba, affiliationFcen, affiliationConicet, copyright}` with matching keys. `es.html` contains "Saltar al contenido principal", "Abrir menú de navegación", and all Spanish nav labels; `en.html` contains "Skip to main content", "Open navigation menu", and all English nav labels. Locale-toggle button label is produced dynamically from `locale === 'es' ? 'Cambiar a EN' : 'Switch to ES'` (LocaleToggle.tsx:90-94) — bilingual by construction. |

**Score:** 6/6 success criteria verified (SC-4 by construction with deferred runtime test).

### Required Artifacts

| Artifact                                      | Expected                                             | Level 1 Exists | Level 2 Substantive                   | Level 3 Wired                                                              | Status     |
| --------------------------------------------- | ---------------------------------------------------- | -------------- | ------------------------------------- | -------------------------------------------------------------------------- | ---------- |
| `src/components/layout/SkipLink.tsx`          | Server component, focusable skip link                | EXISTS (51 lines) | SUBSTANTIVE (async server, real JSX, no stubs) | WIRED — imported by `layout.tsx:7` and rendered line 52                  | VERIFIED   |
| `src/components/layout/nav-items.ts`          | NAV_ITEMS registry, 7 entries                        | EXISTS (27 lines) | SUBSTANTIVE (exports typed NavItem + NAV_ITEMS array) | WIRED — imported by `SiteHeader.tsx:7` and `MobileNav.tsx:7`             | VERIFIED   |
| `src/components/layout/NavLink.tsx`           | Client NavLink with active state, i18n-aware path    | EXISTS (67 lines) | SUBSTANTIVE (uses `@/i18n/navigation` Link + usePathname, emits aria-current) | WIRED — imported by SiteHeader + MobileNav                               | VERIFIED   |
| `src/components/layout/LocaleToggle.tsx`      | Suspense-wrapped toggle preserving path + query      | EXISTS (128 lines) | SUBSTANTIVE (stale-locale strip + useTransition guard + query preservation + Suspense wrapper) | WIRED — imported by SiteHeader + MobileNav                               | VERIFIED   |
| `src/components/layout/SiteHeader.tsx`        | Sticky header: logo + 7 NavLinks + LocaleToggle + MobileNav trigger | EXISTS (109 lines) | SUBSTANTIVE (renders Image, maps NAV_ITEMS, composes desktop/mobile surfaces) | WIRED — imported by `layout.tsx:8` and rendered line 53                  | VERIFIED   |
| `src/components/layout/MobileNav.tsx`         | Radix Dialog drawer with NavLinks + LocaleToggle     | EXISTS (145 lines) | SUBSTANTIVE (Dialog.Root/Trigger/Portal/Overlay/Content/Title/Close + NavLinks map) | WIRED — imported by SiteHeader                                           | VERIFIED   |
| `src/components/layout/SiteFooter.tsx`        | Server footer with identity + EmailLink + social guard | EXISTS (122 lines) | SUBSTANTIVE (getTranslations server call, EmailLink, social-list guard, copyright ICU) | WIRED — imported by `layout.tsx:9` and rendered line 57                  | VERIFIED   |
| `src/components/ui/EmailLink.tsx`             | 'use client' wrapper over dynamic(ssr:false) inner   | EXISTS (33 lines) | SUBSTANTIVE (dynamic import + ssr:false; 'use client' directive for Next.js 16) | WIRED — imported by SiteFooter                                           | VERIFIED   |
| `src/components/ui/EmailLinkInner.tsx`        | Client-only anchor assembling href via array join   | EXISTS (33 lines) | SUBSTANTIVE (array-join href assembly; no literal message-scheme) | WIRED — dynamically imported by EmailLink wrapper                        | VERIFIED   |
| `src/app/[locale]/layout.tsx`                 | Composes SkipLink → SiteHeader → main → SiteFooter inside flex-col body | EXISTS (62 lines) | SUBSTANTIVE (hasLocale guard, setRequestLocale, NextIntlClientProvider wrapping, full chrome composition) | WIRED — imported by Next.js App Router for every `/[locale]/*` route     | VERIFIED   |
| `src/app/[locale]/page.tsx`                   | No inner `<main>` (landmark owned by layout)          | EXISTS (49 lines) | SUBSTANTIVE (renders `<section>` only; verified no `<main>` tag)         | WIRED — served as `/`                                                   | VERIFIED   |
| `src/app/globals.css` tokens                  | `--header-height: 56px` + `#main-content` scroll-margin | EXISTS (globals.css:50, 76-79) | SUBSTANTIVE                          | WIRED — matches SiteHeader `h-14` (56px) and aligns skip-link target     | VERIFIED   |
| `public/logo_cosmo.png`                       | Logo asset referenced by SiteHeader                  | EXISTS (1287 bytes) | SUBSTANTIVE (real PNG, not placeholder) | WIRED — referenced `SiteHeader.tsx:76`                                    | VERIFIED   |
| `src/config/site.ts` (SocialLink + siteConfig) | Exports SocialLink type + siteConfig.{groupName,contactEmail,socialLinks} | EXISTS (74 lines) | SUBSTANTIVE (typed, canonical data) | WIRED — imported by SiteHeader + SiteFooter                              | VERIFIED   |
| `messages/{es,en}.json` keys                  | `layout.{skipToContent, openMenu, closeMenu}` + `nav.*` + `footer.*` | EXISTS, keys match across locales | SUBSTANTIVE (real copy both locales) | WIRED — consumed via `getTranslations` / `useTranslations`                | VERIFIED   |

### Key Link Verification

| From                                  | To                                                        | Via                                                                     | Status   | Evidence                                                                                                                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.tsx`                          | `SkipLink` → `SiteHeader` → `<main>` → `SiteFooter`        | Sequential JSX inside `<NextIntlClientProvider>`                         | WIRED    | `layout.tsx:51-58`                                                                                                                                                                                                            |
| `SiteHeader`                          | `NAV_ITEMS` → 7 `<NavLink>` on desktop                     | `.map()` in `hidden md:flex` nav                                         | WIRED    | `SiteHeader.tsx:88-95`                                                                                                                                                                                                        |
| `SiteHeader`                          | `<MobileNav>` on mobile                                    | `<div className="md:hidden ml-auto"><MobileNav /></div>`                 | WIRED    | `SiteHeader.tsx:102-105`                                                                                                                                                                                                      |
| `MobileNav`                           | `NAV_ITEMS` → 7 `<NavLink>` inside Radix Dialog drawer     | `.map()` in `<Dialog.Content>`                                            | WIRED    | `MobileNav.tsx:124-136`                                                                                                                                                                                                       |
| `LocaleToggle`                        | `router.replace({pathname, params, query}, {locale})`      | `useTransition` + `router.replace` with stripped stale locale param      | WIRED    | `LocaleToggle.tsx:56-82`                                                                                                                                                                                                      |
| `SiteFooter`                          | `<EmailLink user domain>`                                  | `siteConfig.contactEmail.split('@')` → user + domain props               | WIRED    | `SiteFooter.tsx:47, 81-89`                                                                                                                                                                                                    |
| `EmailLink` (client wrapper)          | `EmailLinkInner` (dynamic import, ssr:false)              | `dynamic(() => import('./EmailLinkInner').then(m => m.EmailLinkInner), {ssr:false})` | WIRED    | `EmailLink.tsx:26-33`                                                                                                                                                                                                         |
| Built output                          | Zero `mailto:` literal in prerendered HTML (NAV-03 gate)   | Grep of `.next/server/app` for `mailto:`                                 | VERIFIED | `grep -r 'mailto:' .next/server/app` → 0 matches. Static chunk `088sb.0x.t8ad.js` contains the token (inside client-side EmailLinkInner bundle) — expected and correct, because it's the post-hydration assembly site.      |
| `<main>` target                       | SkipLink `href="#main-content"` → `<main id="main-content" tabIndex={-1}>` | Element id + `tabIndex={-1}` enabling programmatic focus movement         | WIRED    | `SkipLink.tsx:33` → `layout.tsx:54`; `globals.css:76-79` sets `scroll-margin-top: var(--header-height)` so header doesn't cover focus target                                                                                 |

### Requirements Coverage

| Requirement | Status                  | Supporting Truths | Evidence / Notes                                                                                                                                                     |
| ----------- | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAV-01      | SATISFIED               | Truth 1           | 7 NavLinks in both locales; `aria-current="page"` emitted; active-style classes applied in `NavLink.tsx:43-48`.                                                     |
| NAV-02      | SATISFIED               | Truth 2           | `LocaleToggle` threads pathname + stripped params + query through `router.replace` with `{locale: otherLocale}` option; verified by human-verify on `?debug=yes`.   |
| NAV-03      | SATISFIED               | Truth 3           | **Gate passed.** Footer identity + `<EmailLink>` + zero `mailto:` in `.next/server/app/{es,en}.html` + split-on-`@` pattern. |
| NAV-04      | SATISFIED_BY_CONSTRUCTION | Truth 4           | Desktop responsive toggles verified (`hidden md:flex` / `md:hidden`). Runtime mobile verification deferred per 03-05 SUMMARY — Radix primitives provide a11y-critical behaviours by construction. |
| NAV-05      | SATISFIED               | Truth 5           | SkipLink is first focusable, focus-reveals, anchors to `#main-content`, landmark has `tabIndex={-1}`, header-offset via `scroll-margin-top`.                         |
| I18N-01     | SATISFIED               | Truth 6           | All nav labels + mobile menu toggle + locale-toggle aria-label + footer microcopy render translated; `messages/{es,en}.json` keys aligned.                           |
| I18N-04     | SATISFIED               | Truth 2           | Query params preserved via `useSearchParams()` iteration into a dict and forwarded as `query` option; deep-route parameter preservation is by construction.          |

### Anti-Patterns Found

No blocker anti-patterns. Known non-blocker findings (pre-documented, carried forward):

| File                                    | Line | Pattern                                                                            | Severity | Impact                                                                                                                                                                                                                            |
| --------------------------------------- | ---- | ---------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/layout/MobileNav.tsx`   | 37-39 | `react-hooks/set-state-in-effect` lint finding on `useEffect([pathname]) → setOpen(false)` | Info     | Pre-existing (shipped in 03-04), does not block build/runtime. Explicitly documented in 03-05 SUMMARY:235. Belt-and-braces drawer-autoclose on programmatic navigation; NavLink's `onNavigate` handles the click path already.   |

### Human Verification Required

Two items are structurally verified but carry deferred runtime confirmation:

#### 1. Mobile drawer at real 375px viewport (Radix Dialog runtime)

- **Test:** Open site on a real mobile device or 375px viewport; tap hamburger; verify drawer opens with focus trapped, Escape closes, tap outside closes, return-focus lands on trigger; scroll page and verify no horizontal overflow.
- **Expected:** All behaviours pass. Inline nav and desktop locale toggle are hidden; only hamburger trigger visible in header.
- **Why human:** Local devtools responsive mode is unreliable for touch events and iOS Safari. Radix Dialog provides focus trap / Escape / return-focus / aria-modal / scroll-lock by construction — deferred to live Vercel deploy per 03-05 SUMMARY:234.

#### 2. Active-route NavLink on dynamic segments (post-Phase 4)

- **Test:** Once Phase 4 ships `/people/[slug]` and `/publications?year=2025`, visit each and confirm the corresponding top-level NavLink remains highlighted.
- **Expected:** People NavLink highlighted on `/people/[slug]`; Publications NavLink highlighted on `/publications?year=2025`.
- **Why human:** Dynamic routes don't exist yet. NavLink's `startsWith` semantics + i18n-aware `usePathname` is correct by construction; end-to-end confirmation must wait for Phase 4.

### Gaps Summary

None. All six Phase 3 success criteria are satisfied, with SC-4 (mobile collapse) marked passed-by-construction plus explicit deferred-verification against the live deployment — a deliberate, low-risk deferral backed by Radix Dialog primitives and documented in the 03-05 SUMMARY.

The most load-bearing assertion of the phase — NAV-03 zero-mailto in prerendered HTML — is verified directly against the built output in `.next/server/app/{es,en}.html` in addition to source-level review.

---

_Verified: 2026-04-17_
_Verifier: Claude (gsd-verifier)_
