# Domain Skill: Dark Mode (Next.js + Tailwind v4 + OKLCH)

> Apply this skill when adding dark mode to a Next.js project using Tailwind v4 with OKLCH design tokens. Covers token design, implementation pattern, and all pitfalls learned from dime.ar v2.4. Works with projects that have multiple layout roots (e.g., marketing site + portal + admin).

## When to Apply

- Adding dark mode to any Next.js App Router project
- Projects using OKLCH color tokens in CSS variables
- Projects with Tailwind v4 `@custom-variant dark`
- Sites with multiple layout roots (e.g., [locale], /portal, /admin)

---

## 1. Dark Mode Token Design (OKLCH)

### Key Principles (from ui-ux-pro-max)

1. **Never use pure black** — L=0.00 causes OLED smear and feels harsh. Use L=0.20-0.25 for backgrounds.
2. **Never use pure white text** — L=1.00 is too bright. Use L=0.90-0.93 for primary text.
3. **Maintain minimum 7:1 contrast** for body text (WCAG AAA target).
4. **Muted text needs L=0.70-0.75** in dark mode — L=0.60 or below becomes unreadable against dark backgrounds.
5. **Borders need sufficient delta** — at least 0.10 lightness difference from background (e.g., bg L=0.20 → border L=0.32).
6. **Surfaces should be NEUTRAL** — the #1 mistake is tinting every surface with the brand hue. In pro dark modes (Linear, Vercel, Raycast), surfaces use chroma=0 (pure gray), and ONLY the accent/primary carry brand color. A green-tinted surface makes the whole UI look "sickly". Keep hue out of backgrounds.
7. **Accent colors get HIGHER chroma in dark mode** — brand colors need to pop against neutral gray. Use chroma 0.12-0.14 for primary/accent (vs ~0.088 in light mode).
8. **Card surfaces should be L=0.24-0.28** — visibly distinct from background but not jarring. Use multiple elevation tiers: bg L=0.20 → muted L=0.26 → card L=0.24 → border L=0.32.

### Reference Token Values

```css
/* Light mode */
:root {
  --background:       oklch(0.98 0.004 110);  /* near-white */
  --foreground:       oklch(0.16 0.020 140);  /* near-black */
  --card:             oklch(1.00 0.000   0);  /* white */
  --muted-foreground: oklch(0.48 0.025 130);  /* medium gray */
  --border:           oklch(0.91 0.010 120);  /* light gray */
}

/* Dark mode — DO NOT just invert. Surfaces are NEUTRAL. */
.dark {
  --background:       oklch(0.20 0.000 0);    /* neutral dark gray */
  --foreground:       oklch(0.93 0.000 0);    /* neutral off-white */
  --card:             oklch(0.24 0.000 0);    /* neutral elevated */
  --muted:            oklch(0.26 0.000 0);    /* neutral muted bg */
  --muted-foreground: oklch(0.72 0.000 0);    /* readable muted text */
  --border:           oklch(0.32 0.000 0);    /* neutral border */
  --primary:          oklch(0.70 0.140 140);  /* brand green pops against neutral */
  --accent:           oklch(0.68 0.140 354);  /* brand accent, also with chroma */
}
```

**Critical:** Notice chroma=0 on all surfaces. The only colors with chroma are primary and accent. This is the Linear/Vercel/Raycast approach.

### Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Background too dark (L < 0.18) | Feels like a cave, text hurts eyes | Use L=0.22-0.25 |
| Muted text too dim (L < 0.65) | Nav links, labels unreadable | Use L=0.72-0.78 |
| Borders invisible (delta < 0.10) | Cards blend into background | Border L should be background L + 0.15 |
| Full chroma on dark bg | Colors feel neon/garish | Reduce chroma by 30-50% |
| Pure white foreground (L=1.0) | Glare, eye strain | Use L=0.88-0.92 |

---

## 2. Implementation Pattern (No Library)

### Why not next-themes

A custom ThemeProvider is ~60 lines and avoids a dependency. The pattern below handles:
- Cookie-based persistence (no flash of wrong theme)
- System preference detection + watching for changes
- Three-way toggle (light / dark / system)
- SSR-safe (initial class set server-side from cookie)

### ThemeProvider

```typescript
// src/components/theme-provider.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'system', setTheme: () => {}
})

export function ThemeProvider({ initialTheme, children }: { initialTheme: string; children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme as Theme)

  function setTheme(t: Theme) {
    setThemeState(t)
    document.cookie = `theme=${t};path=/;max-age=31536000;SameSite=Lax`
    applyTheme(t)
  }

  function applyTheme(t: Theme) {
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  useEffect(() => {
    applyTheme(theme)
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
```

### Layout Wiring (SSR — no flash)

```typescript
// In each layout (locale, portal, admin):
const cookieStore = await cookies()
const theme = cookieStore.get('theme')?.value ?? 'system'
const isDark = theme === 'dark' // system preference can't be read server-side
const htmlClass = [fontVariable, isDark ? 'dark' : ''].filter(Boolean).join(' ')

return (
  <html className={htmlClass} suppressHydrationWarning>
    <body>
      <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
    </body>
  </html>
)
```

**`suppressHydrationWarning`** is critical — the server may render without `.dark` (system theme), but the client immediately applies it on mount. Without this attribute, React throws a hydration mismatch.

### Multiple Layout Roots

If the project has separate `<html>` roots (e.g., `[locale]/layout.tsx`, `portal/layout.tsx`, `admin/layout.tsx`):
- Each layout reads the same `theme` cookie
- Each wraps content in the same `ThemeProvider`
- The cookie is shared across all routes (path=/)
- Toggle placed in each layout's nav/footer

---

## 3. Logo Handling

Dark logos on dark backgrounds become invisible. Two approaches:

| Approach | When to use | Implementation |
|----------|------------|----------------|
| CSS `dark:invert` | Logo is simple dark text/shapes | `className="dark:invert"` on `<Image>` |
| Separate logo file | Logo has complex colors/gradients | `src={isDark ? '/logo-white.png' : '/logo.png'}` |

**Apply to ALL logo instances** — header, footer, portal nav, admin nav, auth pages.

---

## 4. Tailwind v4 Setup

```css
/* globals.css */
@custom-variant dark (&:is(.dark *));
```

Then use `dark:` prefix on any utility:
```html
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

With OKLCH semantic tokens, most components just work — they reference `bg-background`, `text-foreground`, etc. which automatically switch values when `.dark` is on `<html>`.

---

## 5. Checklist

- [ ] Background L=0.22-0.25 (not black)
- [ ] Foreground L=0.88-0.92 (not pure white)
- [ ] Muted text L=0.72-0.78 (readable)
- [ ] Borders visible (L delta >= 0.15 from background)
- [ ] Chroma reduced 30-50% from light mode
- [ ] Logo inverted or swapped for dark variant
- [ ] Cookie-based persistence (not localStorage — avoids flash)
- [ ] `suppressHydrationWarning` on `<html>`
- [ ] System preference respected and watched for changes
- [ ] Toggle accessible in all layout roots
- [ ] `prefers-color-scheme` as default for first-time visitors
- [ ] All text passes WCAG AA contrast (4.5:1 minimum, target 7:1)

---

*Extracted from: dime.ar v2.4 Dark Mode (Phase 29)*
*Date: 2026-04-12*
