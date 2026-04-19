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

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: oklch(0.52 0.12 45);
  color: oklch(0.995 0.003 85);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: oklch(0.52 0.12 45);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: oklch(0.978 0.008 80);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  background: oklch(0.978 0.008 80);
  transition: box-shadow 200ms ease;
}

.input:focus {
  outline: none;
  box-shadow: 0 0 0 3px oklch(0.52 0.12 45 / 0.20);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: oklch(0.995 0.003 85);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-md);
  max-width: 500px;
  width: 90%;
}
```

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
- Dark-mode-first palettes or cosmic/space aesthetics
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
