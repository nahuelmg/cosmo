# Phase 5: SEO & Discoverability — Research

**Researched:** 2026-04-18
**Domain:** Next.js 16 App Router metadata API · next-intl 4 navigation · Schema.org JSON-LD · Bilingual sitemap
**Confidence:** HIGH (all critical claims verified against official Next.js 16.2.4 docs and validated references/patterns/seo-metadata.md)

---

## Summary

Phase 5 adds zero new dependencies. Every mechanism (generateMetadata, sitemap.ts, robots.ts, JSON-LD script tags) is built into Next.js 16 App Router or already wired via next-intl 4.9. The project has a prior validated reference (`references/patterns/seo-metadata.md`, verified 2026-03) that covers the core patterns exactly. Research here extends that reference with project-specific details: localePrefix "always" path construction, the pathnames config (personas vs people), Schema.org shapes, OG image asset audit, and the email-in-JSON-LD constraint.

**Primary recommendation:** Use `generateMetadata` on every page/layout (never the static `metadata` export on pages that need locale-awareness), set `metadataBase` once in the locale layout, use `getPathname` from `@/i18n/navigation` for all URL construction (canonical, alternates, sitemap), and inject JSON-LD via a thin server component that returns a `<script type="application/ld+json">` tag.

Key scoping constraints from CONTEXT.md decisions:
- No new npm packages needed (schema-dts is out — use plain typed objects)
- Email fields in JSON-LD must be omitted or replaced with a non-mailto alternative (NAV-03 constraint carries forward)
- `siteConfig.url` does not yet exist in `src/config/site.ts` — must be added as the single source of truth

---

## Standard Stack

### Core (zero new installs)

| Tool | Version | Purpose | Already Present |
|------|---------|---------|----------------|
| Next.js `generateMetadata` | 16.2.4 | Per-page metadata, canonical, alternates, OG, Twitter | Yes |
| Next.js `sitemap.ts` | 16.2.4 | `MetadataRoute.Sitemap` with `alternates.languages` | No — create `src/app/sitemap.ts` |
| Next.js `robots.ts` | 16.2.4 | `MetadataRoute.Robots` | No — create `src/app/robots.ts` |
| `getPathname` from `@/i18n/navigation` | next-intl 4.9.1 | Locale-aware URL construction respecting pathnames config | Yes (navigation.ts exports it) |
| `getTranslations` from `next-intl/server` | 4.9.1 | Read SEO translation keys in generateMetadata | Yes |
| Inline `<script type="application/ld+json">` | HTML | Schema.org JSON-LD injection | No new library needed |

### Supporting

| Tool | Purpose | Note |
|------|---------|------|
| `src/config/site.ts` | `siteConfig.url` as canonical base | Needs `url` field added |
| `messages/es.json` + `messages/en.json` | Per-page SEO descriptions + titles | Needs `seo` namespace added |
| `src/lib/metadata.ts` (new helper) | Shared `buildPageMetadata(...)` — DRY canonical/alternates computation | Create in Phase 5 |

### Alternatives Rejected

| Instead of | Could Use | Why Rejected |
|------------|-----------|-------------|
| Plain typed objects for JSON-LD | `schema-dts` npm package | No new installs; decision in CONTEXT.md |
| `generateMetadata` | Static `export const metadata` | Static export cannot read locale params — dynamic metadata required |
| `app/robots.ts` | Static `public/robots.txt` | `robots.ts` lets us gate preview deployments via env var at build time |

**Installation:** no new packages required.

---

## Architecture Patterns

### Recommended File Structure (Phase 5 additions)

```
src/
├── app/
│   ├── sitemap.ts               # NEW — MetadataRoute.Sitemap, all routes × 2 locales
│   ├── robots.ts                # NEW — MetadataRoute.Robots
│   └── [locale]/
│       ├── layout.tsx           # MODIFY — add metadata export (metadataBase + title template)
│       ├── page.tsx             # MODIFY — add generateMetadata + JSON-LD
│       ├── people/
│       │   ├── page.tsx         # MODIFY — add generateMetadata
│       │   └── [slug]/
│       │       └── page.tsx     # MODIFY — add generateMetadata + Person JSON-LD
│       ├── publications/
│       │   └── page.tsx         # MODIFY — add generateMetadata + ScholarlyArticle JSON-LD
│       ├── research/page.tsx    # MODIFY — add generateMetadata
│       ├── journal-club/page.tsx # MODIFY — add generateMetadata
│       ├── outreach/page.tsx    # MODIFY — add generateMetadata
│       └── contact/page.tsx     # MODIFY — add generateMetadata
├── lib/
│   └── metadata.ts              # NEW — buildPageMetadata() shared helper
└── config/
    └── site.ts                  # MODIFY — add `url` field
```

---

### Pattern 1: metadataBase in Locale Layout (one-time setup)

**What:** `metadataBase` allows all relative paths in metadata fields to be resolved to absolute URLs. It must be set in the segment that all locale pages inherit from.

**Where:** `src/app/[locale]/layout.tsx` — export a `metadata` object (static, not generateMetadata, because the layout-level metadata is for defaults only).

```tsx
// src/app/[locale]/layout.tsx
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.groupName,
    template: `${siteConfig.groupName} — %s`,
  },
  description: siteConfig.tagline.es, // fallback only; pages override
};
```

**Critical nuance:** The title template reads `"Grupo de Cosmología — %s"` (brand-first per decision). Child pages set `title: t('seo.title')` (e.g. "Investigación") and Next.js assembles "Grupo de Cosmología — Investigación". The **home page** must use `title: { absolute: siteConfig.groupName }` to suppress the suffix — the template only applies to children, not the segment that defines it, but using `absolute` is the safe explicit choice.

---

### Pattern 2: generateMetadata on Static Pages

**What:** Each locale page exports `generateMetadata` to emit locale-specific canonical, alternates, OG, Twitter.

**Key constraint:** Because `localePrefix: "always"`, every URL always has `/es/...` or `/en/...`. `getPathname` from next-intl navigation handles the pathnames config mapping (e.g., `/people` → `/es/personas` for Spanish).

```tsx
// src/app/[locale]/research/page.tsx
// Source: references/patterns/seo-metadata.md (validated 2026-03)
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';

const SITE_URL = siteConfig.url;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  // For localized pathnames, pass the app-router internal href key
  const esPath = getPathname({ locale: 'es', href: '/research' });
  const enPath = getPathname({ locale: 'en', href: '/research' });
  // Result: esPath = "/es/investigacion", enPath = "/en/research"

  const canonicalUrl = locale === 'es'
    ? SITE_URL + esPath
    : SITE_URL + enPath;

  const ogImage = '/Portadas/portada_1.jpg'; // shared fallback

  return {
    title: t('research.title'),            // "Investigación" / "Research"
    description: t('research.description'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: SITE_URL + esPath,
        en: SITE_URL + enPath,
        'x-default': SITE_URL + esPath,    // x-default → /es (decision 01-03)
      },
    },
    openGraph: {
      title: `${siteConfig.groupName} — ${t('research.title')}`,
      description: t('research.description'),
      url: canonicalUrl,
      siteName: siteConfig.groupName,      // canonical Spanish always
      locale: locale === 'en' ? 'en_US' : 'es_AR',
      type: 'website',
      images: [{ url: ogImage, width: 1920, height: 820 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteConfig.groupName} — ${t('research.title')}`,
      description: t('research.description'),
      images: [ogImage],
    },
  };
}
```

---

### Pattern 3: generateMetadata on Dynamic Routes (/people/[slug])

**What:** Person pages need both locale and slug to construct URLs and read person data.

```tsx
// src/app/[locale]/people/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const person = getPersonBySlug(slug);
  if (!person) return {};

  const t = await getTranslations({ locale, namespace: 'seo' });

  // href key for localized pathnames
  const href = `/people/${slug}` as const;
  const esPath = getPathname({ locale: 'es', href });
  const enPath = getPathname({ locale: 'en', href });
  // Result: esPath = "/es/personas/esteban-calzetta"
  //         enPath = "/en/people/esteban-calzetta"

  const canonicalUrl = locale === 'es'
    ? siteConfig.url + esPath
    : siteConfig.url + enPath;

  const ogImage = person.photo
    ? `/${person.photo}`        // e.g. "/people/Esteban_C.png"
    : '/Portadas/portada_1.jpg'; // fallback

  const localizedName = person.name; // canonical (not bilingual)
  const localizedRole = localize(person.role, locale as Locale);

  return {
    title: localizedName,
    description: `${localizedRole} — ${siteConfig.groupName}`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: siteConfig.url + esPath,
        en: siteConfig.url + enPath,
        'x-default': siteConfig.url + esPath,
      },
    },
    openGraph: {
      title: `${localizedName} — ${siteConfig.groupName}`,
      description: `${localizedRole} — ${siteConfig.groupName}`,
      url: canonicalUrl,
      siteName: siteConfig.groupName,
      locale: locale === 'en' ? 'en_US' : 'es_AR',
      type: 'profile',
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${localizedName} — ${siteConfig.groupName}`,
      description: `${localizedRole} — ${siteConfig.groupName}`,
      images: [ogImage],
    },
  };
}
```

**Note on photo path:** `person.photo` is stored as `"people/Esteban_C.png"` (no leading slash, per photoPath validator). Prepend `/` when using as a URL. With `metadataBase` set, relative paths work — so `/people/Esteban_C.png` resolves correctly.

---

### Pattern 4: sitemap.ts

**What:** `src/app/sitemap.ts` (at the app root, not under [locale]) generates all URLs with `alternates.languages`.

**Key:** Use `getPathname` from next-intl. Since `localePrefix: "always"`, every call returns a locale-prefixed path like `/es/investigacion`. The `url` field in each entry should be the ES (default) version; alternates list both.

**Important:** The sitemap file lives at `src/app/sitemap.ts` (not inside `[locale]`), so it's a plain async function — it does NOT use `setRequestLocale` or next-intl server hooks. Import `getPathname` from `@/i18n/navigation` directly.

```ts
// src/app/sitemap.ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
import type { MetadataRoute } from 'next';
import { getPathname } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';
import { getPeople } from '@/content';

const SITE_URL = siteConfig.url;

type Href = Parameters<typeof getPathname>[0]['href'];

function entry(href: Href) {
  const esUrl = SITE_URL + getPathname({ locale: 'es', href });
  const enUrl = SITE_URL + getPathname({ locale: 'en', href });
  return {
    url: esUrl,
    lastModified: new Date(),
    alternates: {
      languages: {
        es: esUrl,
        en: enUrl,
        'x-default': esUrl,
      },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticHrefs: Href[] = [
    '/',
    '/people',
    '/research',
    '/publications',
    '/journal-club',
    '/outreach',
    '/contact',
  ];

  const people = getPeople().filter(
    (p) => p.category === 'pi' || p.category === 'postdoc' || p.category === 'phd'
  );
  const peopleHrefs: Href[] = people.map(
    (p) => `/people/${p.slug}` as Href
  );

  return [
    ...staticHrefs.map(entry),
    ...peopleHrefs.map(entry),
  ];
}
```

**URL count:** 7 static + 13 people = 20 entries in sitemap. Each entry has 3 alternates. Well within Google's 50,000 URL limit.

---

### Pattern 5: robots.ts

```ts
// src/app/robots.ts
// Source: references/patterns/seo-metadata.md (validated 2026-03)
import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const isPreview = process.env.VERCEL_ENV !== 'production';

  return {
    rules: isPreview
      ? { userAgent: '*', disallow: '/' }   // block bots on preview
      : { userAgent: '*', allow: '/' },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
```

**Note:** `VERCEL_ENV` is a server-side env var Vercel sets automatically (`"production"`, `"preview"`, or `"development"`). It is NOT `NEXT_PUBLIC_*`, so it's only available at build/runtime server-side. `robots.ts` runs server-side, so this is safe. For preview deployments you may want to allow all until the site goes production — this is Claude's discretion (CONTEXT.md).

---

### Pattern 6: JSON-LD Injection

**What:** Inline `<script type="application/ld+json">` in the page component's JSX return. Use a thin helper component `JsonLd` to keep it DRY.

**Where:**
- Root `ResearchOrganization`: in `[locale]/layout.tsx` return (renders on every page)
- `Person`: in `[locale]/people/[slug]/page.tsx` return
- `ScholarlyArticle` list: in `[locale]/publications/page.tsx` return

```tsx
// src/components/seo/JsonLd.tsx  (server component — no 'use client')
// Source: references/patterns/seo-metadata.md §3 Security note
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // .replace prevents </script> injection via JSON string content
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
```

Usage in layout (ResearchOrganization):
```tsx
// In LocaleLayout return, inside <NextIntlClientProvider>:
<JsonLd data={buildOrganizationSchema()} />
```

**Placement in layout.tsx:** The `JsonLd` component must be a sibling of the page `{children}` inside the JSX, NOT inside `<head>`. Next.js hoists `<script type="application/ld+json">` to `<head>` automatically, or leaves it inline in `<body>` — both are valid for Google's rich results crawler.

---

### Pattern 7: Schema.org Shapes

#### ResearchOrganization (root layout, every page)

```ts
// src/lib/schemas.ts
import { siteConfig } from '@/config/site';

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.groupName,           // "Grupo de Cosmología" — canonical Spanish always
    url: siteConfig.url,
    // Email: OMIT from JSON-LD — see Pitfall #6 (NAV-03 constraint)
    parentOrganization: [
      {
        '@type': 'CollegeOrUniversity',
        name: siteConfig.affiliations[0].name.es,  // "Universidad de Buenos Aires"
        url: siteConfig.affiliations[0].url,
        sameAs: 'https://www.wikidata.org/wiki/Q1572590',
      },
      {
        '@type': 'EducationalOrganization',
        name: siteConfig.affiliations[1].name.es,  // "Facultad de Ciencias Exactas y Naturales"
        url: siteConfig.affiliations[1].url,
      },
      {
        '@type': 'ResearchOrganization',
        name: 'CONICET',
        url: siteConfig.affiliations[2].url,
        sameAs: 'https://www.wikidata.org/wiki/Q1054964',
      },
    ],
  };
}
```

#### Person (people/[slug] page)

```ts
export function buildPersonSchema(person: Person, locale: Locale) {
  const orgId = `${siteConfig.url}/#organization`;
  const sameAs: string[] = [];
  if (person.contact.scholar) sameAs.push(person.contact.scholar);
  // Add other social_links with URL
  person.social_links.forEach((l) => sameAs.push(l.url));

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: localize(person.role, locale),
    description: localize(person.short_bio, locale),
    worksFor: { '@id': orgId },
    affiliation: { '@id': orgId },
    ...(person.contact.orcid && {
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'ORCID',
        value: `https://orcid.org/${person.contact.orcid}`,
      },
    }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(person.photo && {
      image: `${siteConfig.url}/${person.photo}`,
    }),
    // email: OMIT — NAV-03 constraint. See Pitfall #6.
  };
}
```

#### ScholarlyArticle (publications page — array)

```ts
export function buildScholarlyArticleSchema(pub: Publication) {
  const sameAs: string[] = [];
  if (pub.arxiv) sameAs.push(`https://arxiv.org/abs/${pub.arxiv}`);
  if (pub.doi) sameAs.push(`https://doi.org/${pub.doi}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: pub.title,
    author: pub.authors.map((name) => ({ '@type': 'Person', name })),
    datePublished: String(pub.year),
    isPartOf: { '@type': 'Periodical', name: pub.journal },
    ...(sameAs.length > 0 && { sameAs }),
    ...(pub.doi && {
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'DOI',
        value: pub.doi,
      },
    }),
  };
}
```

**For publications page:** Build an array of ScholarlyArticle objects and render one `<JsonLd>` per publication, OR wrap them in a single `ItemList` — CONTEXT.md defers ItemList, so emit one `<JsonLd>` per publication entry.

---

### Pattern 8: siteConfig.url Addition

`src/config/site.ts` needs a `url` field:

```ts
// Add to siteConfig object:
url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cosmo.vercel.app',
```

Add to `.env.example`:
```
NEXT_PUBLIC_SITE_URL=https://cosmo.vercel.app
```

Set in Vercel dashboard for production. This single constant threads into: `metadataBase`, sitemap, JSON-LD `url`/`@id`, and all canonical URL computations.

---

### Pattern 9: messages/ SEO Namespace

Add a `seo` key to both `messages/es.json` and `messages/en.json`. Each page gets a `title` and `description` (150–160 chars). This keeps SEO copy out of the component tree and in the translation system.

```json
// messages/es.json — add alongside existing keys:
"seo": {
  "home": {
    "title": "Grupo de Cosmología",
    "description": "Grupo de investigación en cosmología teórica y observacional — FCEN, Universidad de Buenos Aires. Materia oscura, energía oscura y estructura a gran escala."
  },
  "people": {
    "title": "Personas",
    "description": "Investigadores, postdoctorandos y estudiantes del Grupo de Cosmología en el Departamento de Física de la FCEN, UBA."
  },
  "research": {
    "title": "Investigación",
    "description": "Líneas de investigación activas: cosmología de perturbaciones, materia oscura, energía oscura y formación de estructura a gran escala en el universo."
  },
  "publications": {
    "title": "Publicaciones",
    "description": "Publicaciones científicas del Grupo de Cosmología. Artículos en revistas arbitradas con enlaces a arXiv y DOI."
  },
  "journalClub": {
    "title": "Journal Club",
    "description": "Reuniones semanales del Grupo de Cosmología para discutir artículos recientes en cosmología y astrofísica."
  },
  "outreach": {
    "title": "Divulgación",
    "description": "Actividades de comunicación pública de la ciencia del Grupo de Cosmología: charlas, talleres y publicaciones de divulgación."
  },
  "contact": {
    "title": "Contacto",
    "description": "Cómo contactar al Grupo de Cosmología de la FCEN, UBA. Dirección, correo y redes sociales."
  }
}
```

```json
// messages/en.json — add alongside existing keys:
"seo": {
  "home": {
    "title": "Grupo de Cosmología",
    "description": "Theoretical and observational cosmology research group at FCEN, University of Buenos Aires. Dark matter, dark energy and large-scale structure."
  },
  "people": { ... },
  "research": { ... },
  ...
}
```

**Note:** The descriptions above are draft suggestions (~150–160 chars each). The user should review and edit. Person pages derive description from `role + groupName` (no SEO key needed per person — computed from data).

---

### Anti-Patterns to Avoid

- **Static `export const metadata` on locale pages.** The locale param is needed to localize title/description. Always use `generateMetadata` for any page under `[locale]/`. Static `metadata` is only valid for the layout-level defaults.
- **Hardcoding URLs in generateMetadata.** Always use `getPathname` from `@/i18n/navigation` — it respects the `pathnames` config (e.g., `/research` → `/es/investigacion`).
- **Emitting Organization JSON-LD in both layout AND page.** Layout handles it once for all pages. Pages add only their own type (Person, ScholarlyArticle). Do not duplicate the Organization schema.
- **Using `NEXT_PUBLIC_VERCEL_ENV` in robots.ts.** The correct var is `VERCEL_ENV` (server-only). `NEXT_PUBLIC_VERCEL_ENV` is also available but exposes build context to the client unnecessarily.
- **Forgetting `setRequestLocale` in generateMetadata.** Pages already call it in the component, but `generateMetadata` runs separately. Pass `locale` explicitly to `getTranslations({ locale, namespace: 'seo' })` — this keeps it SSG-eligible (no dynamic APIs used).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL construction for alternates | String template `${SITE_URL}/es/investigacion` | `getPathname({ locale, href })` from next-intl | Respects pathnames config — manual strings will miss `/investigacion` for Spanish |
| `<link rel="canonical">` tags | Custom `<head>` manipulation | Next.js `alternates.canonical` in Metadata | Handles dedup, moves to `<head>` automatically |
| hreflang link tags | Custom `<head>` | Next.js `alternates.languages` | Guaranteed correct output format |
| Sitemap XML template | Custom XML string builder | `MetadataRoute.Sitemap` from `next` | Type-safe, handles xhtml:link alternates correctly |
| JSON-LD type system | `schema-dts` | Plain TypeScript objects + `Record<string, unknown>` | No new install; type completeness via JSDoc or loose typing is sufficient |
| robots.txt | Static file in `/public` | `src/app/robots.ts` | Can gate preview deployments via `VERCEL_ENV` |

**Key insight:** next-intl's `getPathname` is the single-source-of-truth for URL construction. Any hardcoded path string is a bug waiting to happen when pathnames config changes.

---

## Common Pitfalls

### Pitfall 1: localePrefix "always" + getPathname Result Format

**What goes wrong:** Assuming `getPathname({ locale: 'es', href: '/research' })` returns `/investigacion`. It returns `/es/investigacion` because `localePrefix: "always"` is set in `routing.ts`. This is the full path relative to the domain root.

**How to avoid:** Always use the full `SITE_URL + getPathname(...)` pattern. Never strip the locale prefix manually.

**Warning signs:** Canonical URLs showing `/investigacion` instead of `/es/investigacion` in rendered `<head>`.

---

### Pitfall 2: generateMetadata Breaks SSG If Dynamic APIs Are Used

**What goes wrong:** Calling `cookies()`, `headers()`, or `connection()` inside `generateMetadata` forces the page to SSR (request-time rendering), breaking PERF-01 (fully static output).

**Why it happens:** Next.js 16 streams metadata by default, but a page that reads runtime APIs is not prerenderable.

**How to avoid:** In `generateMetadata`, only access `params` (static route params) and `getTranslations({ locale, namespace })`. Both are SSG-safe. The content data (`getPeople()`, `getPublications()`) is module-load static — also safe.

**Warning signs:** `next build` output shows pages as `λ` (server) instead of `○` (static) after adding generateMetadata.

---

### Pitfall 3: Duplicate Organization JSON-LD

**What goes wrong:** If both `[locale]/layout.tsx` AND `[locale]/people/[slug]/page.tsx` emit a full `ResearchOrganization` block, Google sees duplicate markup and may deprioritize both.

**How to avoid:** Layout emits ONE `ResearchOrganization` with `@id: "${url}/#organization"`. Person pages emit `Person` with `worksFor: { '@id': '.../#organization' }` — a reference, not a full re-declaration.

---

### Pitfall 4: OG Image URLs Must Be Absolute

**What goes wrong:** `openGraph.images: [{ url: '/people/Esteban_C.png' }]` — relative URL. Sharing on WhatsApp/Slack will fail to fetch the image.

**How to avoid:** Either provide an absolute URL (`${siteConfig.url}/people/Esteban_C.png`) or rely on `metadataBase` set in layout. With `metadataBase` set to `new URL(siteConfig.url)`, relative paths like `/people/Esteban_C.png` in the `images` array are resolved to absolute by Next.js. This is confirmed behavior per Next.js 16 docs.

**Recommendation:** Use the relative-with-metadataBase approach — it's simpler and metadataBase is already set in the layout.

---

### Pitfall 5: Portrait Images Are Not 1200×630

**What goes wrong:** People portraits are roughly square (profile photos). Displayed as OG images they will be letterboxed or cropped oddly by social platforms.

**Assessment:**
- `portada_*.jpg/png`: 1920×820 landscape — excellent for OG (wider than 1200px, `og:image:width/height` tags needed)
- `people/*.png/jpeg`: profile squares — will not compose well at 1200×630

**Decision from CONTEXT.md:** Fall back to portada when portrait doesn't compose well. The safe implementation: always use portada for OG images. If the team later wants portrait OG, that's a Phase 6+ task (dynamic OG generation deferred).

**Recommendation for planner:** Use portada_1.jpg for ALL pages including person pages (ignore portrait for OG in Phase 5). This is the zero-risk path consistent with CONTEXT.md's "fall back to shared portada when absent."

---

### Pitfall 6: Email in JSON-LD Conflicts with NAV-03

**What goes wrong:** `ResearchOrganization` and `Person` schema.org types support an `email` field. The CONTEXT.md decision 03-02 (NAV-03) mandates no raw `mailto:` strings in prerendered HTML (the EmailLink component uses client-side scheme assembly to prevent this).

JSON-LD is prerendered HTML (it's a server-rendered `<script>` tag). Including `"email": "cosmologia@df.uba.ar"` in JSON-LD violates this constraint — it exposes the email to scrapers in the page source.

**Resolution (Claude's discretion — CONTEXT.md):**
- **Omit `email` entirely from all JSON-LD.** Google does not require it for ResearchOrganization or Person rich results.
- For `ResearchOrganization`, use `contactPoint` with a `url` pointing to `/es/contacto` instead of an email field.
- For `Person`, simply omit the email field — ORCID and Google Scholar links in `sameAs` are sufficient for academic identity.

**Why this is safe:** Rich results for Organization and Person types do not require email. The contact page provides the obfuscated email. Structured data validators (Google Rich Results Test) will not flag a missing email field.

---

### Pitfall 7: title.template Does Not Apply to the Segment That Defines It

**What goes wrong:** Defining `title.template: 'GdC — %s'` in `[locale]/layout.tsx` and expecting the home page (which doesn't export a title) to show "GdC — Inicio". It won't — the template applies to *child* segments, and the layout's own `title.default` is used as fallback.

**How to avoid:** Home page must explicitly export `title: { absolute: siteConfig.groupName }` in its `generateMetadata` to get just "Grupo de Cosmología" with no suffix.

---

### Pitfall 8: getPathname in sitemap.ts Needs the Internal href Key

**What goes wrong:** Passing `'/personas'` (the localized Spanish path) to `getPathname`. The function expects the *internal* href key defined in the routing pathnames object (e.g., `'/people'`), not the localized value.

**How to avoid:** Always pass the internal key: `getPathname({ locale: 'es', href: '/people' })` → returns `/es/personas`. Passing `'/personas'` directly will produce wrong URLs or throw.

**Sitemap href keys to use:**
- `'/'`, `'/people'`, `'/people/[slug]'` (not `'/personas/[slug]'`)
- `'/research'`, `'/publications'`, `'/journal-club'`, `'/outreach'`, `'/contact'`

---

## Code Examples

### Shared buildPageMetadata Helper

```ts
// src/lib/metadata.ts
// Source: pattern from references/patterns/seo-metadata.md
import type { Metadata } from 'next';
import { getPathname } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';

type StaticHref = Parameters<typeof getPathname>[0]['href'];

export function buildPageMetadata({
  locale,
  href,
  title,
  description,
  ogImage = '/Portadas/portada_1.jpg',
}: {
  locale: string;
  href: StaticHref;
  title: string;
  description: string;
  ogImage?: string;
}): Metadata {
  const esUrl = siteConfig.url + getPathname({ locale: 'es', href });
  const enUrl = siteConfig.url + getPathname({ locale: 'en', href });
  const canonicalUrl = locale === 'es' ? esUrl : enUrl;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: esUrl,
        en: enUrl,
        'x-default': esUrl,
      },
    },
    openGraph: {
      title: `${siteConfig.groupName} — ${title}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.groupName,
      locale: locale === 'en' ? 'en_US' : 'es_AR',
      type: 'website',
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteConfig.groupName} — ${title}`,
      description,
      images: [ogImage],
    },
  };
}
```

This helper is called by all 6 static pages. Person pages use a slightly different pattern (type: 'profile', dynamic ogImage logic).

---

### XSS-Safe JSON-LD Script Tag

```tsx
// Source: references/patterns/seo-metadata.md §3
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(data).replace(/</g, '\\u003c'),
  }}
/>
```

The `.replace(/</g, '\\u003c')` prevents a `</script>` sequence embedded in a JSON string value (e.g., a bio containing `<script>`) from breaking the script block.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Static `public/robots.txt` | `src/app/robots.ts` (MetadataRoute.Robots) | Can gate by `VERCEL_ENV` |
| `next-seo` package | Native Next.js Metadata API | No extra dep; same output |
| `schema-dts` for JSON-LD types | Plain TypeScript objects | No dep; sufficient for this schema size |
| `<Head>` from `next/head` (Pages Router) | `generateMetadata` (App Router) | This project already uses App Router |

**No deprecated patterns in use.** The project was greenfield on Next.js 16 App Router — no Pages Router legacy.

---

## Open Questions

1. **Canonical URL for preview vs production**
   - What we know: CONTEXT.md says "use Vercel preview URL for now" — `cosmo.vercel.app` or similar
   - What's unclear: The exact Vercel subdomain assigned. The planner should set a placeholder and instruct the user to update `NEXT_PUBLIC_SITE_URL` in Vercel dashboard.
   - Recommendation: Default to `'https://cosmo.vercel.app'` in `siteConfig.url`; wrap in `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cosmo.vercel.app'`.

2. **robots.txt on preview deployments**
   - What we know: CONTEXT.md defers to Claude's discretion
   - Recommendation: `VERCEL_ENV !== 'production'` → `disallow: '/'`. This prevents Vercel preview URLs from being indexed.

3. **OG image dimensions for portada files**
   - What we know: Files are present (`portada_1.jpg`, `portada_2.png`, `portada_3.jpg`); PIL not available to measure. HeroCarousel source code declares `width: 1920, height: 820`.
   - Recommendation: Emit `images: [{ url: '/Portadas/portada_1.jpg', width: 1920, height: 820 }]` in OG metadata for all pages.

4. **Vercel wikidata/sameAs for UBA and CONICET**
   - UBA Wikidata: `https://www.wikidata.org/wiki/Q1572590` (Universidad de Buenos Aires) — MEDIUM confidence (from training data; planner should verify)
   - CONICET Wikidata: `https://www.wikidata.org/wiki/Q1054964` — MEDIUM confidence
   - Recommendation: Include these as `sameAs` on parentOrganization nodes; easy to remove if incorrect.

5. **Do any pages already export metadata?**
   - Confirmed: Grep of all `src/` files found zero existing `generateMetadata` or `export const metadata` exports on any page. Phase 5 adds them fresh.

---

## Sources

### Primary (HIGH confidence)
- Next.js 16.2.4 official docs — `generateMetadata` API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata (fetched 2026-04-18, version field: 16.2.4, lastUpdated: 2026-04-15)
- Next.js 16.2.4 official docs — sitemap.xml: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap (fetched 2026-04-18, version: 16.2.4)
- `references/patterns/seo-metadata.md` — validated in landing page project 2026-03 with next-intl + Next.js App Router

### Secondary (MEDIUM confidence)
- next-intl docs — metadata/route-handlers: https://next-intl.dev/docs/environments/actions-metadata-route-handlers
- Actual project files read directly (routing.ts, layout.tsx, site.ts, people.schema.ts, publications.schema.ts, navigation.ts, messages/*.json)

### Tertiary (LOW confidence)
- Wikidata entity IDs for UBA and CONICET (from training data — planner should verify)

---

## Metadata

**Confidence breakdown:**
- generateMetadata API: HIGH — fetched from official docs at version 16.2.4
- sitemap.ts API with alternates.languages: HIGH — fetched from official docs
- robots.ts with VERCEL_ENV: HIGH — documented Vercel behavior
- getPathname localePrefix "always" behavior: HIGH — confirmed from routing.ts + next-intl docs
- pathnames config (personas/investigacion etc.): HIGH — read directly from src/i18n/routing.ts
- JSON-LD injection pattern: HIGH — validated reference + official HTML spec
- Schema.org shapes (ResearchOrganization, Person, ScholarlyArticle): MEDIUM — shapes are standard; @id/@type usage is conventional
- Wikidata sameAs URLs: LOW — training data only

**Research date:** 2026-04-18
**Valid until:** 2026-05-18 (stable APIs; next-intl and Next.js major releases would invalidate)
