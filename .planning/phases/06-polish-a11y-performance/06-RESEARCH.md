# Phase 6: Polish (A11y & Performance) — Research

**Researched:** 2026-04-18
**Domain:** WCAG AA + Core Web Vitals audit and remediation for Next.js 16 App Router static site
**Confidence:** HIGH (core findings verified via official Next.js 16.2.4 docs + W3C WAI sources)

---

## Summary

Phase 6 is a verification-plus-surgical-fix phase over 43 prerendered pages. The codebase is in strong shape — Radix Dialog handles mobile nav focus-trapping, SkipLink and `<main>` landmark are correctly wired, and most components already follow `focus-visible:ring-2 focus-visible:ring-accent-ring` focus-ring conventions. The phase has two load-bearing changes (carousel pause button + `priority` → `preload` prop migration) and a series of targeted ARIA/contrast patches identified via axe-core CLI.

**Axe runner recommendation:** `@axe-core/cli` (npx, no install needed) scanning `localhost:3000` after `pnpm build && pnpm start`. Pass all 8 Spanish URLs as space-separated arguments; no file-list or sitemap-native support needed for 8 URLs. Default reporter is human-readable terminal output — sufficient for one-shot audit.

**Carousel pattern:** WAI-ARIA APG specifies that the slide live-region must use `aria-live="off"` while auto-advancing and switch to `aria-live="polite"` when paused. The pause button uses a changing `aria-label` (not `aria-pressed`) that describes the action it will perform. This is the opposite of what was originally planned — `aria-live="polite"` always-on causes constant SR interruption during auto-rotation.

**`priority` prop:** Deprecated in Next.js 16.2.4. Use `preload={true} loading="eager" fetchPriority="high"` on the one true LCP image (slide 0 of the hero carousel). The header logo and person portrait also currently use `priority` — migrate them to `loading="eager" fetchPriority="high"` (no `preload` since they are not the primary LCP candidate on most pages).

**Primary recommendation:** Run axe-core CLI first (plan 06-01), then fix all violations bottom-up by component (06-02 carousel a11y + scrim contrast, 06-03 component-level fixes), then performance (06-04 LCP/CLS optimization + `priority` migration), then verify static output (06-05).

---

## Standard Stack

### Core (no new dependencies needed for the audit)

| Tool | Invocation | Purpose | Why Standard |
|------|-----------|---------|--------------|
| `@axe-core/cli` | `npx @axe-core/cli@4 <urls>` | A11y audit CLI via Puppeteer | Official Deque CLI; zero-install with npx |
| Chrome DevTools Lighthouse | Manual panel run | Mobile 4G Core Web Vitals | No dependency, matches CONTEXT.md audit workflow |
| Chrome DevTools Color Picker | Elements → Styles eyedropper | Text-on-image contrast sampling | Only tool that samples real rendered pixels |

### No new runtime dependencies

All fixes go into existing components. No new npm packages are required.

### If a file-list runner is wanted (planner's call — not recommended)

`axe-scan` (separate package, `npm i -g axe-scan`) reads a `.txt` URL list. For 8 URLs the overhead is not worth it; `@axe-core/cli url1 url2 ... url8` is simpler.

**Audit command (8 Spanish pages, localhost):**
```bash
npx @axe-core/cli@4 \
  http://localhost:3000/es \
  http://localhost:3000/es/personas \
  http://localhost:3000/es/personas/esteban-calzetta \
  http://localhost:3000/es/investigacion \
  http://localhost:3000/es/publicaciones \
  http://localhost:3000/es/contacto \
  http://localhost:3000/es/divulgacion \
  http://localhost:3000/es/club-de-revista \
  --load-delay 1500
```

`--load-delay 1500` gives React hydration time before axe runs. Default headless Chrome is fine.

**Planner decision:** `esteban-calzetta` is recommended as the PI slug for the Spanish audit — has full bio, email, ORCID, scholar links, and selected publications. This maximizes coverage of PersonDetail rendering paths.

---

## Architecture Patterns

### Recommended Plan Order

```
06-01  A11y audit (axe run → violations inventory)
06-02  Carousel: pause button + aria-live toggle + scrim contrast
06-03  Component-level fixes (anything axe found)
06-04  Performance: priority→preload migration, CLS verification, LCP audit
06-05  Final verification: static output check, NAV-03 re-audit, Lighthouse runs
```

### Pattern 1: WAI-ARIA APG Carousel with Pause Button (no prev/next)

**Source:** https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/

The current HeroCarousel.tsx is missing:
1. A pause button (WCAG 2.2.2 violation — Level A)
2. Correct `aria-live` toggling (currently no live region at all)
3. `aria-label` on the carousel root (it has `aria-roledescription` but needs a name)
4. `role="group"` + `aria-roledescription="slide"` + `aria-label` on each slide div

**Correct pattern for this codebase:**

```tsx
// Slide container (wrapping the map of slide divs):
<div
  aria-live={isPaused ? 'polite' : 'off'}
  aria-atomic="false"
>
  {slides.map((slide, i) => (
    <div
      key={slide.src}
      role="group"
      aria-roledescription="slide"
      aria-label={`${i + 1} / ${slides.length}`}
      aria-hidden={i !== index}
      // ... existing className
    >
      ...
    </div>
  ))}
</div>

// Pause button (in the controls cluster, before the dots):
<button
  type="button"
  aria-label={isPaused ? t('startCarousel') : t('stopCarousel')}
  aria-controls="carousel-slides"  // id on the slide container
  onClick={() => setIsPaused(p => !p)}
  className="w-6 h-6 flex items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/70"
>
  {isPaused ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
</button>

// Carousel root needs an accessible name:
<div
  aria-roledescription="carousel"
  aria-label={t('carouselLabel')}  // e.g. "Grupo de Cosmología — galería de fotos"
  // ... existing className
>
```

**Key insight — aria-live toggle rule:**
- Auto-advancing → `aria-live="off"` (prevents SR interruption every 7s)
- Paused (user clicked pause, or prefers-reduced-motion) → `aria-live="polite"` (SR announces slide when user navigates via dots)

**Pause button state wiring:**
- `isPaused` state drives `clearTimeout` (already done by the existing timerRef logic — just gate on `isPaused` instead of checking `reducedMotion` only)
- `prefers-reduced-motion: reduce` → start paused (already respected; just ensure `isPaused` initializes to `true` when `reducedMotion` is true)
- `document.hidden` → pause without changing `isPaused` state (suppress timer, resume on visibility)
- Keyboard: Space / Enter on pause button toggles — native `<button>` handles this
- Focus entering the carousel should pause rotation and NOT resume without explicit user activation (WAI-ARIA APG requirement). Implement via `onFocus` on the carousel root that calls pause.

**Translation keys needed (both `messages/es.json` and `messages/en.json`):**
```json
"carousel": {
  "label": "Galería de fotos del grupo",
  "stopCarousel": "Detener diapositivas",
  "startCarousel": "Iniciar diapositivas",
  "goToSlide": "Ir a diapositiva {n}",
  "controls": "Controles del carrusel"
}
```
(English equivalents in `en.json`)

**Icon choice (Claude's Discretion — consistent with existing inline SVG precedent):**
Use Lucide `Pause` and `Play` — already in dependencies (`lucide-react` is listed). No need for inline SVG.

### Pattern 2: Scrim Contrast Verification

The current scrim is:
```
bg-gradient-to-t from-ink via-ink/85 via-30% to-transparent to-65%
```

`--color-ink` = `oklch(0.22 0.015 60)` — near-black. Text is pure white. CONTEXT.md wants to remove text-shadow and rely on scrim alone.

**Contrast math (approximate):** At the bottom (full ink), white text on oklch(0.22) ≈ contrast ratio ~11:1 (well above 4.5:1). At mid-scrim the gradient fades but the text block is positioned `justify-end` (bottom), so text always sits in the dense part. This passes 4.5:1 with high confidence.

**The axe-core limitation (confirmed):** axe-core reads `background-color` from CSS, not sampled pixels. For `bg-gradient-to-t from-ink to-transparent`, axe cannot reliably resolve a single background-color value. It will either:
- Report a false positive (contrast violation) because it reads the transparent stop, or
- Skip the check entirely

**Fallback manual methodology (belt-and-suspenders, planner should add to 06-02 plan):**
1. `pnpm start`, open `/es` in Chrome
2. Open DevTools → Elements → select the `<h1>` (groupName)
3. Click the white color swatch in Styles panel → eyedropper icon
4. Eyedropper → click the lightest-looking point of the gradient behind the text
5. DevTools shows computed contrast ratio — confirm ≥ 4.5:1
6. Repeat for the lightest slide (slide with most bright pixels near center/bottom)

This takes ~5 minutes per slide and should be included as a required step in 06-02.

### Pattern 3: `priority` → `preload` Migration (Next.js 16.2.4)

**Source:** https://nextjs.org/docs/app/api-reference/components/image (version 16.2.4, updated 2026-04-15)

`priority` is deprecated. The replacement depends on the role of the image:

| Image | Current | Correct in Next.js 16 |
|-------|---------|----------------------|
| Hero carousel slide 0 (LCP candidate) | `priority={i === 0}` | `preload={true} loading="eager" fetchPriority="high"` on slide 0 only; no props on slides 1-2 |
| Logo in SiteHeader (above fold, every page) | `priority` | `loading="eager" fetchPriority="high"` (no `preload` — not LCP) |
| Person portrait in PersonDetail (above fold, person pages) | `priority` | `preload={true} loading="eager" fetchPriority="high"` (IS the LCP on person pages) |

**Rule:** `preload={true}` inserts a `<link rel="preload">` in `<head>`. Use only for the confirmed LCP element. Home page LCP = slide 0. Person page LCP = portrait photo.

**Do not use `preload` on the logo** — it is on every page and is small; preloading it as a link would delay other resources with no LCP benefit.

**Warning from docs:** "When you have multiple images that could be considered the LCP element depending on the viewport — do not use `preload`." This applies to slides 1-2 of the carousel: they should have neither `priority` nor `preload`.

### Pattern 4: Static Output Verification

**Canonical check — build output symbols:**

After `pnpm build`, the terminal table shows:
- `○` = Static (prerendered at build time, no ISR)
- `ƒ` = Dynamic (server function)

All 43 routes must show `○`. Zero `ƒ`.

**Machine-readable check via `prerender-manifest.json`:**

```bash
node -e "
const m = require('.next/prerender-manifest.json');
const routes = Object.keys(m.routes);
console.log('Static routes:', routes.length);
// Should be 45 (43 content + _global-error + _not-found)
"
```

Current state (confirmed from pre-existing `.next/prerender-manifest.json`): 45 static routes, 0 dynamic. The `dynamicRoutes` key in the manifest lists parametric templates (`/[locale]/people/[slug]`) — these are template definitions, not server-rendered routes; all their instantiations appear in `routes`.

**NAV-03 re-audit (after any component changes):**

```bash
grep -r "mailto\|@.*\." .next/server/app --include="*.html" | grep -v "twitter" | grep -v "schema.org"
```

Zero hits = NAV-03 preserved.

### Pattern 5: LCP / CLS Common Causes in This Codebase

**LCP candidates by page:**

| Page | LCP Element | Risk |
|------|-------------|------|
| Home (`/es`) | Hero carousel slide 0 (`/Portadas/portada_1.jpg`) | Priority prop deprecated → migrate to `preload` |
| People list (`/es/personas`) | No above-fold image (PersonCard photos load below fold on mobile) | Risk = LOW, LCP likely h1 text |
| Publications (`/es/publicaciones`) | No image | LCP = h1 or first publication entry; LOW risk |
| Person detail | Portrait photo (`priority` → `preload` needed) | Migrate to `preload={true}` |
| Contact (`/es/contacto`) | Above-fold text; Maps iframe is below fold | Maps iframe MUST NOT be LCP |

**CLS causes to watch:**

1. **Fonts:** Both fonts use `display: 'swap'` via `next/font/google`. This causes a brief FOUT but `next/font` injects a font-metric override that eliminates CLS from font-size changes. CLS from fonts = LOW risk.

2. **Maps iframe (ContactPage):** MapEmbed uses `IntersectionObserver` with `rootMargin: '200px'` — the iframe mounts before the user scrolls to it. The container has `aspect-[16/9]` which reserves space → CLS = 0. Verify Lighthouse confirms the Maps iframe is NOT the LCP element on Contact page.

3. **Hero carousel:** All slides use `fill` with a parent div that has `h-[min(85svh,720px)] md:aspect-[21/9]`. Parent size is fixed by CSS before images load → CLS = 0. The opacity transition does not affect layout.

4. **sr-only content:** Screen-reader-only text with `sr-only` class uses `position: absolute; width: 1px; height: 1px` — no layout impact → CLS = 0.

**Lighthouse mobile 4G verification procedure (Contact page — PERF-05):**

1. Run `pnpm build && pnpm start`
2. Open Chrome, navigate to `http://localhost:3000/es/contacto`
3. DevTools → Lighthouse → Mobile preset → "Simulated throttling (4G)" → Analyze
4. In the "Largest Contentful Paint element" diagnostic: confirm element is NOT the Maps iframe
5. Expected LCP element: first `<h1>` or address text above the fold
6. If Maps iframe appears as LCP: increase `rootMargin` offset or add `loading="lazy"` explicitly on the `<iframe>`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile nav focus trap | Custom focus management | Radix Dialog (already in place) | Dozens of edge cases: Escape, return focus, aria-modal, scroll lock |
| Contrast ratio calculation | Manual OKLCH math | Chrome DevTools eyedropper + built-in contrast display | DevTools shows ratio instantly; manual calculation is error-prone |
| axe-core integration | Custom Puppeteer script | `@axe-core/cli` via npx | Already wraps Puppeteer with correct axe injection |
| Font swap CLS prevention | CSS `font-display` overrides | `next/font` metric override (already configured) | `next/font` automatically injects size-adjust properties |

---

## Common Pitfalls

### Pitfall 1: aria-live="polite" Always-On During Auto-Rotation

**What goes wrong:** Setting `aria-live="polite"` on the slide container unconditionally causes a screen reader to announce the new slide content every 7 seconds — constant interruption while reading other parts of the page.

**Correct behavior:** `aria-live="off"` when auto-advancing, switch to `"polite"` only when paused. The WAI-ARIA APG example uses this exact toggle.

**Warning sign:** If a screen reader user hears slide content announced automatically while they are reading another section of the page.

### Pitfall 2: aria-pressed on Pause Button

**What goes wrong:** Using `aria-pressed={isPaused}` on the pause button makes the button a toggle button. Screen readers announce "button, pressed" or "button, not pressed" — ambiguous in context.

**Correct behavior:** Change the `aria-label` to describe the action: `"Detener diapositivas"` when playing → `"Iniciar diapositivas"` when paused. No `aria-pressed`.

**Source:** WAI-ARIA APG carousel example explicitly uses dynamic `aria-label`, not `aria-pressed`.

### Pitfall 3: priority Prop on Slides 1-2

**What goes wrong:** `priority={i === 0}` (current code) correctly limits priority to the first slide, but the deprecated `priority` prop in Next.js 16 must be migrated. If migrating with `preload`, accidentally adding `preload` to all slides inserts multiple `<link rel="preload">` hints for large images that are not in the initial viewport — wasting bandwidth and potentially hurting LCP by delaying other resources.

**Correct behavior:** `preload={true} loading="eager" fetchPriority="high"` on slide 0 only. Slides 1–2 get no loading-related props (default lazy is correct — they are hidden via `opacity-0`).

### Pitfall 4: axe-core False Negative on Text-on-Gradient Contrast

**What goes wrong:** axe passes the carousel hero text because it cannot compute gradient contrast. The planner may conclude the contrast is verified when it is not.

**Prevention:** Add an explicit manual DevTools eyedropper step to the 06-02 plan (see Pattern 2 above). Do not rely solely on axe for gradient-background contrast.

### Pitfall 5: NAV-03 Regression After Component Edits

**What goes wrong:** Editing `PersonDetail.tsx` or `ContactDetails.tsx` to fix a11y issues might accidentally move the `EmailLink` client-only pattern to a server context, causing the mailto to appear in prerendered HTML.

**Prevention:** Re-run the NAV-03 grep check after every component edit that touches email-related markup. The grep is fast (< 1s). Include it as the final step of 06-05.

### Pitfall 6: scrollable-region-focusable on Carousel with overflow-hidden

**What goes wrong:** axe's `scrollable-region-focusable` rule fires on elements with `overflow: scroll` or `overflow: auto` that contain focusable children — not on `overflow: hidden`. The HeroCarousel uses `overflow-hidden` which is NOT scrollable. axe-core (since version ~3.x) correctly excludes `overflow: hidden` from this rule. This violation should NOT appear, but if it does, it is a false positive.

**Resolution if it fires:** Verify with Chrome DevTools that the carousel element has `overflow: hidden` (not `overflow: auto`). File as a known false positive; do not add a spurious `tabIndex={0}`.

### Pitfall 7: Multiple h1 Elements on Home Page

**What goes wrong:** The HeroCarousel renders the `<h1>` (groupName) inside the carousel. If the home page also has another `<h1>` somewhere else, axe will report `page-has-heading-one` as a warning about duplicate h1s. Currently the carousel is the only h1 on the home page — confirm this is still true after fixes.

**Check:** `grep -n "<h1" src/app/\[locale\]/page.tsx` — should show zero direct h1s in the page component (the h1 is in HeroCarousel).

---

## Axe-Core Rule Likelihood Assessment

Rules most likely to fire given the current codebase:

| Rule | Likelihood | Reason | Fix |
|------|-----------|--------|-----|
| `button-name` | HIGH | HeroCarousel dot buttons currently have `aria-label={t('goToSlide', { n: i + 1 })}` — this is correct. But there's no `aria-label` on the carousel root element. May fire on root if axe requires a name for `role=region`. | Add `aria-label` to carousel root |
| `color-contrast` | MEDIUM | `text-ink-muted` (oklch 0.48) on `surface` (oklch 0.995) — likely ~4.5:1 but needs axe verification. `text-ink-subtle` (oklch 0.62) on surface = approximately 3.5:1 — may fail. | Darken `ink-subtle` tokens if axe flags |
| `landmark-complementary-is-top-level` | LOW | No `<aside>` elements in current codebase — unlikely |  |
| `region` | MEDIUM | Sections without `aria-labelledby` inside `<main>` may fire. Most sections in the codebase already have `aria-labelledby`. Check OutreachCard `<article>` without an `id`-based heading link. | Add `aria-labelledby` where missing |
| `image-alt` | LOW | PersonCard uses `alt=""` for portrait (correct — name is in adjacent h3). OutreachCard uses `alt=""` (correct — title is adjacent). HeroCarousel slide images have `alt={slide.alt}` from data. | Verify data provides meaningful alt for hero slides |
| `link-name` | LOW | `PersonDetail.tsx` backlink uses `←` prefix + translated text — should have accessible name. Check that locale toggle link has accessible name. | Verify LocaleToggle has aria-label |
| `html-has-lang` | NONE | Layout sets `lang={locale}` — already correct |  |
| `page-has-heading-one` | NONE | HeroCarousel renders h1 on Home; all other pages have explicit h1 | Already correct |
| `scrollable-region-focusable` | NONE | All overflow-hidden elements; carousel excluded by rule | No action needed |
| `duplicate-id` | LOW | Possible if `pub-${publication.id}` IDs collide across year groups on Publications page | Verify unique IDs |

---

## Code Examples

### Carousel pause-button state machine (TypeScript)

```tsx
// Source: WAI-ARIA APG carousel-1-prev-next + codebase analysis
const reducedMotionPreferred =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const [isPaused, setIsPaused] = useState(reducedMotionPreferred);

// Timer effect — gate on isPaused instead of just reducedMotion
useEffect(() => {
  if (timerRef.current) clearTimeout(timerRef.current);
  if (isPaused) return;                    // paused: no timer
  timerRef.current = setTimeout(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, VISIBLE_MS);
  return () => { if (timerRef.current) clearTimeout(timerRef.current); };
}, [index, slides.length, isPaused]);

// Focus-enters-carousel → pause (WAI-ARIA APG requirement)
const handleFocus = () => setIsPaused(true);

// aria-live toggle
const liveRegion = isPaused ? 'polite' : 'off';
```

### preload migration (Next.js 16.2.4)

```tsx
// Source: https://nextjs.org/docs/app/api-reference/components/image v16.2.4

// BEFORE (deprecated):
<Image src={slide.src} alt={slide.alt} fill priority={i === 0} />

// AFTER — slide 0 (LCP):
<Image
  src={slide.src}
  alt={slide.alt}
  fill
  {...(i === 0 && {
    preload: true,
    loading: 'eager',
    fetchPriority: 'high',
  })}
/>

// AFTER — header logo (above fold, not LCP):
<Image src="/logo_cosmo.png" alt={...} width={40} height={40}
  loading="eager" fetchPriority="high" className="h-8 w-auto" />

// AFTER — person portrait (IS LCP on person pages):
<Image src={`/${person.photo}`} alt="" fill
  preload={true} loading="eager" fetchPriority="high"
  sizes="(min-width: 768px) 240px, 100vw" />
```

### Static output machine check

```bash
# Source: Next.js build output documentation + prerender-manifest analysis
node -e "
const m = require('.next/prerender-manifest.json');
const n = Object.keys(m.routes).length;
console.log('Static routes:', n);
if (n < 43) { console.error('FAIL: fewer than 43 routes'); process.exit(1); }
console.log('PASS');
"
```

### alt text decision tree for this codebase

```
Portrait photo on PersonCard (name in h3 below):     alt=""   ✓ (supplementary)
Portrait photo on PersonDetail (name in adjacent h1): alt=""   ✓ (supplementary)
Hero carousel slide photo (no adjacent caption):       alt={slide.alt from data}  (meaningful)
OutreachCard event photo (title in adjacent h2):       alt=""   ✓ (supplementary)
PartnerStrip logo (no image tags — text only):         N/A
Logo in SiteHeader:                                    alt={siteConfig.groupName}  ✓ (brand identity)
ResearchCard Lucide icons:                             aria-hidden="true"  ✓ (already correct)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `priority` prop on LCP images | `preload={true} loading="eager" fetchPriority="high"` | Next.js 16 (Oct 2025) | Must migrate 3 image instances |
| `aria-live="polite"` on carousel always | `aria-live` toggles off/polite based on play/pause state | WAI-ARIA APG current | Changes carousel implementation |
| `aria-pressed` for pause button toggle | Dynamic `aria-label` describing next action | WAI-ARIA APG current | Simpler, more understandable to SR users |
| Decorative images use `role="presentation"` | Use `alt=""` | WAI support guidance (current) | `role="presentation"` not as widely supported |

**Deprecated:**
- `next/image priority` prop: deprecated in 16.x, replaced by `preload` + `fetchPriority`

---

## Open Questions

1. **`text-ink-subtle` contrast (oklch 0.62 on 0.995)**
   - What we know: oklch(0.62) ≈ roughly sRGB ~60% lightness; on near-white this may be ~3.5:1 — below 4.5:1 for normal text
   - What's unclear: Exact computed contrast depends on gamut mapping; needs axe-core run to confirm or deny
   - Recommendation: Let axe flag this. If it fails, darken `--color-ink-subtle` to oklch(0.45) or lower. `ink-subtle` is used for small-uppercase labels (ContactDetails, OutreachCard) — those qualify as large text (≥18pt or bold ≥14pt). Verify size before adjusting.

2. **Carousel root `aria-label` value**
   - What we know: WAI-ARIA APG requires the carousel container to have an accessible name
   - What's unclear: Should the label be the group name, "gallery", or something else? English and Spanish versions both needed.
   - Recommendation: `"Galería de fotos del grupo"` / `"Group photo gallery"` — planner picks, add to translations

3. **`document.hidden` interaction with `isPaused` state**
   - What we know: Current implementation clears timer on `document.hidden` and restores it via `setIndex(i => i)` (which triggers the effect)
   - What's unclear: After adding `isPaused`, resuming on `visibilitychange` should only re-start timer if `isPaused === false` — the existing `setIndex` trick should still work since the effect gates on `isPaused`
   - Recommendation: Verify this in the 06-02 plan by testing tab-switching behavior manually

4. **NavLink focus ring — missing on hover links?**
   - What we know: NavLink doesn't have explicit `focus-visible:ring-2` (just `transition-colors`); it relies on `Link` from next-intl/navigation
   - What's unclear: Does the underlying `<a>` element show the browser default focus ring, or is it suppressed by global `outline: none`?
   - Recommendation: Audit NavLink in DevTools — add `focus-visible:ring-2 focus-visible:ring-accent-ring rounded` if the native ring is missing or suppressed

5. **`LocaleToggle` accessible name**
   - What we know: Component is at `src/components/layout/LocaleToggle.tsx` (unread — assumed it renders a button or link)
   - What's unclear: Whether it has an `aria-label`
   - Recommendation: Read LocaleToggle.tsx in 06-01 plan; add `aria-label` if the visible text alone is insufficient

---

## Planner Decisions Needed

1. **Axe runner confirmed:** Use `@axe-core/cli@4` via npx. No install. **No decision needed.**

2. **PI slug for audit:** `esteban-calzetta` recommended. Planner confirm or substitute.

3. **Manual contrast spot-check:** CONTEXT.md says "axe-core primary signal" but acknowledges axe cannot sample pixels. Research confirms axe reliably fails on gradient backgrounds. **Planner should add the DevTools eyedropper step to 06-02 as a required verification step** (5 min, 3 slides).

4. **Pause button icon:** Use Lucide `Pause`/`Play` (already in `lucide-react` dependency). No new import needed.

5. **`aria-label` string for carousel root:** Planner picks the label and adds it to both `messages/es.json` and `messages/en.json`.

6. **`text-ink-subtle` contrast:** Planner should check this in 06-01 and budget a fix if axe flags it. The fix is a one-line CSS token change but affects every usage site.

---

## Sources

### Primary (HIGH confidence)
- Next.js docs v16.2.4 (fetched 2026-04-15): `preload` prop documentation, `priority` deprecation notice, `fetchPriority` guidance
- W3C WAI-ARIA APG Carousel Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ — ARIA roles, live region toggle, pause button pattern
- W3C WAI-ARIA APG Carousel Example (prev/next): https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/ — `aria-live` off/polite toggle, `aria-label` (not `aria-pressed`) on pause button
- W3C WAI Decorative Images tutorial: https://www.w3.org/WAI/tutorials/images/decorative/ — `alt=""` vs `role="presentation"` guidance
- Codebase read: HeroCarousel.tsx, layout.tsx, PersonCard.tsx, PersonDetail.tsx, SiteHeader.tsx, SkipLink.tsx, MobileNav.tsx, MapEmbed.tsx, NavLink.tsx, EmailLink.tsx, globals.css
- `.next/prerender-manifest.json` read: 45 static routes confirmed, 20 Spanish routes confirmed

### Secondary (MEDIUM confidence)
- Deque axe-core scrollable-region-focusable rule: https://dequeuniversity.com/rules/axe/4.8/scrollable-region-focusable — `overflow:hidden` exclusion confirmed
- Next.js build output symbols: ○ = static, ƒ = dynamic — confirmed via multiple official Next.js pages

### Tertiary (LOW confidence — for awareness only)
- WebSearch finding: `axe-scan` for file-list multi-URL scanning — not recommended for 8 URLs, use `@axe-core/cli` with space-separated URLs instead
- WebSearch finding: Lighthouse simulated 4G throttling methodology — official docs not fetched

---

## Metadata

**Confidence breakdown:**
- Carousel ARIA pattern: HIGH — verified against WAI-ARIA APG source
- `priority` → `preload` migration: HIGH — verified against Next.js 16.2.4 official docs
- axe-core CLI runner: HIGH — official npm package, confirmed approach
- CLS root causes: MEDIUM — verified logic from codebase analysis + Next.js docs patterns
- Text-on-image contrast methodology: MEDIUM — Chrome DevTools capability confirmed via WebSearch + WebAIM
- Static output verification: HIGH — confirmed via manifest file read

**Research date:** 2026-04-18
**Valid until:** ~2026-06-01 (Next.js moves fast; `preload`/`priority` guidance may evolve)
