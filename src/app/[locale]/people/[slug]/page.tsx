import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getPeople, getLocalizedPerson, getPublicationById } from '@/content';
import { PersonDetail } from '@/components/people/PersonDetail';

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

export default async function PersonDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const person = getLocalizedPerson(slug, locale);
  if (!person) notFound();
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
  );
}
