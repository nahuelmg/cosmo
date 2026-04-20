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
 *   - Desktop (>= md / 768px): three-column flex — logo (left), NavLinks
 *     (centred via equal-width flex-1 gutters), LocaleToggle (right).
 *   - Mobile (< md): logo (left) + MobileNav hamburger trigger (right).
 *     The inline nav and desktop LocaleToggle are hidden; both live inside
 *     the drawer that MobileNav opens.
 *
 * Design constraints from 01-02 / RESEARCH.md Pattern 6:
 *   - Sticky, z-30, surface background with `shadow-sm` — visual separation
 *     without a border. `shadow-sm` is the one allowed separator under the
 *     shadow ceiling.
 *   - Height 96px mirrors the `--header-height` token, so the SkipLink's
 *     `scroll-margin-top: var(--header-height)` aligns perfectly.
 *   - `max-w-5xl` container width keeps the header span consistent with page
 *     content; individual pages may use narrower widths.
 *
 * Logo sizing:
 *   - `h-16 w-auto` renders the logo at 64px tall inside the 96px header.
 *   - `width={80} height={80}` match the PNG's intrinsic ~1:1 aspect;
 *     next/image downscales for the rendered 64px box.
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
        'h-24',
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto max-w-6xl',
          'h-full px-6',
          'flex items-center',
        ].join(' ')}
      >
        {/* Left column — brand mark links to locale-prefixed home. */}
        <div className="flex-1 flex items-center justify-start">
          <Link
            href="/"
            aria-label={siteConfig.groupName}
            className={[
              'inline-flex items-center shrink-0',
              'focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded',
            ].join(' ')}
          >
            <Image
              src="/logo_cosmo.png"
              alt={siteConfig.groupName}
              width={80}
              height={80}
              loading="eager"
              fetchPriority="high"
              className="h-16 w-auto"
            />
          </Link>
        </div>

        {/* Centre column — desktop nav (hidden below md). */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-5"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} className="text-lg">
              {tNav(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Right column — locale toggle (desktop) or mobile nav trigger. */}
        <div className="flex-1 flex items-center justify-end">
          <div className="hidden md:flex items-center">
            <LocaleToggle />
          </div>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
