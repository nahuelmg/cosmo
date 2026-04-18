'use client';

import {useState, useEffect} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {useTranslations} from 'next-intl';
import {usePathname} from '@/i18n/navigation';
import {NAV_ITEMS} from './nav-items';
import {NavLink} from './NavLink';
import {LocaleToggle} from './LocaleToggle';

/**
 * Mobile-only navigation drawer.
 *
 * Architecture:
 *   - Radix Dialog supplies focus trap, Escape-to-close, return-focus-to-trigger,
 *     aria-modal, portal rendering, and scroll-lock via the overlay. Hand-rolling
 *     any of these is the single most common source of mobile-a11y regressions
 *     (see RESEARCH.md), so we delegate completely.
 *   - The Trigger is hidden on desktop via `md:hidden`, so the SiteHeader does
 *     not need to wrap this component in a media-query — the responsive boundary
 *     lives inside MobileNav.
 *   - Passing `setOpen(false)` as each NavLink's `onNavigate` closes the drawer
 *     when a link is tapped. `useEffect([pathname])` covers the edge case of
 *     programmatic navigation (no click event).
 *   - z-index ladder from RESEARCH.md Pattern 6: overlay z-40, content z-50.
 *     SkipLink's focus:z-[100] still sits above if the user tabs to it while
 *     the drawer is open.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('layout');
  const tNav = useTranslations('nav');
  const pathname = usePathname();

  // Auto-close when the route actually changes — belt-and-braces alongside
  // NavLink's onNavigate. Covers programmatic navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={t('openMenu')}
        className={[
          'md:hidden',
          'inline-flex items-center justify-center',
          'w-10 h-10 rounded',
          'text-ink hover:text-accent',
          'focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-accent-ring',
        ].join(' ')}
      >
        {/* Inline hamburger — avoids adding an icon library for 3 glyphs total. */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/20" />
        <Dialog.Content
          aria-label={t('openMenu')}
          className={[
            'fixed inset-y-0 right-0 z-50',
            'w-72 max-w-[85vw]',
            'bg-surface',
            'shadow-md',
            'p-6 pt-4',
            'flex flex-col',
            'focus:outline-none',
          ].join(' ')}
        >
          {/* Hidden but announced title — Radix requires Dialog.Title for a11y. */}
          <Dialog.Title className="sr-only">{t('openMenu')}</Dialog.Title>

          <div className="flex justify-end mb-6">
            <Dialog.Close
              aria-label={t('closeMenu')}
              className={[
                'inline-flex items-center justify-center',
                'w-10 h-10 rounded',
                'text-ink hover:text-accent',
                'focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-accent-ring',
              ].join(' ')}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </Dialog.Close>
          </div>

          <nav aria-label={t('openMenu')} className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                onNavigate={() => setOpen(false)}
                className="text-base py-3 px-2 rounded"
                activeClassName="bg-surface-alt"
              >
                {tNav(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <LocaleToggle className="w-full text-left px-2 py-3 text-base" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
