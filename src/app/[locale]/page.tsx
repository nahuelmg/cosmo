import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { localize, siteConfig } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { Highlights } from '@/components/home/Highlights';
import { PartnerStrip } from '@/components/home/PartnerStrip';

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
    href: '/',
    title: siteConfig.groupName,
    description: t('home.description'),
    absoluteTitle: true,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');

  const slides = [
    { src: '/Portadas/portada_1.jpg', alt: '', width: 1920, height: 820 },
    { src: '/Portadas/portada_2.png', alt: '', width: 1920, height: 820 },
    { src: '/Portadas/portada_3.jpg', alt: '', width: 1920, height: 820 },
  ];

  const tagline = localize(siteConfig.tagline, locale);
  const affiliation = siteConfig.affiliations
    .map(a => localize(a.name, locale))
    .join(' · ');

  const partners = siteConfig.affiliations.map(a => ({
    name: localize(a.name, locale),
    url: a.url,
  }));

  // HOME-05: split on `\n\n` so each paragraph renders as a real <p> element.
  // Do NOT use whitespace-pre-line — semantic paragraphs required (2–3 per spec).
  const introParagraphs = t('intro').split('\n\n').filter(p => p.trim().length > 0);

  return (
    <>
      <HeroCarousel
        slides={slides}
        groupName={siteConfig.groupName}
        tagline={tagline}
        affiliation={affiliation}
      />

      <section className="mx-auto max-w-3xl space-y-4 px-6 py-16">
        {introParagraphs.map((para, i) => (
          <p key={i} className="font-serif text-lg leading-relaxed text-ink-muted">
            {para}
          </p>
        ))}
      </section>

      <Highlights
        sectionTitle={t('highlightsTitle')}
        cards={[
          { title: t('highlight1Title'), body: t('highlight1Body') },
          { title: t('highlight2Title'), body: t('highlight2Body') },
          { title: t('highlight3Title'), body: t('highlight3Body') },
        ]}
      />

      <PartnerStrip
        title={t('partnersTitle')}
        partners={partners}
      />
    </>
  );
}
