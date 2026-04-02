# Design Tokens Starter (OKLCH + Tailwind v4)

> Complete globals.css starter with OKLCH design tokens, light/dark mode, Tailwind v4 theme integration, and shadcn compatibility. Copy and adapt the color values to match each project's brand.

**Validated in**: Landing page project (2026-03)
**Works with**: Tailwind CSS v4, shadcn (Base UI or Radix), Next.js

---

## 1. Why OKLCH?

OKLCH is a perceptually uniform color space — changing the lightness value by the same amount produces visually consistent results across different hues. This makes it easier to create accessible contrast ratios and harmonious palettes compared to HSL.

Format: `oklch(lightness chroma hue)`
- **Lightness**: 0 (black) to 1 (white)
- **Chroma**: 0 (gray) to ~0.37 (maximum saturation, varies by hue)
- **Hue**: 0-360 degrees (color wheel)

---

## 2. Complete globals.css

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: var(--font-primary);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-destructive: var(--destructive);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
  --radius-xl: 1rem;
}

@layer base {
  :root {
    /* --- EDIT THESE VALUES PER PROJECT --- */
    --background:             oklch(0.98 0.004 110);
    --foreground:             oklch(0.16 0.020 140);
    --card:                   oklch(1.00 0.000   0);
    --card-foreground:        oklch(0.16 0.020 140);
    --popover:                oklch(1.00 0.000   0);
    --popover-foreground:     oklch(0.16 0.020 140);
    --primary:                oklch(0.37 0.088 140);
    --primary-foreground:     oklch(0.97 0.005 110);
    --secondary:              oklch(0.48 0.062 132);
    --secondary-foreground:   oklch(0.97 0.005 110);
    --muted:                  oklch(0.95 0.010 110);
    --muted-foreground:       oklch(0.48 0.025 130);
    --accent:                 oklch(0.52 0.118 352);
    --accent-foreground:      oklch(0.98 0.005 110);
    --destructive:            oklch(0.57 0.220  28);
    --destructive-foreground: oklch(0.98 0.005 240);
    --border:                 oklch(0.91 0.010 120);
    --input:                  oklch(0.91 0.010 120);
    --ring:                   oklch(0.52 0.118 352);
    --radius: 0.5rem;
  }

  .dark {
    --background:             oklch(0.16 0.030 140);
    --foreground:             oklch(0.93 0.010 110);
    --card:                   oklch(0.20 0.030 138);
    --card-foreground:        oklch(0.93 0.010 110);
    --popover:                oklch(0.20 0.030 138);
    --popover-foreground:     oklch(0.93 0.010 110);
    --primary:                oklch(0.68 0.130 134);
    --primary-foreground:     oklch(0.14 0.025 140);
    --secondary:              oklch(0.26 0.040 138);
    --secondary-foreground:   oklch(0.93 0.010 110);
    --muted:                  oklch(0.22 0.025 138);
    --muted-foreground:       oklch(0.62 0.025 130);
    --accent:                 oklch(0.63 0.125 354);
    --accent-foreground:      oklch(0.14 0.025 140);
    --destructive:            oklch(0.62 0.220  28);
    --destructive-foreground: oklch(0.98 0.005 240);
    --border:                 oklch(0.26 0.030 138);
    --input:                  oklch(0.26 0.030 138);
    --ring:                   oklch(0.63 0.125 354);
  }

  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

---

## 3. Token Roles

| Token | Purpose | Usage |
|-------|---------|-------|
| `background` / `foreground` | Page-level bg and default text | `bg-background`, `text-foreground` |
| `card` / `card-foreground` | Elevated surfaces (cards, panels) | `bg-card`, footer background |
| `primary` / `primary-foreground` | Main brand action (buttons, links) | `bg-primary text-primary-foreground` |
| `secondary` / `secondary-foreground` | Supporting brand color | Secondary buttons, badges |
| `accent` / `accent-foreground` | Highlight / CTA color (can differ from primary) | CTAs, hover states, focus rings |
| `muted` / `muted-foreground` | Subdued elements | Placeholder text, disabled states, subtle bg |
| `destructive` / `destructive-foreground` | Error / danger | Delete buttons, error messages |
| `border` | Default border color | Dividers, card borders, input borders |
| `input` | Input field borders | Form inputs (often same as border) |
| `ring` | Focus ring color | Keyboard focus indicators |

---

## 4. Adapting Colors Per Project

To customize for a new project, change the **hue** values while keeping the lightness/chroma relationships consistent:

### Step-by-step

1. **Pick your primary hue** from the client's brand color
2. **Set accent hue** — either complementary (opposite on color wheel) or a brand secondary
3. **Keep these fixed**: destructive (hue ~28, red-orange), background/foreground lightness values
4. **Adjust chroma** — lower for professional/corporate, higher for playful/creative

### Hue reference

| Color family | Hue range | Good for |
|-------------|-----------|----------|
| Red | 15-30 | Food, energy, urgency |
| Orange | 45-70 | Warmth, creativity |
| Yellow | 85-100 | Optimism, attention |
| Green | 130-160 | Nature, health, finance |
| Teal | 170-190 | Tech, trust |
| Blue | 230-260 | Corporate, trust, calm |
| Purple | 280-310 | Luxury, creativity |
| Pink/Magenta | 340-360 | Fashion, beauty, bold |

### Example: adapting for a dental clinic (blue primary)

```css
:root {
  --primary:           oklch(0.37 0.088 240);    /* Blue instead of green */
  --primary-foreground: oklch(0.97 0.005 240);
  --secondary:         oklch(0.48 0.062 232);
  --accent:            oklch(0.52 0.118 180);    /* Teal accent */
  /* ... keep other tokens the same, adjust border/muted hues to match */
}
```

---

## 5. Font Setup

The `--font-sans` token maps to a CSS variable set by Next.js font optimization:

```tsx
// src/app/[locale]/layout.tsx
import { Inter } from 'next/font/google';
// Or: Plus_Jakarta_Sans, DM_Sans, Manrope, etc.

const fontPrimary = Inter({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
});

// In the layout JSX:
<html lang={locale} className={fontPrimary.variable}>
```

### Font pairing suggestions

| Project type | Font | Character |
|-------------|------|-----------|
| Corporate / SaaS | Inter, Geist | Clean, neutral |
| Creative agency | Plus Jakarta Sans, Manrope | Modern, friendly |
| Medical / professional | DM Sans, Source Sans 3 | Trustworthy, readable |
| E-commerce | Outfit, Poppins | Approachable, clear |

---

## 6. Marquee Animation (optional)

If using a client logos / partner strip with infinite scroll, add to `@theme inline`:

```css
@theme inline {
  /* ... other tokens ... */

  --animate-marquee: marquee 30s linear infinite;

  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
}
```

Usage: `className="animate-marquee"` on a container with duplicated children.

---

## 7. Dark Mode Toggle

Add `.dark` class to `<html>` to activate dark tokens. Common approaches:

- **next-themes**: Handles system preference, localStorage persistence, flash prevention
- **Manual**: `document.documentElement.classList.toggle('dark')` with localStorage

The `@custom-variant dark (&:is(.dark *))` line in globals.css enables Tailwind's `dark:` prefix to work with class-based toggling.

---

*Last verified: 2026-03*
