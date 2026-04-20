import {getTranslations} from 'next-intl/server';
import {routing} from '@/i18n/routing';
import {siteConfig, type SocialLink} from '@/config/site';
import {EmailLink} from '@/components/ui/EmailLink';

type Locale = (typeof routing.locales)[number];

interface SiteFooterProps {
  locale: Locale;
}

/**
 * Institutional footer — the shared chrome at the bottom of every page.
 *
 * Server component because it reads the `footer` translation namespace via
 * `getTranslations({locale, namespace: 'footer'})` and renders <EmailLink>,
 * which is itself the dynamic(ssr:false) wrapper from 03-02. No `'use client'`
 * directive at this layer — the whole subtree stays out of the prerendered
 * HTML's message-scheme literal (Success Criterion 3 / NAV-03).
 *
 * Layout:
 *   - md+: two-column grid — identity column (group name + affiliations) on
 *     the left, contact column (email + guarded social links) on the right.
 *   - <md: stacked single-column with gap.
 *   - `mt-auto` combined with the layout's `min-h-screen flex flex-col` pins
 *     the footer to the bottom on short pages.
 *   - `shadow-sm` separator honours the no-border policy (01-02).
 *
 * Identity:
 *   - Group name comes from the site config (canonical Spanish — 02-01).
 *   - Affiliations use the `footer.affiliationUba/Fcen/Conicet` translation
 *     keys (bilingual); the config `affiliations` array intentionally stays
 *     available for future logo-linked references but is not used here.
 *   - Contact email is split on '@' and passed to <EmailLink> as user/domain
 *     so the message-scheme literal never appears in this file or in the
 *     prerendered HTML.
 *   - Social links render only when the config list is non-empty
 *     (currently empty — academic-restraint: no "follow us" placeholder).
 *   - Copyright uses `footer.copyright` with `{year}` ICU interpolation.
 */
export async function SiteFooter({locale}: SiteFooterProps) {
  const tFooter = await getTranslations({locale, namespace: 'footer'});

  // Split the canonical contact email into the two props <EmailLink> expects.
  // siteConfig.contactEmail is a compile-time-checked string containing '@'.
  const [user, domain] = siteConfig.contactEmail.split('@');

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
          <ul className="flex flex-col gap-1 text-sm text-ink-muted">
            <li>{tFooter('affiliationUba')}</li>
            <li>{tFooter('affiliationFcen')}</li>
            <li>{tFooter('affiliationConicet')}</li>
          </ul>
        </div>

        {/* Contact column */}
        <div className="flex flex-col gap-3 md:items-end">
          <EmailLink
            user={user}
            domain={domain}
            className={[
              'text-sm text-ink-muted hover:text-accent transition-colors',
              'focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded',
            ].join(' ')}
          />

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
