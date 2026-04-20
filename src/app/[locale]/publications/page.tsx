import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getAllYears, getPublicationsByYear, getPublicationsMeta, getPeople } from '@/content';
import { buildMemberSurnameSet, buildMemberOrcidMap } from '@/lib/publications-helpers';
import { buildPageMetadata } from '@/lib/metadata';
import { buildScholarlyArticleSchema } from '@/lib/schemas';
import { JsonLd } from '@/components/seo/JsonLd';
import { PublicationsClientShell } from '@/components/publications/PublicationsClientShell';

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

  const years = getAllYears();
  const meta = getPublicationsMeta();
  const people = getPeople();
  const memberSurnameSet = buildMemberSurnameSet(people);
  // Convert Set<string> to string[] for RSC → client boundary serialization.
  // Set is not JSON-serializable; PublicationsClientShell rebuilds the Set via useMemo.
  const memberSurnameList = [...memberSurnameSet];
  // Convert Map<string,string> to [string,string][] for RSC → client boundary serialization.
  // Map is not JSON-serializable; PublicationsClientShell rebuilds the Map via useMemo.
  const memberOrcidMap = buildMemberOrcidMap(people);
  const memberOrcidList = [...memberOrcidMap] as [string, string][];
  const groups = years.map((year) => ({
    year,
    publications: getPublicationsByYear(year),
  }));
  const labels = {
    arxiv: t('arxiv'),
    doi: t('doi'),
    preprint: t('preprint'),
    published: t('published'),
  };
  const allPublications = groups.flatMap((g) => g.publications);
  const formattedSyncedAt = new Intl.DateTimeFormat(
    locale === 'es' ? 'es-AR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  ).format(new Date(meta.synced_at));

  return (
    <>
      {allPublications.map((pub) => (
        <JsonLd
          key={`jsonld-${pub.id}`}
          data={buildScholarlyArticleSchema(pub)}
        />
      ))}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <header>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">{t('title')}</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {t('updatedAt', { date: formattedSyncedAt })}
          </p>
        </header>
        <PublicationsClientShell
          groups={groups}
          memberSurnameList={memberSurnameList}
          memberOrcidList={memberOrcidList}
          labels={labels}
        />
        <p className="mt-12 text-sm text-ink-subtle">
          {t('footnote')}
        </p>
      </section>
    </>
  );
}
