# SEO Metadata Pattern (Bilingual Next.js)

> Per-page metadata generation with language alternates, canonical URLs, OpenGraph tags, JSON-LD structured data, robots.txt, and sitemap — all locale-aware.

**Validated in**: Landing page project (2026-03)
**Works with**: next-intl, Next.js App Router

---

## 1. Per-Page Metadata (generateMetadata)

Every page exports `generateMetadata` with canonical URL, language alternates, and OpenGraph:

```tsx
// src/app/[locale]/page.tsx (or any page)
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = 'Your Company';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const href = '/';  // Change per page: '/about', '/contact', etc.
  const enPath = getPathname({ locale: 'en', href });
  const esPath = getPathname({ locale: 'es', href });
  const canonicalUrl = locale === 'es'
    ? SITE_URL + esPath
    : SITE_URL + enPath;

  return {
    title: t('home.title'),
    description: t('home.description'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: SITE_URL + enPath,
        es: SITE_URL + esPath,
        'x-default': SITE_URL + esPath,  // Default locale for unmatched browsers
      },
    },
    openGraph: {
      title: t('home.title'),
      description: t('home.description'),
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: locale === 'en' ? 'en_US' : 'es_AR',
      type: 'website',
    },
  };
}
```

### For dynamic routes (e.g., `/services/[slug]`)

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  // Map slug to metadata translation key
  const metaKey = metadataKeyMap[slug];
  if (!metaKey) return {};

  const href = `/services/${slug}` as Parameters<typeof getPathname>[0]['href'];
  const enPath = getPathname({ locale: 'en', href });
  const esPath = getPathname({ locale: 'es', href });
  const canonicalUrl = locale === 'es'
    ? SITE_URL + esPath
    : SITE_URL + enPath;

  return {
    title: t(`${metaKey}.title` as Parameters<typeof t>[0]),
    description: t(`${metaKey}.description` as Parameters<typeof t>[0]),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: SITE_URL + enPath,
        es: SITE_URL + esPath,
        'x-default': SITE_URL + esPath,
      },
    },
    openGraph: {
      title: t(`${metaKey}.title` as Parameters<typeof t>[0]),
      description: t(`${metaKey}.description` as Parameters<typeof t>[0]),
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: locale === 'en' ? 'en_US' : 'es_AR',
      type: 'website',
    },
  };
}
```

### Metadata translation keys

```json
{
  "Metadata": {
    "home": {
      "title": "Your Company — Tagline",
      "description": "What you do, for SEO."
    },
    "about": {
      "title": "About Us",
      "description": "Learn about the team."
    },
    "contact": {
      "title": "Contact",
      "description": "Get in touch."
    }
  }
}
```

---

## 2. Title Template

Set in the locale layout so every page title follows the pattern `Page Title | Site Name`:

```tsx
// src/app/[locale]/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | Your Company',
    default: 'Your Company — Tagline',
  },
  description: 'Default site description.',
};
```

And in the root layout, set `metadataBase` for resolving relative URLs:

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};
```

---

## 3. JSON-LD Structured Data

Add schema.org markup inline on pages. Common types:

### LocalBusiness (for service/agency sites)

```tsx
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const loc = locale as 'en' | 'es';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',     // Or 'Organization', 'ProfessionalService', etc.
    name: 'Your Company',
    url: SITE_URL,
    email: 'hello@example.com',
    description: 'Company description in current locale.',
    // Optional:
    // telephone: '+1234567890',
    // address: { '@type': 'PostalAddress', ... },
    // openingHours: 'Mo-Fr 09:00-18:00',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {/* Page content */}
    </>
  );
}
```

**Security note**: `.replace(/</g, '\\u003c')` prevents XSS via `</script>` injection in JSON-LD content.

### Other useful schema types

| Page type | Schema `@type` |
|-----------|---------------|
| Agency / company | `Organization` or `LocalBusiness` |
| Service page | `Service` with `provider` |
| Product page | `Product` with `offers` |
| Blog post | `Article` or `BlogPosting` |
| FAQ page | `FAQPage` with `mainEntity` |
| Contact page | `ContactPage` |

---

## 4. Robots.txt

```ts
// src/app/robots.ts
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

---

## 5. Sitemap (Bilingual)

Generate entries for every page in every locale with language alternates:

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getPathname } from '@/i18n/navigation';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

type Href = Parameters<typeof getPathname>[0]['href'];

function entry(href: Href) {
  const enUrl = SITE_URL + getPathname({ locale: 'en', href });
  const esUrl = SITE_URL + getPathname({ locale: 'es', href });
  return {
    url: esUrl,                   // Default locale URL as primary
    lastModified: new Date(),
    alternates: {
      languages: {
        en: enUrl,
        es: esUrl,
        'x-default': esUrl,
      },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: Href[] = ['/', '/about', '/contact', '/services'];

  // Dynamic pages (fetch slugs from your data files)
  // const dynamicPages = services.map((s) => `/services/${s.slug}` as Href);

  return [
    ...staticPages.map(entry),
    // ...dynamicPages.map(entry),
  ];
}
```

---

## 6. Static Params for Dynamic Routes

Generate all locale + slug combinations for static generation:

```tsx
import { routing } from '@/i18n/routing';
import { services } from '@/data/services';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    services.map((service) => ({
      locale,
      slug: service.slug,
    }))
  );
}
```

---

## 7. Environment Variable

Add to `.env.example` and `.env.local`:

```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**Critical**: Without this, canonical URLs and sitemap entries will point to `localhost:3000` in production. Set it in your deployment platform's env vars dashboard.

---

## 8. Checklist

```
[ ] Every page has generateMetadata with title, description, canonical, alternates
[ ] Title template set in locale layout ("%s | Site Name")
[ ] metadataBase set in root layout (resolves relative URLs)
[ ] JSON-LD on at least the home page
[ ] robots.ts points to sitemap
[ ] sitemap.ts includes all pages with language alternates
[ ] NEXT_PUBLIC_SITE_URL set in .env.example and deployment platform
[ ] Verify with: view-source on deployed page → check <link rel="alternate">, <link rel="canonical">
[ ] Test with Google Rich Results Test for JSON-LD validation
```

---

*Last verified: 2026-03*
