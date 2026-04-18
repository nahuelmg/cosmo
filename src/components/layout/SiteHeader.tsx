'use client';

import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {siteConfig} from '@/config/site';
import {NAV_ITEMS} from './nav-items';
import {NavLink} from './NavLink';
import {LocaleToggle} from './LocaleToggle';
import {MobileNav} from './MobileNav';

/**
 * Sticky top header — the chrome every page wears.
 *
 * Layout:
 *   - Desktop (>= md / 768px): logo (left) + 7 NavLinks (centre-right) +
 *     LocaleToggle (far right via `ml-auto`).
 *   - Mobile (< md): logo (left) + MobileNav hamburger trigger (right).
 *     The inline nav and desktop LocaleToggle are hidden; both live inside
 *     the drawer that MobileNav opens.
 *
 * Design constraints from 01-02 / RESEARCH.md Pattern 6:
 *   - Sticky, z-30, surface background with `shadow-sm` — visual separation
 *     without a border. `shadow-sm` is the one allowed separator under the
 *     shadow ceiling.
 *   - Height 56px mirrors the `--header-height` token Plan 01 added, so the
 *     SkipLink's `scroll-margin-top: var(--header-height)` aligns perfectly.
 *   - `max-w-5xl` container width keeps the header span consistent with page
 *     content; individual pages may use narrower widths.
 *
 * Logo sizing:
 *   - `h-8 w-auto` renders the logo at 32px tall inside the 56px header —
 *     sensible visual weight for a compact-density bar.
 *   - `width={40} height={40}` match the PNG's intrinsic ~1:1 aspect;
 *     next/image downscales for the rendered 32px box.
 *   - `loading="eager" fetchPriority="high"` because the logo is in the
 *     initial viewport on every route; no `preload` because the logo is NOT
 *     the LCP element on any page — preloading it would delay the true LCP
 *     asset on content pages (migrated from deprecated `priority` per
 *     Next.js 16.2.4, RESEARCH.md Pattern 3 image-role matrix).
 *   - `alt={siteConfig.groupName}` — the logo's accessible name is the
 *     institutional group name (Spanish, canonical per 02-01). Screen-reader
 *     users on /en also hear "Grupo de Cosmología"; that is the correct
 *     institutional identity, not a localisation miss.
 *
 * Active-state rendering happens inside each NavLink (Plan 03), so SiteHeader
 * does not call `usePathname` itself.
 */
export function SiteHeader() {
  const tNav = useTranslations('nav');

  return (
    <header
      className={[
        'sticky top-0 z-30',
        'bg-surface',
        'shadow-sm',
        'h-14',
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto max-w-5xl',
          'h-full px-6',
          'flex items-center gap-6',
        ].join(' ')}
      >
        {/* Brand mark — logo links to locale-prefixed home. */}
        <Link
          href="/"
          aria-label={siteConfig.groupName}
          className={[
            'inline-flex items-center shrink-0',
            'focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-accent-ring rounded',
          ].join(' ')}
        >
          <Image
            src="/logo_cosmo.png"
            alt={siteConfig.groupName}
            width={40}
            height={40}
            loading="eager"
            fetchPriority="high"
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop nav — hidden below md. */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-5 ml-2"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} className="text-sm">
              {tNav(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Desktop-only locale toggle pushed to the far right. */}
        <div className="hidden md:flex ml-auto items-center">
          <LocaleToggle />
        </div>

        {/* Mobile nav trigger — MobileNav's trigger is internally md:hidden. */}
        <div className="md:hidden ml-auto">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
