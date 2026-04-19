# v1.2 Aesthetic Polish — Research Summary

**Approach:** This milestone used the project-native ui-ux-pro-max consultation tool (`skills/design/ui-ux-pro-max/scripts/search.py`) across 5 queries + a direct audit of the current codebase instead of the 4 generic `gsd-project-researcher` agents. Raw consultation outputs in `.planning/research/UIUX-*.md`.

Guardrail: **do not redesign.** Warm-academic direction is locked. Polish typography rhythm, button consistency, spacing density, media sizing, and micro-interactions within the existing `design-system/cosmology-group-uba/MASTER.md` token set.

## ui-ux-pro-max highlights (filtered to our context)

**Typography** (UIUX-TYPOGRAPHY.md Result 2 — Academic/Research)
- Serif-heading + accessible-sans body is the canonical academic stack — we're already there with Source Serif 4 + Source Sans 3.
- Greek subset on both families already shipped (v1.0).
- **Gap:** our 1.2 type-scale compresses at the top (26 → 30 → 32 = 1.15× then 1.07×), which flattens H1 vs H2. Add `text-5xl` token or soften H1 to restore heading pop without breaking density.

**Interactive elements** (UIUX-INTERACTIVE.md + MICRO.md)
- Visible focus rings are non-negotiable — we have them, but they're inconsistent (`accent-ring` vs `surface/70`).
- Active state for current nav (`text-accent font-semibold`) is correct; some pages miss hover on clickable rows.
- **Touch-target minimum: 44 × 44 px** — carousel dots at 10 × 10 fail this, pause button at 24 × 24 fails, filter pills at ~28 px height fail.
- Loading-state feedback: SourceFilter has no skeleton; LocaleToggle uses `aria-busy` + opacity dim (correct); no other long-op signals exist (acceptable given SSG).

**Spacing / density** (UIUX-SPACING.md Result 3 — Swiss Modernism 2.0)
- 8 px base unit + mathematical ratios — matches our `--spacing: 0.25rem` (4 px step) and spacing scale (4/8/16/24/32/48/64).
- Vertical rhythm (consistent baseline, predictable section spacing) > ornament. Our design system captures this but isn't rigorously applied: `py-12` here, `py-16` there, `max-w-5xl` vs `max-w-6xl` inconsistent.

**Micro-interactions** (UIUX-MICRO.md)
- Hover (desktop) + active (touch) are both necessary; don't rely on hover alone.
- Focus ring + active state are the two most important polish items — both present but inconsistent.
- Loading skeleton only matters for dynamic content; our SSG pages mostly don't need it.

**Media** (UIUX-PHOTOS.md — generic, less directly applicable)
- Institutional directories typically use **160–240 px** headshots. Our `PersonCard` with `aspect-square` in a 3-col `max-w-6xl` grid renders at **~340–420 px** per card — roughly **2× too big** for institutional directory density.

## Codebase audit — specific polish targets

### Typography inconsistencies

| Token | px | Usage | Observed issue |
|-------|----|----|----------------|
| `text-xs` | 13 | Captions, meta | OK |
| `text-sm` | 15 | UI labels, secondary body | OK, but near-identical to base — minor signal-loss |
| `text-base` | 16 | Body prose | OK |
| `text-lg` | 18 | Lead paragraph | Used inconsistently — nav/toggle use `text-base lg:text-lg` which jumps sans cadence |
| `text-xl` | 22 | H4 (sans semibold) | Rarely used |
| `text-2xl` | 26 | H3 | OK |
| `text-3xl` | 30 | H2 | OK |
| `text-4xl` | 32 | H1 | **Too close to H2 (30 → 32 = 1.07×)** — heading hierarchy reads weak on People / Research / Contact |
| (missing) | — | Hero | `text-5xl` at the hero falls through to Tailwind default **48 px** since no `--text-5xl` token exists — undocumented drift |

**Fix direction:** Add `--text-5xl` (40 px) token; soften `--text-4xl` to 36 px so H1 ≥ 1.2× H2 (36 / 30 = 1.20).

### Member photo sizing (user-flagged)

- **`/people`:** `PersonCard` uses full-column `aspect-square` → ~340–420 px. Target: **max 240 px card width** (or 200 px photo + surrounding card). Constrain grid max-width or bump to 4-col at lg+.
- **`/people/[slug]`:** hero photo at 240 px — slightly large for institutional convention. Target: **180–200 px**.

### Button / interactive consistency

| Element | Current | Target |
|---------|---------|--------|
| Nav links | `text-base lg:text-lg`, no padding | Add `py-1.5` for 44 px tap row |
| Locale toggle | `text-base lg:text-lg px-2 py-1` | Match nav padding |
| SourceFilter pills | `px-3 py-1 text-sm` | `px-3.5 py-1.5` (≥ 36 px tap target) |
| Carousel dots | `w-2.5 h-2.5` (10 px) | Keep visual 10 px but add invisible 44 × 44 tap area (`p-3` with transparent bg) |
| Carousel pause | `w-6 h-6` | Bump to `w-10 h-10` with centred 14 × 14 glyph |
| Focus ring colour | Mix of `accent-ring` / `surface/70` | Unify on `accent-ring` for all light-surface contexts |

### Spacing rhythm

- **Page container widths inconsistent:** `max-w-5xl` (PersonDetail, Contact, SiteHeader inner) vs `max-w-6xl` (PeopleSection, OutreachGrid, ResearchGrid). Standardise: **`max-w-5xl` for prose/single-column, `max-w-6xl` for grids**.
- **Vertical section rhythm:** `py-12` (sections) vs `py-16` (page wrappers) vs custom hero padding — codify a 4-step rhythm (section `py-12`, page wrapper `py-16`, hero `py-20`, hero-with-nav `py-24`).
- **Card padding:** `p-4` (PersonCard body), `p-8` (ResearchCard) — the 2× delta is fine, document the intent.

### Micro-interactions

- Focus ring unified (above).
- Hover for all `<a>` links already in place.
- **Missing:** subtle transition on nav active-state change; pill toggle crossfade; optional photo zoom-on-hover (1.02 scale).
- **Keep deferred:** elaborate page transitions, shared-element animation — violate "no flashy animations" constraint.

## Out of scope for v1.2

- Dark mode (explicit scope boundary in PROJECT.md)
- New fonts / changing Source Serif 4 or Source Sans 3
- Visual style pivot (academic direction stays)
- Adding accent colour(s) — single warm terracotta locked in v1.0
- Loading skeletons for SSG content (no need)
- Page transitions / shared-element animation
- Dropping axe-core 0-violations acceptance bar

## Five key decisions surfaced during research

1. **Add `--text-5xl` token (40 px) + bump `--text-4xl` to 36 px** — closes the 30 → 32 H1/H2 gap and documents the hero size.
2. **Standardise page container widths** — `max-w-5xl` for prose, `max-w-6xl` for grids, documented in MASTER.md.
3. **Constrain `PersonCard` grid** — max card width or 4-col at lg to reduce photo size ~35 %.
4. **Touch-target enforcement** — every interactive element ≥ 44 × 44 px effective tap area (visible may be smaller with padding).
5. **Focus-ring unification** — every `focus-visible:ring-*` uses `ring-accent-ring`.

---
*Generated: 2026-04-19 from `.planning/research/UIUX-*.md` + live codebase audit*
