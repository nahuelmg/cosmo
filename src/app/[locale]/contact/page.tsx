import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { localize, siteConfig } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';
import { ContactDetails } from '@/components/contact/ContactDetails';
import MapEmbed from '@/components/contact/MapEmbed';

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
    href: '/contact',
    title: t('contact.title'),
    description: t('contact.description'),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('contact');

  const address = localize(siteConfig.address, locale);
  const office = localize(siteConfig.office, locale);
  const mapQuery = siteConfig.mapQuery;
  const fallbackHref = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`;
  const mapTitle = t('mapTitle');

  const socialLinks = (siteConfig.socialLinks as readonly { platform: string; url: string; label: string }[]).map(
    (s) => ({ platform: s.platform, url: s.url, label: s.label }),
  );

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          {t('title')}
        </h1>
      </header>

      <div className="mt-10">
        <ContactDetails
          address={address}
          office={office}
          email={siteConfig.contactEmail}
          socialLinks={socialLinks}
          labels={{
            addressLabel: t('addressLabel'),
            officeLabel: t('officeLabel'),
            emailLabel: t('emailLabel'),
            socialLabel: t('social'),
            noSocialMessage: t('noSocial'),
          }}
        />
      </div>

      <div className="mt-12">
        <h2 className="font-serif text-sm uppercase tracking-wider text-ink-subtle">
          {t('viewOnMaps')}
        </h2>
        <div className="mt-4">
          <MapEmbed query={mapQuery} fallbackHref={fallbackHref} title={mapTitle} />
        </div>
      </div>
    </section>
  );
}
