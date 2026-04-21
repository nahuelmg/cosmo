import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { localize } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';

type Locale = (typeof routing.locales)[number];
type Props = { params: Promise<{ locale: Locale }> };

type ResourceLink = {
  title: { es: string; en: string };
  url: string;
  description?: { es: string; en: string };
};

// Add new entries here. Keep titles/descriptions bilingual.
const RESOURCES: ResourceLink[] = [];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'seo' });
  return buildPageMetadata({
    locale,
    href: '/resources',
    title: t('resources.title'),
    description: t('resources.description'),
  });
}

export default async function ResourcesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('resources');

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">{t('title')}</h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed text-ink-muted">
          {t('intro')}
        </p>
      </header>

      {RESOURCES.length === 0 ? (
        <p className="mt-12 text-ink-muted">{t('empty')}</p>
      ) : (
        <ul className="mt-12 space-y-6">
          {RESOURCES.map((r) => (
            <li key={r.url}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-lg underline decoration-ink-muted/40 underline-offset-4 hover:decoration-ink"
              >
                {localize(r.title, locale)}
              </a>
              {r.description && (
                <p className="mt-1 text-ink-muted">{localize(r.description, locale)}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
