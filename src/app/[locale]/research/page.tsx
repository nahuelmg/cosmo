import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getLocalizedResearchAreas } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';
import { ResearchGrid } from '@/components/research/ResearchGrid';

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
    href: '/research',
    title: t('research.title'),
    description: t('research.description'),
  });
}

export default async function ResearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('research');
  const areas = getLocalizedResearchAreas(locale);

  const mapped = areas.map((a) => ({
    id: a.id,
    title: a.title,
    shortDescription: a.short_description,
    iconName: a.icon,
  }));

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">{t('title')}</h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed text-ink-muted">
          {t('intro')}
        </p>
      </header>
      <ResearchGrid areas={mapped} />
    </section>
  );
}
