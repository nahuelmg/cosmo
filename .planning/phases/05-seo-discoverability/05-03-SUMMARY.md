# 05-03 Summary — Per-page metadata + ScholarlyArticle JSON-LD

**Status:** ✓ Complete
**Commits:** `2907292` (Task 1: 6 static pages generateMetadata), `1fbc38e` (Task 2: ScholarlyArticle JSON-LD)

## Per-page metadata table (both locales)

| Route | `<title>` | Canonical |
|-------|-----------|-----------|
| `/es` | Grupo de Cosmología | https://cosmo.vercel.app/es |
| `/en` | Grupo de Cosmología | https://cosmo.vercel.app/en |
| `/es/investigacion` | Grupo de Cosmología — Investigación | https://cosmo.vercel.app/es/investigacion |
| `/en/research` | Grupo de Cosmología — Research | https://cosmo.vercel.app/en/research |
| `/es/personas` | Grupo de Cosmología — Personas | https://cosmo.vercel.app/es/personas |
| `/en/people` | Grupo de Cosmología — People | https://cosmo.vercel.app/en/people |
| `/es/publicaciones` | Grupo de Cosmología — Publicaciones | https://cosmo.vercel.app/es/publicaciones |
| `/en/publications` | Grupo de Cosmología — Publications | https://cosmo.vercel.app/en/publications |
| `/es/contacto` | Grupo de Cosmología — Contacto | https://cosmo.vercel.app/es/contacto |
| `/en/contact` | Grupo de Cosmología — Contact | https://cosmo.vercel.app/en/contact |
| `/es/divulgacion` | Grupo de Cosmología — Divulgación | https://cosmo.vercel.app/es/divulgacion |
| `/en/outreach` | Grupo de Cosmología — Outreach | https://cosmo.vercel.app/en/outreach |
| `/es/journal-club` | Grupo de Cosmología — Journal Club | https://cosmo.vercel.app/es/journal-club |
| `/en/journal-club` | Grupo de Cosmología — Journal Club | https://cosmo.vercel.app/en/journal-club |

Home uses `absoluteTitle: true` (unsuffixed). All other pages pick up the default layout title template "Grupo de Cosmología — %s".

`journal-club` is intentionally not path-translated (see [src/i18n/routing.ts:14](src/i18n/routing.ts#L14)) — same slug in both locales by design.

## ScholarlyArticle JSON-LD count (Task 2)

| Locale | Route | `"@type":"ScholarlyArticle"` occurrences |
|--------|-------|------------------------------------------|
| es | `/es/publicaciones` | 13 |
| en | `/en/publications` | 13 |

Matches publication roster exactly. Renders one `<JsonLd key={jsonld-${pub.id}} data={buildScholarlyArticleSchema(pub)} />` per entry in a fragment above the existing year-grouped rendering (preserves Phase 4 output).

## Build route table — all 7 routes static

```
├ ● /[locale]
│ ├ /es
│ └ /en
├ ● /[locale]/contact (es/contacto, en/contact)
├ ● /[locale]/journal-club
├ ● /[locale]/outreach (es/divulgacion, en/outreach)
├ ● /[locale]/people (es/personas, en/people)
├ ● /[locale]/publications (es/publicaciones, en/publications)
├ ● /[locale]/research (es/investigacion, en/research)
```

All 7 routes × 2 locales prerendered statically (●). PERF-01 preserved.

## OG samples (confirming metadataBase absolute-URL resolution)

### Home (es)

```
<meta property="og:title" content="Grupo de Cosmología"
<meta property="og:description" content="Grupo de investigación en cosmología teórica y observacional — FCEN, Universidad de Buenos Aires. Materia oscura, energía oscura y estructura a gran escala."
<meta property="og:url" content="https://cosmo.vercel.app/es"
<meta property="og:site_name" content="Grupo de Cosmología"
<meta property="og:locale" content="es_AR"
<meta property="og:image" content="https://cosmo.vercel.app/Portadas/portada_1.jpg"
<meta property="og:image:width" content="1920"
<meta property="og:image:height" content="820"
<meta property="og:type" content="website"
```

### Research (en)

```
<meta property="og:title" content="Grupo de Cosmología — Research"
<meta property="og:description" content="Active research lines: perturbation cosmology, dark matter, dark energy, and large-scale structure formation in the universe."
<meta property="og:url" content="https://cosmo.vercel.app/en/research"
<meta property="og:site_name" content="Grupo de Cosmología"
<meta property="og:locale" content="en_US"
<meta property="og:image" content="https://cosmo.vercel.app/Portadas/portada_1.jpg"
<meta property="og:image:width" content="1920"
<meta property="og:image:height" content="820"
<meta property="og:type" content="website"
```

Both pages resolve the shared portada to its absolute URL via `siteConfig.url`-derived `metadataBase` configured in [src/app/[locale]/layout.tsx](src/app/[locale]/layout.tsx).

## NAV-03 check

`curl` both publications pages (es + en) → `grep -cE '"email"|mailto:'` → **0** on both. No email exposure in prerendered HTML.
