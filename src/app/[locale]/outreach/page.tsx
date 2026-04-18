import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getLocalizedOutreach } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';
import { OutreachGrid } from '@/components/outreach/OutreachGrid';

type Locale = (typeof routing.locales)[number];
type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'seo' });
  return buildPageMetadata({
    locale,
    href: '/outreach',
    title: t('outreach.title'),
    description: t('outreach.description'),
  });
}

export default async function OutreachPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('outreach');
  const activities = getLocalizedOutreach(locale);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <header>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed text-ink-muted">{t('intro')}</p>
      </header>
      <OutreachGrid
        activities={activities}
        locale={locale}
        learnMoreLabel={t('learnMore')}
      />
    </section>
  );
}
