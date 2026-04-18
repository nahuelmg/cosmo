import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getAllYears, getPublicationsByYear } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';
import { buildScholarlyArticleSchema } from '@/lib/schemas';
import { JsonLd } from '@/components/seo/JsonLd';
import { PublicationsYearGroup } from '@/components/publications/PublicationsYearGroup';

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
    href: '/publications',
    title: t('publications.title'),
    description: t('publications.description'),
  });
}

export default async function PublicationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('publications');
  const years = getAllYears(); // accessor returns years descending

  const labels = { arxiv: t('arxiv'), doi: t('doi') };

  // Flatten all publications across years for JSON-LD emission. Each entry gets
  // its own <script type="application/ld+json"> ScholarlyArticle block. Rendering
  // before the visible content keeps rich markup high in the DOM for crawlers.
  const allPublications = years.flatMap((year) => getPublicationsByYear(year));

  return (
    <>
      {allPublications.map((pub) => (
        <JsonLd
          key={`jsonld-${pub.id}`}
          data={buildScholarlyArticleSchema(pub)}
        />
      ))}
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
    </>
  );
}
