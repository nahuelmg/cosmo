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
  getPublicationsByAuthor,
  siteConfig,
} from '@/content';
import { deriveNameVariants, buildMemberSurnameSet, buildMemberOrcidMap } from '@/lib/publications-helpers';
import { PersonDetail } from '@/components/people/PersonDetail';
import { buildPageMetadata } from '@/lib/metadata';
import { buildPersonSchema } from '@/lib/schemas';
import { JsonLd } from '@/components/seo/JsonLd';

type Locale = (typeof routing.locales)[number];

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const person = getPersonBySlug(slug);
  if (!person) return {};
  if (person.category === 'past') return {};

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
  if (person.category === 'past') notFound();

  const t = await getTranslations('people');
  const tPubs = await getTranslations('publications');

  const memberPubs = getPublicationsByAuthor(
    deriveNameVariants(rawPerson),
    { lastNYears: 10 },
  );
  const allPeople = getPeople();
  const memberSurnameSet = buildMemberSurnameSet(allPeople);
  const memberOrcidMap = buildMemberOrcidMap(allPeople);
  const pubLabels = {
    arxiv: tPubs('arxiv'),
    doi: tPubs('doi'),
    preprint: tPubs('preprint'),
    published: tPubs('published'),
  };

  return (
    <>
      <JsonLd data={buildPersonSchema(rawPerson, locale)} />
      <PersonDetail
        person={person}
        memberPubs={memberPubs}
        memberSurnameSet={memberSurnameSet}
        memberOrcidMap={memberOrcidMap}
        pubLabels={pubLabels}
        publicationsHeading={tPubs('title')}
        labels={{
          researchInterests: t('researchInterests'),
          email: t('email'),
          office: t('office'),
          scholar: t('scholar'),
          links: t('links'),
          backToPeople: t('backToPeople'),
        }}
      />
    </>
  );
}
