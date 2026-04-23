import type {ReactNode} from 'react';
import type {Metadata} from 'next';
import {cookies} from 'next/headers';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {fontSerif, fontSans} from '@/app/fonts';
import {SkipLink} from '@/components/layout/SkipLink';
import {SiteHeader} from '@/components/layout/SiteHeader';
import {SiteFooter} from '@/components/layout/SiteFooter';
import {ThemeProvider, type Theme} from '@/components/layout/ThemeProvider';
import {siteConfig} from '@/config/site';
import {JsonLd} from '@/components/seo/JsonLd';
import {buildOrganizationSchema} from '@/lib/schemas';
import '@/app/globals.css';

/**
 * No-flash theme bootstrap — runs before body renders so the `.dark` class is
 * present before first paint for system users (whose preference can't be read
 * server-side from the cookie alone). Explicit `light`/`dark` cookies are
 * applied server-side on <html> below; this script still runs as a safety net
 * in case the cookie is corrupted.
 */
const NO_FLASH_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);var t=m?decodeURIComponent(m[1]):'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`;

type Locale = (typeof routing.locales)[number];

/**
 * Site-wide metadata defaults — SEO-01 / SEO-02.
 *
 * STATIC export (not generateMetadata) — defaults don't depend on locale and
 * keeping this statically evaluable preserves SSG eligibility (PERF-01).
 *
 * - metadataBase lets child pages use relative OG/Twitter image paths
 *   (e.g. `openGraph: { images: ["/Portadas/foo.jpg"] }`) that Next.js
 *   resolves to absolute URLs automatically.
 * - title.default is used only when a child does not set its own title.
 *   title.template is applied to children that DO set a title
 *   (e.g. 05-03 inner pages). Home page overrides via `title.absolute`.
 * - description is a last-resort fallback; every page should override it
 *   via its own generateMetadata. siteConfig.tagline has shape
 *   `{ es: string; en: string }` (see src/config/site.ts) — the `.es`
 *   access is safe and intentional (canonical Spanish fallback).
 */
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

type Props = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

export default async function LocaleLayout({children, params}: Props) {
  // Next.js 16: params is a Promise — await before use
  const {locale} = await params;

  // hasLocale guard BEFORE setRequestLocale — Pitfall #6: order is non-negotiable
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // setRequestLocale enables static rendering for all locale pages (SSG baseline)
  setRequestLocale(locale);

  // Read the theme cookie for SSR parity — explicit `light`/`dark` choices
  // render with the right class on first paint. `system` defers to the no-flash
  // script below because `prefers-color-scheme` isn't in the request.
  const cookieStore = await cookies();
  const cookieTheme = (cookieStore.get('theme')?.value ?? 'system') as Theme;
  const initialTheme: Theme = ['light', 'dark', 'system'].includes(cookieTheme)
    ? cookieTheme
    : 'system';
  const htmlClass = [
    fontSerif.variable,
    fontSans.variable,
    initialTheme === 'dark' ? 'dark' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <html lang={locale} className={htmlClass} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{__html: NO_FLASH_SCRIPT}} />
      </head>
      {/*
        Body is a vertical flex column sized to at least the viewport height so
        the footer's mt-auto pins it to the bottom on short pages; the main
        landmark grows to consume the remaining vertical space (see className).
      */}
      <body className="bg-surface text-ink antialiased min-h-screen flex flex-col">
        {/* NextIntlClientProvider without explicit messages prop — next-intl 4.x
            auto-picks messages from request.ts.
            Tab order: SkipLink → SiteHeader nav → main content → SiteFooter.
            The main landmark with tabIndex={-1} is the skip-link target — the
            tabIndex is required for focus movement, not just scroll
            (WCAG 2.4.1, RESEARCH.md Pitfall #3).
            SiteFooter receives `locale` explicitly because it's a server component
            that calls getTranslations({locale, namespace: 'footer'}). */}
        <NextIntlClientProvider>
          <ThemeProvider initialTheme={initialTheme}>
            {/* ResearchOrganization JSON-LD (SEO-03) — emitted once per page
                through the shared layout. NAV-03: the builder omits `email`
                entirely; contactPoint.url points at the localised /contact
                page rather than exposing a mailto in prerendered HTML. */}
            <JsonLd data={buildOrganizationSchema(locale as Locale)} />
            <SkipLink locale={locale} />
            <SiteHeader />
            <main id="main-content" tabIndex={-1} className="flex-1">
              {children}
            </main>
            <SiteFooter locale={locale as Locale} />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
