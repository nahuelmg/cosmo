---
phase: 05-seo-discoverability
plan: 01
subsystem: seo
tags: [next-intl, schema-org, metadata, json-ld, seo, i18n]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: next-intl routing + pathnames config (routing.ts, navigation.ts, getPathname)
  - phase: 02-content-layer
    provides: siteConfig object, Person/Publication types, localize() + Locale
  - phase: 04-core-pages
    provides: stable URL set (7 static routes + /people/[slug]) and public/Portadas assets
provides:
  - siteConfig.url env-driven canonical base URL
  - messages `seo` namespace (home/people/research/publications/journalClub/outreach/contact) × es+en
  - buildPageMetadata() helper (canonical + hreflang + OG + Twitter in one call)
  - buildOrganizationSchema / buildPersonSchema / buildScholarlyArticleSchema (NAV-03 compliant)
  - JsonLd server component with </script>-injection-safe escaping
affects: [05-02, 05-03, 05-04, 05-05, 06-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Centralised SEO helper (single-call metadata composition)"
    - "Schema.org builders as pure functions, email-free (NAV-03)"
    - "All URL construction routed through getPathname (pathnames config single source of truth)"
    - "XSS-safe JSON-LD via < -> \\u003c escape"

key-files:
  created:
    - .env.example
    - src/lib/metadata.ts
    - src/lib/schemas.ts
    - src/components/seo/JsonLd.tsx
  modified:
    - src/config/site.ts
    - messages/es.json
    - messages/en.json

key-decisions:
  - "siteConfig.url falls back to https://cosmo.vercel.app when NEXT_PUBLIC_SITE_URL is unset"
  - "home locale title is 'Inicio' / 'Home' but plan 05-03 will use title.absolute to suppress template suffix"
  - "ResearchOrganization exposes contactPoint.url via getPathname (not hardcoded /contacto|/contact ternary)"
  - "Person schema: ORCID as identifier (PropertyValue), scholar + social_links as sameAs, email omitted"

patterns-established:
  - "Href type extracted from getPathname parameters keeps routing.ts as single source of truth"
  - "Schema builder convention: start with base object, add optional fields via conditional assignment (avoids spread-on-undefined type friction)"

# Metrics
duration: 3 min
completed: 2026-04-18
---

# Phase 5 Plan 1: SEO Foundation Summary

**siteConfig.url env-driven canonical base, bilingual `seo` messages namespace, and shared SSG-safe helpers (buildPageMetadata, schema builders, JsonLd) — wave-1 prerequisites for 05-02..05-05.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-18T16:20:44Z
- **Completed:** 2026-04-18T16:23:57Z
- **Tasks:** 2
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- `siteConfig.url` wired via `process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmo.vercel.app"` — single canonical base URL threaded through every downstream SEO surface.
- Both message files gained a parity-verified `seo` namespace with hand-authored Spanish + English descriptions for all 7 pages (home / people / research / publications / journalClub / outreach / contact).
- `buildPageMetadata()` helper composes canonical + hreflang alternates (`es`, `en`, `x-default` → `es`) + Open Graph + Twitter card metadata from a single `{ locale, href, title, description }` call.
- Three JSON-LD schema builders (`buildOrganizationSchema`, `buildPersonSchema`, `buildScholarlyArticleSchema`) produce Schema.org payloads with zero email leakage (NAV-03).
- `JsonLd` server component renders `<script type="application/ld+json">` with `"<" → "\u003c"` escaping to neutralise `</script>` injection.
- Build remains fully static: 43 prerendered pages (all `○` or `●` SSG), zero SSR regression from the new helpers.

## Task Commits

Each task was committed atomically:

1. **Task 1: siteConfig.url, .env.example, seo messages namespace** — `2ef02e5` (feat)
2. **Task 2: buildPageMetadata + schema builders + JsonLd component** — `ae68cf8` (feat)

## Files Created/Modified

**Created:**
- `.env.example` — documents `NEXT_PUBLIC_SITE_URL` for future env-specific overrides
- `src/lib/metadata.ts` — exports `buildPageMetadata(options)` → `Metadata`; extracts Href type from `getPathname` parameters so routing.ts remains the single source of truth
- `src/lib/schemas.ts` — exports `buildOrganizationSchema(locale)`, `buildPersonSchema(person, locale)`, `buildScholarlyArticleSchema(pub)`
- `src/components/seo/JsonLd.tsx` — server component (no `'use client'`) injecting `<script type="application/ld+json">` with XSS-safe `<` escape

**Modified:**
- `src/config/site.ts` — added `url` field next to `groupName` (env-driven with fallback)
- `messages/es.json` — added top-level `"seo": { ... }` object (7 page entries, Spanish)
- `messages/en.json` — added matching `"seo": { ... }` object (7 page entries, English)

## Exports

**`src/lib/metadata.ts`:**
- `buildPageMetadata(options: BuildPageMetadataOptions): Metadata`
- `BuildPageMetadataOptions` interface (exported)

**`src/lib/schemas.ts`:**
- `buildOrganizationSchema(locale: Locale)`
- `buildPersonSchema(person: Person, locale: Locale)`
- `buildScholarlyArticleSchema(pub: Publication)`

**`src/components/seo/JsonLd.tsx`:**
- `JsonLd({ data }: { data: Record<string, unknown> })`

## `seo` keys written (per locale)

Both `messages/es.json` and `messages/en.json` now carry:

```
seo.home.{title, description}
seo.people.{title, description}
seo.research.{title, description}
seo.publications.{title, description}
seo.journalClub.{title, description}
seo.outreach.{title, description}
seo.contact.{title, description}
```

Spanish titles: "Inicio", "Personas", "Investigación", "Publicaciones", "Journal Club", "Divulgación", "Contacto".
English titles: "Home", "People", "Research", "Publications", "Journal Club", "Outreach", "Contact".

Descriptions are hand-authored at 140–170 characters per locale (verbatim from the plan's draft; user can refine copy post-hoc without touching helpers).

## Build Status (PERF-01 smoke test)

`pnpm build` result — all existing pages remain statically prerendered:

```
Route (app)
┌ ○ /_not-found
├ ● /[locale]                  (/es, /en)
├ ● /[locale]/contact          (/es/contact, /en/contact)
├ ● /[locale]/journal-club     (/es/journal-club, /en/journal-club)
├ ● /[locale]/outreach         (/es/outreach, /en/outreach)
├ ● /[locale]/people           (/es/people, /en/people)
├ ● /[locale]/people/[slug]    (/es/people/<slug>, /en/people/<slug>) — 26 slugs total
├ ● /[locale]/publications     (/es/publications, /en/publications)
└ ● /[locale]/research         (/es/research, /en/research)

ƒ Proxy (Middleware)

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses generateStaticParams)
```

No page is marked `λ` (Dynamic) or server-rendered. The sole `ƒ` entry is the next-intl Proxy middleware, which is the expected/unchanged Edge middleware — not a page regression.

Total pages prerendered: 43 (2 locales × ~8 routes + /_not-found + 26 /people/[slug] slugs).

## Env var behaviour (observed)

- With `NEXT_PUBLIC_SITE_URL` unset (current dev + build env), `siteConfig.url === "https://cosmo.vercel.app"`. Verified via the passing build — every canonical URL expression consistent against the fallback.
- Vercel production deploy should set `NEXT_PUBLIC_SITE_URL` to the real domain once claimed; no code change needed.

## Constraint audit (NAV-03 + PERF-01)

- **NAV-03:** `rg '"email"' src/lib/schemas.ts` → 0 hits. The token `email` only appears in explanatory comments (lines 7, 73, 75, 106). ResearchOrganization uses `contactPoint.url` via `getPathname({ locale, href: "/contact" })`; Person uses ORCID identifier + `sameAs` for academic identity.
- **PERF-01:** Helpers use only module-level imports (`getPathname`, `siteConfig`, `localize`) and explicit `locale` arguments. No calls to `cookies()`, `headers()`, or `connection()`. Build output confirms every page is `○`/`●`.

## Decisions Made

- **Home locale title is "Inicio" / "Home" in the seo namespace even though the home page will render with `title.absolute`.** The value is still needed for OG/Twitter title prefix composition (`"Grupo de Cosmología — Inicio"` in social cards). Plan 05-03 will set `title: { absolute: siteConfig.groupName }` on the home page to suppress only the `<title>` element suffix. This means the OG/Twitter title will still read `"Grupo de Cosmología — Inicio"` — 05-03 can override via `absoluteTitle: true` on the home call to `buildPageMetadata` if a different social-card shape is desired.
- **`BuildPageMetadataOptions` interface exported alongside the function** so downstream plans can typecheck their option objects before passing them in.
- **`Href` type extracted via `Parameters<typeof getPathname>[0]["href"]`** — keeps the type in lockstep with `routing.ts` pathnames without a parallel type declaration.
- **Schema builders use conditional property assignment (`if (...) schema.x = ...`) instead of spread-with-ternary-undefined.** Cleaner narrowing under `exactOptionalPropertyTypes`-style strictness; the Record<string, unknown> base accepts dynamic keys without ceremony.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Setting `NEXT_PUBLIC_SITE_URL` in the Vercel dashboard is a deploy-time action, not a local-dev prerequisite (the fallback `https://cosmo.vercel.app` covers builds and social previews until a real domain is assigned).

## Next Phase Readiness

- **05-02** (root locale layout metadata + ResearchOrganization JSON-LD on every page) can import `buildPageMetadata`, `buildOrganizationSchema`, and `JsonLd` directly from their new locations.
- **05-03** (per-page generateMetadata + ScholarlyArticle schema per publication) has the `seo.{page}.{title,description}` keys and `buildScholarlyArticleSchema` ready.
- **05-04** (/people/[slug] generateMetadata + Person JSON-LD) has `buildPersonSchema` with NAV-03-compliant output.
- **05-05** (sitemap.ts + robots.ts) has `siteConfig.url` as the canonical base.
- Pathnames config (`routing.ts`) remains the single source of truth for every URL computation downstream — no hardcoded `/contacto` / `/contact` strings in any helper.

---
*Phase: 05-seo-discoverability*
*Completed: 2026-04-18*
