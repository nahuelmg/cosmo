import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

// Narrow literal union ("es" | "en") derived from the routing config so
// getTranslations({ locale }) gets a typed locale instead of plain string.
// Matches the pattern used in src/app/[locale]/page.tsx.
type Locale = (typeof routing.locales)[number];

interface SkipLinkProps {
  locale: Locale;
}

/**
 * Accessibility skip link — visually hidden until keyboard focus reveals it.
 *
 * Renders as the first focusable element inside <body> so a keyboard user
 * pressing Tab once on any page sees a "Skip to main content" chip top-left.
 * Activating it jumps focus (not just scroll) to <main id="main-content">
 * because that landmark has tabIndex={-1} (see src/app/[locale]/layout.tsx).
 *
 * Styling respects the no-border policy (01-02): focus ring is rendered as a
 * box-shadow via `focus:ring-2 focus:ring-accent-ring`, not a CSS border.
 * z-[100] sits above every Phase 3 surface (header z-30, mobile overlay z-40,
 * drawer z-50 per the RESEARCH.md z-index ladder).
 *
 * Server component — label comes from `getTranslations` with the request's
 * locale, so no client JS is needed to render the correct string per locale.
 */
export async function SkipLink({ locale }: SkipLinkProps) {
  const t = await getTranslations({ locale, namespace: 'layout' });
  return (
    <a
      href="#main-content"
      className={[
        'sr-only focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
        'focus:bg-surface focus:text-ink',
        'focus:px-4 focus:py-2 focus:rounded',
        'focus:shadow-md focus:outline-none',
        'focus:ring-2 focus:ring-accent-ring',
        'font-sans text-sm font-semibold',
      ].join(' ')}
    >
      {t('skipToContent')}
    </a>
  );
}
