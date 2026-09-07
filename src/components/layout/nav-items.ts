/**
 * Single source of truth for the site's top navigation.
 * Both desktop header (SiteNav) and mobile drawer (MobileNav) render from this array.
 *
 * `href` values are INTERNAL keys from src/i18n/routing.ts.pathnames — NOT
 * localized paths. The Link component from @/i18n/navigation handles path
 * translation per locale automatically.
 *
 * `labelKey` is a key inside the `nav` namespace of messages/{es,en}.json.
 */

export interface NavItem {
  /** Internal pathname key — must exist as a key in routing.pathnames. */
  href: '/' | '/people' | '/research' | '/publications' | '/journal-club' | '/resources' | '/outreach' | '/contact';
  /** Translation key under the `nav` namespace. */
  labelKey: 'home' | 'people' | 'research' | 'publications' | 'journalClub' | 'resources' | 'outreach' | 'contact';
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/',             labelKey: 'home' },
  { href: '/people',       labelKey: 'people' },
  { href: '/research',     labelKey: 'research' },
  { href: '/publications', labelKey: 'publications' },
  { href: '/journal-club', labelKey: 'journalClub' },
  { href: '/resources',    labelKey: 'resources' },
  // { href: '/outreach',     labelKey: 'outreach' }, // hidden — page still reachable by URL
  { href: '/contact',      labelKey: 'contact' },
] as const;
