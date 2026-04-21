import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { BookOpen, FolderGit2, type LucideIcon } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { localize } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';

type Locale = (typeof routing.locales)[number];
type Props = { params: Promise<{ locale: Locale }> };

type ResourceLink = {
  title: { es: string; en: string };
  url: string;
  description?: { es: string; en: string };
  doi?: string;
};

type ResourceGroup = {
  title: { es: string; en: string };
  icon: LucideIcon;
  items: ResourceLink[];
};

// Add new entries here. Keep titles/descriptions bilingual.
const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    title: { es: 'Repositorios', en: 'Repositories' },
    icon: FolderGit2,
    items: [
      {
        title: { es: 'class.VFDM', en: 'class.VFDM' },
        url: 'https://github.com/classULDM/class.VFDM',
        description: {
          en: 'CLASS Boltzmann code extension implementing cosmological perturbations with spin-1 ultralight dark matter.',
          es: 'Extensión del código de Boltzmann CLASS que implementa las perturbaciones cosmológicas con materia oscura ultraliviana de spin-1.',
        },
        doi: '10.1103/PhysRevD.111.103520',
      },
      {
        title: { es: 'class.SFDM', en: 'class.SFDM' },
        url: 'https://github.com/classULDM/class.SFDM',
        description: {
          en: 'CLASS Boltzmann code extension implementing cosmological perturbations with spin-0 ultralight dark matter.',
          es: 'Extensión del código de Boltzmann CLASS que implementa las perturbaciones cosmológicas con materia oscura ultraliviana de spin-0.',
        },
      },
    ],
  },
  {
    title: { es: 'Apuntes', en: 'Notes' },
    icon: BookOpen,
    items: [],
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
    <section className="mx-auto max-w-6xl px-6 py-16">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">{t('title')}</h1>
      </header>

      {RESOURCE_GROUPS.every((g) => g.items.length === 0) ? (
        <p className="mt-12 text-ink-muted">{t('empty')}</p>
      ) : (
        <div className="mt-12 space-y-14">
          {RESOURCE_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <section key={group.title.en}>
                <h2 className="font-serif text-xl uppercase tracking-wider text-ink-subtle">
                  {localize(group.title, locale)}
                </h2>
                {group.items.length === 0 ? (
                  <p className="mt-4 text-ink-muted">{t('groupEmpty')}</p>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {group.items.map((r) => (
                      <article
                        key={r.url}
                        className="flex flex-col rounded-md bg-surface-alt p-6"
                      >
                        <Icon aria-hidden="true" className="h-8 w-8 text-accent" />
                        <h3 className="mt-5 font-serif text-xl font-semibold leading-snug">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt rounded"
                          >
                            {localize(r.title, locale)}
                          </a>
                        </h3>
                        {r.description && (
                          <p className="mt-3 text-ink-muted leading-relaxed">
                            {localize(r.description, locale)}
                          </p>
                        )}
                        {r.doi && (
                          <a
                            href={`https://doi.org/${r.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 self-start text-sm text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt rounded"
                          >
                            DOI: {r.doi} →
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
