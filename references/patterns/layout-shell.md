# Layout Shell Pattern (Server/Client Split)

> Responsive page shell with sticky header, footer, and mobile navigation. Uses a server/client component split so the header can fetch translations server-side while keeping interactive behavior (hamburger menu, scroll lock) client-side.

**Validated in**: Landing page project (2026-03)
**Works with**: next-intl, Tailwind CSS v4, Next.js App Router

---

## 1. Architecture

```
Server Component (SiteHeader)          Client Component (HeaderClient)
┌─────────────────────────┐            ┌──────────────────────────────┐
│ - Fetches translations  │───props───▶│ - Mobile menu toggle         │
│ - Resolves locale       │            │ - Body scroll lock           │
│ - Maps nav items        │            │ - Route change detection     │
│ - Computes toggle label │            │ - CSS dropdown (desktop)     │
└─────────────────────────┘            │ - Language toggle            │
                                       └──────────────────────────────┘
```

**Why split?** The header needs both server data (translations, locale) and client interactivity (menu state, scroll lock). Keeping the server component as the data boundary avoids `useTranslations` in the client and keeps the client bundle smaller.

---

## 2. Data Layer

Define navigation items in a centralized data file — not hardcoded in components:

```ts
// src/data/navigation.ts
export type NavKey = 'home' | 'about' | 'services' | 'contact';

export type NavItem = {
  key: NavKey;
  href: string;
};

export const mainNavItems: NavItem[] = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'services', href: '/services' },
  { key: 'contact', href: '/contact' },
];
```

Translation keys in `messages/en.json` match the `NavKey` values:
```json
{
  "Navigation": {
    "home": "Home",
    "about": "About",
    "services": "Services",
    "contact": "Contact",
    "languageToggle": "ES",
    "footerNavigation": "Navigation"
  }
}
```

---

## 3. Server Component (SiteHeader)

Fetches translations and resolves locale, then passes plain serializable props to the client:

```tsx
// src/components/layout/site-header.tsx
import { getTranslations, getLocale } from 'next-intl/server';
import { mainNavItems } from '@/data/navigation';
import { HeaderClient } from './header-client';

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations('Navigation');

  const navItems = mainNavItems.map((item) => ({
    label: t(item.key),
    href: item.href,
    key: item.key,
  }));

  // Add dropdown items if a nav item has sub-pages
  // const subItems = someDataSource.map((s) => ({
  //   label: s.title[locale as 'en' | 'es'],
  //   href: `/services/${s.slug}`,
  // }));

  const languageToggleLabel = t('languageToggle');
  const oppositeLocale = locale === 'en' ? 'es' : 'en';

  return (
    <HeaderClient
      navItems={navItems}
      // subItems={subItems}
      languageToggleLabel={languageToggleLabel}
      oppositeLocale={oppositeLocale}
    />
  );
}
```

---

## 4. Client Component (HeaderClient)

Handles all interactive behavior:

```tsx
// src/components/layout/header-client.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

type NavItem = { label: string; href: string; key: string };
type SubItem = { label: string; href: string };

type HeaderClientProps = {
  navItems: NavItem[];
  subItems?: SubItem[];
  dropdownKey?: string;         // Which nav key triggers the dropdown
  languageToggleLabel: string;
  oppositeLocale: string;
};

export function HeaderClient({
  navItems,
  subItems = [],
  dropdownKey = 'services',
  languageToggleLabel,
  oppositeLocale,
}: HeaderClientProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const didMount = useRef(false);

  // Close menu on route change (skip initial mount)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setIsMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40 h-20">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {/* Replace with your logo */}
            <span className="text-xl font-bold">Logo</span>
          </Link>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 text-foreground"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) =>
              item.key === dropdownKey && subItems.length > 0 ? (
                <div key={item.key} className="relative group">
                  <Link href={item.href} className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                  {/* CSS-only dropdown — no JS popover library needed */}
                  <div className="absolute top-full left-0 hidden pt-2 group-hover:flex flex-col">
                    <div className="bg-card border border-border shadow-md rounded-lg min-w-48 py-1">
                      {subItems.map((sub) => (
                        <Link key={sub.href} href={sub.href} className="block px-4 py-2 text-base text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={item.key} href={item.href} className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              )
            )}

            {/* Language toggle */}
            <Link href={pathname} locale={oppositeLocale} className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground border border-border rounded-md px-3 py-1">
              {languageToggleLabel}
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile menu overlay — outside <header> to avoid backdrop-filter stacking context */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-20 z-50 bg-background flex flex-col p-6 space-y-4 overflow-y-auto md:hidden">
          {navItems.map((item) => (
            <div key={item.key}>
              <Link href={item.href} className="text-lg font-medium transition-colors hover:text-muted-foreground" onClick={() => setIsMenuOpen(false)}>
                {item.label}
              </Link>
              {item.key === dropdownKey && subItems.length > 0 && (
                <div className="pl-4 mt-2 space-y-2">
                  {subItems.map((sub) => (
                    <Link key={sub.href} href={sub.href} className="block text-base text-muted-foreground transition-colors hover:text-foreground" onClick={() => setIsMenuOpen(false)}>
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Link href={pathname} locale={oppositeLocale} className="inline-flex w-fit text-lg font-medium text-muted-foreground transition-colors hover:text-foreground border border-border rounded-md px-3 py-1" onClick={() => setIsMenuOpen(false)}>
            {languageToggleLabel}
          </Link>
        </div>
      )}
    </>
  );
}
```

---

## 5. Footer (Server Component)

Footer is simpler — no client interactivity needed:

```tsx
// src/components/layout/site-footer.tsx
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { mainNavItems } from '@/data/navigation';

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getTranslations('Navigation');

  const navLinks = mainNavItems.map((item) => ({
    label: t(item.key),
    href: item.href,
  }));

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex">
              <span className="text-lg font-bold">Logo</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {/* Company description */}
            </p>
          </div>

          {/* Navigation column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('footerNavigation')}</h3>
            <ul className="space-y-2">
              {navLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Add more columns as needed (services, contact, social) */}
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Your Company
          </p>
        </div>
      </div>
    </footer>
  );
}
```

---

## 6. Locale Layout Assembly

Wire it all together in the locale layout:

```tsx
// src/app/[locale]/layout.tsx
<body className="min-h-screen flex flex-col antialiased">
  <NextIntlClientProvider>
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <SiteFooter />
  </NextIntlClientProvider>
</body>
```

Key classes:
- `min-h-screen flex flex-col` — footer sticks to bottom even on short pages
- `flex-1` on `<main>` — content area fills remaining space
- `antialiased` — smoother font rendering

---

## 7. Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Server/client split | Server fetches, client renders | Smaller client bundle, no `useTranslations` in interactive components |
| CSS-only dropdown | `group-hover:flex` | No popover library dependency, works without JS |
| Mobile overlay outside `<header>` | Separate `<div>` after `</header>` | `backdrop-blur` on header creates a stacking context that clips the overlay |
| Inline SVG icons | No icon library import | Two icons don't justify a dependency; keeps bundle small |
| `didMount` ref for route change | Skip close on initial render | Without this, menu closes immediately on page load |
| Body scroll lock | `document.body.style.overflow` | Simple and reliable; cleanup in useEffect return |

---

## 8. Adaptation Guide

**No i18n?** Remove `oppositeLocale`, `languageToggleLabel`, and the language toggle `<Link>`. Use regular `next/link` instead of `@/i18n/navigation`.

**No dropdown?** Remove the `subItems` prop and the `dropdownKey` conditional — every nav item renders as a simple link.

**Dark mode toggle?** Add it next to the language toggle in the desktop nav and mobile menu.

**Authenticated routes?** Add a user avatar / sign-in button in the same nav area. The server component can check auth state and pass `isAuthenticated` as a prop.

---

*Last verified: 2026-03*
