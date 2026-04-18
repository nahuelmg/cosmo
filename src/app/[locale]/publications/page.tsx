import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getAllYears, getPublicationsByYear } from '@/content';
import { PublicationsYearGroup } from '@/components/publications/PublicationsYearGroup';

type Locale = (typeof routing.locales)[number];
type Props = { params: Promise<{ locale: Locale }> };

export default async function PublicationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('publications');
  const years = getAllYears(); // accessor returns years descending

  const labels = { arxiv: t('arxiv'), doi: t('doi') };

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <header>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">{t('title')}</h1>
      </header>
      {years.map((year) => (
        <PublicationsYearGroup
          key={year}
          year={year}
          publications={getPublicationsByYear(year)}
          labels={labels}
        />
      ))}
    </section>
  );
}
