# Roadmap: Cosmology Group Website (UBA / FCEN)

## Overview

Six phases take the project from an empty repo to a deployed bilingual institutional website. Phase 1 locks the foundations that ripple through every URL and component (bootstrap, design system, i18n routing). Phase 2 stabilises the typed content layer so pages can consume placeholder JSON safely. Phase 3 builds the layout shell and language toggle every page depends on. Phase 4 ships the seven pages in parallel. Phase 5 makes the site discoverable. Phase 6 verifies accessibility and performance before launch.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** — Next.js scaffold, OKLCH design tokens, i18n routing, fonts
- [x] **Phase 2: Content Layer** — Zod-validated JSON content files and typed accessors
- [x] **Phase 3: Layout Shell** — Header with language toggle, footer, skip link, EmailLink
- [x] **Phase 4: Core Pages** — Home, People (list + detail), Research, Publications, Journal Club, Outreach, Contact
- [x] **Phase 5: SEO & Discoverability** — Metadata, Schema.org JSON-LD, sitemap, robots
- [ ] **Phase 6: Polish (A11y & Performance)** — WCAG AA audit, Core Web Vitals, SSG verification

## Phase Details

### Phase 1: Foundation

**Goal**: The project boots end-to-end as a bilingual Next.js app with a locked design system and i18n routing, so every subsequent phase builds on stable foundations.

**Depends on**: Nothing (first phase)

**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, I18N-05, I18N-06, I18N-07

**Success Criteria** (what must be TRUE):
  1. `pnpm dev` starts the app; visiting `/` redirects to `/es` and visiting `/en` renders the English locale with `<html lang="en">` (I18N-05).
  2. `design-system/MASTER.md` exists with chosen style, colour palette, typography, and effects produced by `ui-ux-pro-max` (FOUND-02).
  3. `globals.css` defines OKLCH design tokens wired into Tailwind v4 theme; a token change updates rendered colours (FOUND-03).
  4. Self-hosted fonts load without FOUT/FOIT on first paint; Latin + Latin-Extended subsets verified in DevTools (FOUND-04).
  5. `pnpm check-translations` fails CI when a key exists in one locale's messages but is missing in the other; dev logs a warning and prod returns the key without crashing when a translation is missing (I18N-06, I18N-07).

**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Next.js 16 + TypeScript strict + Tailwind v4 scaffold with pnpm, scripts, .gitignore, README stub
- [ ] 01-02-PLAN.md — Generate design system via ui-ux-pro-max; review and override against CONTEXT.md; lock MASTER.md + OVERRIDES.md
- [ ] 01-03-PLAN.md — next-intl 4.9 routing, proxy.ts, navigation, request config, messages seeds, check-translations CI script
- [ ] 01-04-PLAN.md — OKLCH tokens in globals.css, Source Serif 4 + Source Sans 3 with Greek subset, [locale]/layout.tsx, boot verification

---

### Phase 2: Content Layer

**Goal**: All content types have Zod schemas and placeholder JSON files that pages can consume through typed accessors; the build fails loudly on malformed content.

**Depends on**: Phase 1

**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08, I18N-03

**Success Criteria** (what must be TRUE):
  1. `content/people.json`, `content/publications.json`, `content/research.json`, `content/journal-club.json`, `content/outreach.json` exist with realistic placeholder data that stress-tests schemas (long names, missing optional fields, portrait + landscape photos) (DATA-01..05).
  2. A smart-quote or missing photo reference in any `content/*.json` fails `pnpm build` with a clear, line-pointed error message (DATA-07).
  3. `src/config/site.ts` owns group name, tagline, affiliations, contact email, and social links; changing the group name there updates every page that renders it (DATA-06).
  4. Each `content/*.json` has a neighbouring `*.schema.json` generated from the Zod schema; opening a file in VS Code shows IntelliSense and inline validation errors (DATA-08).
  5. Per-entity bilingual fields (bios, research-area descriptions, outreach descriptions) render in the active locale when accessed via typed accessors (I18N-03).

**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Install zod@^4 + tsx, shared Zod helpers, src/config/site.ts, scaffold folder tree, .vscode/settings.json wiring
- [x] 02-02-PLAN.md — People schema + realistic placeholder JSON (19–21 entries, 8 real photos, 4-part long name) + typed accessors with locale resolution
- [x] 02-03-PLAN.md — Publications schema (id uniqueness, arXiv/DOI regex) + 10–15 entries across 2024–2026 + accessors (year/topic filters)
- [x] 02-04-PLAN.md — Research (4 areas) + Journal Club (3–4 sessions) + Outreach (3–4 activities) schemas, JSON, and accessors
- [x] 02-05-PLAN.md — Prebuild validator (file-grouped errors, photo existence), JSON Schema generator (draft-07), barrel index, seeded-violation verification

---

### Phase 3: Layout Shell

**Goal**: Every page inherits a header with a working language toggle, a footer with institutional identity, and shared chrome (skip link, EmailLink) — ready to wrap the core pages.

**Depends on**: Phase 1, Phase 2

**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, I18N-01, I18N-04

**Success Criteria** (what must be TRUE):
  1. The top navigation renders seven links (Home, People, Research, Publications, Journal Club, Outreach, Contact) and visibly marks the active route in both locales (NAV-01).
  2. Clicking the language toggle on any page — including `/people/[slug]` and a filtered publications URL — switches locales while preserving the current path and query params (NAV-02, I18N-04).
  3. The footer shows the group name (from `site.ts`), UBA / FCEN / CONICET affiliations, a contact email (via `<EmailLink>`, no raw `mailto:` literal in the rendered HTML source), and social links (NAV-03).
  4. At a mobile viewport the nav collapses to a menu and the page does not overflow horizontally; at desktop the full nav is visible (NAV-04).
  5. Tab-first keyboard navigation reveals a "Skip to content" link that, when activated, moves focus to the page's main landmark (NAV-05).
  6. All nav labels, the mobile menu toggle, the language toggle, and the footer microcopy render in Spanish by default and in English when toggled (I18N-01).

**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — Foundation: layout namespace, --header-height token, main landmark, SkipLink, Radix Dialog install
- [x] 03-02-PLAN.md — EmailLink component (dynamic ssr:false wrapper) guaranteeing zero `mailto:` in prerendered HTML
- [x] 03-03-PLAN.md — Nav primitives: NAV_ITEMS registry, NavLink with active state, LocaleToggle with Suspense
- [x] 03-04-PLAN.md — SiteHeader (sticky, logo, desktop nav, locale toggle) + MobileNav (Radix Dialog drawer)
- [x] 03-05-PLAN.md — SiteFooter + integration into [locale]/layout.tsx + human-verify of the full shell

---

### Phase 4: Core Pages

**Goal**: All seven top-level pages (plus People detail pages) render real placeholder content end-to-end in both locales, consuming the content layer and wearing the layout shell.

**Depends on**: Phase 2, Phase 3

**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, HOME-07, PEOP-01, PEOP-02, PEOP-03, PEOP-04, PEOP-05, PEOP-06, PEOP-07, PEOP-08, PEOP-09, PEOP-10, PEOP-11, PEOP-12, RSCH-01, RSCH-02, PUBS-01, PUBS-02, CLUB-01, CLUB-02, OTRCH-01, OTRCH-02, OTRCH-03, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, I18N-02

**Scope adjustment (from CONTEXT.md, 2026-04-18):** Publications filter UI (PUBS-03) and URL-synced filter state (PUBS-04) are both explicitly **deferred** beyond Phase 4. Phase 4 ships a plain year-grouped Publications list — no filter controls, no URL-synced state. Both requirements move to a future phase, not dropped. Also: HOME-03 hover/focus pause behavior was updated to "pause button only" (hover/focus deliberately do NOT pause); the REQUIREMENTS.md HOME-03 entry carries the authoritative wording.

**Success Criteria** (what must be TRUE):
  1. The Home page shows a rotating hero carousel (3–5 landscape placeholders, 7s visible + 1s crossfade per slide), an overlay with group name / tagline / affiliation that passes WCAG-AA contrast on every slide, an intro block, 3 highlight cards, and a partner logo strip; the carousel pauses when the tab is backgrounded (`document.hidden`), does not auto-advance when `prefers-reduced-motion` is set, and exposes dot indicators for manual navigation. No pause button (user direction 2026-04-18 during human-verify; HOME-03 wording updated). Hover and keyboard focus deliberately do NOT pause (HOME-01..07).
  2. The People page lists PIs (5), Postdocs (2), PhDs (6), Undergrads, and Past Members in the correct card formats; clicking a PI / Postdoc / PhD card navigates to `/people/[slug]`; Undergrads and Past Members are not clickable (PEOP-01..06).
  3. Each `/people/[slug]` page shows a large photo, name, title, affiliation, 2–4 paragraph bio, research-interests bullets, selected-publications list, obfuscated email, office, ORCID, Google Scholar, and optional links that hide cleanly when absent (PEOP-07..12).
  4. The Research page shows an intro and a grid of four research areas (Dark Matter, Gravitational Waves, Early Universe, Artificial Intelligence) with icon/image, title, and short description (RSCH-01..02).
  5. The Publications page lists entries grouped by year (most recent first) with authors / title / journal / year / arXiv / DOI per entry (PUBS-01..02). Filter controls (PUBS-03) and URL-synced filter state (PUBS-04) are both **deferred** beyond Phase 4.
  6. The Journal Club page shows upcoming sessions (date, speaker, affiliation, title, paper link) and a past-sessions archive grouped by academic year (CLUB-01..02).
  7. The Outreach page shows an intro and a grid of activities (image, title, date, description) with optional links to videos / slides / articles that hide when not provided (OTRCH-01..03).
  8. The Contact page shows the FCEN postal address, office location in Pabellón I/II, obfuscated general contact email, a lazy-loaded Google Map embed below the fold (no LCP impact), and social-media links (CONT-01..05).
  9. Every page's own copy (intros, headings, body prose) renders translated when the locale toggles; nothing falls back to Spanish on English pages or vice versa (I18N-02).

**Plans**: 8 plans (wave 1: 1 plan; wave 2: 7 plans parallel)

Plans:
- [x] 04-01-PLAN.md — Shared prereqs: lucide-react install, third carousel placeholder, siteConfig address/office/mapQuery, seed Phase-4 message keys (es+en), build HeroCarousel + MapEmbed 'use client' leaves [wave 1]
- [x] 04-02-PLAN.md — Home page: hero carousel + intro + 3 highlight cards + partner strip (HOME-01..07) [wave 2]
- [x] 04-03-PLAN.md — People list page + /people/[slug] detail page with generateStaticParams + 5 supporting components (PEOP-01..12) [wave 2]
- [x] 04-04-PLAN.md — Research page with 4-area grid + Lucide icons (RSCH-01..02) [wave 2]
- [x] 04-05-PLAN.md — Publications page: year-grouped bibliography, no filters (PUBS-01..02; PUBS-03 and PUBS-04 both deferred) [wave 2]
- [x] 04-06-PLAN.md — Journal Club page: upcoming sessions + past-sessions archive by academic year (CLUB-01..02) [wave 2]
- [x] 04-07-PLAN.md — Outreach page: intro + activity grid, optional links hide when absent (OTRCH-01..03) [wave 2]
- [x] 04-08-PLAN.md — Contact page: address + office + obfuscated email + social block + lazy Google Maps embed (CONT-01..05) [wave 2]

---

### Phase 5: SEO & Discoverability

**Goal**: The site is fully indexable in both locales with correct canonicals, hreflang alternates, Schema.org structured data, OG / Twitter cards, sitemap, and robots — institutional credibility through search.

**Depends on**: Phase 4 (URL set must be stable)

**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06

**Success Criteria** (what must be TRUE):
  1. Every page exposes Open Graph and Twitter-card metadata (title, description, image) verified via `view-source` and a social-preview debugger (SEO-01).
  2. Every page declares a canonical URL and `hreflang` alternates for both `es`, `en`, and `x-default` pointing at the Spanish version (SEO-02).
  3. The root layout emits Organization (or ResearchOrganization) Schema.org JSON-LD with group name, affiliations, and URL; it validates in Google's Rich Results Test (SEO-03).
  4. Each `/people/[slug]` page emits Person JSON-LD that validates in Google's Rich Results Test (SEO-04).
  5. `sitemap.xml` lists every static route in both locales with `alternates.languages` + `x-default`; `robots.txt` is served at the site root and references the sitemap (SEO-05, SEO-06).

**Plans**: 5 plans (wave 1: 1 plan; wave 2: 4 plans parallel)

Plans:
- [x] 05-01-PLAN.md — Prereqs: siteConfig.url + .env.example + full seo messages namespace (es+en) + buildPageMetadata helper + schema builders + JsonLd component [wave 1]
- [x] 05-02-PLAN.md — Root locale layout: metadataBase + title template + default OG + ResearchOrganization JSON-LD on every page (SEO-01, SEO-02 defaults, SEO-03) [wave 2]
- [x] 05-03-PLAN.md — generateMetadata on 7 static pages (home absolute-title; others template-suffix) + ScholarlyArticle JSON-LD per publication entry (SEO-01, SEO-02) [wave 2]
- [x] 05-04-PLAN.md — /people/[slug] generateMetadata + Person JSON-LD (no email, ORCID + Scholar + socials in sameAs) (SEO-01, SEO-02, SEO-04) [wave 2]
- [x] 05-05-PLAN.md — sitemap.ts (7 routes + 13 people × alternates) + robots.ts (VERCEL_ENV-gated) (SEO-05, SEO-06) [wave 2]

---

### Phase 6: Polish (A11y & Performance)

**Goal**: The site meets WCAG AA and Core Web Vitals targets across all pages, in both locales, as a verified whole — ready to ship to Vercel.

**Depends on**: Phase 5

**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, PERF-01, PERF-02, PERF-03, PERF-04, PERF-05

**Success Criteria** (what must be TRUE):
  1. `axe-core` automated checks return zero critical violations on Home, People list, any `/people/[slug]`, Publications, Contact, and all other pages, in both locales (A11Y-01).
  2. Every interactive element is keyboard-reachable with a visible focus ring; hero carousel pause / prev / next controls are keyboard-operable and announce state changes to screen readers; all images have meaningful alt text or empty alt for decoratives (A11Y-03, A11Y-04, A11Y-05).
  3. Contrast audit confirms 4.5:1 for text and 3:1 for UI components throughout, including every carousel slide's overlay (A11Y-02).
  4. `pnpm build` produces a fully static output — no page falls back to SSR; every `generateStaticParams` returns the expected slug set (PERF-01).
  5. Lighthouse mobile (throttled 4G) reports LCP < 2.5s for Home, People, and Publications; CLS is 0 on every page; the Google Maps embed does not contribute to Contact's LCP (PERF-02, PERF-03, PERF-04, PERF-05).

**Plans**: TBD

Plans:
- [ ] 06-01: TBD (sized during `/gsd:plan-phase 6`)

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

Phase 4 fans out into parallel per-page plans (7 plans in Wave 2 after 1 shared-prereq plan in Wave 1).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete ✓ | 2026-04-17 |
| 2. Content Layer | 5/5 | Complete ✓ | 2026-04-17 |
| 3. Layout Shell | 5/5 | Complete ✓ | 2026-04-17 |
| 4. Core Pages | 8/8 | Complete ✓ | 2026-04-18 |
| 5. SEO & Discoverability | 1/5 | In progress | - |
| 6. Polish (A11y & Performance) | 0/TBD | Not started | - |

---

*Roadmap created: 2026-04-17*
*Depth: standard (6 phases)*
*Coverage: 75/75 v1 requirements mapped (PUBS-04 deferred beyond Phase 4 but still counted)*
*Phase 4 planned: 2026-04-18*
