# Phase 3: Layout Shell - Research

**Researched:** 2026-04-17
**Domain:** Next.js 16 app router, next-intl 4.x navigation, accessibility, email obfuscation, Tailwind v4
**Confidence:** HIGH (codebase directly inspected; next-intl API from installed source + official docs)

---

## Summary

Five things the planner must know before tasking:

1. **Locale toggle**: Use `useRouter().replace({pathname, params}, {locale})` from `@/i18n/navigation` (already exported). `usePathname()` returns the **internal pathname key** (e.g., `/research`, not `/es/investigacion`), so it composes correctly with `router.replace`. Query params require manual threading via `useSearchParams()` from `next/navigation`. Hash is NOT preserved by next-intl's router automatically.

2. **Active route detection**: Compare `usePathname()` (returns internal key) against the nav link's internal href key. Works across locales because the internal key is locale-agnostic. No extra library or `useSelectedLayoutSegment` needed.

3. **EmailLink obfuscation**: Hand-roll a client component that stores email parts in data attributes and assembles `mailto:` only on the client after hydration. The `react-obfuscate` package (v3.7.0, last published 2 years ago) is an option but is effectively unmaintained. A 15-line custom component is safer, zero-dependency, and gives full control. The constraint — zero literal `mailto:` in prerendered HTML — is achievable either way.

4. **Mobile nav focus trap**: `@radix-ui/react-dialog` v1.1.15 (React 19 compatible, peer deps confirmed) provides focus trap, Escape key, return-focus-to-trigger, and `aria-modal` semantics out of the box. A hand-rolled trap is feasible (~30 lines) but Dialog is the better tradeoff for this project. Radix has no other Radix dep that isn't already implied.

5. **Skip link + sticky header**: Add `scroll-margin-top: var(--header-height)` to `#main-content` and `tabindex="-1"` to the `<main>` element. Without `tabindex="-1"`, screen reader focus does not land on the target. The skip link must be the first focusable element in the DOM.

**Primary recommendation:** Build locale toggle as a `'use client'` component using the already-wired `useRouter`/`usePathname` from `@/i18n/navigation`. Build `<EmailLink>` as a `'use client'` component with data-attribute assembly (no new package). Add `@radix-ui/react-dialog` for mobile nav.

---

## Standard Stack

### Core (already installed — no new installs for core functionality)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| next-intl | 4.9.1 | Locale-aware Link, usePathname, useRouter, useLocale | already in package.json |
| next | 16.2.4 | App router, useParams, useSearchParams | already in package.json |
| react | 19.2.4 | Client component hooks | already in package.json |
| tailwindcss | 4.x | sticky, z-*, shadow-*, sr-only | already in package.json |

### New Package Required

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @radix-ui/react-dialog | 1.1.15 | Focus trap for mobile nav | Handles focus trap, Escape, return-focus, aria-modal, body scroll lock. React 19 peer dep confirmed. |

**Installation:**
```bash
npm install @radix-ui/react-dialog
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @radix-ui/react-dialog | Hand-rolled focus trap | ~30-line hook achievable but fragile; edge cases around dynamically added focusable elements, iOS Safari, shadow DOM. Radix is battle-tested. |
| @radix-ui/react-dialog | focus-trap-react | Another valid option (focus-trap/focus-trap-react, well-maintained) but adds similar weight; Radix also provides overlay, portal, aria-modal, so it replaces more boilerplate. |
| Custom EmailLink | react-obfuscate 3.7.0 | react-obfuscate is last published 2 years ago, not actively maintained; uses CSS `direction: rtl` reversal which breaks copy-paste of the address. Custom component is better. |

---

## Architecture Patterns

### Recommended Component Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── SiteHeader.tsx          # 'use client' — sticky header wrapper
│   │   ├── SiteNav.tsx             # nav links + active state (client)
│   │   ├── LocaleToggle.tsx        # 'use client' — single-button locale switch
│   │   ├── MobileNav.tsx           # 'use client' — Radix Dialog drawer
│   │   ├── SiteFooter.tsx          # Server component (static content)
│   │   └── SkipLink.tsx            # Server component (plain anchor)
│   └── ui/
│       └── EmailLink.tsx           # 'use client' — obfuscated mailto
```

The locale layout (`src/app/[locale]/layout.tsx`) imports `SiteHeader` and `SiteFooter` and wraps `children` in a `<main id="main-content" tabIndex={-1}>`.

### Pattern 1: Locale Toggle

**What:** Client component that reads current internal pathname + params, then navigates to same pathname with swapped locale.

**Implementation:**
```tsx
// Source: next-intl 4.9.1 docs (https://next-intl.dev/docs/routing/navigation#userouter)
'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useParams, useSearchParams } from 'next/navigation';
import { routing } from '@/i18n/routing';

export function LocaleToggle() {
  const locale = useLocale();
  const otherLocale = locale === 'es' ? 'en' : 'es';
  const router = useRouter();
  const pathname = usePathname();   // returns internal key e.g. /research
  const params = useParams();       // includes slug for /people/[slug]
  const searchParams = useSearchParams();

  function handleSwitch() {
    // Build query object from current search params
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });

    router.replace(
      { pathname, params, query },
      { locale: otherLocale }
    );
    // Hash: not preserved by next-intl router; acceptable per CONTEXT.md requirements
    // (no hash-based pages in this site's nav flows)
  }

  return (
    <button onClick={handleSwitch} aria-label={`Switch to ${otherLocale.toUpperCase()}`}>
      {otherLocale.toUpperCase()}
    </button>
  );
}
```

**Critical insight:** `usePathname()` from `@/i18n/navigation` (next-intl's version) already strips the locale prefix and returns the internal key. Do NOT import from `next/navigation` — that returns the raw `/es/investigacion` path which breaks `router.replace`.

**useSearchParams() requires Suspense boundary** — wrap `LocaleToggle` in `<Suspense>` or hoist the searchParams reading into a child component.

### Pattern 2: Active Route Detection

**What:** Compare `usePathname()` (internal key) to the nav link's internal href.

```tsx
// Source: next-intl docs + Next.js docs (both confirmed)
'use client';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';

interface NavLinkProps {
  href: string;   // internal key: '/', '/research', '/people', etc.
  label: string;
}

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  // Root: exact match. Others: starts-with for sub-pages
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={isActive ? 'font-semibold text-accent' : 'text-ink-muted hover:text-ink'}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}
```

**Note:** This uses `font-semibold` + `text-accent` within the no-border policy. No underline, no box-shadow on the link itself (box-shadow is for focus rings). The weight+colour change is sufficient for academic aesthetics.

### Pattern 3: EmailLink Obfuscation

**Constraint:** Zero literal `mailto:` string in prerendered HTML (view-source check). Works with SSG.

**Chosen approach:** `'use client'` component that assembles the mailto URI only at render time on the client. The prerendered HTML contains no href — only a placeholder. The email itself is split into parts stored as props (not JSX string `mailto:...`).

```tsx
// Hand-rolled — no package required
'use client';

interface EmailLinkProps {
  user: string;  // e.g. "cosmologia"
  domain: string; // e.g. "df.uba.ar"
  children?: React.ReactNode;
  className?: string;
}

export function EmailLink({ user, domain, children, className }: EmailLinkProps) {
  // Assembled only on client; prerendered HTML has no href at all
  const href = `${'mai'}${'lto'}:${user}@${domain}`;
  return (
    <a href={href} className={className}>
      {children ?? `${user}@${domain}`}
    </a>
  );
}
```

**Why this works for SSG:** `'use client'` components render on the server for the initial shell (React RSC model), BUT if we use this pattern the `href` string is assembled dynamically so the literal string `mailto:` does not appear in source. To guarantee zero `mailto:` in prerendered output, use dynamic import with `{ ssr: false }` (Next.js NoSSR pattern):

```tsx
// src/components/ui/EmailLink.tsx
import dynamic from 'next/dynamic';

const EmailLink = dynamic(
  () => import('./EmailLinkInner').then(m => m.EmailLinkInner),
  { ssr: false, loading: () => <span>cosmologia@df.uba.ar</span> }
);
export { EmailLink };
```

**The `loading` fallback** shows plaintext (still readable/copyable) while JS loads — acceptable tradeoff vs. full concealment.

**Accessibility:** The rendered `<a>` is a standard anchor. Screen readers announce it as a link. No `aria-label` hacks needed because the visible text IS the email address.

**Verification:** `view-source` on the deployed page should show zero instances of `mailto:`.

### Pattern 4: Skip-to-Content Link

```tsx
// SkipLink.tsx — pure server component, no 'use client' needed
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={[
        'sr-only focus:not-sr-only',           // visible on focus
        'focus:fixed focus:top-4 focus:left-4', // positioned clear of header
        'focus:z-[100]',                        // above sticky header z-index
        'focus:bg-surface focus:text-ink',
        'focus:px-4 focus:py-2 focus:shadow-md',
        'focus:rounded',
      ].join(' ')}
    >
      Saltar al contenido {/* or use t('layout.skipToContent') */}
    </a>
  );
}
```

The target:
```tsx
// In LocaleLayout body:
<main id="main-content" tabIndex={-1} className="outline-none">
  {children}
</main>
```

**Critical:** `tabIndex={-1}` on `<main>` is required. Without it, focus does not move to the element — the page scrolls but keyboard focus stays at the link.

**CSS token needed:** Add `--header-height: 56px` (or the actual header height) and apply to `<main>`:
```css
main { scroll-margin-top: var(--header-height); }
```

### Pattern 5: Mobile Nav with Radix Dialog

```tsx
'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { usePathname } from '@/i18n/navigation';
import { useEffect } from 'react';

export function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Auto-close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button aria-label="Abrir menú">
          <MenuIcon />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/20 z-40" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 w-72 bg-surface z-50 p-6 shadow-md"
          aria-label="Menú de navegación"
        >
          <Dialog.Close asChild>
            <button aria-label="Cerrar menú" className="absolute top-4 right-4">
              <XIcon />
            </button>
          </Dialog.Close>
          {/* Nav links + inline locale toggle */}
          <nav>
            {navItems.map(item => <NavLink key={item.href} {...item} />)}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

Radix Dialog provides automatically: focus trap, Escape key closes and returns focus to trigger, `aria-modal="true"`, body scroll lock (via pointer-events on overlay), portal rendering.

### Pattern 6: Sticky Header Composition (no-border policy)

```tsx
<header className="sticky top-0 z-30 bg-surface shadow-sm">
  {/* shadow-sm: 0 1px 2px oklch(0.22/0.04) — within shadow ceiling */}
  <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
    {/* Logo + nav + locale toggle */}
  </div>
</header>
```

**Visual separation without border:** `shadow-sm` (already in token map as `0 1px 2px oklch(0.22 0.015 60 / 0.04)`) creates a 1px diffuse shadow that reads as separation on warm-white surfaces without introducing a hard border line. This is the canonical academic restraint pattern.

**z-index ladder:** header `z-30`, mobile overlay `z-40`, mobile drawer `z-50`, skip link `z-[100]`.

### Anti-Patterns to Avoid

- **Importing `usePathname` from `next/navigation`** in locale toggle — returns raw `/es/investigacion`, which breaks router.replace with localized pathnames.
- **Missing `tabIndex={-1}` on `<main>`** — skip link scrolls page but focus doesn't move; fails WCAG 2.4.1.
- **Putting literal `mailto:` in JSX** — defeats EmailLink obfuscation even if the component is `'use client'`.
- **Missing `<Suspense>` around `useSearchParams()`** — Next.js app router throws if `useSearchParams` is used outside Suspense boundary in a component that is otherwise statically renderable.
- **Using `next/navigation`'s Link** instead of `@/i18n/navigation`'s Link — loses locale-aware path translation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in mobile nav | querySelectorAll + Tab key interceptor | @radix-ui/react-dialog | Edge cases: dynamic content, iOS Safari focus quirks, aria-modal announcement, return-focus-to-trigger |
| Email obfuscation | Any library | 15-line custom `'use client'` + dynamic import ssr:false | react-obfuscate unmaintained; CSS reversal breaks copy-paste; custom is simpler |
| Body scroll lock when nav open | overflow:hidden on body | Radix Dialog (handles via overlay) | Radix overlay captures pointer events; manual body scroll lock leaves gaps on iOS |

**Key insight:** The only new package needed is `@radix-ui/react-dialog`. Everything else — locale toggle, active link, skip link, footer — is achievable with already-installed libraries.

---

## Common Pitfalls

### Pitfall 1: usePathname import source mismatch
**What goes wrong:** Developer imports `usePathname` from `next/navigation` for locale toggle. Returns `/es/investigacion` instead of `/research`. `router.replace` with localized pathname fails to match a valid key.
**Why it happens:** Both `next/navigation` and `@/i18n/navigation` export `usePathname`; the former is the plain Next.js one.
**How to avoid:** Enforce a lint rule or comment: all navigation imports in layout shell components come from `@/i18n/navigation`.
**Warning signs:** TypeScript error: "Argument of type '/es/investigacion' is not assignable to parameter of type keyof AppPathnames".

### Pitfall 2: useSearchParams outside Suspense
**What goes wrong:** Using `useSearchParams()` in `LocaleToggle` causes Next.js to bail out of static rendering for the entire route subtree (or throws in dev).
**Why it happens:** `useSearchParams` is a dynamic API in app router.
**How to avoid:** Wrap `LocaleToggle` (or the component that calls `useSearchParams`) in `<Suspense fallback={...}>`.
**Warning signs:** Console warning "useSearchParams() should be wrapped in a suspense boundary".

### Pitfall 3: Missing tabIndex=-1 on main landmark
**What goes wrong:** Skip link scrolls the page visually but screen reader/keyboard focus stays at the top. WCAG 2.4.1 failure.
**Why it happens:** `<main>` is not natively programmatically focusable.
**How to avoid:** `<main id="main-content" tabIndex={-1} className="outline-none">` in the locale layout.
**Warning signs:** After activating skip link, next Tab keypress goes to first nav item, not first content item.

### Pitfall 4: Email in prerendered HTML
**What goes wrong:** `<EmailLink>` uses `'use client'` but the server still renders the initial shell with the href, exposing `mailto:cosmologia@df.uba.ar` in view-source.
**Why it happens:** React 19 RSC model renders `'use client'` components on the server for the initial HTML shell. Assembling `mailto:` in the component body doesn't help.
**How to avoid:** Use `dynamic(() => import('./EmailLinkInner'), { ssr: false })` to exclude entirely from server rendering.
**Warning signs:** `view-source` shows `mailto:` in the initial HTML.

### Pitfall 5: Header z-index conflicts
**What goes wrong:** Mobile nav overlay appears under sticky header, or dropdown menu appears under page content.
**Why it happens:** z-index only works within the same stacking context.
**How to avoid:** Use Radix Dialog Portal (renders to `<body>`, escapes any stacking context) + establish the z-index ladder documented above.
**Warning signs:** Overlay or drawer appears clipped by header.

### Pitfall 6: Hash not preserved on locale switch
**What goes wrong:** User on `/es/publicaciones#2023` clicks EN toggle, lands on `/en/publications` with no hash.
**Why it happens:** next-intl's `router.replace` does not pass through `window.location.hash`.
**How to avoid:** This site has no hash-navigation flows in its requirements, so this is acceptable. If needed in future: read `typeof window !== 'undefined' ? window.location.hash : ''` before calling replace and append manually (next-intl router doesn't accept hash in the href object, so it would require `window.location.replace` as a fallback).
**Warning signs:** Only relevant if hash-based content (e.g., anchor links to publication year sections) is added later.

### Pitfall 7: Active route check on home route
**What goes wrong:** `pathname.startsWith('/')` matches everything, marking all nav items as active.
**Why it happens:** `/research`.startsWith(`/`) is true.
**How to avoid:** Home is the only item that uses exact match (`pathname === '/'`); all others use `pathname.startsWith(href)` where href is `/people`, `/research`, etc.

---

## Code Examples

### LocaleToggle full pattern (verified against next-intl 4.9.1 type signatures)
```tsx
// Source: next-intl/dist/types/navigation/react-client/createNavigation.d.ts (inspected locally)
'use client';
import { Suspense } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useParams, useSearchParams } from 'next/navigation';

function LocaleToggleInner() {
  const locale = useLocale();
  const otherLocale = locale === 'es' ? 'en' : 'es';
  const router = useRouter();
  const pathname = usePathname();   // internal key, e.g. '/research'
  const params = useParams();
  const searchParams = useSearchParams();

  function handleSwitch() {
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });
    router.replace({ pathname, params, query }, { locale: otherLocale });
  }

  return (
    <button onClick={handleSwitch} aria-label={`Cambiar a ${otherLocale.toUpperCase()}`}>
      {otherLocale.toUpperCase()}
    </button>
  );
}

// Suspense wrapper required because LocaleToggleInner calls useSearchParams()
export function LocaleToggle() {
  return (
    <Suspense fallback={null}>
      <LocaleToggleInner />
    </Suspense>
  );
}
```

### EmailLink with guaranteed SSG safety
```tsx
// src/components/ui/EmailLinkInner.tsx — actual implementation
'use client';
export function EmailLinkInner({
  user, domain, children, className
}: { user: string; domain: string; children?: React.ReactNode; className?: string }) {
  const addr = `${user}@${domain}`;
  const href = ['mai', 'lto', ':', addr].join('');
  return <a href={href} className={className}>{children ?? addr}</a>;
}

// src/components/ui/EmailLink.tsx — public export
import dynamic from 'next/dynamic';
export const EmailLink = dynamic(
  () => import('./EmailLinkInner').then(m => m.EmailLinkInner),
  { ssr: false }
);
```

Usage in footer:
```tsx
import { siteConfig } from '@/config/site';
// siteConfig.contactEmail = "cosmologia@df.uba.ar"
const [user, domain] = siteConfig.contactEmail.split('@');
<EmailLink user={user} domain={domain} />
```

### scroll-margin-top for sticky header
```css
/* globals.css addition */
:root {
  --header-height: 56px; /* matches h-14 = 14 * 0.25rem * 4 = 56px */
}

#main-content {
  scroll-margin-top: var(--header-height);
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| next-intl `<Link locale="en">` with hardcoded href | `router.replace({pathname, params}, {locale})` using internal keys | Correct path translation for localized pathnames (e.g., /investigacion → /research) |
| `tabindex=0` on skip link target | `tabindex=-1` on `<main>` | -1 makes element focusable programmatically without adding it to tab order |
| CSS `unicode-bidi: bidi-override` for email reversal | `ssr:false` dynamic import + string assembly | No copy-paste break, works with SSG, accessible |
| `overflow-hidden` on body for scroll lock | Radix Dialog overlay (pointer-events) | Handles iOS Safari rubber-band scroll, avoids layout shift from scrollbar removal |

---

## Codebase State (Verified)

| Item | Status | Location |
|------|--------|----------|
| `usePathname`, `useRouter`, `Link`, `getPathname` | Exported and ready | `src/i18n/navigation.ts` |
| `routing.pathnames` | Wired with 7 routes + slug | `src/i18n/routing.ts` |
| next-intl middleware | Active at `src/proxy.ts` | Exported as middleware |
| `nav.*` translation keys | Present in both locales | `messages/es.json`, `messages/en.json` |
| `locale.*` keys (`switchTo`) | Present | Both message files |
| `footer.*` keys | Present (affiliationUba/Fcen/Conicet, copyright) | Both message files |
| `siteConfig.contactEmail` | `"cosmologia@df.uba.ar"` | `src/config/site.ts` |
| `siteConfig.affiliations` | Array of 3 with es/en names + URLs | `src/config/site.ts` |
| `siteConfig.socialLinks` | Empty array `[]` | `src/config/site.ts` — footer social section renders nothing or is omitted |
| Tailwind tokens | surface, surface-alt, ink, ink-muted, ink-subtle, accent, shadow-sm, shadow-md | `src/globals.css` |
| `fontSerif.variable`, `fontSans.variable` | Applied to `<html>` | `src/app/[locale]/layout.tsx` |
| `<main>` element | Not yet in layout — currently `{children}` direct | `src/app/[locale]/layout.tsx` — Phase 3 adds `<main>` wrapper |

**Missing translation keys to add in Phase 3:**
- `layout.skipToContent` (or hardcode Spanish "Saltar al contenido" / English "Skip to content")
- `layout.openMenu` / `layout.closeMenu` (mobile nav aria-labels)
- `footer.skipToContent` label not needed if hardcoded

The current `messages/*.json` files do NOT have a `layout` namespace. Phase 3 tasks must add it.

---

## Open Questions

1. **Logo asset** — CONTEXT.md says user will drop `public/logo_cosmo.*`. Format (SVG preferred for crispness at 48–56px header height) is unknown. The `<img>` vs `<Image>` decision and sizing depends on asset format. Plan should include a task that conditionally uses `next/image` if raster or raw `<img>`/inline SVG if vector.

2. **Social links icons** — `siteConfig.socialLinks` is currently empty. CONTEXT.md says "icon/text Claude's discretion with accessible labels". If social links remain empty at phase completion, the footer social section should render nothing (guard with `.length > 0`). Icon library (Lucide, Heroicons, inline SVG) can be decided at implementation time; no research needed.

3. **Exact header height** — CONTEXT.md says 48–56px. The research recommends `h-14` (56px) to align with `--spacing: 0.25rem` grid. Planner should lock this as 56px and set `--header-height: 56px` token.

4. **`params` type compatibility** — `useParams()` from `next/navigation` returns `Record<string, string | string[]>`. next-intl's `router.replace` expects `StrictParams<pathname>`. TypeScript may flag this. Standard workaround: cast `params as any` or use `useParams<{slug?: string}>()`. Low risk, implementation detail.

---

## Recommended Package Installs

```bash
npm install @radix-ui/react-dialog
```

- Version 1.1.15 (latest stable)
- Peer deps: React ^19.0 — confirmed compatible
- Provides: focus trap, Escape key, return-focus, portal, aria-modal, overlay
- No other new packages needed

---

## Sources

### Primary (HIGH confidence — local inspection)
- `/home/tomas/Projects/cosmo/node_modules/next-intl/dist/types/navigation/react-client/createNavigation.d.ts` — useRouter.replace signature, usePathname return type, Link locale prop
- `/home/tomas/Projects/cosmo/src/i18n/navigation.ts` — confirms usePathname, useRouter, Link, getPathname already exported
- `/home/tomas/Projects/cosmo/src/i18n/routing.ts` — confirms localized pathnames config
- `/home/tomas/Projects/cosmo/src/app/[locale]/layout.tsx` — confirms no `<main>` yet; NextIntlClientProvider wraps children
- `/home/tomas/Projects/cosmo/src/config/site.ts` — confirms contactEmail, affiliations, socialLinks shapes
- `/home/tomas/Projects/cosmo/src/app/globals.css` — confirms all design tokens available
- `/home/tomas/Projects/cosmo/messages/es.json`, `en.json` — confirms nav.*, locale.*, footer.* keys exist; no layout.* namespace yet

### Secondary (HIGH confidence — official docs)
- https://next-intl.dev/docs/routing/navigation — usePathname returns internal key, router.replace with locale option pattern, useParams for dynamic routes
- https://www.radix-ui.com/primitives/docs/components/dialog — Dialog API, focus trap, Escape, return-focus-to-trigger
- `npm info @radix-ui/react-dialog` — React 19 peer dep confirmed

### Tertiary (MEDIUM confidence — WebSearch verified with official source)
- https://spencermortensen.com/articles/email-obfuscation/ — CSS techniques effectiveness
- https://www.patrickobermeier.at/blog/next-js-nossr-component-and-email-obfuscation — NoSSR + ssr:false pattern
- https://testparty.ai/blog/skip-navigation-links — scroll-margin-top + tabindex=-1 on target
- https://www.tpgi.com/prevent-focused-elements-from-being-obscured-by-sticky-headers/ — scroll-margin-top for sticky header
- https://github.com/amannn/next-intl/issues/550 — query param preservation workaround (useSearchParams manual threading)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions directly inspected from installed node_modules
- Architecture patterns: HIGH — next-intl API from source types + official docs; Radix from official docs + npm info
- Locale toggle query params: MEDIUM — no official documentation states preservation; workaround from community issue verified as standard approach
- Email obfuscation: HIGH — ssr:false dynamic import is documented Next.js pattern; custom implementation is verifiable
- Pitfalls: HIGH — all derived from direct API inspection or official guidance

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable libraries; next-intl and Radix release infrequently)
