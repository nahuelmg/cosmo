import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getLocalizedResearchAreas } from '@/content';
import { ResearchGrid } from '@/components/research/ResearchGrid';

type Locale = (typeof routing.locales)[number];
type Props = { params: Promise<{ locale: Locale }> };

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
    <section className="mx-auto max-w-5xl px-6 py-16">
      <header>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed text-ink-muted">
          {t('intro')}
        </p>
      </header>
      <ResearchGrid areas={mapped} />
    </section>
  );
}
