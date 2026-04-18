---
phase: 05-seo-discoverability
verified: 2026-04-18T19:30:00Z
status: passed
score: 26/26 must-haves verified
re_verification: false
---

# Phase 5: SEO & Discoverability Verification Report

**Phase Goal:** "The site is fully indexable in both locales with correct canonicals, hreflang alternates, Schema.org structured data, OG / Twitter cards, sitemap, and robots — institutional credibility through search."

**Verified:** 2026-04-18
**Status:** passed
**Re-verification:** No — initial verification.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every user-facing route emits canonical + hreflang alternates (es, en, x-default) | PASS | 40 / 40 prerendered HTMLs contain `canonical` tag; all 8 pages call `buildPageMetadata({ locale, href })` which emits `alternates.canonical` + `alternates.languages.{es,en,x-default}` (src/lib/metadata.ts:63-69) |
| 2 | ResearchOrganization JSON-LD on every page via layout | PASS | 40 / 40 prerendered HTMLs contain `"ResearchOrganization"` (JsonLd rendered inside `<body>` of `src/app/[locale]/layout.tsx:95`) |
| 3 | Person JSON-LD on every `/people/[slug]` page | PASS | `buildPersonSchema` imported + `<JsonLd>` rendered at src/app/[locale]/people/[slug]/page.tsx:91; 26 HTMLs (13 slugs × 2 locales) contain `"@type":"Person"` |
| 4 | ScholarlyArticle JSON-LD per publication | PASS | 26 ScholarlyArticle blocks in each of `/es/publications.html` and `/en/publications.html` (one per pub), via src/app/[locale]/publications/page.tsx:44-49 |
| 5 | OG + Twitter cards on every page | PASS | 40 / 40 HTMLs contain `og:title`; `buildPageMetadata` returns full `openGraph` (title, description, url, siteName, locale, type, images) + `twitter` (card: summary_large_image, title, description, images) — src/lib/metadata.ts:71-85 |
| 6 | Sitemap.xml lists 20 canonical URLs with xhtml:link alternates | PASS | `.next/server/app/sitemap.xml.body` contains exactly 20 `<url>` entries (7 static × 1 + 13 people × 1), each with three `xhtml:link` alternates (es/en/x-default) |
| 7 | Sitemap uses getPathname, no hardcoded localized paths | PASS | src/app/sitemap.ts:19-60 routes every URL through `getPathname({ locale, href })`; emitted XML shows localized paths `/personas`, `/investigacion`, `/divulgacion`, `/contacto` as expected |
| 8 | robots.txt gates on VERCEL_ENV === "production" | PASS | src/app/robots.ts:7 reads `process.env.VERCEL_ENV === "production"`; current build (no env set) emits `Disallow: /` + `Sitemap: https://cosmo.vercel.app/sitemap.xml` (visible in `.next/server/app/robots.txt.body`) |
| 9 | All routes remain statically prerendered | PASS | 45 routes in prerender-manifest.json (all static); sitemap.xml.body and robots.txt.body exist (static file convention); no λ functions in app-paths-manifest.json |

**Score:** 9 / 9 truths verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/config/site.ts` | siteConfig.url from env | PASS | Line 50: `url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmo.vercel.app"` |
| `src/lib/metadata.ts` | buildPageMetadata export | PASS | 88 lines; exports `buildPageMetadata` + `BuildPageMetadataOptions` |
| `src/lib/schemas.ts` | 3 schema builders, no email | PASS | 137 lines; exports `buildOrganizationSchema`, `buildPersonSchema`, `buildScholarlyArticleSchema`; `rg '"email"'` returns zero hits |
| `src/components/seo/JsonLd.tsx` | Server component with `</script>` escape | PASS | 26 lines; uses `\u003c` replacement at line 22 |
| `src/app/[locale]/layout.tsx` | metadataBase + title template + JsonLd | PASS | Line 36 `metadataBase: new URL(siteConfig.url)`; line 39 template; line 95 `<JsonLd data={buildOrganizationSchema(locale)} />` |
| `src/app/[locale]/page.tsx` | generateMetadata with absoluteTitle | PASS | Line 13 generateMetadata, line 25 `absoluteTitle: true` |
| `src/app/[locale]/people/page.tsx` | generateMetadata | PASS | Uses buildPageMetadata({ href: '/people' }) |
| `src/app/[locale]/research/page.tsx` | generateMetadata | PASS | Uses buildPageMetadata({ href: '/research' }) |
| `src/app/[locale]/publications/page.tsx` | generateMetadata + ScholarlyArticle JSON-LD | PASS | generateMetadata at line 13; JsonLd loop at 44-49 |
| `src/app/[locale]/journal-club/page.tsx` | generateMetadata | PASS | Uses buildPageMetadata({ href: '/journal-club' }) |
| `src/app/[locale]/outreach/page.tsx` | generateMetadata | PASS | Uses buildPageMetadata({ href: '/outreach' }) |
| `src/app/[locale]/contact/page.tsx` | generateMetadata | PASS | Uses buildPageMetadata({ href: '/contact' }) |
| `src/app/[locale]/people/[slug]/page.tsx` | generateMetadata + Person JSON-LD | PASS | generateMetadata at line 36; `<JsonLd data={buildPersonSchema(rawPerson, locale)} />` at line 91 |
| `src/app/sitemap.ts` | MetadataRoute.Sitemap default export | PASS | 82 lines; default export builds 7 static + 13 people entries via getPathname |
| `src/app/robots.ts` | MetadataRoute.Robots default export | PASS | 16 lines; VERCEL_ENV-gated rules + sitemap URL |
| `messages/es.json` + `messages/en.json` | `seo` namespace with 7 keys | PASS | Both files contain the `seo` namespace (21 key occurrences = 7 pages × {title,description,section-marker} per file, parity ok) |
| `.env.example` | NEXT_PUBLIC_SITE_URL documented | PASS | Present with explanatory comment |

### Key Link Verification

| From | To | Via | Status |
|------|-----|-----|--------|
| src/lib/metadata.ts | @/i18n/navigation | getPathname({ locale, href }) | WIRED (line 52-53) |
| src/lib/metadata.ts | siteConfig | `${siteConfig.url}${...}` | WIRED (line 54-55) |
| src/lib/schemas.ts | @/i18n/navigation | getPathname for contactUrl | WIRED (line 33-36) |
| src/app/[locale]/layout.tsx | schemas.ts + JsonLd | `<JsonLd data={buildOrganizationSchema(locale)} />` | WIRED (line 95) |
| src/app/[locale]/people/[slug]/page.tsx | schemas.ts + JsonLd | `<JsonLd data={buildPersonSchema(...)} />` | WIRED (line 91) |
| src/app/[locale]/publications/page.tsx | schemas.ts | `buildScholarlyArticleSchema(pub)` per entry | WIRED (line 47) |
| src/app/sitemap.ts | @/i18n/navigation + getPeople | getPathname per locale + `getPeople().filter(pi/postdoc/phd)` | WIRED (lines 19-60) |
| src/app/robots.ts | siteConfig | `${siteConfig.url}/sitemap.xml` | WIRED (line 13) |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| SEO-01 (OG + Twitter per page) | SATISFIED | 40/40 HTMLs have og:title; buildPageMetadata emits full OG+Twitter |
| SEO-02 (canonical + hreflang + x-default) | SATISFIED | 40/40 HTMLs have canonical; alternates.languages includes es/en/x-default |
| SEO-03 (ResearchOrganization JSON-LD in layout) | SATISFIED | 40/40 HTMLs contain ResearchOrganization via layout JsonLd |
| SEO-04 (Person JSON-LD on /people/[slug]) | SATISFIED | 26 slug HTMLs (13×2) contain `"@type":"Person"` |
| SEO-05 (sitemap.xml with both-locale alternates + x-default) | SATISFIED | Sitemap has 20 URLs, each with xhtml:link es/en/x-default |
| SEO-06 (robots.txt at root) | SATISFIED | robots.txt served with VERCEL_ENV gating + sitemap reference |

### Cross-Phase Constraints

**NAV-03 (no email / mailto in prerendered HTML):** PASS
- `rg '"email"' src/lib/schemas.ts` → zero hits
- `rg 'mailto:|"email"' .next/server/app/*.html` (glob *.html across 40 prerendered files) → zero matches
- Organization JSON-LD uses `contactPoint.url` → localised `/contacto` or `/contact` page (src/lib/schemas.ts:44-48)
- Person JSON-LD explicitly omits email (src/lib/schemas.ts:106 comment: "NAV-03: no email key — omitted entirely")

**PERF-01 (every page statically prerendered):** PASS
- prerender-manifest.json: 45 statically prerendered routes (2 locale home + 12 locale static pages + 26 people slug pages + 4 system = 45 aligns with build output)
- app-paths-manifest.json shows only page + route (no function handlers)
- sitemap.xml.body + robots.txt.body exist as static file artifacts (not runtime routes)
- No λ dynamic routes introduced by Phase 5

### Anti-Patterns Found

None. The codebase does not contain TODO / FIXME / placeholder content in the Phase 5 files. `mailto:` appears only in an explanatory comment inside `src/lib/schemas.ts:27` and the email `t('email')` label on PersonDetail is a translation key label for the on-page UI, not a schema emission.

### Human Verification Required

None required for passage. Optional live-site spot checks once deployed:
1. Google Rich Results Test on `/es` and `/en/people/esteban-calzetta` — expect "ResearchOrganization" and "Person" recognised.
2. `curl -sI https://cosmo.vercel.app/robots.txt` on production — expect `Allow: /`, on preview — expect `Disallow: /`.
3. Facebook Sharing Debugger on `/es/publications` — expect og:title, og:image, twitter:card.

### Gaps Summary

No gaps. All must-haves across 05-01 through 05-05 verified at source + build-output level. Phase 5 goal achieved: the site is fully indexable in both locales with canonicals, hreflang, Schema.org markup (Organization + Person + ScholarlyArticle), OG/Twitter cards, bilingual sitemap, and environment-gated robots. NAV-03 and PERF-01 constraints preserved.

---

*Verified: 2026-04-18*
*Verifier: Claude (gsd-verifier)*
