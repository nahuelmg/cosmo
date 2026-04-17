import type {ReactNode} from 'react';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {fontSerif, fontSans} from '@/app/fonts';
import '@/app/globals.css';

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
      <body className="bg-surface text-ink antialiased">
        {/* NextIntlClientProvider without explicit messages prop — next-intl 4.x
            auto-picks messages from request.ts */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
