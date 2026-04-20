# Design System — Overrides Against Raw ui-ux-pro-max Output

**Source:** `design-system/cosmology-group-uba/MASTER.md` (ui-ux-pro-max generated 2026-04-17 17:34:53)
**Reviewer:** Phase 1, Plan 01-02
**Constraints source:** `.planning/phases/01-foundation/01-CONTEXT.md`
**User decision:** `approve-overrides` (all 17 overrides accepted — 2026-04-17)

---

## Overrides Applied

### 1. `--color-primary` removed

- **Raw:** `#2563EB` (`--color-primary`)
- **Override:** Removed entirely
- **Why:** CONTEXT.md > Palette character — "Warm-academic direction (Nature / Oxford leaning) — NOT cool-institutional, NOT UBA-blue-forward." A cool-band primary blue has no role in the warm palette. Surface and ink tokens replace any structural role it might have played.

### 2. `--color-secondary` removed

- **Raw:** `#3B82F6` (`--color-secondary`)
- **Override:** Removed entirely
- **Why:** Same constraint as #1. A second cool blue is redundant and reinforces the wrong palette direction.

### 3. CTA/Accent colour

- **Raw:** `#F97316` (`--color-cta`)
- **Override:** `oklch(0.52 0.12 45)` (muted terracotta; `--color-accent`)
- **Why:** CONTEXT.md > Palette character — raw value is a saturated orange that reads tech-startup. Muted terracotta at hue 45° is within the warm band (30°–80°) and reads editorial-warm without drawing aggressive attention. Chroma reduced from ~0.20 (saturated) to 0.12 (muted). Token renamed from `--color-cta` to `--color-accent` to match the single-accent constraint.

### 4. Background — two-tier ivory replacing one flat surface

- **Raw:** `#F8FAFC` (`--color-background`) — single cool near-white
- **Override:** Primary `oklch(0.995 0.003 85)` (`--color-surface`) + alt `oklch(0.978 0.008 80)` (`--color-surface-alt`)
- **Why:** CONTEXT.md > Palette character — "Background ladder: white primary + ONE subtle alternate surface (off-white/ivory) for alternating sections and cards. No third tier." Raw value was a single cool near-white (hue ~210). Replaced with two warm ivory values (hue 80–85), satisfying both the warm-palette and two-tier constraints simultaneously.

### 5. Text colour — three-tier warm ink replacing one cool text colour

- **Raw:** `#1E293B` (`--color-text`) — single cool slate
- **Override:** Ink `oklch(0.22 0.015 60)` + Ink muted `oklch(0.48 0.012 60)` + Ink subtle `oklch(0.62 0.010 60)` (`--color-ink`, `--color-ink-muted`, `--color-ink-subtle`)
- **Why:** CONTEXT.md > Palette character and Typography pairing — editorial prose hierarchy requires multiple text levels (body, captions, meta). Raw value was a cool slate (hue ~220). All three ink values sit at hue 60 (warm near-black band) matching the ivory surfaces. The three levels (body / muted / subtle) map to primary prose, secondary text, and disabled/meta copy.

### 6. Color Notes paragraph

- **Raw:** "Editorial black + accent pink"
- **Override:** "Warm-academic: ivory surfaces, warm near-black ink, muted terracotta accent."
- **Why:** The raw description was inaccurate (no pink in the palette; the "editorial black" was a cool slate). Corrected to reflect the actual tokens and palette direction per CONTEXT.md > Palette character.

### 7. Heading font

- **Raw:** Crimson Pro
- **Override:** **Source Serif 4** (variable, SIL OFL, Google Fonts — subsets: Latin, Latin-Extended, Greek)
- **Why:** CONTEXT.md > Font delivery & subsets — "Greek subset required for Λ Ω H₀ σ₈ χ²." Crimson Pro does not ship a Greek subset on Google Fonts (cross-referenced `skills/design/ui-ux-pro-max/data/google-fonts.csv`). Source Serif 4 is a variable font with verified Greek, and matches the Nature-adjacent institutional aesthetic described in CONTEXT.md > Specific Ideas.

### 8. Body font

- **Raw:** Atkinson Hyperlegible
- **Override:** **Source Sans 3** (variable, SIL OFL, Google Fonts — subsets: Latin, Latin-Extended, Greek)
- **Why:** Same constraint as #7. Atkinson Hyperlegible does not ship Greek on Google Fonts. Source Sans 3 ships Greek and pairs cleanly with Source Serif 4 (Adobe type family siblings — shared design heritage, matched x-height). CONTEXT.md > Font delivery & subsets: "Apply to BOTH serif display and sans body families so Greek letters don't switch visual style mid-sentence."

### 9. Google Fonts URL

- **Raw:** `https://fonts.google.com/share?selection.family=Atkinson+Hyperlegible:wght@400;700|Crimson+Pro:wght@400;500;600;700`
- **Override:** `https://fonts.google.com/share?selection.family=Source+Sans+3:ital,wght@0,200..900;1,200..900|Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900`
- **Why:** Follows directly from overrides #7 and #8. Variable axis ranges used (`200..900`) rather than discrete weights to allow the full weight range with a single file. Subsets (`latin`, `latin-ext`, `greek`) are specified in `next/font/google` config (Plan 01-04), not in the URL.

### 10. CSS `@import` replaced with `next/font/google` delivery note

- **Raw:** `@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Crimson+Pro:wght@400;500;600;700&display=swap');`
- **Override:** Replaced with delivery note: fonts loaded via `next/font/google` in `src/app/fonts.ts` (Plan 01-04) — no CSS `@import`.
- **Why:** CONTEXT.md > Font delivery — "Default to `next/font/google` [...] Next auto-self-hosts at build, zero external requests in production." A CSS `@import` would bypass Next's self-hosting optimisation and expose external font requests. The `@import` is an instruction artifact not applicable to this project's delivery mechanism.

### 11. Type scale added (ratio 1.2)

- **Raw:** No type scale table in raw output.
- **Override:** Full ratio-1.2 scale added: xs=0.8125rem, sm=0.9375rem, base=1rem (lh 1.5), lg=1.125rem, xl=1.375rem, 2xl=1.625rem, 3xl=1.875rem, 4xl=2rem (H1). Serif display weight 600; sans 400/600/700.
- **Why:** CONTEXT.md > Typography pairing — "Body feel: dense and compact (15–16px, ~1.45–1.5 line-height). Display scale: restrained (ratio 1.2–1.25, H1 28–32px)." Without an explicit scale table, Plan 01-04 cannot mechanically derive CSS tokens. The scale is anchored at `1rem` base, ratio 1.2, rounded to the nearest 0.125rem step.

### 12. `--shadow-lg` removed

- **Raw:** `0 10px 15px rgba(0,0,0,0.1)` (`--shadow-lg`)
- **Override:** Removed
- **Why:** CONTEXT.md > Palette character — "No borders. Hierarchy carried by typography and whitespace alone." Heavy shadow tiers contradict the Nature long-form aesthetic and begin to substitute visually for the borders that are explicitly excluded. `--shadow-sm` and `--shadow-md` are sufficient for subtle card lift.

### 13. `--shadow-xl` removed

- **Raw:** `0 20px 25px rgba(0,0,0,0.15)` (`--shadow-xl`)
- **Override:** Removed
- **Why:** Same reasoning as #12. An xl halo shadow is a hero-splash / SaaS-landing-page pattern, explicitly anti-referenced in CONTEXT.md > Specific Ideas ("AI-generic dark-mode-first SaaS landing pages").

### 14. `.btn-secondary` border declaration removed

- **Raw:** `border: 2px solid #2563EB;` inside `.btn-secondary`
- **Override:** Border declaration removed; colour changed to accent `oklch(0.52 0.12 45)` (text only, no border)
- **Why:** CONTEXT.md > Palette character — "No borders. Hierarchy carried by typography and whitespace alone." A solid-border ghost button reads button-chrome-heavy and uses the cool blue that has been retired. Secondary button style is achieved through text colour alone; hover/focus states via `box-shadow` focus ring.

### 15. `.input` border declarations removed

- **Raw:** `border: 1px solid #E2E8F0;` and `:focus { border-color: #2563EB; }` inside `.input`
- **Override:** Both border declarations removed; replaced with `background: oklch(0.978 0.008 80)` for resting state and `box-shadow: 0 0 0 3px oklch(0.52 0.12 45 / 0.20)` for focus ring
- **Why:** Same constraint as #14. `border-color` also referenced the retired cool blue. Focus feedback is preserved via the warm terracotta focus ring at 20% opacity.

### 16. Style category (top-line)

- **Raw:** "Data-Dense Dashboard"
- **Override:** "Warm-Academic Institutional"
- **Why:** "Data-Dense Dashboard" describes a business intelligence product, not an academic research group portal. The category drives downstream component suggestions; mislabelling it would pull future plans in the wrong direction. CONTEXT.md > Domain: "A credible, professional academic presence."

### 17. Hex values converted to OKLCH

- **Raw:** All palette entries expressed as hex (`#2563EB`, `#F97316`, `#F8FAFC`, `#1E293B`, etc.)
- **Override:** All retained colour values expressed as `oklch(L C H)` triples
- **Why:** CONTEXT.md > Phase 1 boundary: "Locked design system from `ui-ux-pro-max` materialised as OKLCH tokens in `globals.css`." Project convention: Tailwind v4 with OKLCH design tokens. Hex values would require conversion downstream in Plan 01-04 — doing it once here eliminates an error-prone manual step. All component CSS blocks updated in parallel.

---

## No Override Needed

The following raw output fields were already acceptable and required no change:

- **Spacing tokens** (`--space-xs` through `--space-3xl`) — values are unit-based, palette-neutral; retained as-is.
- **Border-radius on components** (`border-radius: 8px`, `12px`, `16px`) — restrained, non-token radii; acceptable for a warm-academic feel.
- **Transition timing** (`200ms ease`) — within the 150–300ms guidance; no change needed.
- **Pre-delivery checklist** — retained with two additional items (Greek verification, no border declarations).
- **Anti-patterns list** — retained and extended with warm-academic-specific anti-patterns.

---

## Ratified By

- Plan 01-02 Task 2 checkpoint (2026-04-17)
- Accepted by user: `approve-overrides` (all 17 proposed overrides)

---

## v1.2 Overrides (Phases 13–15)

| Token / Component | v1.0 | v1.2 | Rationale |
|-------------------|------|------|-----------|
| `--text-4xl` | `2rem` (32 px) | `2.25rem` (36 px) | Inner-page H1 ≥1.2× above H2 (Phase 13-01) |
| `--text-5xl` | (n/a) | `2.5rem` (40 px) | Hero H1 cap; HomePage only (Phase 13-01) |
| `--color-ink-subtle` | `oklch(0.62 0.010 60)` | `oklch(0.45 0.012 60)` | WCAG AA 4.5:1 contrast on warm-cream (Phase 6-03) |
| Container widths | ad-hoc | max-w-3xl/5xl/6xl tiers | SPACE-01 layout rhythm (Phase 13-02) |
| Vertical rhythm | mixed | py-12 / py-16 / py-20 tiers | SPACE-02 (Phase 13-02) |
| Card padding | mixed | p-4 dense / p-6 spacious | SPACE-03 two-tier (Phase 13-03) |
| PersonCard width | flex-fill | max-w-[240px] w-full mx-auto | MEDIA-01 240 px cap (Phase 14-01) |
| PersonDetail hero | uncapped | 180 px × 225 px (4:5 portrait) | MEDIA-02 hero resize (Phase 14-02) |
| HeroCarousel pause/play focus ring | `ring-surface/70` | `ring-accent-ring + ring-offset-2 ring-offset-black/40` | BTN-02 unification + image-bg contrast (Phase 15-01) |
| HeroCarousel pause/play tap target | `w-6 h-6` (24×24) | `w-11 h-11` (44×44) | BTN-03 ≥44 (Phase 15-01) |
| HeroCarousel dot tap target | `w-2.5 h-2.5` + `gap-2` (~18 px center-to-center) | 10×10 visible inside `p-[17px]` button + `gap-0` (44 px center-to-center) | BTN-03 padding-inside pattern (Phase 15-01) |
| MobileNav trigger / close | `w-10 h-10` (40×40) | `w-11 h-11` (44×44) | BTN-01 sweep (Phase 15-02) |
| NavLink hit row | (no padding) | `py-1.5` + explicit `transition-colors duration-150` | BTN-05 + MICRO-01 (Phase 15-02) |
| LocaleToggle hit row | `px-2 py-1` | `px-2 py-1.5` | BTN-05 (Phase 15-02) |
| SourceFilter pill | `px-3 py-1` (~30 px) + no transition | `px-3.5 py-1.5` (~36 px) + `transition-colors duration-150` | BTN-04 + MICRO-02 (Phase 15-03) |
| PersonCard photo hover | (no transform on image) | `motion-safe:scale-[1.02] duration-200 group-hover` | MICRO-03 (Phase 15-04) |
| Focus ring offset | (no offset utility used) | `ring-offset-2 ring-offset-{surface\|black/40}` everywhere | MICRO-05 macOS-style halo (Phase 15-01..05) |

**Inline-text link exemption:** WCAG 2.5.5 AAA inline-text exception applied to PartnerStrip, OutreachCard learn-more, SiteFooter EmailLink, ContactDetails social, SessionRow paper-link, PublicationEntry arXiv/DOI links, and PublicationEntry source-pill metadata chips. These deliberately do NOT receive 44×44 padding (per Phase 15 planner decision, RESEARCH open-question #1 + #3).

**Drift gate:** `.github/workflows/lint-rings.yml` runs `grep -EnP 'focus-visible:ring-(?!2($|\s|"|'"'"'|/|\\)|accent-ring|offset-)' src/` on push/PR to prevent reintroduction of stray ring colors.
