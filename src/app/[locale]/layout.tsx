import type {ReactNode} from 'react';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {fontSerif, fontSans} from '@/app/fonts';
import {SkipLink} from '@/components/layout/SkipLink';
import {SiteHeader} from '@/components/layout/SiteHeader';
import {SiteFooter} from '@/components/layout/SiteFooter';
import '@/app/globals.css';

type Locale = (typeof routing.locales)[number];

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

  return (
    <html lang={locale} className={`${fontSerif.variable} ${fontSans.variable}`}>
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
          <SkipLink locale={locale} />
          <SiteHeader />
          <main id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </main>
          <SiteFooter locale={locale as Locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
