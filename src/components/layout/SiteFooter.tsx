import {getTranslations} from 'next-intl/server';
import {routing} from '@/i18n/routing';
import {siteConfig, type SocialLink} from '@/config/site';

type Locale = (typeof routing.locales)[number];

interface SiteFooterProps {
  locale: Locale;
}

/**
 * Institutional footer — the shared chrome at the bottom of every page.
 *
 * Server component because it reads the `footer` translation namespace via
 * `getTranslations({locale, namespace: 'footer'})`. No `'use client'` directive
 * at this layer.
 *
 * Layout:
 *   - md+: two-column grid — identity column (group name + affiliation line)
 *     on the left, guarded social links on the right.
 *   - <md: stacked single-column with gap.
 *   - `mt-auto` combined with the layout's `min-h-screen flex flex-col` pins
 *     the footer to the bottom on short pages.
 *   - `shadow-sm` separator honours the no-border policy (01-02).
 *
 * Identity:
 *   - Group name comes from the site config (canonical Spanish — 02-01).
 *   - The affiliation block uses the `footer.affiliationsPrimary` /
 *     `affiliationsSecondary` keys, one per line (bilingual); the config
 *     `affiliations` array intentionally stays
 *     available for future logo-linked references but is not used here.
 *   - The group has no public contact address, so the footer shows none.
 *   - Social links render only when the config list is non-empty
 *     (currently empty — academic-restraint: no "follow us" placeholder).
 *   - Copyright uses `footer.copyright` with `{year}` ICU interpolation.
 */
export async function SiteFooter({locale}: SiteFooterProps) {
  const tFooter = await getTranslations({locale, namespace: 'footer'});

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={[
        'mt-auto',
        'bg-surface-alt',
        'shadow-sm',
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto max-w-5xl',
          'px-6 py-10',
          'grid gap-8',
          'md:grid-cols-2',
        ].join(' ')}
      >
        {/* Identity column */}
        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-lg font-semibold text-ink">
            {siteConfig.groupName}
          </h2>
          <div className="flex flex-col gap-1 text-sm text-ink-muted">
            <p>{tFooter('affiliationsPrimary')}</p>
            <p>{tFooter('affiliationsSecondary')}</p>
          </div>
        </div>

        {/* Contact column */}
        <div className="flex flex-col gap-3 md:items-end">
          {siteConfig.socialLinks.length > 0 && (
            <ul className="flex flex-wrap gap-4 text-sm text-ink-muted md:justify-end">
              {(siteConfig.socialLinks as ReadonlyArray<SocialLink>).map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className={[
                      'hover:text-accent transition-colors',
                      'focus-visible:outline-none',
                      'focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded',
                    ].join(' ')}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-6">
        <p className="text-xs text-ink-subtle">
          {tFooter('copyright', {year: currentYear})}
        </p>
      </div>
    </footer>
  );
}
