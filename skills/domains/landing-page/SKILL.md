# Domain Skill: Landing Page / Marketing Site

> Apply this skill alongside `web-dev-general/SKILL.md` when building landing pages, single-page marketing sites, or multi-page business sites. This skill captures patterns specific to conversion-focused sites for local businesses and service providers.
>
> For contact form backend (Server Action + Resend), see also: `skills/domains/contact-backend/SKILL.md`

## When to Apply

- Single-page or few-page marketing sites with anchor navigation
- Multi-page business sites (services index + service detail pages)
- Local business sites (restaurants, clinics, service providers, studios)
- Product launch pages
- Service provider portfolios (design studios, consulting, trades)
- Agency websites (web development, marketing, consulting)
- Bilingual business sites serving a local market + international community

---

## 1. Phase Order for Landing Pages

Landing pages use a modified phase order that front-loads visible sections before interactivity:

```
Phase 1: Foundation + i18n    → Stack, design tokens, types, message files, data stubs
Phase 2: Content Sections     → Navigation shell + all visible sections/pages (static)
Phase 3: Interactivity        → Forms, mobile menu, language toggle, FAB
Phase 4: SEO + Legal + Polish → Metadata, schema, legal pages, cookie banner, a11y
```

**Why this order differs from dashboards:**
- Sections are the deliverable — get all visible content before touching interactivity
- The client can review a static page; they can't review a broken form
- SEO/legal come last because they depend on finalized content (titles, addresses, company name)

---

## 2. Content Intake — Do This BEFORE Phase 1

**This is the most important rule in this entire skill.** The #1 cause of landing page tech debt is building with placeholder content that blocks launch.

### Minimum Required Before Phase 1

```
[ ] Company / business name — used everywhere: title, JSON-LD, legal pages, footer
[ ] Legal entity name and registration number — required for legal disclosure (LSSI Art.10 in Spain, Companies House in UK, etc.)
[ ] Physical address — contact section, JSON-LD, Maps embed, legal pages
[ ] Phone number
[ ] Email address
[ ] WhatsApp number (if used as primary contact — standard in Spain/LatAm/MENA)
    Format: international without +: "34612345678"
[ ] Google Maps embed URL (generate at maps.google.com → Share → Embed → Copy HTML, extract src URL)
[ ] Business hours
```

### Can Wait Until Phase 4 (but collect early)

```
[ ] Logo (vector SVG preferred, high-res PNG minimum)
[ ] Brand colors (hex codes; if none, describe the feeling)
[ ] Portfolio photos (client emails them; developer adds to data/portfolio.ts)
[ ] Hero / background image (high quality, 1920×1080 minimum)
[ ] Branded OG image (1200×630; can be auto-generated with Vercel OG if unavailable)
[ ] Real LinkedIn URLs for team members
```

### Can Deploy Without (but guard with placeholders)

```
[ ] WhatsApp number — use isPlaceholderNumber() guard pattern (see Section 7)
[ ] Real LinkedIn URLs — use '#' placeholder + visual guard
[ ] Domain verification in Resend — use onboarding@resend.dev temporarily
```

### Use the Content Intake Template

The `skills/web-dev-general/templates/content-intake.md` template exists for this. Send it before starting.

---

## 3. Architecture: Single-Page vs Multi-Page

### Single-Page (Anchor Navigation)

Use for simple businesses with fewer than 5 content areas. All sections on one page with `<a href="#section">` anchors.

```
/           → Hero + Services + Portfolio + About + Contact (sections)
/aviso-legal → Legal page
/privacidad  → Privacy page
/cookies     → Cookie page
```

Every section must have:
```tsx
<section id="services" className="scroll-mt-20 ...">
```

- `id`: matches the nav anchor href (`href="#services"`)
- `scroll-mt-20`: offset for sticky header (80px = h-20 header). Adjust to match actual header height.

Add `scroll-behavior: smooth` to globals.css:
```css
html {
  scroll-behavior: smooth;
}
```

**Use native `<a href="#section">` for same-page anchors, NOT Next.js `<Link>`** — Link adds routing overhead for same-page navigation.

### Multi-Page (Route-Based Navigation)

Use when content is too deep for a single page — service detail pages, about page with team bios, dedicated contact page.

```
/                           → Home (hero + content blocks + features)
/about                      → About (philosophy + team bios)
/services                   → Services index (cards linking to detail pages)
/services/web-development   → Service detail page (dynamic [slug])
/services/ai-integration    → Service detail page
/contact                    → Contact page (form + email + WhatsApp)
```

**Dynamic service pages with `generateStaticParams`:**

```typescript
// src/app/[locale]/services/[slug]/page.tsx
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}
```

**Use Next.js `<Link>` (from `@/i18n/navigation`) for all route-based navigation.** The i18n-aware Link handles locale prefixes automatically.

### Navigation Pattern by Architecture

| Architecture | Desktop Nav | Mobile Nav |
|-------------|------------|------------|
| Single-page | Anchors (`<a href="#section">`) | Same anchors in overlay menu |
| Multi-page | `<Link href="/about">` + Services dropdown | `<Link>` items in overlay menu |
| Mixed | Routes for pages + anchors within a page | Both in overlay |

---

## 4. Section Architecture & Order

### Standard Section Order (Proven Conversion Flow)

```
1. Hero          — First impression: headline + value prop + primary CTA + secondary CTA
2. Services      — What you offer (3-6 items with icons or cards)
3. Materials/How — Differentiator: what makes you good at it
4. Portfolio     — Social proof: real examples of your work
5. Process       — Reduce friction: "here's how easy it is"
6. About         — Trust: who you are, local connection, credibility
7. Contact       — Conversion: form + WhatsApp + map + hours
```

For multi-page sites, these map to separate pages or page sections depending on content depth.

**Why this order works:**
- Hero → hooks attention and states the offer
- Services/Materials → tells them exactly what they get
- Portfolio → proves you can do it
- Process → removes the "is this complicated?" fear
- About → makes the human connection (especially important for local business)
- Contact → strikes when they're convinced

### Alternating Backgrounds

Create visual rhythm with alternating section backgrounds:

```
Hero:      bg-background
Services:  bg-secondary/30
Materials: bg-background
Portfolio: bg-secondary/30
Process:   bg-background
About:     bg-secondary/30
Contact:   bg-background
```

Never use the same background for two consecutive sections. Use `bg-secondary/30` (not `bg-secondary`) for a subtle, not distracting, alternation.

**For higher visual quality:** Use intentional section color assignments rather than mechanical alternation. See **Section 18 — Visual Art Direction** for the full rhythm pattern.

---

## 5. Design Token Guidance for Local Business

### Background Warmth Rule

For local businesses, especially in southern Europe, Mediterranean, Latin America, or anywhere with warm cultural associations: **start with a warm background**. Do not use neutral white.

**Recommended starting point:**
```css
:root {
  --background: oklch(0.963 0.006 80);   /* warm off-white (hue 70-90 for warmth) */
  --card: oklch(0.978 0.004 80);          /* slightly lighter warm white */
}
```

**What "warm" means in OKLCH:**
- Hue 70-90: warm stone/sand undertone (NOT the neutral hue-106 that Tailwind defaults to)
- Chroma 0.004-0.008: subtle, not colorful (barely perceptible)
- Lightness 0.960-0.985: high lightness (nearly white but not paper white)

### Nature-Inspired Palette (Validated in dime Project)

For agencies, tech services, or businesses with a modern identity, a nature-inspired green/mauve palette works well:

```css
:root {
  --background: oklch(0.98 0.004 110);   /* natural white */
  --foreground: oklch(0.16 0.020 140);   /* deep forest near-black */
  --primary: oklch(0.37 0.088 140);      /* forest green */
  --secondary: oklch(0.48 0.062 132);    /* medium forest green */
  --accent: oklch(0.52 0.118 352);       /* warm mauve (CTAs, highlights) */
  --muted: oklch(0.95 0.010 110);        /* warm off-white */
  --border: oklch(0.91 0.010 120);       /* warm-tinted border */
}
```

**Key principle:** Accent color for CTAs should be a different hue from primary — creates visual hierarchy (forest green primary vs mauve accent in dime).

### Local Business Color Personality

| Business Type | Primary Palette Direction | Background |
|--------------|--------------------------|------------|
| Restaurant/café | Warm terracotta, burgundy | oklch(0.960 0.010 50-70) |
| Professional services | Cool Mediterranean blue | oklch(0.963 0.006 80) |
| Health/wellness | Sage, muted green | oklch(0.965 0.008 120-140) |
| Technology / Agency | Forest green, mauve accent | oklch(0.98 0.004 110) |
| Creative studio | Variable — match brand | Ask ui-ux-pro-max |

**Rule:** Always consult ui-ux-pro-max during Phase 1 token setup for local business sites. Never use the Tailwind neutral defaults.

---

## 6. Navigation Architecture

### Sticky Header with Server/Client Split

```
site-header.tsx (Server Component)
  → Fetches getTranslations('Navigation')
  → Builds navItems array with translated labels
  → Fetches services from data for dropdown
  → Renders <HeaderClient navItems={navItems} serviceItems={...} />

header-client.tsx ('use client')
  → Manages menuOpen state
  → Renders desktop nav, hamburger, mobile overlay, language toggle
  → Handles service dropdown (CSS-only on desktop, tap on mobile)
```

### Backdrop-Blur Sticky Header (Validated Pattern)

```tsx
<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 h-20">
```

- `bg-background/80` — 80% opacity for glassmorphism effect
- `backdrop-blur-md` — blur content behind header
- `border-border/40` — subtle warm separator
- `h-20` — consistent height for scroll offset calculations

### CSS-Only Services Dropdown (Desktop)

```tsx
<div className="relative group">
  <button className="...">Services</button>
  <div className="absolute top-full left-0 hidden pt-2 group-hover:flex flex-col">
    <div className="bg-card border border-border shadow-md rounded-lg min-w-48 py-1">
      {serviceItems.map((item) => (
        <Link key={item.slug} href={`/services/${item.slug}`} className="...">
          {item.title}
        </Link>
      ))}
    </div>
  </div>
</div>
```

- `group` + `group-hover:flex` — pure CSS, zero JS for desktop
- `pt-2` on the hidden container — creates hover gap tolerance
- On mobile: render service items inline in the overlay menu instead

### Mobile Menu Pattern

```tsx
// Overlay OUTSIDE the header element (avoids backdrop-filter stacking issues)
{menuOpen && (
  <div className="fixed inset-0 top-20 z-50 bg-background overflow-y-auto md:hidden">
    <nav className="flex flex-col p-6 space-y-4">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className="text-lg font-medium">
          {item.label}
        </Link>
      ))}
    </nav>
  </div>
)}
```

**Critical:** Render the mobile overlay as a sibling of the header, NOT a child. Placing it inside a `backdrop-blur` header creates stacking context issues where the overlay renders behind the blur.

### Body Scroll Lock

```tsx
useEffect(() => {
  if (menuOpen) {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }
}, [menuOpen]);
```

### Close Menu on Route Change

```tsx
const pathname = usePathname();
const didMount = useRef(false);

useEffect(() => {
  if (didMount.current) setMenuOpen(false);
  else didMount.current = true;
}, [pathname]);
```

**The `didMount` guard is critical** — without it, the menu closes on initial mount before the user ever opens it. This prevents a useEffect-on-mount false trigger.

### Z-Index Layering (No Conflicts)

```
WhatsApp FAB:     z-30  (fixed, always visible)
Mobile menu:      z-40  (fixed full-screen, hides FAB — correct)
Sticky header:    z-50  (top of stack — always above menu)
Cookie banner:    z-50  (bottom of screen — different region from header)
```

**Rule:** WhatsApp FAB z-index must be BELOW the mobile menu overlay. If FAB is z-50 and menu is z-40, the FAB shows through the menu on mobile.

### Language Toggle

```tsx
// Uses Link from @/i18n/navigation
<Link href={pathname} locale={oppositeLocale}>
  {oppositeLocale.toUpperCase()}
</Link>
```

- Maintains current URL path, only changes locale
- Shows the locale you're switching TO (clicking "EN" switches to English)
- Works for both single-page anchors and multi-page routes

---

## 7. Contact Form

### Architecture: Server Action + Resend (Preferred)

**Full pattern documented in `skills/domains/contact-backend/SKILL.md`.** Key points here:

```
src/app/actions/contact.ts   → 'use server' Server Action with zod re-validation
src/components/contact-form.tsx → 'use client' with react-hook-form + zodResolver
```

### handleSubmit + startTransition (NOT useActionState)

**Critical gotcha:** `useActionState` bypasses react-hook-form's `handleSubmit` gateway, breaking client-side validation. Use `startTransition` instead:

```typescript
import { useTransition } from 'react';
import { sendContactEmail } from '@/app/actions/contact';

const [, startTransition] = useTransition();

function onSubmit(data: FormData) {
  setStatus('submitting');
  startTransition(async () => {
    const result = await sendContactEmail(data);
    if (result.success) setStatus('success');
    else setStatus('error');
  });
}
```

**Why `[, startTransition]` with omitted `isPending`:** When using a status state machine (`idle | submitting | success | error`), `isPending` from `useTransition` is redundant. The state machine drives all UI states. Omitting it avoids an ESLint unused variable warning.

### Form State Machine

```typescript
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';
const [status, setStatus] = useState<FormStatus>('idle');
```

States:
- `idle`: normal form display
- `submitting`: button disabled, loading indicator
- `success`: hide form, show confirmation + WhatsApp CTA
- `error`: show error message, form stays filled (do NOT clear fields on error)

### Zod Schema Factory for Bilingual Forms

```typescript
export function createContactSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(2, t('nameRequired')),
    email: z.string().email(t('emailInvalid')),
    message: z.string().min(10, t('messageRequired')),
  });
}
```

**When using `z.coerce.*`:** Define an explicit type instead of `z.infer<>`. `z.coerce.number()` input type is `unknown`, breaking zodResolver type inference:

```typescript
// BAD: type FormData = z.infer<typeof schema>; // breaks with z.coerce
// GOOD:
export type QuoteFormData = {
  name: string;
  email: string;
  quantity: number;
};
```

### Controller Pattern for Radix/shadcn Select

`register()` does not work with shadcn Select. Use `<Controller>`:

```tsx
<Controller
  name="material"
  control={control}
  render={({ field }) => (
    <Select onValueChange={field.onChange} value={field.value}>
      <SelectTrigger>
        <SelectValue placeholder={t('materialPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {materials.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
```

**Rule: any shadcn/Radix component that is NOT a native input needs `<Controller>`:**
- Select, Switch, RadioGroup, DatePicker, Combobox, Slider, Toggle

### WhatsApp CTA in Success State

After successful form submission, show a WhatsApp follow-up CTA (if real number available):

```tsx
{status === 'success' && (
  <div className="border border-border bg-card p-8 rounded-lg text-center space-y-4">
    <p className="text-xl font-semibold">{t('successTitle')}</p>
    <p className="text-muted-foreground">{t('successMessage')}</p>
    {!isPlaceholderNumber(contactContent.whatsapp.number) && (
      <a href={getWhatsAppUrl(contactContent.whatsapp.number)}
         target="_blank" rel="noopener noreferrer"
         className="inline-block bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3 rounded-md">
        {contactContent.whatsapp.label[locale]}
      </a>
    )}
  </div>
)}
```

### RESEND_API_KEY Guard (Dev-Friendly No-Op)

```typescript
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn('[contact] RESEND_API_KEY not set — skipping email send');
  return { success: true }; // Form works in dev/preview without credentials
}
```

**Return success, not error.** This lets the form work in development and Vercel preview deployments without crashing.

### Legacy: Formspree (Alternative)

If you don't want to self-host email sending, Formspree works as a drop-in alternative. But Server Action + Resend is preferred because:
- No third-party dependency for a core feature (lead capture)
- Full control over email content and Reply-To headers
- No Formspree branding or submission limits
- Server-side only — no API keys exposed to the client

---

## 8. WhatsApp Integration

WhatsApp is the primary business inquiry channel in Spain, Latin America, and MENA. Treat it as a first-class contact method, not an afterthought.

### Placeholder Guard Pattern

```typescript
// data/contact.ts
export function isPlaceholderNumber(number: string): boolean {
  return number.replace(/[^0-9]/g, '') === '000000000000' || number.includes('+00');
}

export function getWhatsAppUrl(number: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}`;
}

export const contactContent = {
  whatsapp: {
    label: { en: 'Chat on WhatsApp', es: 'Chatea por WhatsApp' } satisfies BilingualText,
    number: '+00 000 000 0000', // Placeholder — replace before launch
  },
};
```

**Why the guard exists:** During development, the real WhatsApp number is often unavailable. The guard:
- Hides the WhatsApp button entirely when the number is a placeholder
- Prevents dead `wa.me/000000000000` links in production previews
- Makes the TODO obvious in the pre-launch checklist

### Implementation Points

```tsx
// Contact page — conditional WhatsApp button
{!isPlaceholderNumber(contactContent.whatsapp.number) && (
  <a href={getWhatsAppUrl(contactContent.whatsapp.number)}
     target="_blank" rel="noopener noreferrer"
     className="bg-[#25D366] hover:bg-[#20bd5a] text-white ..."
     aria-label={contactContent.whatsapp.label[locale]}>
    {contactContent.whatsapp.label[locale]}
  </a>
)}

// Floating Action Button (if single-page) — always visible
<a href={getWhatsAppUrl(company.whatsapp)}
   target="_blank" rel="noopener noreferrer"
   className="fixed bottom-6 right-6 z-30 ..."
   aria-label={t('whatsappCTA')}>
  <WhatsAppIcon />
</a>
```

### WhatsApp Number Format

```typescript
whatsapp: '34612345678',  // No +, no spaces, no dashes
// Used as: https://wa.me/34612345678
```

---

## 9. Google Maps Integration

### Static Embed (No API Key Required)

Use a static `<iframe>` embed for maps — no Google Maps API key, no billing, always works:

```tsx
<iframe
  src={company.googleMapsEmbed}
  width="100%"
  height="400"
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
  title={t('mapTitle')}
  aria-label={t('mapTitle')}
/>
```

### Generating the Embed URL

1. Open Google Maps and find the business location
2. Click Share → Embed a map → Copy HTML
3. Extract the `src` attribute from the `<iframe>` tag
4. Paste into `company.ts` as `googleMapsEmbed`

**This is required content intake data** — you cannot generate a valid Maps embed URL without knowing the exact physical address.

---

## 10. Bilingual Architecture (next-intl Pattern)

### Route Strategy

Use `localePrefix: 'as-needed'` for the clearest URL structure:
- Default locale (Spanish) at `/` — no prefix
- Secondary locale (English) at `/en/` — prefix

```typescript
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
});
```

### BilingualText Pattern for Business Content

```typescript
// types/index.ts
export type BilingualText = {
  es: string;
  en: string;
};

// data/services.ts
export type Service = {
  id: string;
  slug: string;
  title: BilingualText;
  shortDescription: BilingualText;
  longDescription: BilingualText;
};

export const services: Service[] = [
  {
    id: 'web-dev',
    slug: 'web-development',
    title: { es: 'Desarrollo Web', en: 'Web Development' } satisfies BilingualText,
    shortDescription: { es: '...', en: '...' } satisfies BilingualText,
    longDescription: { es: '...', en: '...' } satisfies BilingualText,
  },
];
```

**Use `satisfies BilingualText`** on every object literal for type safety — catches missing locales at compile time.

Access in server components:
```typescript
const locale = await getLocale();
service.title[locale] // → 'Desarrollo Web' or 'Web Development'
```

### Translation Files for UI Strings

All UI labels, error messages, button text → `messages/es.json` + `messages/en.json`:

```json
{
  "Navigation": { "home": "Inicio", "about": "Nosotros", "services": "Servicios", "contact": "Contacto" },
  "Common": { "learnMore": "Ver más", "contactUs": "Contáctanos" },
  "Metadata": {
    "home": { "title": "dime — Desarrollo Web & IA", "description": "..." },
    "about": { "title": "Sobre Nosotros", "description": "..." }
  },
  "NotFound": { "title": "Página no encontrada", "goHome": "Volver al inicio" }
}
```

**Namespace organization:** `Navigation`, `Common`, `NotFound`, `Metadata` — keeps translations organized by feature. Metadata supports dot notation for nested lookups: `t('home.title')`.

### Navigation Helpers (next-intl)

```typescript
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- `Link` — locale-aware, handles prefix automatically
- `usePathname()` — returns pathname without locale prefix
- `getPathname()` — for sitemap/metadata URL construction

### Server vs Client i18n

- **Server Components:** `getLocale()`, `getTranslations()`, `setRequestLocale()`
- **Client Components:** `NextIntlClientProvider` in locale layout + `useTranslations()`
- **Preference:** Use server-side whenever possible — pass translated strings as props to client components

### Middleware

```typescript
// src/middleware.ts (at src/ when using --src-dir)
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};
```

### URL Slug Decision

Decide before Phase 4 whether legal page slugs should be translated:
- **Option A (same slug):** `/aviso-legal` (ES) and `/en/aviso-legal` (EN) — simpler, one page file
- **Option B (translated slugs):** `/aviso-legal` (ES) and `/en/legal-notice` (EN) — better SEO for English

**Recommendation:** Option A for most projects unless English SEO is critical.

---

## 11. Content Data Architecture

### Company Data (Single Source of Truth)

```typescript
// src/data/company.ts
export const company = {
  name: 'dime',
  email: 'hello@dime.ar',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://dime.ar',
  description: {
    en: 'Web Development & AI Integration Agency',
    es: 'Agencia de Desarrollo Web e Integración IA',
  } satisfies BilingualText,
};
```

**`siteUrl` from env var with fallback:** Allows override per deployment (preview vs production) without changing code.

### Data Files Pattern

All domain-specific content lives in `src/data/` as typed constants:

```
src/data/
├── company.ts        → company metadata (name, email, siteUrl)
├── navigation.ts     → NavItem[] (links, labels, keys)
├── services.ts       → Service[] (id, slug, title, descriptions)
├── service-pages.ts  → detailed content per service page
├── home.ts           → hero content, content blocks, features
├── about.ts          → philosophy, team members with bios
├── contact.ts        → form labels, validation messages, WhatsApp
```

**Rule:** Content in data files, never hardcoded in components. This enables:
- Easy content updates without touching component logic
- Template reuse — swap data files for a new client site
- Type safety via BilingualText and explicit types

### Navigation Data Pattern

```typescript
// src/data/navigation.ts
export type NavKey = 'home' | 'about' | 'services' | 'contact';

export type NavItem = {
  key: NavKey;
  href: string;
};

export const navItems: NavItem[] = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'services', href: '/services' },
  { key: 'contact', href: '/contact' },
];
```

Labels come from translation files (`Navigation` namespace), not from data files. This keeps data files locale-agnostic.

---

## 12. Image Placeholder Pattern

### ImagePlaceholder Component

```typescript
export function ImagePlaceholder({ width, height, label, className }: {
  width: number;
  height: number;
  label?: string;
  className?: string;
}) {
  const displayLabel = label ?? `${width}×${height}`;
  return (
    <div
      className={cn('bg-muted text-muted-foreground flex flex-col items-center justify-center rounded-lg text-sm font-medium', className)}
      style={{ width: '100%', maxWidth: width, aspectRatio: `${width}/${height}` }}
      role="img"
      aria-label={displayLabel}
    >
      <span>{displayLabel}</span>
    </div>
  );
}
```

**Key patterns:**
- `aspectRatio` CSS property maintains layout stability during development
- `width: '100%', maxWidth: width` — responsive, never overflows container
- `role="img"` + `aria-label` — accessible to screen readers
- Warm `bg-muted` background — matches design system, not generic gray

### Standard Placeholder Dimensions

| Context | Dimensions | Notes |
|---------|-----------|-------|
| Hero banner | 1920×800 | Full-width, dramatic |
| Feature image | 768×432 | 16:9 aspect ratio |
| Service card | 400×300 | 4:3 aspect ratio |
| Team photo | 400×400 | Square, rounded |
| Portfolio item | 800×600 | 4:3, consistent grid |

---

## 13. Hero Patterns

### Photo Hero with Dark Overlay (Validated in dime)

```tsx
<section className="relative h-[560px]">
  <Image
    src="/homepage/hero.png"
    alt="Hero image description"
    fill
    className="object-cover"
    priority
    sizes="100vw"
  />
  <div className="absolute inset-0 bg-foreground/40" />
  <div className="relative z-10 flex h-full items-center justify-center text-center">
    <div className="max-w-4xl px-6">
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white">
        {heroContent.title[locale]}
      </h1>
      <p className="mt-4 text-xl text-white/90 max-w-2xl mx-auto">
        {heroContent.subtitle[locale]}
      </p>
    </div>
  </div>
</section>
```

- `fill` + `object-cover` — image fills container, crops to fit
- `priority` + `sizes="100vw"` — preloads hero image (LCP optimization)
- `bg-foreground/40` — dark overlay ensures text readability on any image
- `text-white/90` for subtitle — slightly softer than pure white

### Flat Color Hero with Texture (From 3D Printing Project)

For sites without a strong hero photo:

```css
.hero-grain {
  position: relative;
  overflow: hidden;
}

.hero-grain::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 182px;
  pointer-events: none;
}
```

Add a brand pattern overlay (optional):
```css
.hero-grain::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.07;
  background-image: url('/images/hero-pattern.png');
  background-size: cover;
  background-position: center bottom;
  pointer-events: none;
}
```

**Content must be `relative z-10`** to appear above the texture layers.

---

## 14. 404 Handling (Bilingual)

### Two-Tier 404 Strategy

```
src/app/not-found.tsx                → Root-level 404 (minimal, bilingual inline)
src/app/[locale]/not-found.tsx       → Locale-aware 404 (uses translations)
src/app/[locale]/[...rest]/page.tsx  → Catch-all route → triggers locale 404
```

### Root 404 (No Locale Context)

```tsx
// src/app/not-found.tsx
export default function RootNotFound() {
  return (
    <html><body>
      <h1>404</h1>
      <p>Página no encontrada · Page not found</p>
      <a href="/">Volver al inicio · Go home</a>
    </body></html>
  );
}
```

Simple bilingual text inline — no translations framework available at this level.

### Locale 404 (Full i18n)

```tsx
// src/app/[locale]/not-found.tsx
export default async function NotFound() {
  const t = await getTranslations('NotFound');
  return (
    <div className="flex flex-col items-center justify-center py-40">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">{t('message')}</p>
      <Link href="/" className="mt-8 text-accent hover:underline">{t('goHome')}</Link>
    </div>
  );
}
```

### Catch-All Route

```tsx
// src/app/[locale]/[...rest]/page.tsx
import { notFound } from 'next/navigation';
export default function CatchAll() { notFound(); }
```

This ensures any undefined route under a locale triggers the locale-aware 404 page.

---

## 15. SEO for Landing Pages

### Per-Page Metadata with Hreflang (Validated Pattern)

```typescript
// src/app/[locale]/page.tsx (or any page)
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const siteUrl = company.siteUrl;

  const enPath = getPathname({ locale: 'en', href: '/' });
  const esPath = getPathname({ locale: 'es', href: '/' });
  const canonicalUrl = locale === 'es' ? siteUrl + esPath : siteUrl + enPath;

  return {
    title: t('home.title'),
    description: t('home.description'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: siteUrl + enPath,
        es: siteUrl + esPath,
        'x-default': siteUrl + esPath, // Default locale = x-default
      },
    },
    openGraph: {
      title: t('home.title'),
      description: t('home.description'),
      url: canonicalUrl,
      siteName: company.name,
      locale: locale === 'en' ? 'en_US' : 'es_AR',
      type: 'website',
    },
  };
}
```

**Each page gets its own `generateMetadata`** — not just the layout. This ensures correct canonical URLs and hreflang per page.

### Root Layout metadataBase

```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(company.siteUrl),
};
```

Set `metadataBase` once in root layout. All relative URLs in child metadata resolve against it.

### LocalBusiness JSON-LD

```typescript
// Home page only
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: company.name,
  url: company.siteUrl,
  email: company.email,
  description: company.description[locale],
};

// XSS-safe serialization
const jsonLdString = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
```

Use native `<script type="application/ld+json">` with `dangerouslySetInnerHTML` — NOT `next/script`.

### Sitemap with Language Alternates

```typescript
// src/app/sitemap.ts (at app root, NOT inside [locale])
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = company.siteUrl;
  const pages = ['/', '/about', '/contact', '/services'];

  // Add service detail pages
  services.forEach((s) => pages.push(`/services/${s.slug}`));

  return pages.map((page) => ({
    url: `${siteUrl}${page}`,
    alternates: {
      languages: {
        es: `${siteUrl}${page}`,
        en: `${siteUrl}/en${page}`,
        'x-default': `${siteUrl}${page}`,
      },
    },
  }));
}
```

### robots.ts

```typescript
// src/app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${company.siteUrl}/sitemap.xml`,
  };
}
```

### Target Keywords in Headings

The hero h1 must contain the primary target keyword. Secondary keywords appear in section h2 headings. Plan keyword placement before writing copy.

---

## 16. Legal Compliance (Spain / EU)

### Required Pages (LSSI + GDPR)

All three are legally required for any commercial website in Spain:

| Page | Spanish URL | English URL | Legal Basis |
|------|------------|-------------|-------------|
| Aviso Legal | `/aviso-legal` | `/en/aviso-legal` | LSSI-CE Art. 10 |
| Política de Privacidad | `/privacidad` | `/en/privacidad` | GDPR / LOPDGDD |
| Política de Cookies | `/cookies` | `/en/cookies` | LSSI + GDPR |

### Aviso Legal (LSSI Art. 10) Minimum Content

```
- Legal entity name (Razón social)
- CIF/NIF / Business registration number
- Registered address
- Email
- Registration in Registro Mercantil or professional register (if applicable)
- Professional title (for regulated professions)
- VAT number (if applicable)
```

### Cookie Consent (GDPR)

```tsx
const [showBanner, setShowBanner] = useState(false); // MUST init as false for SSR safety

useEffect(() => {
  const consent = localStorage.getItem('cookie-consent');
  if (!consent) setShowBanner(true);
}, []);

// GDPR requires equal-weight accept AND reject options
```

Initialize `showBanner` as `false`. localStorage doesn't exist on the server — reading it on mount via `useEffect` prevents hydration mismatch.

---

## 17. Page Layout Patterns

### Layout Structure

```
RootLayout (src/app/layout.tsx)
  → Sets metadataBase only

LocaleLayout (src/app/[locale]/layout.tsx)
  → Validates locale via hasLocale() → notFound() if invalid
  → setRequestLocale(locale) for server translations
  → NextIntlClientProvider wraps children
  → Font setup (Plus Jakarta Sans or project font)
  → Structure: html → body → SiteHeader → main.flex-1 → SiteFooter

Pages
  → generateMetadata() with locale-specific translations
  → setRequestLocale(locale) at top of component
  → Sections with py-20/py-24 spacing
```

### Common Page Patterns

**Page header:**
```tsx
<div className="pt-20 pb-8 max-w-7xl mx-auto px-6">
  <h1 className="text-5xl font-bold tracking-tight">{t('title')}</h1>
</div>
```

**Content section:**
```tsx
<section className="py-20">
  <div className="max-w-7xl mx-auto px-6">
    <h2 className="text-3xl font-semibold mb-6">{title}</h2>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
</section>
```

**Section divider:**
```tsx
<div className="max-w-7xl mx-auto px-6">
  <hr className="border-t border-border" />
</div>
```

**Card grid (services, capabilities):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {items.map((item) => (
    <div key={item.id} className="rounded-lg border border-border bg-card p-6 space-y-2">
      <h3 className="text-xl font-semibold">{item.title[locale]}</h3>
      <p className="text-muted-foreground">{item.description[locale]}</p>
    </div>
  ))}
</div>
```

**Alternating image + text rows:**
```tsx
{features.map((feature, i) => (
  <div key={i} className={cn('flex flex-col md:flex-row gap-8 items-center', i % 2 !== 0 && 'md:flex-row-reverse')}>
    <div className="flex-1">
      <Image src={feature.image} alt={feature.alt[locale]} ... />
    </div>
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-semibold">{feature.title[locale]}</h2>
      <p className="text-muted-foreground">{feature.description[locale]}</p>
    </div>
  </div>
))}
```

### Footer Pattern

4-column grid: brand + description, navigation links, service links, contact info + social.

```tsx
<footer className="border-t border-border bg-card">
  <div className="max-w-7xl mx-auto px-6 py-12">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {/* Column 1: Brand */}
      {/* Column 2: Navigation */}
      {/* Column 3: Services */}
      {/* Column 4: Contact + Social */}
    </div>
    <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} {company.name}
    </div>
  </div>
</footer>
```

---

## 18. Performance Targets

Landing pages have stricter performance targets than dashboards:

| Metric | Target | Method |
|--------|--------|--------|
| LCP | < 1.5s | next/image priority on hero, preload critical assets |
| CLS | 0 | Fixed image dimensions, aspect-ratio on placeholders |
| FID/INP | < 100ms | Minimal client JS on initial render (Server Components default) |
| Performance score | >= 90 | Measured with Lighthouse Mobile preset |

### Key Optimizations

- **Hero image:** Use `<Image priority sizes="100vw" />` — always preload
- **Below-fold images:** Use `<Image loading="lazy" />` — default for next/image
- **No heavy JS on first load:** Server Components render everything statically; only interactive components (form, mobile menu, language toggle) need client JS
- **No layout shift:** Reserve image dimensions with `aspect-ratio` or fixed heights

---

## 19. Accessibility Checklist

```
[ ] Skip-to-content link: <a href="#main-content" className="sr-only focus:not-sr-only ...">
[ ] Main landmark: <main id="main-content" className="flex-1">
[ ] Heading hierarchy: h1 per page, h2 per section, h3 for sub-items — no skips
[ ] Form labels: every input has <label htmlFor="..."> (not just placeholder text)
[ ] Form errors: aria-describedby or adjacent <p> for screen readers
[ ] Images: descriptive alt text (not filename, not empty for non-decorative images)
[ ] Image placeholders: role="img" + aria-label
[ ] Icon-only buttons: aria-label describing the action ("Open menu", "Close menu")
[ ] WhatsApp button: aria-label="Chat on WhatsApp" (icon alone is inaccessible)
[ ] Language toggle: indicate current locale in aria-label or visually
[ ] Touch targets: minimum 44×44px for all interactive elements on mobile
[ ] Color contrast: WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
[ ] Semantic HTML: <header>, <footer>, <main>, <nav>, <section>
[ ] Focus ring: focus-visible:ring-2 focus-visible:ring-ring ring-offset-2
```

---

## 20. Known Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| WhatsApp FAB on top of mobile menu | FAB visible through menu overlay | Set FAB z-30, mobile menu z-40 |
| Mobile overlay inside backdrop-blur header | Overlay renders behind header blur | Render overlay as sibling, not child of header |
| Close menu fires on initial mount | Menu never opens because useEffect runs on mount | Add `didMount` ref guard in route-change useEffect |
| shadcn Select won't validate with register() | No error shown, field always passes | Use `<Controller>` for all Radix-based components |
| z.coerce.number() breaks zodResolver | TypeScript error in useForm<> | Define explicit type, don't use z.infer<> with coerce |
| useActionState bypasses RHF validation | Server Action runs without client validation | Use handleSubmit + startTransition instead |
| ESLint unused isPending from useTransition | Lint error when status state machine drives UI | Destructure as `[, startTransition]` |
| SSR hydration mismatch on cookie banner | Console error, banner flashes | Init useState(false), read localStorage in useEffect |
| sitemap shows localhost:3000 URLs | Deployed sitemap has wrong domain | Set NEXT_PUBLIC_SITE_URL in deployment environment |
| NEXT_PUBLIC_ prefix on RESEND_API_KEY | API key exposed to client bundle | Never prefix server-only keys — Server Actions use process.env directly |
| Legal placeholder text in production | [Company Name] visible to users | Gate launch on all placeholders replaced |
| Contact form never actually sends | RESEND_API_KEY not set | Test real submission during Phase 3 |
| Google Maps shows empty iframe | Placeholder embed URL in company.ts | Get real Maps embed URL during content intake |
| English users see Spanish URL slugs | /en/aviso-legal not /en/legal-notice | Decide translated vs same slug BEFORE Phase 4 |
| Mobile menu body scroll leaks | User can scroll page behind open menu | useEffect to set overflow:hidden, cleanup in return |
| Translation keys missing at runtime | "Missing message" warning or crash | Check ALL keys exist BEFORE writing the component |
| Button stays disabled after removing Formspree guard | `disabled={status === 'submitting' \|\| !formspreeId}` lingering | Remove guard: `disabled={status === 'submitting'}` only |

---

## 21. Design System Application (MASTER.md / ui-ux-pro-max)

### When to Consult ui-ux-pro-max

Consult during Phase 1 BEFORE setting design tokens:
1. Background warmth (neutral vs warm off-white)
2. Primary brand color selection
3. Typography choice (serif for prestige vs sans-serif for modern)
4. Card style (border vs shadow vs background-diff)
5. Button radius and style

**Do NOT consult for:** engineering decisions, component architecture, routing, state management.

### Border-First Card Aesthetic (Validated in dime)

For modern, clean sites prefer borders over shadows:
```tsx
className="rounded-lg border border-border bg-card p-6"
```

This creates a quieter, more refined look than box shadows. Add hover shadow only on interactive cards:
```tsx
className="... transition-shadow hover:shadow-lg"
```

### Common Design Mistakes

1. Using generic "Bootstrap blue" instead of a regional/brand color
2. Using pure white background (feels clinical, not warm/welcoming)
3. Oversized hero text that breaks on mobile (test at 375px)
4. Stock photo hero (obvious, feels untrustworthy)
5. Too many CTAs on the hero (one primary, one secondary — no more)
6. Generic gray shadows on warm-palette sites (use warm-tinted shadows)

---

## 22. Visual Art Direction for Service Business Landing Pages

> These patterns were validated across two projects. Apply after the functional site is built — this is a polish pass, not a phase-1 concern.

### Typography: Choosing the Display Font

| Business type | Font direction | Avoid | Rationale |
|---------------|---------------|-------|-----------|
| 3D printing, engineering | Geometric sans (Space Grotesk, DM Sans) | Serifs | Geometric = precise, modern |
| Web dev, tech agency | Geometric sans (Plus Jakarta Sans) | Editorial serif | Clean, contemporary |
| Architecture, interior design | Geometric or humanist sans | Editorial serif | Spatial intelligence |
| Restaurant, bakery, artisan | Warm serif (Playfair Display, Lora) | Geometric sans | Organic, handcrafted |
| Law, finance, consulting | Classic serif (Libre Baskerville) | Playful sans | Authority, trust |
| Creative studio, agency | Variable — ask client | Nothing | Their brand IS their typography |

**The newspaper trap:** High-contrast editorial serifs can make a service business look like a publication. Test at the actual hero font size (60-80px) — review with the user at a checkpoint before propagating.

**Single-font pattern (validated in dime):**
```tsx
// When one font family covers all weights well
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});
```

**Two-font pattern:**
```tsx
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

<html className={cn('font-sans', geist.variable, spaceGrotesk.variable)}>
```

**Critical:** Load fonts with `.variable` (NOT `.className`). `.className` overrides `font-family` on `<html>` — body text gets the display font too. `.variable` only injects the CSS custom property.

### CTA Typography

```tsx
className="uppercase tracking-wide" // letter-spacing: 0.025em
```

Apply to hero CTAs, section CTA buttons, prominent action labels. Creates a confident, professional feel.

### Section Background Rhythm

Intentional section assignment gives each section a visual job:

```
Hero:      bg-background (warm linen)      — first impression, warm and welcoming
Services:  bg-muted/40 (warm sand)         — grouped with hero, continuous feel
Materials: bg-background (warm linen)      — content-heavy; neutral lets cards stand out
Portfolio: bg-muted/40 (warm sand)         — visual contrast to break monotony
Process:   bg-background (warm linen)      — instructional; clean background aids comprehension
About:     bg-[oklch(0.92_0.030_240)]      — COOL BLUE-GRAY: deliberate contrast break, signals trust
Contact:   bg-background (warm linen)      — warm invitation to act
Footer:    bg-[oklch(0.985_0.008_80)]      — near-white; recedes visually
```

**The "contrast break" rule:** At least one section should be a distinctly different tone. The About section works well in a cool blue-gray because it creates visual punctuation and signals trust.

**The footer rule:** Footer should always feel lighter and quieter than the rest. Near-white, barely any chroma. It signals "the page is done."

### Warm Palette Depth

Default OKLCH warm tokens often feel washed out:

| Token | Too subtle | Right amount | Effect |
|-------|-----------|--------------|--------|
| --background | 0.006 | 0.020–0.030 | Reads as warm stone, not cold white |
| --card | 0.004 | 0.015–0.020 | Cards lift from background |
| --secondary | 0.003 | 0.035–0.045 | Sand sections feel distinct |
| --border | 0.005 | 0.025–0.035 | Borders visible as warm lines |

**"White spirit" = high lightness, not zero chroma.** If the background looks identical to neutral white in a screenshot, boost chroma.

### Card Shadow Refinement (Warm Palettes)

```css
@layer utilities {
  .shadow-warm {
    box-shadow:
      0 1px 2px oklch(0.553 0.013 58 / 0.06),
      0 2px 4px oklch(0.553 0.013 58 / 0.08);
  }
  .shadow-warm-hover {
    box-shadow:
      0 2px 4px oklch(0.553 0.013 58 / 0.07),
      0 4px 8px oklch(0.553 0.013 58 / 0.09),
      0 8px 16px oklch(0.553 0.013 58 / 0.06);
  }
}
```

On warm palettes, gray shadows create a faint hue conflict. Warm-tinted shadows are visually quieter.

### Quick Checklist: Visual Polish Phase

```
[ ] Display font chosen for business type — NOT random default
[ ] Font reviewed at actual hero scale (60-80px) BEFORE propagating
[ ] Hero has real photo with overlay OR at least one texture layer (grain)
[ ] Section colour rhythm is intentional — at least one contrast break
[ ] About section has a distinctly cooler/different tone
[ ] Footer lighter than everything above
[ ] Background chroma > 0.018 — not identical to neutral white
[ ] Card shadows use palette hue on warm-palette sites
[ ] All interactive cards have hover transition
[ ] CTA buttons use uppercase tracking-wide
```

---

## 23. Pre-Launch Checklist

```
[ ] Verify domain in Resend → update `from` address in Server Action
[ ] Set NEXT_PUBLIC_SITE_URL on Vercel (production domain)
[ ] Replace WhatsApp placeholder with real number
[ ] Replace LinkedIn '#' placeholders with real URLs
[ ] Point domain DNS to Vercel
[ ] Submit sitemap.xml to Google Search Console
[ ] Test contact form end-to-end (submit → email received)
[ ] Test both locales (ES at /, EN at /en/)
[ ] Test mobile menu on real device
[ ] Check all image placeholders are replaced (or guard hidden)
[ ] Legal pages have real company data (not [Company Name])
[ ] OG image exists at /public/og.png (or configured path)
[ ] Run Lighthouse Mobile audit — score >= 90
```

---

## 24. Quick Reference: Lessons Across Projects

1. **Content intake first** — company name, WhatsApp, address, Maps URL block launch if missing
2. **Warm backgrounds** — local business = warm off-white, not Tailwind neutral
3. **Server Action + Resend over Formspree** — self-hosted, no third-party dependency
4. **handleSubmit + startTransition, NOT useActionState** — useActionState bypasses RHF validation
5. **isPlaceholderNumber guard** — hide WhatsApp buttons when real number unavailable
6. **RESEND_API_KEY server-side only** — never NEXT_PUBLIC_ prefix
7. **Controller, not register()** — for any Radix/shadcn form component
8. **z.coerce.* = explicit type** — don't use z.infer with coerce transforms
9. **middleware at src/** — not project root when using --src-dir
10. **Translation keys before components** — verify keys exist before writing the component
11. **Decide URL slugs before Phase 4** — changing after launch breaks URLs
12. **ui-ux-pro-max in Phase 1** — consult for warmth/palette before setting tokens
13. **Legal placeholders are launch blockers** — must be real before going live
14. **Mobile overlay outside header** — backdrop-filter stacking context breaks otherwise
15. **didMount guard on route-change useEffect** — prevents false menu close on mount
16. **satisfies BilingualText** — compile-time check that both locales are present
17. **Per-page generateMetadata** — not just layout-level; each page needs canonical + hreflang
18. **Catch-all [...rest] route** — ensures bilingual 404 for undefined routes
19. **Backdrop-blur header** — bg-background/80 + backdrop-blur-md for professional glassmorphism
20. **Border-first cards** — cleaner than shadows for modern aesthetic; add shadow only on hover
21. **Geometric sans for technical businesses** — serifs read as newspaper at display sizes
22. **Chroma 0.020+ for warmth** — default ~0.005 produces invisible warmth
23. **SVG feTurbulence grain** — free hero texture, zero HTTP requests
24. **About section = trust break** — use a distinctly cooler hue for credibility
25. **Footer = near-white, not palette** — signals the page is done

---

*Status: Updated from dime agency website project (April 2026) + 3D Printing Barcelona (March 2026)*
*Two projects validated. Patterns are production-tested.*
