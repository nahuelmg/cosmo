# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-17)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** Phase 4 Core Pages — Wave 2 in progress (04-01 Wave 1 + 04-02 Home + 04-04 Research complete)

## Current Position

Phase: 4 of 6 (Core Pages) — In Progress
Plan: 3 of 8 in Phase 4 (04-01 Wave 1, 04-02 Home page, 04-04 Research page complete)
Status: In progress — Home page and Research page shipped; remaining Wave 2 plans (04-03, 04-05..08) pending
Last activity: 2026-04-18 — Completed 04-02-PLAN.md (Home page: Highlights, PartnerStrip, full RSC with carousel + 2-para intro + highlights + partners)

Progress: [████████████████░░░░░░] ~66% (Phase 3 complete + Phase 4: Wave 1 + Home + Research)

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: ~10 min
- Total execution time: ~2 hours 30 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 Complete | ~57 min | ~14 min |
| 2. Content Layer | 5/5 Complete | ~40 min est. | ~8 min |
| 3. Layout Shell | 5/5 Complete | ~38 min | ~7.5 min |
| 4. Core Pages | 2/8 (04-01 + 04-04 complete) | ~20 min | ~10 min |
| 5. SEO & Discoverability | 0/TBD | — | — |
| 6. Polish (A11y & Performance) | 0/TBD | — | — |

**Recent Trend:**
- 04-04 ran ~8 min (pure-auto, 2 task commits, zero deviations; TypeScript clean on first attempt; build static-prerendered both locales)
- 03-05 ran ~16 min (human-verify plan, 2 tasks + checkpoint; first-pass had 3 auto-fixes — SocialLink export, mailto JSDoc grep, Next.js 16 'use client' compat — then gap-closure surfaced LocaleToggle home-route stale-param bug + press-feedback baseline, both fixed in-plan)
- 03-04 ran ~2 min (pure-auto, 2 atomic task commits, zero functional deviations)
- 03-03 ran ~10 min (pure-auto, 3 nav primitives, one minor typecheck false alarm from parallel wave)
- 03-02 ran ~2 min (pure-auto, two-file component, no checkpoints)
- 03-01 ran ~4 min (pure-auto, 3 atomic task commits; 1 blocking-type deviation fixed inline)
- Phase 2 plans ran 3–30 min (01: 3 min pure-auto; 05: ~30 min with human-verify checkpoint)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation: Vercel-only deployment (no dual-build) — avoids static-export CI overhead.
- Foundation: next-intl with Spanish default, English toggle — locks URL structure from Phase 1.
- Content: JSON/YAML content files with Zod validation over a CMS — academic maintainers edit infrequently.
- Home: Keep auto-fade hero carousel despite anti-pattern flag — ≥6s dwell + `prefers-reduced-motion` respected.
- Publications: Defer arXiv/ADS importer to v2 — placeholder data validates layout now.

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | lint=eslint src (not next lint) | next lint removed from Next.js 16 CLI |
| 01-01 | tsconfig excludes ui-ux-pro-max/skills/references/.planning/ | Default **/*.ts glob picked up non-project TS files |
| 01-01 | Node 20 via nvm required | System had Node 18; Next.js 16 requires >=20.9.0 |
| 01-02 | Warm-academic palette at hue 45° (muted terracotta accent) | CONTEXT.md: warm band 30°–80°; cool blues rejected |
| 01-02 | Source Serif 4 + Source Sans 3 font pair | Greek subset required; Crimson Pro + Atkinson Hyperlegible disqualified (no Greek on Google Fonts) |
| 01-02 | No-border policy: focus rings via box-shadow only | CONTEXT.md: hierarchy via typography and whitespace alone |
| 01-02 | Two-tier surface: primary oklch(0.995 0.003 85) + alt oklch(0.978 0.008 80) | CONTEXT.md: max two surface tiers |
| 01-02 | Type scale ratio 1.2, H1=2rem | CONTEXT.md: restrained display scale (28–32px) |
| 01-02 | Shadow ceiling at --shadow-md; --shadow-lg/xl removed | Nature long-form aesthetic; whitespace hierarchy principle |
| 01-03 | journal-club stays English in both locales | International domain lexicon; Spanish speakers recognise it |
| 01-03 | localeDetection: false — / always → /es | Argentine-first, canonical-friendly, no Accept-Language sniffing |
| 01-03 | dev-warn/prod-silent i18n error policy | I18N-06: dev visibility + production silence on missing keys |
| 01-04 | @theme inline for font utilities | Without inline, Tailwind resolves font name literally and bypasses next/font subsetting pipeline |
| 01-04 | locale-layout order locked: hasLocale → notFound → setRequestLocale → render | Required by next-intl for static rendering; deviation breaks SSG |
| 01-04 | Greek probe retained in page.tsx until Phase 3 | Visual confirmation Greek subset stays wired across future changes |
| 01-04 | Root layout.tsx + page.tsx deleted | Proxy from 01-03 guarantees locale-prefixed traffic; no root route needed |
| 02-01 | import * as z from "zod" not "zod/v4" | Zod v4 ships as default export; /v4 path for v3-alongside compatibility only |
| 02-01 | z.strictObject() for bilingualString | .strict() chain is deprecated in Zod v4 API |
| 02-01 | photoPath rejects leading slash | path.join(PUBLIC_DIR, "/people/Foo.png") resolves to filesystem root, not public/ |
| 02-01 | siteConfig uses TypeScript satisfies not Zod | Developer-maintained file; compile-time sufficient; no runtime overhead |
| 02-01 | groupName single canonical Spanish string | Argentine institutional identity; site-level identity not bilingual (I18N-03) |
| 02-01 | .vscode/settings.json committed (.gitignore exception) | JSON schema wiring is shared team config, not user-specific |
| 02-05 | node --import tsx (not tsx/esm) for prebuild scripts | tsx/esm requires explicit file extensions in import specifiers; bare tsx flag handles .ts imports from .mjs scripts |
| 02-05 | JSON Schema target draft-07 for VS Code | VS Code JSON language server fully supports Draft 7; Draft 2020-12 (Zod v4 default) has limited VS Code support |
| 02-05 | Photo-existence check post-parse, not via Zod .refine() | Schema stays filesystem-free; error category is visually distinct in CLI output |
| 02-05 | generate-schemas is manual (not chained into prebuild) | Schema-JSON drift is visible via git diff; maintainer opts in to regeneration |
| 02-05 | Zod .refine() rules do not translate to JSON Schema — build time only | photoPath and proseString smart-quote checks are runtime-only; not representable in JSON Schema |
| 03-02 | Two-file EmailLink (server wrapper + 'use client' inner) via next/dynamic ssr:false | Only way to guarantee zero message-scheme literal in prerendered HTML source (Success Criterion 3 / NAV-03) |
| 03-02 | No loading-state fallback on dynamic import | next/dynamic loading is zero-arg; prop-aware plaintext requires duplicating UI — accepted flash-of-nothing for simplicity |
| 03-02 | URI scheme assembled via ['mai','lto'].join('') not string literal | Literal token must not appear as contiguous five characters in source or compiled bundle |
| 03-01 | --header-height: 56px (matches Tailwind h-14) | Token is single source of truth for sticky-header height + #main-content scroll offset; header plan uses h-14 utility without drift |
| 03-01 | #main-content uses outline:none | tabIndex={-1} focus target uses content (page heading) as visual confirmation; full-page outline is noisy |
| 03-01 | SkipLink focus ring via focus:ring-2 focus:ring-accent-ring | Box-shadow focus indicator, honours 01-02 no-border policy |
| 03-01 | SkipLink focus:z-[100] | Sits above Phase 3 z-index ladder (header z-30, overlay z-40, drawer z-50) |
| 03-01 | Locale prop narrowed to ('es' \| 'en') via (typeof routing.locales)[number] | Plain string rejected getTranslations namespace overload; matches existing pattern in page.tsx |
| 03-03 | Import Link/usePathname/useRouter from @/i18n/navigation, not next/navigation | i18n versions return/accept internal pathname keys — required for active-state check + router.replace |
| 03-03 | useParams/useSearchParams still from next/navigation | next-intl does not re-export these; must stay raw |
| 03-03 | LocaleToggle Suspense fallback=null | 2-character button; single-paint absence is not a layout-shift concern |
| 03-03 | aria-label strings inlined (not translated) | Abbreviation (ES/EN) is language-agnostic; wrapping verb is tiny — translation keys would be overkill |
| 03-04 | MobileNav takes no props, owns its own `open` state | Lets SiteHeader compose declaratively; any future host can wrap without reaching inside render tree |
| 03-04 | Inline hamburger/X SVGs, no icon library | Only 2 glyphs needed in the whole layout shell; lucide-react would add KB for zero net gain |
| 03-04 | Dialog.Title is sr-only | Radix requires title for a11y; visible title would duplicate labelled X-close + nav |
| 03-04 | Drawer slides in from right (not left) | Matches thumb-reach convention on LTR phones (hamburger top-right → drawer same edge) |
| 03-04 | Logo alt text = canonical Spanish siteConfig.groupName on both locales | 02-01 canonical-Spanish rule; institutional identity is language-independent |
| 03-04 | Drawer width w-72 max-w-[85vw] | 18rem comfortable on tablet, 85vw cap prevents fullscreen on narrow phones |
| 03-04 | Active-link inside drawer uses bg-surface-alt via activeClassName | Shaded row = restraint-consistent current-item indicator inside a drawer (no border, no underline) |
| 03-04 | next/image priority on logo | Logo is in initial viewport on every route (LCP candidate); eager preload justified |
| 03-05 | EmailLink forced 'use client' | Next.js 16 + Turbopack rejects dynamic({ssr:false}) inside Server Components; wrapper must be a Client Component. Zero-mailto guarantee still holds (curl confirms) because the server emits only the wrapper placeholder into prerendered HTML |
| 03-05 | LocaleToggle strips params.locale before router.replace | useParams() in [locale]/* tree returns {locale: X} as part of its payload; forwarding it fights next-intl's {locale: otherLocale} option — especially on the home route where that key is the entire payload |
| 03-05 | LocaleToggle uses useTransition + disabled/aria-busy while pending | Prevents rapid double-click races that can fire two concurrent router.replace calls against next-intl's reconciliation |
| 03-05 | Press-feedback baseline (active:scale-95 transition-[color,transform] duration-75) on interactive controls (not NavLinks) | UI-UX-Pro-Max Result 1 tactile affordance; text links in reading flow (NavLinks, social anchors) intentionally skipped to avoid layout shift. Further tuning deferred per user direction |
| 03-05 | Mobile verification deferred to deployed-site phase | Local mobile-viewport testing (devtools responsive mode) is unreliable pre-deploy; Radix Dialog primitives provide focus-trap/Escape/return-focus/aria-modal/scroll-lock by construction (RESEARCH.md Pattern 2), so deferral risk is low |
| 03-05 | Layout owns the single <main> landmark | page.tsx's inner <main> replaced with <section>; Phase 4 pages return content only, MUST NOT add their own <main> wrapper (double-landmark is an a11y violation) |
| 03-05 | Body is min-h-screen flex flex-col with main flex-1 + footer mt-auto | Standard sticky-footer pattern; footer pins to viewport bottom on short pages without JavaScript |
| 03-05 | Footer affiliations render from translations, not siteConfig.affiliations | footer.affiliation* keys are already bilingual; siteConfig.affiliations remains available for Phase 5 Schema.org JSON-LD and future logo-linked references |
| 04-01 | BilingualString interface inline in site.ts (not imported from content schemas) | Keeps compile-time-only file filesystem-free; consistent with existing SocialLink/Affiliation inline pattern (decision 02-01) |
| 04-01 | portada_3.jpg is a deliberate copy of portada_1.jpg | Third carousel slot requires a valid image file; real image deferred per RESEARCH.md open-question #1 |
| 04-01 | HeroCarousel uses setTimeout (not setInterval) per index/isPaused useEffect deps | Avoids interval drift; timer restarts cleanly on advance; prefers-reduced-motion checked inside effect (SSR-safe) |
| 04-01 | MapEmbed fallback anchor is always-rendered (not gated on shouldLoad) | Ensures crawlability in prerendered HTML and functional with JS disabled; iframe overlays it once IntersectionObserver fires |
| 04-01 | Pause/play glyphs are inline SVGs (not lucide) | 2 glyphs only; consistent with 03-04 hamburger/X decision; lucide-react installed for page-level icons |
| 04-04 | Static ICON_MAP (Record<string, LucideIcon>) keyed by JSON icon field | Dynamic require() breaks tree-shaking; all 4 icons (atom/waves/sparkles/cpu) resolve — no HelpCircle fallback fires on real data |
| 04-04 | HelpCircle as fallback for unknown icon names | Loud visual signal of content drift; never crashes |
| 04-04 | 2-up grid (sm:grid-cols-2) for 4 research areas | 3-up would orphan 4th card; 2×2 fits cleanly on tablet/desktop |
| 04-02 | Named export { HeroCarousel } added alongside default export | Plan uses named import style; export default function creates a named binding that can be re-exported; default retained for backward compat |
| 04-02 | home.intro already had 2-paragraph structure from 04-01 seed | No rewrite needed; plan sub-step 1 was pre-satisfied; verified with jq+awk paragraph count = 2 per locale |
| 04-02 | Props-down server composition for Highlights and PartnerStrip | Page resolves all translations + siteConfig, passes resolved strings as props — leaves stay server-renderable with zero client coupling |

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

- Add nvm init to shell profile so pnpm works without sourcing manually each session.
- Revisit `react-hooks/set-state-in-effect` lint on `MobileNav.tsx:38` (predates 03-05; not blocking) when doing mobile-drawer verification against the live Vercel deployment.
- Mobile drawer verification (focus trap, Escape, return-focus, 375px no-overflow) against the deployed Vercel site — deferred from 03-05 per user direction; fold into Phase 6 a11y audit or the deploy phase.
- Press-feedback tuning (spring curve, exact duration) across the shell — baseline landed in 03-05; user flagged further iteration as a later polish concern.

### Blockers/Concerns

- **Node version environment:** pnpm and Next.js 16 commands require Node 20. Must source nvm before running: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`. Consider adding to .bashrc.
- **Mobile-viewport verification debt:** The Phase 3 shell passed desktop verification, but mobile (375px, touch, real-device focus behaviour) was deferred to the deployed-site phase per user direction. Risk is low because Radix Dialog primitives provide the a11y-critical behaviours by construction, but it must be exercised before the site is publicly announced.

## Session Continuity

Last session: 2026-04-18
Stopped at: Completed 04-02-PLAN.md (Home page — Highlights, PartnerStrip, full RSC with carousel + 2-para intro + highlights + partners, HOME-01..07 satisfied)
Resume file: None
