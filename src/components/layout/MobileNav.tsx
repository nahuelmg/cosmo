'use client';

import {useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {useTranslations} from 'next-intl';
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
 *   - Close paths (React 19 / `react-hooks/set-state-in-effect` compliant —
 *     no `useEffect([pathname])` auto-close, which would trip the new rule):
 *       1. Link tap: `NavLink.onNavigate` → `setOpen(false)` (lines below).
 *       2. Locale swap: onClick-capture on the LocaleToggle wrapper closes the
 *          drawer before `router.replace` fires. This is the only programmatic
 *          navigation source rendered inside the drawer (verified by grepping
 *          for `router.push|router.replace` across src/ — only LocaleToggle).
 *       3. Escape / overlay click / explicit close button: handled by Radix
 *          `onOpenChange` → `setOpen`.
 *   - z-index ladder from RESEARCH.md Pattern 6: overlay z-40, content z-50.
 *     SkipLink's focus:z-[100] still sits above if the user tabs to it while
 *     the drawer is open.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('layout');
  const tNav = useTranslations('nav');

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={t('openMenu')}
        className={[
          'md:hidden',
          'inline-flex items-center justify-center',
          'w-11 h-11 rounded',
          'text-ink hover:text-accent',
          // Press-feedback: combined transition so color + scale animate together
          // without one clobbering the other's transition-property.
          'transition-[color,transform] duration-75',
          'active:scale-95',
          'focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
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
                'w-11 h-11 rounded',
                'text-ink hover:text-accent',
                // Press-feedback (see trigger).
                'transition-[color,transform] duration-75',
                'active:scale-95',
                'focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
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
                className="text-sm py-3 px-2 rounded"
                activeClassName="bg-surface-alt"
              >
                {tNav(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          {/*
            onClickCapture closes the drawer BEFORE LocaleToggle's onClick
            handler triggers `router.replace`. Without this, the drawer would
            stay visually open on top of the freshly-rendered route. The
            capture phase is essential: a bubble-phase listener would fire
            after LocaleToggle's startTransition has already scheduled the
            replace, and setOpen(false) would race the navigation commit.
          */}
          <div
            className="mt-auto pt-6"
            onClickCapture={() => setOpen(false)}
          >
            <LocaleToggle className="w-full text-left px-2 py-3 text-sm" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
