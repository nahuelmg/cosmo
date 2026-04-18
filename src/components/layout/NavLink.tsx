'use client';

import type {ReactNode} from 'react';
import {Link, usePathname} from '@/i18n/navigation';
import type {NavItem} from './nav-items';

export interface NavLinkProps {
  href: NavItem['href'];
  children: ReactNode;
  className?: string;
  /** Applied on top of base classes when route is active. */
  activeClassName?: string;
  /** Called after navigation (used by MobileNav to close the drawer). */
  onNavigate?: () => void;
}

/**
 * Localized navigation link that marks itself active when the current route
 * matches its internal href key.
 *
 * IMPORT SOURCE MATTERS: `Link` and `usePathname` come from `@/i18n/navigation`,
 * NOT from `next/navigation`. The i18n-aware `usePathname` returns the internal
 * key (e.g. `/research`) regardless of locale, so a simple equality/startsWith
 * check against the `href` prop works. Importing from `next/navigation` would
 * return the localized path (`/es/investigacion`) and break the active-state
 * check. See RESEARCH.md Pitfall #1.
 *
 * Active styling honours the 01-02 no-border policy: active state changes
 * weight (`font-semibold`) and colour (`text-accent`) only. No underline, no
 * border, no box-shadow on the link itself.
 */
export function NavLink({
  href,
  children,
  className = '',
  activeClassName = '',
  onNavigate,
}: NavLinkProps) {
  const pathname = usePathname();

  // Home uses exact match; every other route uses startsWith so sub-routes
  // like /people/[slug] still highlight the top-level nav entry.
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  const base = 'transition-colors';
  const inactive = 'text-ink-muted hover:text-ink';
  const active = 'text-accent font-semibold';

  const combined = [
    base,
    isActive ? `${active} ${activeClassName}` : inactive,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link
      href={href}
      className={combined}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}
