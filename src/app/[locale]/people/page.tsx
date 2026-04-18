import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getLocalizedPeople } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';
import { PeopleSection } from '@/components/people/PeopleSection';
import { PeoplePlainSection } from '@/components/people/PeoplePlainSection';

type Locale = (typeof routing.locales)[number];
type Props = { params: Promise<{ locale: Locale }> };

const CATEGORIES = ['pi', 'postdoc', 'phd', 'undergrad', 'past'] as const;
type Category = (typeof CATEGORIES)[number];
const CLICKABLE: readonly Category[] = ['pi', 'postdoc', 'phd'] as const;

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
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          {t('title')}
        </h1>
      </header>
      {CATEGORIES.map((cat) => {
        const people = all.filter((p) => p.category === cat);
        if (people.length === 0) return null;
        if (CLICKABLE.includes(cat)) {
          return (
            <PeopleSection
              key={cat}
              id={cat}
              title={t(cat)}
              people={people}
            />
          );
        }
        return (
          <PeoplePlainSection
            key={cat}
            id={cat}
            title={t(cat)}
            people={people}
            category={cat as 'undergrad' | 'past'}
          />
        );
      })}
    </>
  );
}
