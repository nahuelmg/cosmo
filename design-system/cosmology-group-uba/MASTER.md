# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Cosmology Group UBA
**Generated:** 2026-04-17 17:34:53 (raw); overrides applied 2026-04-17 by Plan 01-02
**Category:** Warm-Academic Institutional

---

## Global Rules

### Color Palette

| Role | OKLCH | CSS Variable |
|------|-------|--------------|
| CTA/Accent | `oklch(0.52 0.12 45)` | `--color-accent` |
| Surface (primary) | `oklch(0.995 0.003 85)` | `--color-surface` |
| Surface (alt) | `oklch(0.978 0.008 80)` | `--color-surface-alt` |
| Ink (body) | `oklch(0.22 0.015 60)` | `--color-ink` |
| Ink (muted) | `oklch(0.48 0.012 60)` | `--color-ink-muted` |
| Ink (subtle) | `oklch(0.62 0.010 60)` | `--color-ink-subtle` |

**Color Notes:** Warm-academic: ivory surfaces, warm near-black ink, muted terracotta accent. No cool blues, no neons, no gradients. Accent surfaces on links, focus ring, active-nav underline, and at most one additional chrome element. Not on body prose, not as background fills.

### Dark Mode (optional toggle)

Opt-in dark palette applied when `.dark` sits on `<html>`. Light mode remains
the canonical warm-academic identity; dark is a user preference honoured via
cookie + `prefers-color-scheme`. Tokens adapted per
`skills/domains/dark-mode/SKILL.md`:

| Role | Light (baseline) | Dark (override) |
|------|------------------|-----------------|
| `--color-surface` | `oklch(0.995 0.003 85)` | `oklch(0.22 0.005 60)` |
| `--color-surface-alt` | `oklch(0.978 0.008 80)` | `oklch(0.26 0.008 60)` |
| `--color-ink` | `oklch(0.22 0.015 60)` | `oklch(0.93 0.012 75)` |
| `--color-ink-muted` | `oklch(0.48 0.012 60)` | `oklch(0.75 0.015 65)` |
| `--color-ink-subtle` | `oklch(0.62 0.010 60)` | `oklch(0.65 0.012 65)` |
| `--color-accent` | `oklch(0.52 0.12 45)` | `oklch(0.70 0.14 45)` |
| `--color-accent-hover` | `oklch(0.44 0.13 45)` | `oklch(0.78 0.15 45)` |
| `--color-accent-ring` | `oklch(0.52 0.12 45 / 0.45)` | `oklch(0.70 0.14 45 / 0.55)` |
| `--color-accent-sage` | `oklch(0.55 0.05 145)` | `oklch(0.72 0.07 145)` |
| `--color-accent-ink-blue` | `oklch(0.40 0.08 250)` | `oklch(0.72 0.10 250)` |
| `--shadow-sm` | `0 1px 2px oklch(ink/0.04)` | `0 1px 2px oklch(0 0 0 / 0.4)` |
| `--shadow-md` | `0 2px 8px oklch(ink/0.06)` | `0 2px 8px oklch(0 0 0 / 0.55)` |

**Rules:**
- Surfaces carry only a residual warm hue (chroma ≤ 0.008). No strong tinting —
  the #1 dark-mode mistake is tinting surfaces with brand hue; keep hue on
  accent only.
- Accent lightness + chroma are *raised* so terracotta pops against dark
  surfaces (L 0.52 → 0.70, C 0.12 → 0.14).
- Text uses L 0.93 (not pure white) for primary and L 0.75 (not L 0.60) for
  muted — dark-mode muted text at L < 0.65 becomes unreadable.
- Shadows re-authored as near-black; light-mode shadows tinted with warm ink
  wash out on dark surfaces.
- `ring-offset-surface` automatically flips with the theme; no ring-offset
  overrides needed on light-bg components.

**Source-pill dark variants** (PublicationEntry only — the site's one "category
chip" cluster): invert L between bg and text, preserve hue, moderate chroma.
Applied inline via Tailwind `dark:` arbitrary values, not tokens — a token
would over-promise reuse for a single component's palette.

### Typography

- **Heading Font:** Source Serif 4 (variable, SIL OFL; subsets: Latin, Latin-Extended, Greek)
- **Body Font:** Source Sans 3 (variable, SIL OFL; subsets: Latin, Latin-Extended, Greek)
- **Greek subset required** on BOTH families for inline cosmology notation (Λ, Ω, H₀, σ₈, χ²) so Greek letters do not switch visual style mid-sentence.
- **Mood:** academic, research, scholarly, accessible, readable, educational, warm-minimal, serif-headings, whitespace-driven

**Google Fonts:** [Source Serif 4 + Source Sans 3](https://fonts.google.com/share?selection.family=Source+Sans+3:ital,wght@0,200..900;1,200..900|Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900)

> **Font delivery note:** Fonts are loaded via `next/font/google` in `src/app/fonts.ts` (Plan 01-04), with `subsets: ['latin', 'latin-ext', 'greek']`. No CSS `@import` is used — Next.js auto-self-hosts at build time, eliminating external font requests in production.

### Type Scale (ratio 1.2)

| Token | rem | px | Usage |
|-------|-----|----|-------|
| `--text-xs` | `0.8125rem` | ~13px | Captions, meta labels |
| `--text-sm` | `0.9375rem` | 15px | Secondary body, UI labels |
| `--text-base` | `1rem` | 16px | Primary body prose (`line-height: 1.5`) |
| `--text-lg` | `1.125rem` | 18px | Lead paragraph, card summary |
| `--text-xl` | `1.375rem` | ~22px | H4 (sans, semibold 600) |
| `--text-2xl` | `1.625rem` | 26px | H3 (serif, semibold 600) |
| `--text-3xl` | `1.875rem` | 30px | H2 (serif, semibold 600) |
| `--text-4xl` | `2.25rem` | 36px | H1 on inner pages (serif, semibold 600) |
| `--text-5xl` | `2.5rem` | 40px | Hero H1 (HomePage HeroCarousel only, serif, semibold 600) |

> **v1.2 update:** `--text-4xl` bumped from 32 px → 36 px and `--text-5xl` added at 40 px so H1 (36 px) sits ≥1.20× above H2 (30 px). The v1.0 scale entries above this line (`--text-xs` through `--text-3xl`) are unchanged. Any external doc or branch referring to `--text-4xl: 2rem` is superseded.

### Line-Height Convention

Two-tier convention per v1.2 Phase 13:

| Tier | Applies to | Value | Tailwind utility |
|------|-----------|-------|------------------|
| Display | `text-3xl` and larger (H1, large H2) | `1.2` | `leading-tight` |
| Body | `text-xl` and smaller (paragraph, list items, card copy) | `1.625` | `leading-relaxed` |

- `h1` is encoded in `@layer base` as `line-height: 1.2`. H2 elements that render at `text-3xl` add `leading-tight` per-component.
- Body prose converges on `leading-relaxed` (1.625). Existing `leading-normal` usage is migrated case-by-case; no blanket `@layer base` body override.
- Letter-spacing unchanged: `-0.01em` on headings via `@layer base`; body stays at 0.

**Weights:** Serif display at `600` (semibold); Sans body at `400` (regular) / `600` (semibold) / `700` (bold).

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |

> `--shadow-lg` and `--shadow-xl` removed — heavy halo shadows contradict the whitespace-hierarchy / Nature long-form aesthetic.

---

## Layout

Codified in v1.2 Phase 13. All measurements encoded as Tailwind classes on components; no CSS custom properties introduced beyond `--text-5xl`.

### Container Widths (SPACE-01)

| Use case | Wrapper width | Applies to |
|----------|---------------|-----------|
| Prose / single-column | `max-w-5xl` (~1024 px) | Contact, PersonDetail, Journal Club, Publications, PeoplePlainSection |
| Grid / multi-column | `max-w-6xl` (~1152 px) | People (grid + page header), Outreach, Research, HomePage sections |
| Inline reading prose | `max-w-3xl` (~768 px) | HomePage intro, any inline prose block inside a wider grid wrapper |

Rule of thumb: if the page is mostly text read top-to-bottom, use `max-w-5xl`. If the page is a grid of cards or imagery, use `max-w-6xl`. HomePage uses `max-w-6xl` outer with `max-w-3xl` inner for prose sections.

### Vertical Rhythm (SPACE-02)

| Scope | Padding | Applies to |
|-------|---------|-----------|
| Page wrapper | `py-16` | Every top-level page `<section>` / `<header>` / `<article>` |
| Sub-section | `py-12` | `PeopleSection`, `PeoplePlainSection`, other in-page sections with their own vertical scope |
| Hero | `py-20` (reserved) | Not applied as a wrapper in v1.2; hero rhythm carried by `HeroCarousel` internal `p-8 md:p-12` + image height. Retained in convention for future full-bleed variants. |

### Card Padding Tiers (SPACE-03)

Two tiers, flat across breakpoints (no responsive step):

| Tier | Padding | Semantic use | Exemplars |
|------|---------|--------------|-----------|
| Dense | `p-4` (or `py-5` for row-based) | "Read a lot of these at once" — grid tiles, list rows | `PersonCard`, `SessionRow` |
| Spacious | `p-6` | "Feature this one" — editorial or hero-card context | `ResearchCard`, `OutreachCard` |

No named utility wrapper (e.g., `.card-dense`, `.card-spacious`) — components carry Tailwind classes directly. Revisit this decision if cards proliferate beyond the four exemplars.

---

## Component Specs

All components use Tailwind utility classes inline (no `.btn-primary` etc. abstractions). The recipes below are copy-pasteable starting points for new components.

### Universal Rules

**Focus ring pattern (BTN-02, MICRO-05):**
- Color: `ring-accent-ring` everywhere (no exceptions in `focus-visible:` — SkipLink uses `focus:` deliberately).
- Offset: `ring-offset-2` always; offset color per surface:
  - Light backgrounds (cream `--color-surface`): `ring-offset-surface`
  - Dark/image backgrounds (Hero JWST starfield): `ring-offset-black/40`
- Full pattern: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-{surface|black/40}`

**Tap-target rule (BTN-01..05):**
- Every interactive button or non-inline link has an effective ≥44×44 px hit area.
- Visible chrome may be smaller; padding-inside compensates (e.g., 10×10 carousel dots inside 44×44 `p-[17px]` buttons).
- **Inline-text links exempted** per WCAG 2.5.5 AAA inline exception: links inside paragraph text (PartnerStrip, OutreachCard learn-more, SiteFooter EmailLink, ContactDetails social, SessionRow paper-link, PublicationEntry arXiv/DOI/source-pill metadata) deliberately do NOT receive padding bumps.

**Motion (MICRO-01..03):** strictly limited to 3 surfaces — NavLink active-state, SourceFilter pill toggle, PersonCard photo zoom. All transitions wrap in `motion-safe:` to respect `prefers-reduced-motion`. Default duration `duration-150`; PersonCard zoom uses `duration-200` (per-spec exception).

### Buttons

**Carousel pause/play (HeroCarousel):**
```html
<button class="w-11 h-11 flex items-center justify-center rounded
  text-surface/90 hover:text-surface
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
  transition-colors">
  <Icon class="w-3.5 h-3.5" aria-hidden />
</button>
```
- Visible chrome: 44×44 (was 24×24 in v1.0).
- Hit area: 44×44.
- Focus ring: dark/image-bg pattern.

**MobileNav trigger / close:**
```html
<button class="w-11 h-11 ... focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
  <Icon ... />
</button>
```
- Visible chrome + hit area: 44×44 (was 40×40 in v1.0).

### Pills

**SourceFilter pill (publications page filter):**
```html
<button class="rounded-full px-3.5 py-1.5 text-sm font-medium
  transition-colors duration-150
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface
  {active ? 'bg-accent text-white' : 'bg-surface-alt text-ink-muted hover:text-ink'}">
  {label}
</button>
```
- Visible height: ≥36 px (px-3.5 py-1.5).
- Hit area: ≥36 × content-width (within 44 px tolerance for short labels).
- Tone toggle: `transition-colors duration-150` (MICRO-02).

### Carousel Dots

**HeroCarousel dot (padding-inside pattern):**
```html
<button class="p-[17px] rounded-full flex items-center justify-center
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black/40">
  <span aria-hidden class="block w-2.5 h-2.5 rounded-full
    active:scale-95 transition-[background-color,transform] duration-75
    {active ? 'bg-surface' : 'bg-surface/50'}" />
</button>
```
- Visible chrome: 10×10 dot (preserved from v1.0).
- Hit area: 44×44 via `p-[17px]` (17 + 10 + 17 = 44).
- Wrapper uses `gap-0` so adjacent dots tile edge-to-edge with no overlap.

### Nav Link

**Desktop NavLink (header):**
```html
<a class="transition-colors duration-150 py-1.5
  text-ink-muted hover:text-ink
  {active && 'text-accent font-semibold'}">
  {children}
</a>
```
- Hit row: 44 px (py-1.5 inside h-24 header flex-center).
- Visible chrome: text-lg + py-1.5 (~36 px text row) as applied by SiteHeader (post-Phase-15 adjustment, commit 1cf9cf8). The NavLink component itself is size-agnostic; parent passes the text-* class.
- Active-state crossfade: `transition-colors duration-150` (MICRO-01, explicit per spec).

### Locale Toggle

```html
<button class="text-sm font-semibold tracking-wide
  text-ink-muted hover:text-ink
  px-2 py-1.5
  transition-[color,transform] duration-75 active:scale-95
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:rounded">
  {ES|EN}
</button>
```
- Hit row: 44 px (py-1.5 inside h-24 header flex-center, paired with NavLink).
- Pre-existing `transition-[color,transform] duration-75` preserved (NOT in MICRO-01..03 motion scope).

### PersonCard (image zoom on hover)

The Image inside the card adds:
```html
<Image class="object-cover
  motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02]" />
```
- Card hover: 1.02 zoom on photo (motion-safe, MICRO-03).
- Card lift (`hover:-translate-y-0.5`) on the outer Link is a separate, pre-existing transition.
- Initials placeholder branch does NOT zoom (no Image to scale).

---

## Style Guidelines

**Style:** Warm-Academic Institutional

**Keywords:** Serif display headings, sans body prose, ivory surfaces, warm near-black ink, whitespace-driven hierarchy, information-dense, editorial calm, no borders, no dividers

**Best For:** Academic research group portals, university department sites, scholarly institutional presences

**Visual references:** nature.com, Max Planck Institute portals, Perimeter Institute, IAS Princeton people pages

**Key Effects:** Subtle lift on hover (translateY -1px or -2px), smooth focus ring via box-shadow (no border), restrained transitions 150–200ms

### Page Pattern

**Pattern Name:** Scholarly Editorial Column

- **Hierarchy strategy:** Typography and whitespace alone carry visual hierarchy — no borders, no hairline rules, no section separators.
- **Surface ladder:** Primary surface `oklch(0.995 0.003 85)` (warm ivory) for page backgrounds; alternate surface `oklch(0.978 0.008 80)` for cards and alternating sections. Maximum two tiers — no third surface colour.
- **Section Order:** 1. Header / affiliation strip, 2. Prose hero, 3. Research highlights cards, 4. People preview, 5. Footer with logo strip

---

## Anti-Patterns (Do NOT Use)

- Ornate or decorative design elements
- Gradient fills or coloured image overlays
- Dark-mode-first palettes or cosmic/space aesthetics (an *opt-in* dark toggle
  is supported — see Dark Mode above — but the canonical identity is light)
- Cool institutional blues or neon accents
- Third surface colour tier (use only surface + surface-alt)
- Border tokens or hairline card/section dividers
- Shadow tiers above `--shadow-md`

### Additional Forbidden Patterns

- **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- **Layout-shifting hovers** — Avoid scale transforms that shift layout
- **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- **Instant state changes** — Always use transitions (150-300ms)
- **Invisible focus states** — Focus states must be visible for a11y
- **Border declarations on interactive elements** — Use box-shadow for focus rings, not border-color

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Greek glyphs render in Source Serif 4 and Source Sans 3 (verify in DevTools Coverage)
- [ ] No border declarations on interactive elements (box-shadow only for focus rings)
