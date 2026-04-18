---
phase: 03-layout-shell
plan: 05
subsystem: layout-shell
tags: [layout, footer, next-intl, email-obfuscation, static-rendering, locale-toggle, radix-dialog, a11y, press-feedback]

# Dependency graph
requires:
  - phase: 03-01
    provides: --header-height token, <SkipLink>, <main id="main-content" tabIndex={-1}> landmark target, `layout` translation namespace
  - phase: 03-02
    provides: <EmailLink> — 'use client' wrapper around `dynamic(() => EmailLinkInner, {ssr: false})`; prerendered HTML emits no message-scheme literal
  - phase: 03-03
    provides: NAV_ITEMS, <NavLink>, <LocaleToggle> nav primitives
  - phase: 03-04
    provides: <SiteHeader> (sticky header composing logo + nav + locale toggle + mobile drawer trigger), <MobileNav> (Radix Dialog drawer)
  - phase: 02-01
    provides: siteConfig.groupName, siteConfig.contactEmail, siteConfig.socialLinks, exported SocialLink interface
provides:
  - SiteFooter component — server component rendering institutional identity, translated affiliations, <EmailLink>, guarded social-links list, year-interpolated copyright
  - Fully composed [locale]/layout.tsx — SkipLink → SiteHeader → <main id="main-content" tabIndex={-1} className="flex-1"> → SiteFooter inside a `min-h-screen flex flex-col` body
  - Confirmed NAV-03 guarantee end-to-end: `curl -s http://localhost:3000/{es,en} | grep -c 'mailto:'` returns 0 on both locales
  - Gap-closure fixes: LocaleToggle no longer forwards a stale `locale` key through `router.replace` and guards against rapid double-clicks via `useTransition`
  - Press-feedback baseline (`active:scale-95` with a tiny color+transform transition) on interactive controls — LocaleToggle, MobileNav trigger, MobileNav close, SkipLink
affects: [04-01, 04-02, 04-03, 04-04, 04-05, 04-06, 04-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Layout-level <main> landmark: [locale]/layout.tsx owns the single <main id='main-content' tabIndex={-1} className='flex-1'> — Phase 4 pages MUST return content directly and MUST NOT introduce their own <main> wrapper (double landmarks = a11y violation)"
    - "Flex-column body + footer `mt-auto` pattern: body is `min-h-screen flex flex-col`; main carries `flex-1`; footer carries `mt-auto`. Short pages no longer float the footer mid-viewport."
    - "Server-component footer calls `getTranslations({locale, namespace: 'footer'})` directly — locale is threaded as a prop from the server layout, not read from a client hook"
    - "EmailLink is always consumed by splitting `siteConfig.contactEmail.split('@')` — no literal message-scheme anywhere in source code"
    - "LocaleToggle: strip stale `locale` key from useParams() before forwarding to router.replace (option is authoritative)"
    - "LocaleToggle: `useTransition` + `disabled={isPending} aria-busy={isPending}` for double-click rate limiting"
    - "Press-feedback baseline uses `transition-[color,transform] duration-75 active:scale-95` — combined transition-property so hover color and press scale animate without clobbering each other. Skipped on text NavLinks/social anchors (shouldn't shift in reading flow)."

key-files:
  created:
    - "src/components/layout/SiteFooter.tsx"
  modified:
    - "src/app/[locale]/layout.tsx"
    - "src/app/[locale]/page.tsx"
    - "src/components/ui/EmailLink.tsx (added 'use client' directive for Next.js 16 + Turbopack compat)"
    - "src/components/layout/LocaleToggle.tsx (gap-closure: strip-stale-locale + useTransition guard + press feedback)"
    - "src/components/layout/MobileNav.tsx (press feedback on trigger + close)"
    - "src/components/layout/SkipLink.tsx (press feedback baseline)"
    - "src/config/site.ts (exported SocialLink interface for downstream .map type inference)"

key-decisions:
  - "Layout owns the sole <main> landmark — page.tsx's inner <main> replaced with <section>; Phase 4 pages return content only"
  - "Body is min-h-screen flex flex-col so footer mt-auto pins to bottom on short pages"
  - "SiteFooter stays a server component — reads footer.* translations via getTranslations and renders <EmailLink> directly; no 'use client' needed at this layer"
  - "Affiliations render from translation keys (footer.affiliationUba/Fcen/Conicet), not siteConfig.affiliations — the bilingual-string pair is already canonicalised in messages; siteConfig.affiliations remains available for future logo-linked references and Schema.org JSON-LD in Phase 5"
  - "Social list guarded by .length > 0 — currently empty; renders nothing rather than a placeholder 'follow us' affordance (academic-restraint choice)"
  - "Copyright uses `footer.copyright` with next-intl ICU `{year}` interpolation — no extra translation machinery"
  - "EmailLink forced 'use client' — Next.js 16 + Turbopack forbid `dynamic(..., {ssr: false})` inside Server Components; consumer side (SiteFooter) stays server-rendered, and the NAV-03 zero-mailto guarantee is preserved (verified by curl)"
  - "LocaleToggle strips params.locale before forwarding to router.replace — useParams() in [locale]/* tree returns {locale: X}; leaving it in fights the {locale: otherLocale} option on static routes (especially / where that key is the entire params payload)"
  - "LocaleToggle wraps switch in useTransition + disabled/aria-busy — rapid double-clicks can race the two replace() calls against next-intl internal reconciliation and drop the switch"
  - "Press-feedback baseline (`active:scale-95 transition-[color,transform] duration-75`) on LocaleToggle, MobileNav trigger, MobileNav close, SkipLink — inspired by ui-ux-pro-max Result 1 (tactile feedback); text-in-reading-flow elements (NavLinks, social anchors) intentionally skipped to avoid layout shift. Further tuning (spring feel, exact timing) deferred to a later polish phase per user direction"
  - "Mobile verification (drawer focus trap, escape, return-focus, narrow-viewport overflow) DEFERRED to the deployed-site phase — local mobile-viewport testing is unreliable before Vercel deploy; Radix Dialog primitives provide correct a11y by construction per RESEARCH.md Pattern 2, so the deferral risk is low"

patterns-established:
  - "Phase 3 exit shape: every page in both locales inherits SkipLink → SiteHeader → <main id='main-content' tabIndex={-1} className='flex-1'> → SiteFooter inside `min-h-screen flex flex-col` body"
  - "Phase 4 page contract: `export default function PageName() { return <content />; }` — no <main> wrapper, no chrome wrapper, no layout concerns. Layout already provides the landmark, padding, and footer docking."
  - "EmailLink consumption pattern: split `siteConfig.contactEmail` on '@' and pass `user` / `domain` — any other approach risks a literal message-scheme in source or compiled bundle"
  - "Deviation-tracked press-feedback baseline is intentionally minimal; further motion tuning is a Phase-5/6 polish concern, not a foundation concern"

# Metrics
duration: ~16 min
completed: 2026-04-17
---

# Phase 3 Plan 5: Layout Shell Integration + SiteFooter Summary

**Institutional footer server component composed with SiteHeader into the locale layout, closing Phase 3 with the end-to-end NAV-03 zero-mailto guarantee verified on both locales.**

## Performance

- **Duration:** ~16 min (across first-pass implementation + two gap-closure fixes after human-verify)
- **Started:** 2026-04-17T23:07:00Z (first task commit: `5bfc7d1`)
- **Completed:** 2026-04-17T23:23:03Z (final gap-closure commit: `1bb9080`)
- **Tasks:** 3/3 (Task 3 was the human-verify checkpoint; approved with gap-closure)
- **Files created:** 1 (SiteFooter.tsx)
- **Files modified:** 6 (layout.tsx, page.tsx, EmailLink.tsx, LocaleToggle.tsx, MobileNav.tsx, SkipLink.tsx, site.ts)

## Accomplishments

- **Phase 3 is done.** Every route in both locales renders the full shell: sticky header (logo + 7 NavLinks + LocaleToggle + mobile drawer trigger), keyboard-revealed SkipLink, `<main id="main-content" tabIndex={-1}>`, and institutional footer.
- **NAV-03 zero-mailto guarantee verified end-to-end.** `curl -s http://localhost:3000/es | grep -c 'mailto:'` → 0. `curl -s http://localhost:3000/en | grep -c 'mailto:'` → 0. The plan's single most load-bearing assertion holds in the actually-served HTML, not just the component source.
- **Layout now owns the single `<main>` landmark.** Body is `min-h-screen flex flex-col`, main is `flex-1`, footer is `mt-auto`. Short pages no longer float the footer mid-viewport. Phase 4 pages must NOT add their own `<main>` wrapper — they return content directly.
- **SiteFooter is a server component.** It reads `footer.*` translations via `getTranslations({locale, namespace: 'footer'})` and renders `<EmailLink>` (which is itself the client-only dynamic wrapper). The footer subtree stays out of the prerendered HTML's message-scheme literal because EmailLink's inner anchor loads post-hydration.
- **Gap-closure fixes shipped post human-verify.** The first human-verify surfaced two real issues: LocaleToggle silently dropped the switch on the home route, and interactive controls had no press-feedback affordance. Both fixed in-plan.
- **Typecheck + build green.** `pnpm typecheck` exits 0. `pnpm build` succeeds (verified during Task 2 and re-verified after every gap-closure fix).

## Final Layout Shape (Phase 4 Contract)

`src/app/[locale]/layout.tsx`:

```tsx
<html lang={locale} className={`${fontSerif.variable} ${fontSans.variable}`}>
  <body className="bg-surface text-ink antialiased min-h-screen flex flex-col">
    <NextIntlClientProvider>
      <SkipLink locale={locale} />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <SiteFooter locale={locale as Locale} />
    </NextIntlClientProvider>
  </body>
</html>
```

**Phase 4 executors:** return page content as-is (e.g., `<section>...</section>`). Do NOT wrap in `<main>`. Do NOT wrap in a max-width container at the root — layout doesn't force one so pages can choose their own widths (hero can go full-bleed, prose can cap at `max-w-5xl`, etc.).

## Component API

### `<SiteFooter locale={locale} />` (SiteFooter.tsx, server component)

```tsx
interface SiteFooterProps {
  locale: Locale;              // 'es' | 'en'
}
export async function SiteFooter({locale}: SiteFooterProps): JSX.Element;
```

**Layout:**

- `md+`: two-column grid — identity column (group name + affiliations) left, contact column (email + guarded social list) right.
- `<md`: stacked single column.
- `mt-auto` + the layout's `min-h-screen flex flex-col` body = footer sticks to bottom on short pages.
- `bg-surface-alt` + `shadow-sm` — honours 01-02 no-border policy.

**Content:**

- `<h2>` with `siteConfig.groupName` (canonical Spanish, per 02-01).
- `<ul>` with three `footer.affiliation*` translations (bilingual).
- `<EmailLink user={user} domain={domain} />` from `siteConfig.contactEmail.split('@')`.
- Social links rendered only when `siteConfig.socialLinks.length > 0` (currently empty, so section is absent).
- `<p>` with `footer.copyright` using ICU `{year}` interpolation from `new Date().getFullYear()`.

## Task Commits

1. **Task 1: SiteFooter** — `5bfc7d1` (feat)
2. **Task 2: Wire SiteHeader + SiteFooter into [locale]/layout.tsx, prune inner <main> in page.tsx** — `2b26ff9` (feat)
3. **Task 3: Human verification checkpoint** — approved with gap-closure. Two additional commits below fall under this task's resolution.
4. **Gap-closure 1 (LocaleToggle home-route switch fix + double-click guard)** — `e85ccdc` (fix)
5. **Gap-closure 2 (Press-feedback baseline on interactive controls)** — `1bb9080` (feat)

Plan metadata commit: _pending (follows this SUMMARY)_.

Phase-level commits spanning this plan: 5 atomic commits (1 footer, 1 layout wiring, 2 gap-closures, 1 logo asset chore staged at end of 03-04 but visually exercised for the first time in this plan: `8ffb102`).

## Files Created/Modified

- **Created:** `src/components/layout/SiteFooter.tsx` — async server component rendering institutional identity, three translated affiliations, `<EmailLink>` from split `siteConfig.contactEmail`, guarded social-links list, and year-interpolated copyright.
- **Modified:** `src/app/[locale]/layout.tsx` — body became `min-h-screen flex flex-col`; SkipLink → SiteHeader → `<main id="main-content" tabIndex={-1} className="flex-1">` → SiteFooter composed inside `<NextIntlClientProvider>`.
- **Modified:** `src/app/[locale]/page.tsx` — inner `<main>` replaced with `<section>` so the layout-level main is the sole landmark.
- **Modified:** `src/components/ui/EmailLink.tsx` — added `'use client'` directive (Next.js 16 + Turbopack rejects `dynamic({ssr:false})` inside Server Components). NAV-03 guarantee still holds via curl verification.
- **Modified:** `src/components/layout/LocaleToggle.tsx` — gap-closure: strip stale `locale` key from useParams() before forwarding; wrap switch in `useTransition` with `disabled={isPending} aria-busy={isPending}`; added press-feedback baseline.
- **Modified:** `src/components/layout/MobileNav.tsx` — press-feedback baseline on hamburger trigger and X close.
- **Modified:** `src/components/layout/SkipLink.tsx` — press-feedback baseline on the chip.
- **Modified:** `src/config/site.ts` — exported `SocialLink` interface so downstream `.map()` calls type-infer correctly against an empty `satisfies SocialLink[]` array.

## Decisions Made

- **Layout owns the single `<main>` landmark.** Page-level `<main>` elements violate "one landmark per page" WCAG guidance. The inner `<main>` in `page.tsx` was replaced with `<section>` (a valid, landmark-free container) to stop the collision.
- **Body is `min-h-screen flex flex-col` with main `flex-1` and footer `mt-auto`.** Standard sticky-footer pattern; footer pins to viewport bottom on short pages without any JavaScript.
- **SiteFooter stays a server component.** Translations read via `getTranslations` (server-only); EmailLink is the client boundary. The footer's own tree never ends up in a client bundle.
- **Affiliations from translations, not from siteConfig.** The `footer.affiliationUba/Fcen/Conicet` keys are already bilingual. `siteConfig.affiliations` remains available for future logo-linked references (likely Phase 5 Schema.org JSON-LD and/or a Phase 4 institutional logo strip).
- **Social list guarded and silent when empty.** No "follow us" placeholder. When `siteConfig.socialLinks = []` the section renders nothing, which is the academic-restraint choice.
- **EmailLink is forced 'use client'.** Next.js 16 with Turbopack rejects `dynamic({ssr:false})` inside a Server Component. The wrapper becomes a Client Component whose only purpose is to host the dynamic import; SiteFooter (server) still consumes it and the server emits only an empty placeholder into prerendered HTML. The curl verification confirms zero `mailto:` on both locales — the original intent of Plan 02 is preserved.
- **LocaleToggle strips stale `params.locale`.** `useParams()` inside a `[locale]/...` tree returns `{locale: X}` as part of its payload (along with any other dynamic segments). Passing that object verbatim to `router.replace` alongside the `{locale: otherLocale}` option gives next-intl two conflicting signals. On the home route (where `params = {locale: 'es'}` is the ENTIRE payload) this caused intermittent misses. Stripping the `locale` key before forwarding removes the ambiguity.
- **LocaleToggle uses `useTransition` + `disabled`/`aria-busy`.** Rapid double-clicks could fire two concurrent `router.replace` calls and race next-intl's internal reconciliation. `useTransition` marks the transition as interruptible React work; `disabled={isPending}` rate-limits at the button level; `aria-busy={isPending}` tells assistive tech what's happening.
- **Press-feedback baseline is minimal and scoped.** `active:scale-95 transition-[color,transform] duration-75` on LocaleToggle, MobileNav trigger, MobileNav close, and SkipLink (SkipLink uses `transition-transform duration-75` since it has no competing `transition-colors` on the same element). NavLinks and social anchors intentionally skipped — text in reading flow shouldn't shift. User noted that further tuning (spring feel, exact timing curves) is deferred to a later polish phase, so this stays as a non-harmful starting point.
- **Mobile-viewport verification deferred to deployed site.** Local mobile-viewport testing (devtools responsive mode) is unreliable before Vercel deploy — touch events, iOS Safari quirks, and real-device focus behaviour don't fully reproduce. Radix Dialog primitives provide focus trap, Escape-to-close, return-focus, aria-modal, and scroll lock by construction (RESEARCH.md Pattern 2), so the risk of deferring is low and will be verified against the live deployment in Phase 6 or earlier.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] SocialLink interface not exported, blocking `.map()` type inference on an empty `satisfies SocialLink[]` array**
- **Found during:** Task 1 (SiteFooter implementation)
- **Issue:** `siteConfig.socialLinks` is typed as `readonly []` (an empty tuple) via `satisfies SocialLink[]`. TypeScript's narrow inference widens the map callback parameter to `never`, so `link.url` etc. fails to typecheck.
- **Fix:** Exported `SocialLink` from `src/config/site.ts`; imported it in SiteFooter; cast the array once with `(siteConfig.socialLinks as ReadonlyArray<SocialLink>).map(...)` at the call site. Preserves the empty-array default and full type safety when the array is populated later.
- **Files modified:** src/config/site.ts, src/components/layout/SiteFooter.tsx
- **Verification:** `pnpm typecheck` exits 0.
- **Committed in:** `5bfc7d1` (Task 1 commit)

**2. [Rule 1 — Bug] Literal `mailto:` token in a JSDoc comment inside SiteFooter.tsx**
- **Found during:** Task 1 (SiteFooter verification)
- **Issue:** Plan verify step 7 requires `grep -c 'mailto:' src/components/layout/SiteFooter.tsx` to return 0. An initial JSDoc comment mentioned the literal token for context; left as-is it would have failed the source-grep guarantee in spirit even though prerendered HTML was fine.
- **Fix:** Rephrased the JSDoc comment to "message-scheme literal" so no contiguous five-character `mailto:` appears anywhere in SiteFooter.tsx source.
- **Files modified:** src/components/layout/SiteFooter.tsx
- **Verification:** `grep -c 'mailto:' src/components/layout/SiteFooter.tsx` → 0.
- **Committed in:** `5bfc7d1` (Task 1 commit)

**3. [Rule 3 — Blocking] `'use client'` added to EmailLink.tsx (Next.js 16 + Turbopack incompatibility)**
- **Found during:** Task 2 (first `pnpm build` after wiring the footer into the layout)
- **Issue:** Next.js 16 with Turbopack throws a compile-time error when `dynamic(..., {ssr: false})` is used inside a Server Component. Plan 03-02's wrapper was implicitly server, and this became a blocker as soon as the footer (server) consumed it.
- **Fix:** Added `'use client'` directive to the top of `src/components/ui/EmailLink.tsx`. The wrapper becomes a Client Component whose sole purpose is to host the dynamic `ssr: false` import; the server still emits only the placeholder for the wrapper into the HTML source (confirmed by curl → 0 mailto).
- **Files modified:** src/components/ui/EmailLink.tsx
- **Verification:** `pnpm build` succeeds; `curl -s http://localhost:3000/{es,en} | grep -c 'mailto:'` both return 0.
- **Committed in:** `2b26ff9` (Task 2 commit). The NAV-03 Phase 3 guarantee is preserved unchanged.

### Gap-closure fixes (from human-verify)

**4. [Rule 1 — Bug] LocaleToggle silently drops the locale switch on the home route**
- **Found during:** Task 3 (human-verify)
- **Issue:** On `/es`, clicking `EN` sometimes did nothing. Root cause: `useParams()` inside `[locale]/...` returns `{locale: 'es'}` (the locale segment is itself a param). Passing that object as `router.replace({...}).params` alongside the `{locale: 'en'}` option gave next-intl two conflicting signals — option says switch, params say stay. Especially bad on `/` because `{locale: 'es'}` is the ENTIRE params payload, so the stale key dominates reconciliation. Rapid double-clicks compounded the issue with replace() races.
- **Fix:** Strip the `locale` key from `useParams()` output before forwarding (`const {locale: _stale, ...restParams} = params`); wrap the switch in `useTransition`; disable the button while pending with `disabled={isPending} aria-busy={isPending}`.
- **Files modified:** src/components/layout/LocaleToggle.tsx
- **Verification:** Re-tested `/es` → `EN` → `/en` → `ES` manually across home, and `/es?debug=yes` → `/en?debug=yes` (query-param preservation). All pass on first click and correctly ignore double-clicks.
- **Committed in:** `e85ccdc` (gap-closure 1)

**5. [Rule 2 — Missing Critical — scoped to baseline] Press-feedback affordance on interactive controls**
- **Found during:** Task 3 (human-verify)
- **Issue:** Interactive controls (LocaleToggle, hamburger trigger, drawer close, SkipLink) had no visible press-feedback. Keyboard-only users saw focus rings but mouse/touch users had no tactile signal on press. Result 1 in the ui-ux-pro-max library notes this as a common restraint-compatible affordance.
- **Fix:** Added `active:scale-95 transition-[color,transform] duration-75` on LocaleToggle and both MobileNav buttons; `active:scale-95 transition-transform duration-75` on SkipLink (no competing color transition on that element). NavLinks and social anchors intentionally skipped — text links in reading flow shouldn't shift on press.
- **Files modified:** src/components/layout/LocaleToggle.tsx, src/components/layout/MobileNav.tsx, src/components/layout/SkipLink.tsx
- **Verification:** Visually confirmed on click; `pnpm typecheck` + `pnpm build` still green. User noted further tuning (spring, exact duration) is deferred — accepted as baseline.
- **Committed in:** `1bb9080` (gap-closure 2)

---

**Total deviations:** 5 auto-fixed (2 bugs caught during initial implementation, 1 blocking compat, 2 gap-closure fixes after human-verify). Zero architectural changes — no Rule 4 triggers.

**Impact on plan:** All fixes were necessary for correctness (bugs, blockers) or for the human-verify pass (UX affordance, real locale-switch bug on home). No scope creep; the press-feedback is an intentional minimal baseline that the user flagged for later tuning in a deliberate "don't over-engineer" direction.

## Issues Encountered

- **Mobile verification deferred.** See Decisions. Radix primitives handle the a11y-critical behaviours (focus trap, Escape, return-focus, aria-modal, scroll lock) by construction, so deferring the manual 375px-viewport pass to post-deploy has low risk. Logged so Phase 6 (or the deploy phase) picks it up.
- **Pre-existing lint finding (NOT introduced by this plan):** `react-hooks/set-state-in-effect` on `MobileNav.tsx:38` for the `useEffect([pathname]) → setOpen(false)` belt-and-braces auto-close. It predates this plan (shipped in 03-04) and does not block build/runtime. Flagged here for future cleanup — likely resolved by switching to `usePathname()` subscription inside the `onOpenChange` handler or migrating to a navigation-event-based close.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Phase 3 is complete.** Ready for Phase 4 planning (`/gsd:plan-phase 4`).

**Phase 3 Success Criteria status:**

- **SC-1** (7-link nav + active indicator, both locales): satisfied — verified live on `/es` and `/en`.
- **SC-2** (locale toggle preserves pathname + query): satisfied — verified via `/es?debug=yes` → `/en?debug=yes`; deep-route preservation (`/people/[slug]`) is architecturally guaranteed by `useParams`/`useSearchParams` threading and will be re-verified in Phase 4 when those routes exist.
- **SC-3** (footer identity + zero-mailto): satisfied — `curl` confirms 0 mailto on both locales; footer renders group name, three affiliations, `<EmailLink>`, guarded social list.
- **SC-4** (mobile collapse, no horizontal overflow): partially verified — desktop confirmed; mobile drawer structure verified in source and via Radix primitives; narrow-viewport visual + touch verification deferred to deployed site.
- **SC-5** (skip link visible on Tab, moves focus into main): satisfied — verified by human-verify step 3.
- **SC-6** (translated nav labels, toggle, footer microcopy, both locales): satisfied — `/es` vs `/en` swap all strings correctly.

**Requirements complete after this plan:** NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, I18N-01, I18N-04.

**Handoff to Phase 4:**

- Every Phase 4 page inherits `<SkipLink>`, `<SiteHeader>`, `<main id="main-content" tabIndex={-1} className="flex-1">`, and `<SiteFooter>` from the layout. Pages return content only — no `<main>` wrapper, no chrome, no global padding at the root.
- Pages are free to choose their own max-width and horizontal padding per section (hero full-bleed is fine; prose can cap at `max-w-5xl mx-auto px-6`).
- Locale is available via `useLocale()` (client) or via the layout-threaded prop pattern for new server components; the proven recipe is the SiteFooter itself.
- `<EmailLink>` is the ONLY correct way to render a contact email anywhere on the site — always from a split `siteConfig.contactEmail` or similar; never write the message-scheme literal in source.

**Known follow-ups (not blocking Phase 4):**

1. Mobile drawer verification against the live Vercel deployment (focus trap under real touch, narrow-viewport no-overflow check at 375px — can be folded into the Phase 6 a11y audit).
2. `react-hooks/set-state-in-effect` lint on `MobileNav.tsx:38` — cleanup when revisiting the drawer for deploy-time mobile verification.
3. Further press-feedback tuning (spring curve, duration calibration) deferred to Phase 5/6 polish.

---

_Phase: 03-layout-shell_
_Plan: 05 (Wave 3 — final plan of phase)_
_Completed: 2026-04-17_
