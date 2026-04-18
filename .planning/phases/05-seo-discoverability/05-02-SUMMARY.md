---
phase: 05-seo-discoverability
plan: 02
subsystem: seo
tags: [next-intl, nextjs, metadata, json-ld, schema-org, ssg, a11y]

requires:
  - phase: 05-01
    provides: siteConfig.url, buildOrganizationSchema, JsonLd component
provides:
  - site-wide metadataBase resolving every relative OG/Twitter path to absolute URLs
  - static title template `Grupo de Cosmología — %s` with canonical Spanish default
  - default OG (siteName + website type + 1920x820 portada_1) and Twitter summary_large_image card
  - ResearchOrganization JSON-LD emitted once per page via the shared locale layout
affects: [05-03, 05-04, 05-05, 06-polish]

tech-stack:
  added: []
  patterns:
    - "Static `export const metadata: Metadata = { ... }` (not generateMetadata) to preserve SSG — PERF-01"
    - "metadataBase at layout level + relative child OG image paths → Next.js auto-absolutises"
    - "Per-locale JSON-LD rendered inside <body> (not <head>) as a sibling of <main> — Next hoists it"

key-files:
  created: []
  modified:
    - src/app/[locale]/layout.tsx

key-decisions:
  - "Static metadata export (not generateMetadata) — defaults are locale-independent, keeps the layout statically evaluable"
  - "Title template uses siteConfig.groupName literally in Spanish; home page will override via absolute title in 05-03"
  - "description fallback uses siteConfig.tagline.es — intentional canonical Spanish fallback; per-page generateMetadata overrides downstream"
  - "JSON-LD rendered as direct child of NextIntlClientProvider (before SkipLink) so ResearchOrganization ships on every prerendered page"
  - "`locale` cast to Locale when passed to buildOrganizationSchema — safe because hasLocale() already narrowed it"

patterns-established:
  - "Layout-level static metadata + per-page generateMetadata override via buildPageMetadata (Next.js recommended inheritance model)"
  - "Single site-wide JSON-LD emitted in root locale layout; per-page schemas (Person/ScholarlyArticle) attach on their respective leaves"

duration: 1 min
completed: 2026-04-18
---

# Phase 5 Plan 02: Layout Metadata + Org JSON-LD Summary

**Site-wide metadataBase + title template + default OG/Twitter + ResearchOrganization JSON-LD on every prerendered page, with PERF-01 static output and NAV-03 email-omission guarantees both verified via curl.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-18T16:27:40Z
- **Completed:** 2026-04-18T16:29:35Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Static `metadata` export wires metadataBase, title template, default description, and OG/Twitter defaults into every `/[locale]/*` page via inheritance.
- ResearchOrganization JSON-LD now ships in the prerendered HTML of every page (not just the home route), with the canonical Spanish group name and a locale-correct `contactPoint.url` (`/es/contacto` vs `/en/contact`).
- Build still prerenders all 43 pages statically — PERF-01 preserved. All 8 route groups marked `●` (SSG) in the route table.
- NAV-03 guard holds end-to-end: zero `"email"` and zero `mailto:` hits in the prerendered HTML of both `/es` and `/en`.

## Task Commits

1. **Task 1: Add static metadata export and ResearchOrganization JSON-LD to [locale]/layout.tsx** — `846bc58` (feat)

Single-file, single-task plan. No TDD or REFACTOR cycle.

## Files Created/Modified

- `src/app/[locale]/layout.tsx` — added Metadata import + siteConfig/JsonLd/buildOrganizationSchema imports; added static `metadata` export with metadataBase + title template + default description + OG/Twitter; rendered `<JsonLd data={buildOrganizationSchema(locale as Locale)} />` as the first child of `<NextIntlClientProvider>`, ahead of `<SkipLink />`.

### Final diff — metadata export

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.groupName,
    template: `${siteConfig.groupName} — %s`,
  },
  description: siteConfig.tagline.es,
  openGraph: {
    siteName: siteConfig.groupName,
    type: 'website',
    images: [{url: '/Portadas/portada_1.jpg', width: 1920, height: 820}],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/Portadas/portada_1.jpg'],
  },
};
```

### Final JSX — JsonLd placement

```tsx
<NextIntlClientProvider>
  <JsonLd data={buildOrganizationSchema(locale as Locale)} />
  <SkipLink locale={locale} />
  <SiteHeader />
  <main id="main-content" tabIndex={-1} className="flex-1">
    {children}
  </main>
  <SiteFooter locale={locale as Locale} />
</NextIntlClientProvider>
```

## Decisions Made

- Kept the metadata export **static** (not `generateMetadata`) per the plan's PERF-01 constraint — defaults don't vary by locale and static evaluation preserves SSG eligibility.
- `title.default` set to `siteConfig.groupName` (canonical Spanish) — 05-03's home page will suppress the suffix via `title.absolute`; inner pages will prepend through the template.
- `description: siteConfig.tagline.es` chosen as the fallback — intentional; every real page is expected to override it through `buildPageMetadata` from 05-01.
- JsonLd placed **inside** `<body>` (not `<head>`) — React/Next.js hoist `<script type="application/ld+json">` correctly, and rendering it in body-context keeps the layout's element tree simple.
- Cast `locale` to the existing `Locale` alias when invoking `buildOrganizationSchema(locale)` — safe because `hasLocale(routing.locales, locale)` already narrows the runtime value, and the cast is a TypeScript-only convenience consistent with the existing `SiteFooter` call on line 101.

## Deviations from Plan

None — plan executed exactly as written. Typecheck clean on first attempt, build succeeded first attempt, all curl verifications passed first attempt.

## Issues Encountered

None.

## Verification Evidence

### Build route table (excerpt) — every page still static

```
Route (app)
┌ ○ /_not-found
├ ● /[locale]
│ ├ /es
│ └ /en
├ ● /[locale]/contact
├ ● /[locale]/journal-club
├ ● /[locale]/outreach
├ ● /[locale]/people
├ ● /[locale]/people/[slug]  (26 paths)
├ ● /[locale]/publications
└ ● /[locale]/research

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses generateStaticParams)
```

43/43 pages prerendered statically — PERF-01 preserved.

### curl /es — ResearchOrganization JSON-LD (body-inlined script tag)

```
application/ld+json">{"@context":"https://schema.org","@type":"ResearchOrganization","@id":"https://cosmo.vercel.app/#organization","name":"Grupo de Cosmología","url":"https://cosmo.vercel.app","contactPoint":{"@type":"ContactPoint","contactType":"inquiries","url":"https://cosmo.vercel.app/es/contacto"},"parentOrganization":[{"@type":"CollegeOrUniversity","name":"Universidad de Buenos Aires","url":"https://www.uba.ar","sameAs":"https://www.wikidata.org/wiki/Q1572590"},{"@type":"EducationalOrganization","name":"Facultad de Ciencias Exactas y Naturales","url":"https://exactas.uba.ar"},{"@type":"ResearchOrganization","name":"CONICET","url":"https://www.conicet.gov.ar","sameAs":"https://www.wikidata.org/wiki/Q1054964"}]}
```

### curl /en — same schema with locale-correct contact URL

```
application/ld+json">{"@context":"https://schema.org","@type":"ResearchOrganization","@id":"https://cosmo.vercel.app/#organization","name":"Grupo de Cosmología","url":"https://cosmo.vercel.app","contactPoint":{"@type":"ContactPoint","contactType":"inquiries","url":"https://cosmo.vercel.app/en/contact"},"parentOrganization":[{"@type":"CollegeOrUniversity","name":"Universidad de Buenos Aires","url":"https://www.uba.ar","sameAs":"https://www.wikidata.org/wiki/Q1572590"},{"@type":"EducationalOrganization","name":"Facultad de Ciencias Exactas y Naturales","url":"https://exactas.uba.ar"},{"@type":"ResearchOrganization","name":"CONICET","url":"https://www.conicet.gov.ar","sameAs":"https://www.wikidata.org/wiki/Q1054964"}]}
```

Note the locale-correct contactPoint.url: `/es/contacto` vs `/en/contact` — confirms the `getPathname({locale, href: "/contact"})` wiring from 05-01 flows through correctly.

### NAV-03 grep guard — zero email leakage

```
curl -s http://localhost:3000/es | grep -o 'mailto:' | wc -l   → 0
curl -s http://localhost:3000/en | grep -o 'mailto:' | wc -l   → 0
curl -s http://localhost:3000/es | grep -o '"email"' | wc -l   → 0
curl -s http://localhost:3000/en | grep -o '"email"' | wc -l   → 0
```

Both locales show zero `mailto:` and zero `"email"` occurrences in the prerendered HTML — the `contactPoint.url` approach from 05-01 plus the shared layout's single JSON-LD emission holds site-wide.

### Exactly one ld+json script tag per page

```
curl -s http://localhost:3000/es | grep -c '<script type="application/ld+json"'   → 1
```

The second `application/ld+json` substring match in the HTML is inside the React Flight serialized payload (not a rendered script); there is one and only one `<script>` tag with that type on each prerendered page — so no duplication from inherited layouts.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave-2 parallel plans 05-03 (page-level metadata + absolute home title), 05-04 (person/publication per-page schemas), 05-05 (sitemap + robots) can consume the now-live metadataBase + title template + organization JSON-LD without any further base-layer work.
- 05-03 specifically will override `title.default` via `title.absolute` on the home page and use `buildPageMetadata` on other pages — both already supported by the inheritance pattern established here.
- No blockers for the remaining phase.

---
*Phase: 05-seo-discoverability*
*Completed: 2026-04-18*
