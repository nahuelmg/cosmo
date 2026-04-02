# i18n with next-intl (App Router)

> Complete bilingual setup for Next.js App Router using next-intl. Covers routing, middleware, server/client translation access, navigation helpers, and message file organization.

**Validated in**: Landing page project (2026-03)
**Dependencies**: `next-intl`, `next-intl/plugin`

---

## 1. Package Setup

```bash
npm install next-intl
```

```ts
// next.config.ts
import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {};
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
```

---

## 2. Core Files (4 files)

### Routing config

```ts
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],        // Add/remove locales here
  defaultLocale: 'es',           // Default language
  localePrefix: 'as-needed',     // Only show /en/ prefix for non-default locale
});
```

### Server-side message loading

```ts
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

### i18n-aware navigation exports

```ts
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

**Always import `Link`, `usePathname`, `useRouter` from this file** — not from `next/link` or `next/navigation`. The i18n-aware versions handle locale prefixes automatically.

### Middleware

```ts
// src/middleware.ts
// IMPORTANT: with --src-dir projects, this goes at src/middleware.ts (NOT project root).
// Use relative imports here — @/ aliases don't work in Edge runtime.
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
```

---

## 3. Route Structure

```
src/app/
├── layout.tsx                  # Root layout (minimal — just metadataBase + children passthrough)
├── not-found.tsx               # Root 404 (outside locale — needs inline styles, no Tailwind)
├── [locale]/
│   ├── layout.tsx              # Locale layout (font, header, footer, NextIntlClientProvider)
│   ├── page.tsx                # Home page
│   ├── not-found.tsx           # Locale-aware 404 (can use translations + Tailwind)
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── services/page.tsx
│   ├── services/[slug]/page.tsx
│   └── [...rest]/page.tsx      # Catch-all for unmapped routes → notFound()
```

### Root layout (minimal)

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### Locale layout

```tsx
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          {/* Insert header, main, footer here */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Root not-found (outside locale context)

```tsx
// src/app/not-found.tsx — NO Tailwind, NO translations (outside locale context)
import Link from 'next/link';

export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>404</h1>
          <p style={{ marginTop: '1rem', color: '#666' }}>Page not found</p>
          <Link href="/" style={{ display: 'inline-block', marginTop: '1.5rem', color: '#0070f3', textDecoration: 'underline' }}>
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
```

### Locale-aware not-found

```tsx
// src/app/[locale]/not-found.tsx — CAN use translations and Tailwind
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('NotFound');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">{t('heading')}</h1>
      <p className="text-muted-foreground">{t('message')}</p>
      <Link href="/" className="text-accent hover:underline">
        {t('goHome')}
      </Link>
    </div>
  );
}
```

---

## 4. Message Files

```
messages/
├── en.json
└── es.json
```

Organize by namespace. Keep namespaces aligned with usage context:

```json
{
  "Navigation": {
    "home": "Home",
    "about": "About",
    "services": "Services",
    "contact": "Contact",
    "languageToggle": "ES",
    "footerNavigation": "Navigation"
  },
  "Common": {
    "learnMore": "Learn more",
    "contactUs": "Contact us"
  },
  "NotFound": {
    "heading": "404",
    "message": "Page not found.",
    "goHome": "Go home"
  },
  "Metadata": {
    "home": {
      "title": "Site Title",
      "description": "Site description for SEO."
    }
  }
}
```

### Namespace guidelines

- `Navigation` — nav items, footer headings, language toggle label
- `Common` — shared CTAs and labels used across multiple pages
- `NotFound` — 404 page strings
- `Metadata` — page titles and descriptions for SEO (nested by page key)
- Add page-specific namespaces as needed (e.g., `Contact`, `About`)

---

## 5. Using Translations

### In Server Components (most common)

```tsx
import { getTranslations, getLocale } from 'next-intl/server';

export default async function Page() {
  const locale = await getLocale();
  const t = await getTranslations('Common');

  return <h1>{t('learnMore')}</h1>;
}
```

### In Client Components

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('Common');
  return <button>{t('contactUs')}</button>;
}
```

---

## 6. BilingualText Pattern (for data files)

For content stored in TypeScript data files (not in message JSON), use a `BilingualText` type:

```ts
// src/types/index.ts
export type BilingualText = {
  en: string;
  es: string;
};
```

```ts
// src/data/services.ts
import type { BilingualText } from '@/types';

export type Service = {
  slug: string;
  title: BilingualText;
  description: BilingualText;
};

export const services: Service[] = [
  {
    slug: 'web-development',
    title: { en: 'Web Development', es: 'Desarrollo Web' },
    description: { en: '...', es: '...' },
  },
];
```

**When to use BilingualText vs message JSON:**
- **Message JSON** — UI labels, CTAs, metadata, navigation, error messages (anything that's a fixed UI string)
- **BilingualText data files** — structured content with multiple fields (services, team bios, FAQs) where each item has several bilingual properties

Access with locale casting: `service.title[locale as 'en' | 'es']`

---

## 7. Language Toggle

Use the i18n-aware `Link` with the `locale` prop to switch languages while staying on the current page:

```tsx
import { Link, usePathname } from '@/i18n/navigation';

function LanguageToggle({ oppositeLocale, label }: { oppositeLocale: string; label: string }) {
  const pathname = usePathname();

  return (
    <Link
      href={pathname}
      locale={oppositeLocale}
      className="border border-border rounded-md px-3 py-1"
    >
      {label}
    </Link>
  );
}
```

---

## 8. Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| Middleware silently ignored | `middleware.ts` at project root with `--src-dir` project | Move to `src/middleware.ts` |
| `@/` imports fail in middleware | Edge runtime doesn't resolve path aliases | Use relative imports: `./i18n/routing` |
| Root not-found has no styles | It renders outside the `[locale]/layout.tsx` | Use inline styles, not Tailwind |
| `localePrefix: 'as-needed'` still shows prefix | Accessing the default locale with explicit prefix | Expected — both `/` and `/es/` work for default locale |
| Translations not updating in dev | next-intl caches message imports | Restart dev server after editing message JSON structure |

---

*Last verified: 2026-03*
