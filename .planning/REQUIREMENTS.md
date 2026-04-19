# v1.2 Aesthetic Polish — Requirements

**Milestone:** v1.2 Aesthetic Polish
**Goal:** Tighten typography rhythm, interactive-element sizing, spacing cadence, member-photo proportions, and micro-interactions using ui-ux-pro-max findings + a live codebase audit. Preserve the warm-academic direction shipped in v1.0.

**Quality bar:** `pnpm build` passes · `pnpm test` green · `pnpm axe` zero violations on all 8 Spanish pages · `pnpm check-translations` clean · visual regressions reviewed in browser.

---

## v1 Requirements for This Milestone

### Typography (TYPO)

- [ ] **TYPO-01:** Add `--text-5xl` (40 px / 2.5 rem) token in `globals.css` `@theme`; documents the hero size and stops `text-5xl` from falling through to Tailwind default 48 px.
- [ ] **TYPO-02:** Soften `--text-4xl` from 32 px to 36 px so H1 ≥ 1.20 × H2 (30 → 36 = 1.20×) and the heading hierarchy on People / Research / Contact reads clearly.
- [ ] **TYPO-03:** Re-key every existing H1 usage (`font-serif text-4xl md:text-5xl` on Hero; `text-3xl`, `text-4xl` on page headings) against the new scale and ensure consistent weight (`font-weight-semibold`, 600) and letter-spacing (`-0.01em` from `@layer base`).
- [ ] **TYPO-04:** Audit body-text `text-base` / `text-sm` / `text-xs` usage across all components; consolidate inconsistent applications (e.g. nav jumping `text-base lg:text-lg` breaks sans cadence — justify or align).
- [ ] **TYPO-05:** Document the final scale + weights + line-heights in `design-system/cosmology-group-uba/MASTER.md` "Type Scale" table and mark v1.0 scale as superseded.

### Buttons & Interactive Elements (BTN)

- [ ] **BTN-01:** Every interactive element has an effective tap target ≥ 44 × 44 px (WCAG 2.5.5 AAA / iOS HIG). Visible chrome may be smaller; padding compensates (e.g. carousel dots stay 10 px but sit inside a `p-3` tap area).
- [ ] **BTN-02:** Unify every `focus-visible:ring-*` ring colour on `ring-accent-ring`. Remove the `ring-surface/70` variant used inside HeroCarousel controls; pick a contrast-safe dark-on-image alternative if needed (halo or outline offset).
- [ ] **BTN-03:** Standardise carousel controls: dots wrapper grows to 44 × 44 tap area, pause/play button bumps to `w-10 h-10` with a centred 14 × 14 glyph.
- [ ] **BTN-04:** Standardise `SourceFilter` pills: `px-3.5 py-1.5` (≥ 36 px visual height) + unified focus ring; keep current active/inactive tone logic.
- [ ] **BTN-05:** Add consistent vertical padding to `NavLink` (`py-1.5`) and match `LocaleToggle` padding so they read as a single interactive row at 44 px.
- [ ] **BTN-06:** Document the button/pill/link sizing recipes in `design-system/cosmology-group-uba/MASTER.md` "Component Specs" section.

### Spacing & Layout Density (SPACE)

- [ ] **SPACE-01:** Codify page-container widths: `max-w-5xl` for prose / single-column (Contact, PersonDetail, Journal Club), `max-w-6xl` for grids (People, Outreach, Research, Publications). Apply across all 8 page wrappers.
- [ ] **SPACE-02:** Codify vertical-rhythm scale: section `py-12`, page wrapper `py-16`, hero `py-20` when applicable. Apply consistently.
- [ ] **SPACE-03:** Audit card padding across `PersonCard` / `ResearchCard` / `OutreachCard` / `SessionRow` — document intent for `p-4` vs `p-8` delta or converge if the delta carries no meaning.
- [ ] **SPACE-04:** Document container widths + vertical rhythm in `design-system/cosmology-group-uba/MASTER.md` "Layout" subsection.

### Media Sizing (MEDIA)

- [ ] **MEDIA-01:** `PersonCard` on `/people` sized down ~35 %. Target: card caps at 240–280 px wide OR grid shifts to 4-col at `lg` so each card is ≤ 280 px. Photo remains square; aspect ratio preserved.
- [ ] **MEDIA-02:** `PersonDetail` hero photo on `/people/[slug]` reduced from 240 px to 180–200 px; typography fills recovered space proportionally.
- [ ] **MEDIA-03:** Hero carousel aspect ratio and min-height re-checked against the new scale — no visual regression at 375 / 768 / 1024 / 1440 px viewports.
- [ ] **MEDIA-04:** Outreach and home-page highlight imagery reviewed for proportion against the new grid; resize or recrop if over-dominant.
- [ ] **MEDIA-05:** `PersonCard` `sizes` attribute on `next/image` updated to match the new column width so Next.js serves the correct srcset.

### Micro-interactions & Polish (MICRO)

- [ ] **MICRO-01:** Add subtle transition on `NavLink` active-state change (`transition-colors duration-150`).
- [ ] **MICRO-02:** `SourceFilter` pill toggle crossfades tone (colour transition already has `transition-colors`; add `duration-150` if missing).
- [ ] **MICRO-03:** Optional photo zoom-on-hover on `PersonCard` (1.02 scale, 200 ms ease-out); respect `prefers-reduced-motion` via `motion-safe:`.
- [ ] **MICRO-04:** `pnpm axe` passes with zero violations across all 8 Spanish pages after the polish is applied (non-regression on WCAG AA bar).
- [ ] **MICRO-05:** All `focus-visible` rings render against both light and image backgrounds with sufficient contrast (check Hero carousel, Publications pills, People cards).

### Documentation (DOC)

- [ ] **DOC-01:** `design-system/cosmology-group-uba/MASTER.md` updated end-to-end (type scale, component specs, layout, spacing) to reflect the v1.2 adjustments.
- [ ] **DOC-02:** `design-system/cosmology-group-uba/OVERRIDES.md` (or equivalent) logs each token delta vs v1.0 with short rationale for future contributors.

**Total:** 26 requirements across 6 categories.

---

## Deferred / Future Requirements

Not in scope for v1.2 — track for a later milestone.

- **DARK-MODE** — Remains out of scope per PROJECT.md constraint (institutional aesthetic is light-mode-first).
- **ANIM-01** — Elaborate page transitions / shared-element animation between pages. Violates "no flashy animations" constraint.
- **SKELETON-01** — Loading skeletons for dynamic content. SSG site has no dynamic-load moments worth covering.
- **ACCENT-02** — Second accent colour. Single warm terracotta is locked.
- **FONT-02** — Font pair change. Source Serif 4 + Source Sans 3 locked.

---

## Out of Scope

Explicit exclusions with reasoning.

- **Visual style pivot** — Academic/warm-minimal direction is locked; polish only, do not redesign.
- **New colour tokens** — Accent / surface / ink palette unchanged; only CSS values for existing tokens may shift, and only with user approval.
- **Content edits** — No changes to copy, bios, photos, publications, or i18n message *content* beyond what sizing/alignment requires (layout-shift fixes are allowed).
- **PUBS-03 / PUBS-04 filter UI** — Remains deferred from v1.0.
- **v1.1 code-cleanup items** (orphaned accessors, dead i18n key, `publications_selected` field) — Deferred; this milestone is visual polish, not codebase hygiene.

---

## Traceability

> Filled during roadmap phase — each REQ-ID maps to exactly one phase.

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| TYPO-01..05 | 13 | TBD | Pending |
| SPACE-01..04 | 13 | TBD | Pending |
| MEDIA-01..05 | 14 | TBD | Pending |
| BTN-01..06 | 15 | TBD | Pending |
| MICRO-01..05 | 15 | TBD | Pending |
| DOC-01..02 | 15 | TBD | Pending |

---
*Last updated: 2026-04-19 — v1.2 milestone requirements defined.*
