import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
// Note: generateMetadata below does not need getTranslations — description is
// composed from the bilingual person.role value directly + siteConfig.groupName.
import { routing } from '@/i18n/routing';
import {
  getPeople,
  getPersonBySlug,
  getLocalizedPerson,
  getPublicationById,
  siteConfig,
} from '@/content';
import { PersonDetail } from '@/components/people/PersonDetail';
import { buildPageMetadata } from '@/lib/metadata';
import { buildPersonSchema } from '@/lib/schemas';
import { JsonLd } from '@/components/seo/JsonLd';

type Locale = (typeof routing.locales)[number];

export function generateStaticParams() {
  const people = getPeople();
  const clickable = people.filter(
    (p) =>
      p.category === 'pi' ||
      p.category === 'postdoc' ||
      p.category === 'phd'
  );
  return routing.locales.flatMap((locale) =>
    clickable.map((p) => ({ locale, slug: p.slug }))
  );
}

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const person = getPersonBySlug(slug);
  if (!person) return {};
  if (person.category === 'undergrad' || person.category === 'past') return {};

  // role is bilingual; pick the matching locale value directly.
  const localizedRole = person.role[locale as Locale];
  const description = `${localizedRole} — ${siteConfig.groupName}`;

  return buildPageMetadata({
    locale,
    // The pathnames config uses `/people/[slug]` as the internal key; pass the
    // object form so next-intl can compile it to `/es/personas/<slug>` or
    // `/en/people/<slug>` without TypeScript complaints.
    href: { pathname: '/people/[slug]', params: { slug } },
    title: person.name, // canonical, not bilingual (per schema)
    description,
    ogType: 'profile',
    // ogImage omitted → buildPageMetadata falls back to /Portadas/portada_1.jpg
    // per CONTEXT.md 2026-04-18 update: no per-page portrait OG.
    absoluteTitle: false,
  });
}

export default async function PersonDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const rawPerson = getPersonBySlug(slug);
  const person = getLocalizedPerson(slug, locale);
  if (!rawPerson || !person) notFound();
  if (person.category === 'undergrad' || person.category === 'past') notFound();

  const t = await getTranslations('people');

  const selectedPubs = person.publications_selected
    .map((id) => getPublicationById(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .map((p) => ({
      id: p.id,
      authors: p.authors,
      title: p.title,
      journal: p.journal,
      year: p.year,
      arxiv: p.arxiv,
      doi: p.doi,
    }));

  return (
    <>
      <JsonLd data={buildPersonSchema(rawPerson, locale)} />
      <PersonDetail
        person={person}
        selectedPubs={selectedPubs}
        labels={{
          researchInterests: t('researchInterests'),
          selectedPublications: t('selectedPublications'),
          email: t('email'),
          office: t('office'),
          orcid: t('orcid'),
          scholar: t('scholar'),
          links: t('links'),
          backToPeople: t('backToPeople'),
        }}
      />
    </>
  );
}
