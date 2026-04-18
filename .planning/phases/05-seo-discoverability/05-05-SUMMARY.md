# 05-05 Summary — sitemap.xml and robots.txt

**Status:** ✓ Complete
**Commits:** `762c56d` (sitemap), `5ef2030` (robots)
**Files:** [src/app/sitemap.ts](src/app/sitemap.ts), [src/app/robots.ts](src/app/robots.ts)

## Sitemap URL count

`curl http://localhost:3000/sitemap.xml | rg '<loc>' | wc -l` → **20**

Breakdown:
- 7 static routes × 1 canonical entry (home + research + people + publications + contact + outreach + journal-club) = 7
- 13 person slugs × 1 canonical entry = 13
- **Total: 20** canonical URLs. Each entry also carries three `<xhtml:link>` alternates (es / en / x-default) so Google Search Console sees the full locale matrix.

## Sample entries

### Static route — `/es/investigacion`

```xml
<url>
<loc>https://cosmo.vercel.app/es/investigacion</loc>
<xhtml:link rel="alternate" hreflang="es" href="https://cosmo.vercel.app/es/investigacion" />
<xhtml:link rel="alternate" hreflang="en" href="https://cosmo.vercel.app/en/research" />
<xhtml:link rel="alternate" hreflang="x-default" href="https://cosmo.vercel.app/es/investigacion" />
<lastmod>2026-04-18T19:18:50.343Z</lastmod>
</url>
```

### Person slug — `esteban-calzetta`

```xml
<url>
<loc>https://cosmo.vercel.app/es/personas/esteban-calzetta</loc>
<xhtml:link rel="alternate" hreflang="es" href="https://cosmo.vercel.app/es/personas/esteban-calzetta" />
<xhtml:link rel="alternate" hreflang="en" href="https://cosmo.vercel.app/en/people/esteban-calzetta" />
<xhtml:link rel="alternate" hreflang="x-default" href="https://cosmo.vercel.app/es/personas/esteban-calzetta" />
<lastmod>2026-04-18T19:18:50.344Z</lastmod>
</url>
```

Round-trip verified: same slug yields both localized URLs (`/es/personas/...` and `/en/people/...`) via the same `next-intl` pathnames map used by the runtime router.

## Localized path strings in `sitemap.ts` source

`grep -nE '"/(investigacion|personas|publicaciones|contacto|club-de-revistas|divulgacion)"' src/app/sitemap.ts` → **zero matches**

Source only references canonical (English-keyed) path templates like `"/people/[slug]"`; `next-intl`'s `getPathname({ locale, href })` does the es/en substitution. Adding a new localized slug never requires sitemap changes.

## robots.txt in all three environments

### Local dev (no `VERCEL_ENV`)

```
User-Agent: *
Disallow: /

Sitemap: https://cosmo.vercel.app/sitemap.xml
```

### Vercel preview (`VERCEL_ENV=preview`)

Identical to local — the `isProduction` check in [src/app/robots.ts:7](src/app/robots.ts#L7) only returns `Allow: /` when `VERCEL_ENV === "production"`, so preview deployments remain noindex.

```
User-Agent: *
Disallow: /

Sitemap: https://cosmo.vercel.app/sitemap.xml
```

### Production (`VERCEL_ENV=production`)

```
User-Agent: *
Allow: /

Sitemap: https://cosmo.vercel.app/sitemap.xml
```

Only production is crawlable. Preview/local deployments are intentionally locked down to prevent accidental SERP indexing of non-canonical content.

## Build route table — both files static

```
├ ○ /robots.txt
└ ○ /sitemap.xml
```

Both served as pre-built static assets, not dynamic functions. PERF-01 preserved.
