# Project Research Summary

**Project:** Cosmology Group Website (UBA / FCEN)
**Domain:** Bilingual institutional/academic research group website (content-driven, statically generated)
**Researched:** 2026-04-17
**Confidence:** HIGH

## Executive Summary

This is a bilingual (Spanish-default, English-toggle) institutional website for an academic cosmology research group affiliated with UBA / FCEN / CONICET. Peer institutions (MPA, CCA, Perimeter, IAS, DAMTP/CTC, and LATAM-adjacent IAFE) converge on a remarkably consistent pattern: restrained typography-driven design, sectioned people roster (PIs -> Postdocs -> PhDs -> Undergrads -> Past), year-grouped publications with external identifiers (arXiv/DOI/ORCID), research-area narratives, outreach evidence, and a contact page with a map. The user-specified v1 page list (Home, People, Research, Publications, Outreach, Contact) matches this pattern directly — no top-level page is missing, though two peer-universal items (a seminar/events listing and a lightweight "how to join" signal) should be explicitly decided rather than silently dropped.

The recommended stack is **Next.js 16.2 + React 19.2 + TypeScript strict + Tailwind v4 + next-intl v4 + Zod v4 + schema-dts**, with **plain JSON content validated by Zod at build time**, **next/image** on Vercel with a **`images.unoptimized`-guarded static-export escape hatch**, and a **lazy-loaded Google Maps iframe** (no React library, no API key). The architecture is a thin RSC shell around a typed content layer: `content/*.json` is the source of truth, `src/content/*.ts` parses it through Zod schemas and exports typed accessors, pages render server-side, and the only client components are the language toggle, hero crossfade, and publications filter (URL-state via nuqs). A single `src/config/site.ts` owns group-wide identity so the placeholder name is a one-line swap.

The key risks are structural, not technical: (1) **i18n routing decisions ripple everywhere** — middleware works on Vercel but not under `output: 'export'`, so the dual-build contract must be enforced in CI on day 1; (2) **JSON content edited by non-technical users is a build-breaker without Zod validation + pre-commit hooks**; (3) **a hero carousel is the largest LCP/CLS/a11y risk** and should default to a restrained single or 2-3-slide crossfade honoring `prefers-reduced-motion`; (4) **translation-key divergence between `es.json` and `en.json` crashes production** unless `onError` + a CI diff check are wired during Phase 1; (5) **`mailto:` scraping is a real academic pain point** — emails must be obfuscated via a shared `<EmailLink>` component, enforced by a CI lint. All of these are prevented cheaply up front and expensive to retrofit.

## Key Findings

### Recommended Stack

The stack is the validated landing-page pattern with 2026 version bumps (Next.js 16 is current stable; React 19 is required by Next.js 16) plus academic-site-specific additions (`schema-dts`, `embla-carousel-react`). There is no CMS, no auth, no arXiv importer, no dark mode, no framer-motion, no shadcn bulk install — scope discipline is part of the recommendation. Vercel is the primary deploy target with a static-export path kept viable as an escape hatch for university hosting.

**Core technologies:**
- **Next.js 16.2.4** (App Router, RSC, SSG) — statically pre-renders bilingual pages; `generateStaticParams` on every `[locale]/[slug]` route; compatible with both Vercel and static export
- **React 19.2** — required by Next.js 16; server components keep client JS to a minimum
- **TypeScript 5.x strict** — non-negotiable for content schemas and i18n type inference
- **Tailwind v4.2.x** with OKLCH design tokens — CSS-first `@theme inline` matches the validated `design-tokens-starter.md` pattern
- **next-intl v4.9** with `localePrefix: 'as-needed'`, default `'es'` — standard App Router i18n; bilingual via `messages/{es,en}.json` for UI strings and `{ es, en }` objects for structured content
- **Zod v4** — parses `content/*.json` at build time; auto-derives TS types; crashes the build loudly on malformed content
- **schema-dts 2.0** — typed Schema.org for Organization/Person/ScholarlyArticle JSON-LD
- **embla-carousel-react** (only if hero uses more than 1 image) — ~10 KB, accessible, respects `prefers-reduced-motion`
- **next/font/google** — self-hosted Source Serif 4 / Inter (or equivalent academic pairing, decided in Phase 1 via ui-ux-pro-max)
- **Google Maps iframe (no library)** — zero bundle, no API key, `loading="lazy"` for CWV

### Expected Features

The v1 page list is correct for institutional credibility. Peer comparison confirms every page maps to what prospective PhDs, international peers, funders, and journalists expect.

**Must have (table stakes):**
- Home with group identity, tagline, institutional affiliation (UBA/FCEN/CONICET), partner logo strip
- People directory sectioned by role (PIs -> Postdocs -> PhDs -> Undergrads -> Past)
- Individual profile pages with photo, role, research interests, selected publications, external IDs (ORCID, arXiv, Google Scholar, CONICET)
- Research areas page with narrative paragraphs (not just names+icons) for Dark Matter, GW, Early Universe, AI
- Publications list year-grouped with filter (year + author + topic) and arXiv/DOI links per entry
- Outreach page ("Divulgación" in ES) — talks, workshops, school visits, articles
- Contact with postal address, email, embedded Google Map, social links
- Bilingual ES<->EN toggle with URL-based routing, language names in own language ("Español"/"English"), no flags
- WCAG AA compliance (contrast, keyboard nav, alt text, semantic HTML)
- SEO baseline: Schema.org (Organization + Person + ScholarlyArticle), OG/Twitter cards, sitemap.xml with hreflang alternates, robots.txt, favicon

**Should have (competitive differentiators):**
- Restrained typography-driven aesthetic (most academic sites fail this execution — it's a differentiator)
- Curated "selected publications" on PI pages (not full list)
- Research-interest prose (3-5 sentences, not keyword lists) on PI pages
- Past members with current affiliation (single field; strongest alumni-placement signal)
- Bilingual content *parity* (every page fully translated — common LATAM failure mode to skip)
- Lightweight "How to join" paragraph on People or Contact page (addresses prospective applicant audience at minimal cost)
- Funding/acknowledgements footer block (CONICET grant numbers)

**Defer (v1.x / v2+):**
- **Seminar/events listing** — confirm with user whether group runs a regular seminar; if yes, this is near-table-stakes
- News archive beyond 3 home-page highlight cards
- arXiv/ADS/ORCID auto-importer (scope black hole; placeholder JSON is adequate for v1)
- CMS backend (JSON-via-PR is the intentional choice)
- Member login / internal area, site-wide search, mobile app, dark mode, flashy animations, newsletter — all explicitly excluded

### Architecture Approach

A RSC-first App Router shell (`src/app/[locale]/...`) wraps a typed content layer. All content lives in `content/*.json` at the repo root (signals to non-technical editors "this is what you edit"), is parsed through Zod schemas in `src/content/schemas.ts`, and exposed via typed accessors (`src/content/people.ts`, etc.). Group-wide identity lives in `src/config/site.ts` (one-line placeholder swap). UI strings live in `messages/{es,en}.json`; structured bilingual content uses `{ en: string; es: string }` objects embedded in the records. Pages are server components; the only client components are the header menu + language toggle (`HeaderClient`), hero crossfade, and the publications filter (nuqs for URL state). Every dynamic segment declares `generateStaticParams` for static-export compatibility.

**Major components:**
1. **Content layer** (`content/*.json` + `src/content/*.ts` with Zod) — single source of truth; build-time validation boundary
2. **i18n layer** (`src/i18n/routing.ts` + `request.ts` + `navigation.ts` + `middleware.ts`) — locale detection on Vercel; `generateStaticParams` fallback for static export
3. **Layout shell** (`SiteHeader` + `HeaderClient` + `SiteFooter`) — language toggle, nav, affiliations strip; server/client split following `references/patterns/layout-shell.md`
4. **Page tree** (`app/[locale]/{home,people,research,publications,outreach,contact}`) — server-rendered from typed accessors; per-page `generateMetadata` + JSON-LD
5. **Site config** (`src/config/site.ts`) — group name, tagline, URL, affiliations, contact; consumed by metadata, layout, Schema.org
6. **Metadata/SEO layer** — shared `lib/metadata.ts` helper, `sitemap.ts` iterating locales x routes with `hreflang` alternates, `OrganizationJsonLd` on home, `PersonJsonLd` on each person page

### Critical Pitfalls

1. **Translation-key divergence crashes production** — missing `en.json` key for a new `es.json` addition throws when visitor toggles locale. Prevent via `onError`/`getMessageFallback` in `i18n/request.ts` + CI diff of key sets + TypeScript augmentation of the message schema. Phase 1.
2. **Malformed JSON kills the build** — one smart-quote or trailing comma from a non-technical editor via GitHub web UI breaks Vercel deploys. Prevent via Zod `.parse()` in every content loader + pre-commit hook + JSON Schema `$schema` reference for VS Code IntelliSense + `content/README.md` editor docs. Phase 2.
3. **`next/image` silently breaks static export** — default loader requires a Node server. Prevent via `images: { unoptimized: process.env.STATIC_EXPORT === 'true' }` + dual CI build (`build:vercel` and `build:static`) on every PR. Phase 1.
4. **Hero carousel destroys LCP/CLS/a11y** — auto-advance violates WCAG 2.2.2; all slides loading eagerly blows LCP; unset aspect-ratio shifts layout. Prevent via `priority` + `fetchPriority="high"` on slide 1 only, explicit `aspect-ratio` container, visible pause control, `prefers-reduced-motion` disables auto-advance (or use CSS-only fade for 3 slides, no library). Phase 3 build + Phase 6 polish verify.
5. **Language switcher loses current page + Schema.org `hreflang` missing** — default `<Link>` to `/` breaks `<html lang>` updates and query-param preservation; `sitemap.ts` without `alternates.languages` makes Google index only one locale. Prevent via next-intl's `useRouter().replace(pathname, { locale })` + `sitemap.ts` iterating `locales x routes` with `alternates.languages` + `x-default` pointing to ES. Phase 3 (switcher) + Phase 5 (sitemap/metadata).
6. **Email harvesting** — raw `mailto:` in rendered HTML floods PIs with predatory-journal spam. Prevent via shared `<EmailLink>` component with JS reveal + split-form JSON storage (`{ local, domain }`) + CI grep forbidding `mailto:` literals in JSX. Phase 3.

## Implications for Roadmap

Based on combined research, the architecture's phase-order dependency graph (Phase 1 foundation -> 2 content -> 3 shell -> 4 pages -> 5 SEO -> 6 polish) is the correct frame. Seven phases are recommended — the architecture's 6 phases plus a Phase 0 for design-system generation that must precede any UI work per `CLAUDE.md`.

### Phase 0: Design System & Project Bootstrap
**Rationale:** Typography-driven restrained aesthetic is a differentiator (most academic sites fail execution). The ui-ux-pro-max design-system run must happen before any UI tokens are written, per `CLAUDE.md`. Also installs the monorepo baseline (Next.js 16, TS strict, Tailwind v4, pnpm, ESLint 9 flat config, Prettier).
**Delivers:** `design-system/MASTER.md`, `globals.css` with OKLCH tokens, font pairing chosen (Source Serif 4 + Inter or equivalent), scaffolded `src/app/` with root layout, dual build scripts (`build:vercel`, `build:static`) wired in CI.
**Addresses features:** Restrained typography-driven aesthetic (differentiator); WCAG-AA-compatible contrast tokens.
**Avoids pitfalls:** #3 (next/image vs static export — configure dual-build now), #12 (font FOUT/CLS — variable font + subsets from day 1).

### Phase 1: i18n Foundation
**Rationale:** Retrofitting next-intl onto a single-locale app is painful; routing decisions (locale prefix, default locale, middleware vs static-export) ripple across every URL, link, sitemap entry, and JSON-LD record. Lock these before any page is built.
**Delivers:** `src/i18n/{routing,request,navigation}.ts`, `middleware.ts`, `messages/{es,en}.json` skeleton with `Navigation` + `Metadata` namespaces, `src/app/[locale]/layout.tsx`, `src/config/site.ts` with placeholder values, `onError`/`getMessageFallback` configured, CI diff script (`scripts/check-translations.ts`) that fails on key-set divergence, TS module augmentation for `next-intl`.
**Uses stack:** next-intl v4.9, TS strict, Zod (for eventual schemas).
**Avoids pitfalls:** #1 (translation-key divergence — `onError` + CI diff in place before any content lands), #16 (ARIA in one language — pattern enforced via `t()` from day 1).

### Phase 2: Content Layer
**Rationale:** Schemas must be locked before pages consume them — building a `PersonCard` before `people.json` shape is stable guarantees rework. Zod validation at import time is the build-time contract that lets non-technical editors edit JSON safely.
**Delivers:** `src/content/schemas.ts` (Person, Publication, ResearchArea, Outreach with `BilingualText` helper, slug uniqueness + ASCII-only regex, `photo` existence check, `current_affiliation` on past members); `src/content/*.ts` typed accessors with derived fields (e.g., `peopleByCategory`); placeholder `content/*.json` files that *stress-test* the schema (long names, portrait photos, optional fields exercised); `content/README.md` with editor workflow; pre-commit hook + CI that parses all content before `next build`.
**Implements architecture:** Pattern 1 (Content-as-Code with Zod validation boundary).
**Avoids pitfalls:** #4 (malformed JSON kills build — Zod + pre-commit + CI), #5 (missing photo references — build fails on missing files; placeholder avatar component), #9 (placeholder-to-real breaks layout — stress-test placeholders now), #15 (slug collisions / non-ASCII — Zod uniqueness + regex), #18 (contact-info drift — `site.config.ts` is single source).

### Phase 3: Layout Shell & Navigation
**Rationale:** Every page depends on the header/footer and language switcher. Getting the server/client split right once (per validated `layout-shell.md` pattern) avoids `useTranslations`-in-client-bundle creep later.
**Delivers:** `SiteHeader` (RSC) + `HeaderClient` (client) with language toggle using `router.replace(pathname, { locale })`, mobile menu, active-link indicator; `SiteFooter` with affiliations strip (UBA/FCEN/CONICET) and socials; `<html lang>` set from params; reusable `<EmailLink>` obfuscation component; CI lint forbidding raw `mailto:` in JSX.
**Implements architecture:** Pattern 2 (Server-Fetch-Data, Client-Interact); Pattern 4 (metadata driven by `site.config.ts`).
**Avoids pitfalls:** #6 (language switcher loses current page — use `router.replace`), #8 (email harvesting — `<EmailLink>` + CI grep), #16 (ARIA translated via `t()`).

### Phase 4: Core Pages (parallelizable across pages)
**Rationale:** Once schemas + shell exist, the six pages are independent component trees — home, people (list + `[slug]`), research, publications, outreach, contact. Can be parallelized across developers/agents. Each page ships with its own `generateMetadata` + tests.
**Delivers:**
- **Home** — restrained hero (single image or 2-3-slide CSS crossfade honoring `prefers-reduced-motion`; no auto-advance library unless pause control added), tagline, 3 highlight cards linking to research areas, partner logo strip
- **People list + `[slug]` detail** — sectioned roster (PIs -> Postdocs -> PhDs -> Undergrads -> Past); detail pages for PIs/Postdocs/PhDs only, with external IDs (ORCID, arXiv, Google Scholar, CONICET), selected publications, bio, `<EmailLink>`
- **Research** — grid of 4 areas with substantive narrative per area
- **Publications** — server shell + `PublicationsFilter` client component with nuqs for URL-state filtering by year/author/topic; arXiv + DOI links per entry
- **Outreach** ("Divulgación") — grid of activities
- **Contact** — address, lazy-loaded Google Maps iframe (`aspect-ratio` container, `loading="lazy"`, or facade pattern if CWV suffers), `<EmailLink>`, socials
- **"How to join" paragraph** on People or Contact page
**Uses stack:** next-intl `getTranslations`, `next/image`, embla or CSS crossfade, nuqs.
**Addresses features:** All table-stakes + "curated selected pubs" + "research-interest prose" + bilingual parity.
**Avoids pitfalls:** #2 (hero LCP/CLS/a11y — explicit aspect-ratio, `priority` on slide 1 only, reduced-motion respected), #10 (publications unmaintainable — schema matches arXiv/ADS shape now; filter perf tested at 200 entries), #13 (Maps perf — lazy + facade), #14 (carousel as critical content — highlights live in a grid, not slides), #17 (mixed-language content — `<span lang="en">` for paper titles on ES pages).

### Phase 5: SEO, Schema.org & Sitemap
**Rationale:** Sitemap + hreflang are blockers for Google indexing of the second locale. Must land after all pages exist so URL-set is known. Academic audience literally Googles groups — SEO credibility is feature-parity with content credibility.
**Delivers:** `src/app/sitemap.ts` iterating `locales x routes` with `alternates.languages` + `x-default` -> ES; `src/app/robots.ts`; shared `lib/metadata.ts` with per-page `generateMetadata` (title, canonical, hreflang alts, OG, Twitter card); `OrganizationJsonLd` / `ResearchOrganization` on home only; `PersonJsonLd` on each `/people/[slug]`; `ScholarlyArticle` JSON-LD on publication items; static OG PNG (dynamic next/og deferred — incompatible with static export unless fully pre-rendered).
**Uses stack:** `schema-dts` typed JSON-LD, Next.js `MetadataRoute`.
**Avoids pitfalls:** #7 (hreflang missing from sitemap), duplicate Organization on every page.

### Phase 6: Polish, A11y & Performance
**Rationale:** WCAG AA, CWV, and static-export smoke test can only be verified once all pages exist. This is also where the reduced-motion and stress-tested-placeholder work converges.
**Delivers:** Axe/Lighthouse passes per page (LCP < 2.5s mobile, CLS < 0.1, TBT < 200ms on contact page); keyboard nav test; screen-reader spot check on home, people, contact; 404 pages at root + `[locale]` scopes; static-export smoke test via `STATIC_EXPORT=true pnpm build && npx serve out`; printable publications CSS (cheap PI win); funding acknowledgements footer block (content permitting).
**Addresses features:** WCAG AA compliance; printable publications.
**Avoids pitfalls:** All remaining — verifies prevention from prior phases actually held.

### Phase 7 (post-launch / ops): Link-rot & Content Ops
**Rationale:** Link rot accumulates at ~25%/2yr -> 66%/9yr; weekly `lychee` check + auto-issue prevents silent decay. Only needed after v1 ships.
**Delivers:** GitHub Action running `lychee` weekly over `content/**/*.json`; auto-issue with broken links; `checked_at` field in external-link schemas.
**Avoids pitfalls:** #11 (link rot).

### Phase Ordering Rationale

- **Dependencies:** Design tokens precede UI (CLAUDE.md); i18n routing precedes pages (retrofit is painful); schemas precede content (prevents rework); content + shell precede pages (pages consume both); pages precede sitemap (URL-set must be known); all above precede CWV audit (can't measure what doesn't exist).
- **Parallelization:** Phase 4's six pages are independent and should be parallelized across agents/developers; Phase 5's JSON-LD blocks can run per-page-parallel; Phase 6's a11y audits are per-page-parallel.
- **Pitfall prevention is front-loaded:** Phase 1 wires `onError` + CI translation diff before any content lands; Phase 1 wires dual-build CI before any `next/image` usage hardens; Phase 2 wires Zod before any page imports JSON. Every critical pitfall has a prevention hook in a phase that precedes where the pitfall would manifest.
- **Scope discipline:** All v2 deferrals (arXiv importer, CMS, dark mode, member login, seminar-listing-if-no-seminar) stay out of phase scope. The "how to join" paragraph and the seminar confirmation question stay surfaced to the user without auto-expanding scope.

### Research Flags

**Phases likely needing deeper research during planning (`/gsd:research-phase`):**
- **Phase 3 (Layout Shell)** — the server/client split with next-intl-aware language toggle has multiple subtle edge cases (locale preservation on dynamic `[slug]` routes, `<html lang>` update, query-param preservation, `as-needed` vs `always` prefix behavior). Worth a focused research pass even though `references/patterns/layout-shell.md` covers most of it.
- **Phase 5 (SEO / Schema.org)** — hreflang + `x-default` + `alternates.canonical` under `localePrefix: 'as-needed'` has known edge cases (see next-intl issues #647, #1845). Verify before shipping.
- **Phase 6 (Static export smoke test)** — only Phase that exercises a second deploy target; if the group's actual hosting is decided here, research into `next-image-export-optimizer` or custom loader becomes live.

**Phases with standard patterns (skip phase-level research):**
- **Phase 0 (Design System & Bootstrap)** — ui-ux-pro-max + `design-tokens-starter.md` are already validated.
- **Phase 1 (i18n Foundation)** — `references/patterns/i18n-next-intl.md` covers this end-to-end, validated 2026-03.
- **Phase 2 (Content Layer)** — Zod + JSON is a plain pattern; schemas are a design exercise, not a research one.
- **Phase 4 (Core Pages)** — per-page implementation uses already-researched patterns (next/image, embla, nuqs). Page-specific questions, if any, are small enough to resolve inline.
- **Phase 7 (Link-rot ops)** — `lychee` + GitHub Actions is boilerplate.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified against official 2026-04 sources (Next.js blog, GitHub releases, next-intl releases); `embla-carousel-react` and `schema-dts` MEDIUM but well-established; one LOW flag on `next-image-export-optimizer` (only a contingent fallback). |
| Features | HIGH | Peer institutional sites reviewed directly (MPA, IAS, CCA, Perimeter, DAMTP/CTC, IAFE); multilingual UX and carousel anti-pattern guidance triangulated across multiple sources; user v1 list validated without material gaps. |
| Architecture | HIGH | Next.js 15/16 + next-intl patterns validated in prior landing-page project; static-export constraints verified against current Next.js docs; reference-pattern files already exist for i18n, SEO, layout-shell, design-tokens. |
| Pitfalls | HIGH (framework traps) / MEDIUM (academic-site anti-patterns) | Framework pitfalls cited directly from next-intl and Next.js official docs and GitHub issues; academic anti-patterns verified against multiple community sources and standards (W3C WAI, WebAIM). Link-rot statistics from Ahrefs + academic studies. |

**Overall confidence:** HIGH

### Gaps to Address

- **Seminar/events listing decision:** Cosmology peer groups universally run weekly seminars; if the UBA group does, a seminar page is near-table-stakes. *Handling:* flag to user at roadmap-approval time; add Phase 4b (events.json + listing) only if confirmed.
- **Deploy target is ambiguous in PROJECT.md** ("Vercel-first with static-export escape hatch"). *Handling:* build both paths from Phase 1 and test both in CI on every PR; defer the "which wins" decision to post-v1 ops.
- **Group name and email are placeholders.** *Handling:* `src/config/site.ts` abstraction already handles this; real values land in a single one-line edit at user-confirmation time.
- **Font pairing is TBD.** *Handling:* Phase 0 runs ui-ux-pro-max with project-specific keywords per CLAUDE.md; design-system output locks pairing.
- **Tailwind v4.2.2 exact release date has a source discrepancy.** *Handling:* resolve at Phase 0 setup via `npm view tailwindcss version`; low impact (v4.x API stable).
- **Whether the group releases public software/datasets.** *Handling:* not in v1 scope; if confirmed later, additive (separate Software page).
- **Whether "Past Members" need `current_affiliation`.** *Handling:* schema in Phase 2 adds the optional field preemptively — cheaper to have and not use than to retrofit.

## Sources

### Primary (HIGH confidence)

**Stack / architecture:**
- Next.js 16.2 release blog (2026-03-18), Static Exports guide (v16.2.4), Image component API, `generateStaticParams` reference
- next-intl v4.9.1 release notes, Routing configuration, Middleware & Static Export constraints
- Zod v4.3.6 docs, schema-dts 2.0.0 (Google Open Source)
- Tailwind CSS v4.2.x GitHub releases
- Internal validated references: `references/patterns/i18n-next-intl.md`, `references/patterns/seo-metadata.md`, `references/patterns/layout-shell.md`, `references/patterns/design-tokens-starter.md`

**Features (peer institutional sites):**
- MPA Garching, IAS Natural Sciences (Princeton), Flatiron CCA, Perimeter Institute, DAMTP/CTC Cambridge, IAFE (Buenos Aires, LATAM peer)
- Cambridge/Imperial/UW-Madison/UC Davis cosmology seminar pages (evidence of seminar universality)

**Pitfalls (framework traps):**
- next-intl docs + issues #647, #1845 (localePrefix edge cases)
- Next.js static-exports guide, image-API-error doc, font optimization doc
- W3C WAI Carousels Tutorial, WebAIM Animation and Carousels
- Schema.org Organization/Person/ResearchProject specs

### Secondary (MEDIUM confidence)

- Digital.gov multilingual best practices, Weglot language-selector guide (flags-vs-names, top-corner placement)
- NN/G, Baymard, CXL carousel-anti-pattern studies
- azu/next-intl-example repo (working `output: 'export'` pattern)
- Spencer Mortensen email-obfuscation study (2026), Cloudflare Email Address Obfuscation
- web.dev embed-best-practices, Chrome lazy-loading-third-parties (Maps facade guidance)
- Ahrefs link-rot study (66.5% dead at 9 years), Leitner SE-research broken-links study
- Academic lab website best-practice guides (theacademicdesigner.com, jedyang.com)

### Tertiary (LOW confidence)

- Tailwind v4.2.2 exact release date (GitHub vs one secondary source disagree) — resolve at Phase 0 via `npm view`
- Font pairing for academic aesthetic — defer to Phase 0 ui-ux-pro-max run
- `next-image-export-optimizer` (suggested only as fallback if static hosting becomes primary)

---
*Research completed: 2026-04-17*
*Ready for roadmap: yes*
