# Domain Skill: Landing Page / Marketing Site

> Apply this skill alongside `web-dev-general/SKILL.md` when building landing pages, single-page marketing sites, or multi-page business sites. This skill captures patterns specific to conversion-focused sites for local businesses and service providers.

## When to Apply

- Single-page or few-page marketing sites with anchor navigation
- Local business sites (restaurants, clinics, service providers, studios)
- Product launch pages
- Service provider portfolios (design studios, consulting, trades)
- Bilingual business sites serving a local market + international community

---

## 1. Phase Order for Landing Pages

Landing pages use a modified phase order that front-loads visible sections before interactivity:

```
Phase 1: Foundation + i18n    → Stack, design tokens, types, message files, data stubs
Phase 2: Content Sections     → Navigation shell + all visible sections (static)
Phase 3: Interactivity        → Forms, mobile menu, language toggle, FAB
Phase 4: SEO + Legal + Polish → Metadata, schema, legal pages, cookie banner, a11y
```

**Why this order differs from dashboards:**
- Sections are the deliverable — get all 7 visible before touching interactivity
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
```

### Use the Content Intake Template

The `skills/web-dev-general/templates/content-intake.md` template exists for this. Send it before starting.

---

## 3. Section Architecture & Order

### Standard Section Order (Proven Conversion Flow)

```
1. Hero          — First impression: headline + value prop + primary CTA + secondary CTA
2. Services      — What you offer (3-6 items with icons)
3. Materials/How — Differentiator: what makes you good at it
4. Portfolio     — Social proof: real examples of your work
5. Process       — Reduce friction: "here's how easy it is"
6. About         — Trust: who you are, local connection, credibility
7. Contact       — Conversion: form + WhatsApp + map + hours
```

**Why this order works:**
- Hero → hooks attention and states the offer
- Services/Materials → tells them exactly what they get
- Portfolio → proves you can do it
- Process → removes the "is this complicated?" fear
- About → makes the human connection (especially important for local business)
- Contact → strikes when they're convinced

### Section IDs and Scroll Offset

Every section must have:
```tsx
<section id="services" className="scroll-mt-20 ...">
```

- `id`: matches the nav anchor href (`href="#services"`)
- `scroll-mt-20`: offset for sticky header (80px = h-16 header + 4px buffer). Adjust to match your actual header height.

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

### Anchor Navigation Pattern

Use native `<a href="#section">` for same-page anchor links, NOT Next.js `<Link>`:
- Next.js Link adds client-side routing overhead for same-page anchors
- Native anchors work with `scroll-behavior: smooth` in globals.css
- No JavaScript required — degrades gracefully

```css
/* globals.css */
html {
  scroll-behavior: smooth;
}
```

---

## 4. Design Token Guidance for Local Business

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

**Rule:** Always consult ui-ux-pro-max during Phase 1 token setup for local business sites. Never use the Tailwind neutral defaults.

### Local Business Color Personality

| Business Type | Primary Palette Direction | Background |
|--------------|--------------------------|------------|
| Restaurant/café | Warm terracotta, burgundy | oklch(0.960 0.010 50-70) |
| Professional services | Cool Mediterranean blue | oklch(0.963 0.006 80) |
| Health/wellness | Sage, muted green | oklch(0.965 0.008 120-140) |
| Technology/3D printing | Mediterranean blue | oklch(0.963 0.006 80) |
| Creative studio | Variable — match brand | Ask ui-ux-pro-max |

---

## 5. Navigation Architecture

### Sticky Header with Server/Client Split

```
site-header.tsx (Server Component)
  → Fetches getTranslations('Nav')
  → Builds navItems array with translated labels
  → Renders <HeaderClient navItems={navItems} />

header-client.tsx ('use client')
  → Manages menuOpen state
  → Renders desktop nav, hamburger, MobileMenu, LanguageToggle, CTA
  → Uses useTranslations('Nav') only for aria-labels

mobile-menu.tsx ('use client')
  → full-screen overlay: fixed inset-0 top-[header-height] z-40
  → Body scroll lock via useEffect cleanup
  → Each nav link calls onClose() on click

language-toggle.tsx ('use client')
  → useRouter + usePathname from @/i18n/navigation
  → router.replace(pathname, { locale: newLocale })
  → Shows opposite locale as button label (clicking "EN" switches TO English)
```

### Z-Index Layering (No Conflicts)

```
WhatsApp FAB:     z-30  (fixed, always visible)
Mobile menu:      z-40  (fixed full-screen, hides FAB — correct)
Sticky header:    z-50  (top of stack — always above menu)
Cookie banner:    z-50  (bottom of screen — different region from header, no conflict)
```

**Rule:** WhatsApp FAB z-index must be BELOW the mobile menu overlay. If FAB is z-50 and menu is z-40, the FAB shows through the menu on mobile. Fix: lower FAB to z-30.

### Body Scroll Lock Pattern

```tsx
// mobile-menu.tsx
useEffect(() => {
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = '';
  };
}, []);
```

Clean up in the return function — leaving `overflow: hidden` on body breaks scroll after menu closes.

---

## 6. Contact Form (Quote / Lead Form)

### Architecture Pattern

```
quote-form-schema.ts  → Zod schema factory (bilingual validation errors)
quote-form.tsx        → 'use client' form with react-hook-form + zodResolver
lib/form-service.ts   → Abstraction layer (Formspree / Resend / etc.)
```

### Zod Schema Factory for Bilingual Forms

```typescript
// quote-form-schema.ts
export function createQuoteFormSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t('nameRequired')),
    email: z.string().email(t('emailInvalid')),
    phone: z.string().optional(),
    description: z.string().min(1, t('descriptionRequired')),
    material: z.string().min(1, t('materialRequired')),
    quantity: z.coerce.number().min(1, t('quantityMin')),
  });
}

// IMPORTANT: When using z.coerce.*, define explicit type instead of z.infer<>
// z.coerce.number() input type is `unknown`, breaking zodResolver type inference
export type QuoteFormData = {
  name: string;
  email: string;
  phone?: string;
  description: string;
  material: string;
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

### WhatsApp CTA in Success State

After successful form submission, show a WhatsApp follow-up CTA:

```tsx
{status === 'success' && (
  <div>
    <p>{t('successMessage')}</p>
    <a href={`https://wa.me/${company.whatsapp}`} target="_blank">
      {t('whatsappFollowUp')}
    </a>
  </div>
)}
```

This matches Spanish business norms — email + WhatsApp as dual channels.

### Form Submission Service Abstraction

```typescript
// lib/form-service.ts
export async function submitQuoteForm(data: FormSubmission): Promise<FormResult> {
  const url = process.env.NEXT_PUBLIC_FORMSPREE_URL;
  if (!url) {
    // Simulated success for development — but MUST be tested with real URL before launch
    console.warn('NEXT_PUBLIC_FORMSPREE_URL not set — simulating form success');
    return { success: true };
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  return { success: response.ok };
}
```

**Critical:** Configure the real Formspree endpoint during development (during Phase 3), not at deployment. Send a real test submission and verify email delivery before marking the phase complete.

---

## 7. WhatsApp Integration

WhatsApp is the primary business inquiry channel in Spain, Latin America, and MENA. Treat it as a first-class contact method, not an afterthought.

### Implementation Points

```tsx
// Floating Action Button — always visible
<a
  href={`https://wa.me/${company.whatsapp}`}
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-6 right-6 z-30 ..."
  aria-label={t('whatsappCTA')}
>
  <WhatsAppIcon />
</a>

// Header CTA button (desktop)
<a href={`https://wa.me/${company.whatsapp}`} className="...">
  {t('requestQuote')}
</a>

// Contact section
<a href={`https://wa.me/${company.whatsapp}`}>
  {t('chatOnWhatsApp')}
</a>

// Form success state
<a href={`https://wa.me/${company.whatsapp}`}>
  {t('whatsappFollowUp')}
</a>
```

### WhatsApp Number Format

```typescript
// data/company.ts
whatsapp: '34612345678',  // No +, no spaces, no dashes
// Used as: https://wa.me/34612345678
```

---

## 8. Google Maps Integration

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

**This URL looks like:** `https://www.google.com/maps/embed?pb=!1m18!1m12!...`

**This is required content intake data** — you cannot generate a valid Maps embed URL without knowing the exact physical address. Get it from the client before Phase 1.

---

## 9. Bilingual Architecture (next-intl Pattern)

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

For content that varies per item (services, materials, portfolio, etc.):

```typescript
// types/index.ts
export type BilingualText = {
  es: string;
  en: string;
};

// data/services.ts
export const services: Service[] = [
  {
    id: 'prototyping',
    title: { es: 'Prototipado Rápido', en: 'Rapid Prototyping' },
    description: { es: '...', en: '...' },
    icon: 'zap',
  },
];
```

Access in server components:
```typescript
const locale = await getLocale();
service.title[locale] // → 'Prototipado Rápido' or 'Rapid Prototyping'
```

### Translation Files for UI Strings

All UI labels, error messages, button text → `messages/es.json` + `messages/en.json`:

```json
{
  "QuoteForm": {
    "nameLabel": "Nombre",
    "nameRequired": "El nombre es obligatorio",
    "submitButton": "Enviar solicitud",
    "successMessage": "¡Solicitud enviada! Te contactaremos pronto."
  }
}
```

### URL Slug Decision

Decide before Phase 4 whether legal page slugs should be translated:
- **Option A (same slug):** `/aviso-legal` (ES) and `/en/aviso-legal` (EN) — simpler, one page file
- **Option B (translated slugs):** `/aviso-legal` (ES) and `/en/legal-notice` (EN) — better SEO for English, requires separate page files

**Recommendation:** Option A for most projects unless English SEO is critical. Document the decision in REQUIREMENTS.md.

### Middleware for --src-dir Projects

```typescript
// src/middleware.ts (NOT /middleware.ts at project root)
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';  // Use RELATIVE import, not @/ alias

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

---

## 10. SEO for Local Business Landing Pages

### Metadata Structure (generateMetadata)

```typescript
// app/[locale]/layout.tsx
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: '/',
      languages: {
        es: '/',
        en: '/en',
        'x-default': '/',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}
```

### LocalBusiness JSON-LD

```typescript
// app/[locale]/page.tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: company.name,
  url: SITE_URL,
  telephone: company.phone,
  email: company.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: company.address.street,
    addressLocality: company.address.city,
    postalCode: company.address.postalCode,
    addressCountry: company.address.country,
  },
  openingHoursSpecification: [...],
  geo: { '@type': 'GeoCoordinates', latitude: ..., longitude: ... },
};

// XSS-safe serialization
const jsonLdString = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
```

Use native `<script type="application/ld+json">` with `dangerouslySetInnerHTML` — NOT `next/script`. Next.js docs confirm this is the correct approach for JSON-LD.

### Target Keywords in Headings

The hero h1 must contain the primary target keyword:
- Spanish: "Impresión 3D profesional en Barcelona"
- English: "Professional 3D Printing in Barcelona"

Secondary keywords appear in section h2 headings. Plan keyword placement before writing copy.

### sitemap.ts and robots.ts Location

These must be at `src/app/` root — NOT inside `[locale]`:
- `src/app/sitemap.ts` → serves `/sitemap.xml`
- `src/app/robots.ts` → serves `/robots.txt`

```typescript
// src/app/sitemap.ts
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/aviso-legal', '/privacidad', '/cookies'];
  return pages.map((page) => ({
    url: `${SITE_URL}${page}`,
    alternates: {
      languages: {
        es: `${SITE_URL}${page}`,
        en: `${SITE_URL}/en${page}`,
      },
    },
  }));
}
```

---

## 11. Legal Compliance (Spain / EU)

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
// cookie-banner.tsx
const [showBanner, setShowBanner] = useState(false); // MUST init as false for SSR safety

useEffect(() => {
  const consent = localStorage.getItem('cookie-consent');
  if (!consent) setShowBanner(true);
}, []);

// GDPR requires equal-weight accept AND reject options
// Not: prominent "Accept" button + tiny "Manage settings" link
// Yes: two equally prominent buttons (different visual style is OK, but same size/prominence)
```

### SSR Hydration Safety for Cookie Banner

Initialize `showBanner` as `false` (not read from localStorage). localStorage doesn't exist on the server. Reading it on mount via `useEffect` prevents the hydration mismatch:

```
Server renders: showBanner = false → no banner in HTML
Client mounts: useEffect reads localStorage → if no consent, setShowBanner(true)
Result: banner appears only after hydration → no hydration mismatch
```

---

## 12. Portfolio Section Best Practices

### Data-File Driven (No CMS Required for v1)

```typescript
// data/portfolio.ts
export const portfolio: PortfolioItem[] = [
  {
    id: 'architectural-model',
    title: { es: 'Maqueta Arquitectónica', en: 'Architectural Model' },
    description: { es: '...', en: '...' },
    imageUrl: '/images/portfolio/architectural-model.jpg',
    imageAlt: { es: '...', en: '...' },
    material: 'PLA',
    tags: ['arquitectura', 'architecture'],
  },
];
```

### Client Update Workflow

Document for the client (in client-handoff.md):
```
To add a new portfolio item:
1. Add the photo to public/images/portfolio/ (JPG, min 800×600px, max 2MB)
2. Add a new entry to src/data/portfolio.ts
3. Run: git add . && git commit -m "feat: add [project name] to portfolio"
4. Push to deploy
```

### Placeholder to Real Photos Checklist

```
[ ] Replace public/images/portfolio/placeholder.svg with real project photos
[ ] Use next/image for all portfolio images (automatic lazy loading + optimization)
[ ] Provide bilingual alt text for each image
[ ] Minimum 6 portfolio items to show grid density
[ ] Photos: consistent aspect ratio (16:9 or 4:3 for a clean grid)
```

---

## 13. Performance Targets

Landing pages have stricter performance targets than dashboards (no client-side JS required for the first paint):

| Metric | Target | Method |
|--------|--------|--------|
| LCP | < 1.5s | next/image priority on hero, preload critical assets |
| CLS | 0 | Fixed image dimensions, no layout shifts from async content |
| FID/INP | < 100ms | Minimal client JS on initial render (Server Components default) |
| Performance score | >= 90 | Measured with Lighthouse Mobile preset |

### Key Optimizations

- **Hero image:** Use `<Image priority sizes="100vw" />` — always preload
- **Below-fold images:** Use `<Image loading="lazy" />` — default for next/image
- **No heavy JS on first load:** Server Components render everything statically; only interactive components (form, mobile menu, language toggle) need client JS
- **No layout shift:** Reserve image dimensions with `aspect-ratio` or fixed heights before image loads

---

## 14. Accessibility Checklist

```
[ ] Skip-to-content link: <a href="#main-content" className="sr-only focus:not-sr-only ...">
[ ] Main landmark: <main id="main-content">
[ ] Heading hierarchy: h1 in hero, h2 per section, h3 for sub-items — no skips
[ ] Form labels: every input has <label htmlFor="..."> (not just placeholder text)
[ ] Form errors: aria-describedby or adjacent <p> element for screen readers
[ ] Images: descriptive alt text (not filename, not empty for non-decorative images)
[ ] Icon-only buttons: aria-label describing the action ("Open menu", "Close menu")
[ ] WhatsApp FAB: aria-label="Chat on WhatsApp" (icon alone is inaccessible)
[ ] Language toggle: indicate current locale in aria-label or visually
[ ] Touch targets: minimum 44×44px for all interactive elements on mobile
[ ] Color contrast: WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
```

---

## 15. Known Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| WhatsApp FAB on top of mobile menu | FAB visible through menu overlay | Set FAB z-30, mobile menu z-40 |
| shadcn Select won't validate with register() | No error shown, field always passes | Use <Controller> for all Radix-based form components |
| z.coerce.number() breaks zodResolver | TypeScript error in useForm<> | Define explicit type, don't use z.infer<> with coerce |
| SSR hydration mismatch on cookie banner | Console error, banner flashes | Init useState(false), read localStorage only in useEffect |
| sitemap shows localhost:3000 URLs | Deployed sitemap has wrong domain | Set NEXT_PUBLIC_SITE_URL in deployment environment |
| Legal placeholder text in production | [Company Name] visible to users | Gate launch on all placeholders replaced |
| Portfolio section looks like template | All photos are identical placeholder SVGs | Must have real photos before launch — treat as hard blocker |
| Contact form never actually sends | NEXT_PUBLIC_FORMSPREE_URL not set | Test real submission during Phase 3, not at deployment |
| Google Maps shows empty iframe | Placeholder embed URL in company.ts | Get real Maps embed URL during content intake |
| English users see Spanish URL slugs | /en/aviso-legal not /en/legal-notice | Decide translated vs same slug BEFORE Phase 4. Changing after launch breaks URLs. |
| Mobile menu body scroll leaks | User can scroll page behind open menu | useEffect to set overflow:hidden, cleanup in return function |
| Translation keys missing at runtime | "Missing message" warning or crash | Check ALL keys needed by a component exist BEFORE writing the component |

---

## 16. Design System Application (MASTER.md / ui-ux-pro-max)

### When to Consult ui-ux-pro-max

Consult during Phase 1 BEFORE setting design tokens:
1. Background warmth (neutral vs warm off-white)
2. Primary brand color selection (Mediterranean blue vs local color)
3. Typography choice (serif for prestige vs sans-serif for modern)
4. Card style (border vs shadow vs background-diff)
5. Button radius and style

**Do NOT consult for:** engineering decisions, component architecture, routing, state management.

### Landing Page Palette Defaults (from ui-ux-pro-max guidance)

For a professional local business site:
- Background: warm off-white (oklch 0.960-0.970 range, hue 70-90)
- Primary: Mediterranean blue (oklch 0.546 0.245 262)
- Secondary: warm stone (oklch 0.30-0.40 range, desaturated)
- Avoid pure white (#fff) backgrounds — slightly warm always feels more premium
- Avoid high-saturation backgrounds — chroma above 0.010 on background is too much

### Common Local Business Design Mistakes

1. Using generic "Bootstrap blue" instead of a regional/brand color
2. Using pure white background (feels clinical, not warm/welcoming)
3. Oversized hero text that breaks on mobile (test at 375px)
4. Stock photo hero (obvious, feels untrustworthy)
5. Too many CTAs on the hero (one primary, one secondary — no more)

---

## 17. Quick Reference: Lessons from First Project

1. **Content intake first** — company name, WhatsApp, address, Maps URL block launch if missing
2. **Warm backgrounds** — local business = warm off-white, not Tailwind neutral
3. **Controller, not register()** — for any Radix/shadcn form component
4. **z.coerce.* = explicit type** — don't use z.infer with coerce transforms
5. **Formspree during Phase 3** — don't leave form testing until deployment
6. **middleware at src/** — not project root when using --src-dir
7. **Translation keys before components** — verify keys exist before writing the component
8. **Decide URL slugs before Phase 4** — translated vs same slug; changing after launch breaks URLs
9. **ui-ux-pro-max in Phase 1** — consult for warmth/palette before setting tokens
10. **Legal placeholders are launch blockers** — [Company Name], registration number, address must be real before going live

---

*Status: Populated from 3D Printing Barcelona landing page project (March 2026)*
*Next update: After second landing page project*
