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

type ResourceGroup = {
  title: { es: string; en: string };
  items: ResourceLink[];
};

// Add new entries here. Keep titles/descriptions bilingual.
const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    title: { es: 'Repositorios', en: 'Repositories' },
    items: [
      {
        title: { es: 'class.VFDM', en: 'class.VFDM' },
        url: 'https://github.com/classULDM/class.VFDM',
        description: {
          en: 'CLASS Boltzmann code extension implementing Vector Field Dark Matter cosmological perturbations. Companion code to the paper DOI: 10.1103/PhysRevD.111.103520.',
          es: 'Extensión del código de Boltzmann CLASS que implementa las perturbaciones cosmológicas de Materia Oscura de Campo Vectorial. Código asociado al artículo DOI: 10.1103/PhysRevD.111.103520.',
        },
      },
    ],
  },
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

      {RESOURCE_GROUPS.every((g) => g.items.length === 0) ? (
        <p className="mt-12 text-ink-muted">{t('empty')}</p>
      ) : (
        <div className="mt-12 space-y-12">
          {RESOURCE_GROUPS.filter((g) => g.items.length > 0).map((group) => (
            <section key={group.title.en}>
              <h2 className="font-serif text-2xl font-semibold">
                {localize(group.title, locale)}
              </h2>
              <ul className="mt-6 space-y-6">
                {group.items.map((r) => (
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
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
