# Project Milestones: Cosmology Group Website (UBA / FCEN)

## v1.0 MVP (Shipped: 2026-04-18)

**Delivered:** Bilingual (es default / en toggle) institutional website for the Cosmology Group at UBA-FCEN — 45 fully static routes, Schema.org-structured, WCAG-AA accessible, ready to deploy to Vercel.

**Phases completed:** 1-6 (31 plans total)

**Key accomplishments:**

- **Foundation + design system** — Next.js 16 App Router + TypeScript strict + Tailwind v4 with CSS-first `@theme` OKLCH tokens, Source Serif 4 + Source Sans 3 with Greek subset self-hosted via `next/font` (no FOUT/FOIT), warm-academic palette locked in `design-system/cosmology-group-uba/MASTER.md` + OVERRIDES.md.
- **Typed content layer with build-time validation** — Zod v4 strict schemas for 5 content types (people, publications, research, journal-club, outreach) with bilingual field helpers, prebuild validator that fails on smart quotes / missing photos / malformed data, JSON Schema files for VS Code IntelliSense, `@/content` barrel exporting 23 typed accessors.
- **Accessible layout shell with i18n-aware navigation** — next-intl 4.9 routing with path translation (`/es/personas` ↔ `/en/people`), locale toggle that preserves current path + query, Radix Dialog mobile drawer, skip-link + `<main id="main-content">` landmark in locale layout only, `EmailLink` two-file obfuscation pattern guaranteeing zero `mailto:` in prerendered HTML.
- **Eight pages rendering real placeholder content** — Home (hero carousel with `prefers-reduced-motion` + `document.hidden` pause), People list (5 sections) + 13 `/people/[slug]` detail pages via `generateStaticParams`, Research / Publications (year-grouped) / Journal Club / Outreach / Contact (lazy-loaded Google Maps via IntersectionObserver, crawlable fallback) — all SSG, all bilingual, all consuming the typed accessors.
- **SEO end-to-end** — per-page `generateMetadata` with canonical + `hreflang` (es / en / x-default), ResearchOrganization JSON-LD on every page via locale layout, Person JSON-LD on detail pages, 13 ScholarlyArticle JSON-LD blocks on Publications, `sitemap.xml` with 20 canonical URLs + `<xhtml:link>` alternates built via `getPathname` (single source of truth), `robots.ts` gated on `VERCEL_ENV === "production"`.
- **WCAG AA + performance baseline** — axe-core CLI: 0 violations across 8 Spanish pages, carousel a11y upgrade (aria-live, slide attrs, focus-within pause, keyboard-operable controls), contrast tokens revised, `pnpm build` emits 45 fully-static routes with 0 SSR fallback, NAV-03 zero-email grep guard passing.

**Stats:**

- 31 plans across 6 phases (1:4, 2:5, 3:5, 4:8, 5:5, 6:4)
- 45 static routes prerendered (all `/es/*` + `/en/*` + `/people/[slug]` × 13 × 2 locales + sitemap + robots)
- 158 commits from scaffold to ship
- Timeline: 2026-04-17 → 2026-04-18 (2 days)
- 73/75 v1 requirements satisfied; 2 scope-adjusted (PUBS-03/04 filter UI + URL-synced state deferred beyond Phase 4)

**Git range:** `feat(01-01): Next.js 16 scaffold` → `docs(06): complete polish-a11y-performance phase`

**Deferred to production re-measurement:** PERF-02 (CLS on 7 of 8 pages), PERF-04 (LCP mobile 4G on Home/People/Publications), PERF-05 (Contact LCP element). Localhost `pnpm start` is a pessimistic LCP proxy — final numbers land after Vercel deployment.

**Technical debt:** NAV-04 mobile drawer 375px live-deploy verification, HeroCarousel pause/reduced-motion/MapEmbed IntersectionObserver runtime checks, MobileNav.tsx `focus:outline-none` (visible focus ring present via box-shadow), latent `next/link` dead import in `SiteFooter.tsx:1`.

**What's next:** v1.1 — Connect PIs / postdocs / PhDs to arXiv + InspireHEP profiles so publications auto-populate on `/publications` and individual person pages (addresses v1 "Out of Scope: Real publication import" — scope revisited post-v1.0).

---
