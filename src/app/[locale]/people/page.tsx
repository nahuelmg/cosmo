import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getLocalizedPeople, type Person } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';
import { PeopleSection } from '@/components/people/PeopleSection';
import { PeoplePlainSection } from '@/components/people/PeoplePlainSection';

type Locale = (typeof routing.locales)[number];
type Props = { params: Promise<{ locale: Locale }> };

type Section = {
  id: 'pi' | 'researchStaff' | 'externalVisitors' | 'past';
  categories: ReadonlyArray<Person['category']>;
  layout: 'cards' | 'rows';
  rowVariant?: 'undergrad' | 'past' | 'plain';
};

const SECTIONS: ReadonlyArray<Section> = [
  { id: 'pi',               categories: ['pi'],                                  layout: 'cards' },
  { id: 'researchStaff',    categories: ['postdoc', 'phd', 'undergrad'],        layout: 'cards' },
  { id: 'externalVisitors', categories: ['external', 'visitors'],               layout: 'rows', rowVariant: 'plain' },
  { id: 'past',             categories: ['past'],                                layout: 'rows', rowVariant: 'past' },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'seo' });
  return buildPageMetadata({
    locale,
    href: '/people',
    title: t('people.title'),
    description: t('people.description'),
  });
}

export default async function PeoplePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('people');
  const all = getLocalizedPeople(locale);

  return (
    <>
      <header className="mx-auto max-w-6xl px-6 pt-16 pb-4">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          {t('title')}
        </h1>
      </header>
      {SECTIONS.map((section) => {
        const people = all.filter((p) => section.categories.includes(p.category));
        if (people.length === 0) return null;
        const title = t(section.id);
        if (section.layout === 'cards') {
          return (
            <PeopleSection
              key={section.id}
              id={section.id}
              title={title}
              people={people}
            />
          );
        }
          return (
            <PeoplePlainSection
              key={section.id}
              id={section.id}
              title={title}
              people={people}
              category={section.rowVariant ?? 'plain'}
              thesisLabel={t('thesis')}
              nowAtLabel={t('nowAt')}
            />
          );
      })}
    </>
  );
}
