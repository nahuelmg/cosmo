# Phase 13: Design Tokens & Layout Rhythm - Research

**Researched:** 2026-04-19
**Domain:** Tailwind v4 CSS-first design tokens, typography scale, layout rhythm
**Confidence:** HIGH (all findings based on direct codebase inspection + known Tailwind v4 behaviour)

---

## Summary

Phase 13 is almost entirely mechanical: the design decisions are locked in CONTEXT.md and the codebase is well-understood. Research concentrated on enumerating every file to touch, recording exact current values vs. target values, and flagging genuine gotchas.

The standard approach for Tailwind v4 token overrides is simple: add/change values inside the existing `@theme` block in `globals.css`. No extra config, no `tailwind.config.*` file needed. Tailwind v4 reads `--text-*` CSS custom properties directly and generates the corresponding `text-*` utility classes. Adding `--text-5xl` is one line; bumping `--text-4xl` from `2rem` to `2.25rem` is a value change.

The biggest real risk is the `text-4xl` fallback-initial placeholder in `PersonCard.tsx` — it renders initials text in the avatar placeholder at `text-4xl`. Bumping that token from 32 px to 36 px is cosmetically fine (avatar is fixed aspect-square; initials just get slightly larger). No functional breakage.

**Primary recommendation:** Update `globals.css` tokens first, then sweep H1 classes → container widths → card padding → nav sizes → MASTER.md documentation, in that order.

---

## Standard Stack

No new libraries needed. This phase touches only:
- `globals.css` (`@theme` block)
- Page-level `.tsx` files (8 pages)
- Component `.tsx` files (6 components)
- `design-system/cosmology-group-uba/MASTER.md`

### Tailwind v4 `@theme` Token Mechanics (HIGH confidence — direct inspection of working codebase)

In Tailwind v4 (CSS-first, `@import "tailwindcss"`), the `@theme` block is where all design tokens live. The project already follows this pattern correctly. The rules:

- `--text-{size}` custom properties in `@theme` map 1:1 to `text-{size}` utility classes.
- Overriding an existing token is just changing its value in `@theme`. No config elsewhere.
- Adding a new token (e.g., `--text-5xl`) is just one new line. Tailwind v4 automatically generates the `text-5xl` utility class from it.
- The `@theme inline` block at the top (fonts) is separate and must stay as-is (it's for `next/font` CSS var injection, not design tokens).
- Line-heights can be set per-size with `--text-{size}--line-height` (e.g., `--text-base--line-height: 1.5` already exists).

**Current globals.css `@theme` state:**
```
--text-xs:   0.8125rem   (keep)
--text-sm:   0.9375rem   (keep)
--text-base: 1rem         (keep)
--text-lg:   1.125rem    (keep)
--text-xl:   1.375rem    (keep)
--text-2xl:  1.625rem    (keep)
--text-3xl:  1.875rem    (keep)
--text-4xl:  2rem         ← CHANGE to 2.25rem (36 px)
(--text-5xl: missing)     ← ADD 2.5rem (40 px)
```

**Two-line diff in globals.css:**
```css
--text-4xl:  2.25rem;   /* was 2rem; H1 pages */
--text-5xl:  2.5rem;    /* new; hero H1 only  */
```

---

## Architecture Patterns

### Recommended Order of Operations

1. **globals.css first** — update `--text-4xl` and add `--text-5xl`. Everything else depends on this being in place.
2. **H1 class migration** — change `text-4xl → text-3xl md:text-4xl` on inner pages; bump `HeroCarousel` to `text-4xl md:text-5xl`.
3. **Container widths** — sweep `max-w-4xl → max-w-5xl` on prose pages; confirm grids already at `max-w-6xl`.
4. **Vertical rhythm** — standardise `py-12` / `py-16` / `py-20` across all wrappers.
5. **Card padding** — ResearchCard `p-8 → p-6`; verify PersonCard `p-4` and OutreachCard `p-6` stay.
6. **Nav sizing** — remove `lg:text-lg` from NavLink call in SiteHeader; remove `lg:text-lg` from LocaleToggle inline classes.
7. **MASTER.md** — document final scale + layout in Type Scale table and new Layout subsection.

### Anti-Patterns to Avoid

- **Don't add `--text-5xl--line-height`** unless needed — the `@layer base` heading rule (`leading-tight` for display sizes) will handle it once added.
- **Don't add new CSS custom properties for card padding or container widths** — CONTEXT.md explicitly says Tailwind classes + MASTER.md docs only; no new CSS vars beyond `--text-5xl`.
- **Don't use `text-[36px]` arbitrary values** — the token update makes `text-4xl` correct; use the token.

---

## Files to Touch — Complete Enumeration

### 1. globals.css — TYPO-01 + TYPO-02
**Path:** `/home/tomas/Projects/cosmo/src/app/globals.css`
**Change:** Two lines in `@theme` block (lines 36-37).
- Line 36: `--text-4xl: 2rem;` → `--text-4xl: 2.25rem;`
- After line 36: add `--text-5xl: 2.5rem;`
- Optionally add `@layer base` rules for `leading-tight` on display headings (CONTEXT.md decision).

**Current `@layer base`:**
```css
@layer base {
  h1, h2, h3, h4 {
    font-family: var(--font-serif);
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--color-ink);
  }
}
```
Adding `leading-tight` for display headings (text-3xl+) can be done here or left to utility classes case-by-case (per CONTEXT.md — Claude's discretion).

---

### 2. H1 Elements — TYPO-03

**All H1 occurrences:**

| File | Current | Target |
|------|---------|--------|
| `src/app/[locale]/journal-club/page.tsx:57` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` |
| `src/app/[locale]/contact/page.tsx:46` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` |
| `src/app/[locale]/research/page.tsx:43` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` |
| `src/app/[locale]/people/page.tsx:41` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` |
| `src/app/[locale]/publications/page.tsx:68` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` |
| `src/app/[locale]/outreach/page.tsx:36` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` |
| `src/components/people/PersonDetail.tsx:103` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` |
| `src/components/home/HeroCarousel.tsx:145` | `font-bold text-4xl md:text-5xl` | `font-bold text-4xl md:text-5xl` (already correct — keep as-is; token values shift up) |

**Note on `tracking-tight`:** Current H1s use `tracking-tight` explicitly. The `@layer base` rule already sets `letter-spacing: -0.01em` on all headings. The Tailwind `tracking-tight` utility adds `-0.025em`. Since CONTEXT.md says "leave letter-spacing as-is (`-0.01em` on headings via `@layer base`)," the explicit `tracking-tight` on H1s should be removed (let `@layer base` handle it). This is a small cleanup that harmonises with the decision — flag it as a judgment call for the planner.

**Not a true H1 — watch out:** `src/components/people/PersonCard.tsx:29` uses `text-4xl` for the avatar initials placeholder div (`aria-hidden="true"`). This is NOT an H1 — it's decorative text inside a `div`. The token bump from 32px to 36px just makes the placeholder initials slightly larger. No functional issue; no class change needed.

---

### 3. Container Widths — SPACE-01

**Page wrappers requiring width changes:**

| File | Element | Current | Target | Change needed? |
|------|---------|---------|--------|---------------|
| `src/app/[locale]/journal-club/page.tsx:55` | `<section>` | `max-w-4xl` | `max-w-5xl` | YES |
| `src/app/[locale]/contact/page.tsx:44` | `<section>` | `max-w-4xl` | `max-w-5xl` | YES |
| `src/app/[locale]/publications/page.tsx:66` | `<section>` | `max-w-4xl` | `max-w-5xl` | YES |
| `src/components/people/PeoplePlainSection.tsx:30` | `<section>` | `max-w-4xl` | `max-w-5xl` | YES |
| `src/app/[locale]/research/page.tsx:41` | `<section>` | `max-w-5xl` | `max-w-5xl` | Already correct |
| `src/app/[locale]/outreach/page.tsx:34` | `<section>` | `max-w-6xl` | `max-w-6xl` | Already correct |
| `src/components/people/PeopleSection.tsx:22` | `<section>` | `max-w-6xl` | `max-w-6xl` | Already correct |
| `src/app/[locale]/people/page.tsx:40` | `<header>` | `max-w-6xl` | `max-w-6xl` | Already correct |
| `src/components/people/PersonDetail.tsx:68` | `<article>` | `max-w-5xl` | `max-w-5xl` | Already correct |

**HomePage:** No single outer wrapper exists. Structure is three separate components rendered sequentially:
1. `<HeroCarousel>` — full-width (implicit, no wrapper in page.tsx) — per CONTEXT.md stays inside wrapper; HeroCarousel renders its own full-bleed div internally.
2. `<section className="mx-auto max-w-3xl ...">` (intro text) — per CONTEXT.md this is a "prose section"; target is `max-w-3xl` inner, which it already uses.
3. `<Highlights>` — `max-w-6xl` (already correct).
4. `<PartnerStrip>` — `max-w-6xl` (already correct).

HomePage requires no container width changes.

**SPACE-01 verdict: 4 files need `max-w-4xl → max-w-5xl` changes.**

---

### 4. Vertical Rhythm — SPACE-02

All page wrappers already use `py-16`. Sections inside pages use `py-12`. No `py-20` exists currently (hero rhythm via HeroCarousel internal padding `p-8 md:p-12` — this is not a `py-20` wrapper). CONTEXT.md codifies: section `py-12`, page wrapper `py-16`, hero `py-20`.

**Current state:**
- All top-level page `<section>` wrappers: `py-16` — correct.
- Sub-sections inside journal-club, etc.: `mt-12` (not `py-12`) — these are `<section>` elements within the page section, not standalone wrappers, so `mt-*` spacing is appropriate.
- `PeopleSection` and `PeoplePlainSection`: `py-12` — correct.

**Hero:** The `HeroCarousel` component's overlay div uses `p-8 md:p-12`. There is no standalone `py-20` hero wrapper in page.tsx. SPACE-02 targets `py-20` for the hero. But HeroCarousel is full-bleed with internal padding — a page-level `py-20` wrapper doesn't apply here. This is NOT a structural gap; the hero's vertical breathing comes from the carousel height (820px images) and the overlay padding. No action needed for SPACE-02 on hero unless explicitly adding a wrapper.

**SPACE-02 verdict:** Current rhythm is already compliant. Verify during the audit pass; document in MASTER.md.

---

### 5. Card Padding — SPACE-03

| Component | File | Current | Target | Change needed? |
|-----------|------|---------|--------|---------------|
| `PersonCard` | `src/components/people/PersonCard.tsx:39` | `p-4` | `p-4` (dense) | No change |
| `ResearchCard` | `src/components/research/ResearchCard.tsx:21` | `p-8` | `p-6` (spacious) | YES: `p-8 → p-6` |
| `OutreachCard` | `src/components/outreach/OutreachCard.tsx:36` | `p-6` | `p-6` (spacious) | No change |
| `SessionRow` | `src/components/journal-club/SessionRow.tsx:29` | `py-5` | `py-5` (dense, row-based) | No change — row uses `py-*` not `p-*`; `p-4` tier equivalent |

**SPACE-03 verdict: 1 file needs change** — ResearchCard `p-8 → p-6`.

---

### 6. Nav Sizing — TYPO-04

Two locations use `text-base lg:text-lg` that must become `text-sm`:

| File | Location | Current | Target |
|------|---------|---------|--------|
| `src/components/layout/SiteHeader.tsx:94` | `<NavLink>` className prop | `text-base lg:text-lg` | `text-sm` |
| `src/components/layout/LocaleToggle.tsx:96` | button className | `text-base lg:text-lg font-semibold tracking-wide` | `text-sm font-semibold tracking-wide` |

**MobileNav** also has `text-base` in two places (lines 128, 148). These are mobile nav links and locale toggle in the drawer. CONTEXT.md targets `text-sm` across all breakpoints for nav. Mobile nav should follow the same rule for visual consistency.

| File | Line | Current | Target |
|------|------|---------|--------|
| `src/components/layout/MobileNav.tsx:128` | NavLink className | `text-base py-3 px-2 rounded` | `text-sm py-3 px-2 rounded` |
| `src/components/layout/MobileNav.tsx:148` | LocaleToggle className | `w-full text-left px-2 py-3 text-base` | `w-full text-left px-2 py-3 text-sm` |

**TYPO-04 verdict: 4 occurrences across 3 files.**

---

### 7. MASTER.md — TYPO-05 + SPACE-04

**Path:** `/home/tomas/Projects/cosmo/design-system/cosmology-group-uba/MASTER.md`

Current "Type Scale" table stops at `--text-4xl: 2rem / 32px / H1`. Needs:
- `--text-4xl` row updated to `2.25rem / 36px`
- New `--text-5xl` row added: `2.5rem / 40px / Hero H1 (HomePage only)`
- Note that v1.0 scale is superseded.

Current document has no "Layout" subsection. Needs new section added with:
- Container widths: `max-w-5xl` (prose), `max-w-6xl` (grids), `max-w-3xl` (inline prose blocks)
- Vertical rhythm: section `py-12`, page wrapper `py-16`, hero `py-20`
- Card padding: dense `p-4`, spacious `p-6`

---

## Common Pitfalls

### Pitfall 1: `text-4xl` usage in PersonCard avatar placeholder
**What goes wrong:** `PersonCard.tsx:29` uses `text-4xl` for the initials fallback `div`. This is purely visual/decorative. After the token bump (32px → 36px), initials will render slightly larger. No layout breakage, no H1 semantic confusion.
**How to avoid:** Do NOT change this class. The avatar `div` is `aspect-square` and flex-centered; the size increase is cosmetically fine.
**Warning sign:** If someone searches `text-4xl` to find "all H1 usage," they will hit this. Document it in the plan — it is not an H1 and should not get responsive classes.

### Pitfall 2: HeroCarousel H1 already has `md:text-5xl`
**What goes wrong:** `HeroCarousel.tsx:145` currently reads `text-4xl md:text-5xl`. After the token change, `text-4xl` will resolve to 36px and `md:text-5xl` to 40px. This is exactly right — no class change needed, just the token update achieves the desired result.
**How to avoid:** Do NOT change HeroCarousel's heading classes — they are already correct. Only the token values in `globals.css` change.

### Pitfall 3: `tracking-tight` duplication with `@layer base`
**What goes wrong:** All H1 elements currently use `tracking-tight` explicitly in their className. The `@layer base` rule already sets `letter-spacing: -0.01em` on all headings. Tailwind's `tracking-tight` = `-0.025em` (tighter than the base rule). If you remove `tracking-tight` from H1 classes, letter-spacing shifts from `-0.025em` to `-0.01em`. CONTEXT.md says "leave letter-spacing as-is (`-0.01em`)," which implies removing the conflicting `tracking-tight` utility. This is intentional — but the planner should flag it as a conscious choice, not an oversight.
**How to avoid:** When updating H1 classes, remove `tracking-tight` (let `@layer base` govern it). If visual review shows headings look looser, re-add `tracking-tight` case-by-case.

### Pitfall 4: `PeoplePlainSection` — prose page with `max-w-4xl`
**What goes wrong:** `PeoplePlainSection` renders "undergrad" and "past" people as plain rows. Its wrapper is `max-w-4xl`. It appears within the People page, which has a `max-w-6xl` header. The mismatch (6xl header, 4xl plain sections) is intentional prose vs. grid, but after SPACE-01 the plain sections should be `max-w-5xl` (prose) while `PeopleSection` stays `max-w-6xl` (grid). Confirm this asymmetry is intentional and correct per SPACE-01 rule.
**Verdict:** Yes, intentional. PeoplePlainSection = prose rows → `max-w-5xl`. PeopleSection = card grid → `max-w-6xl`. The People page header `<header>` also uses `max-w-6xl` (matches grid sections). This is correct.

### Pitfall 5: `@layer base` heading leading-tight application
**What goes wrong:** CONTEXT.md decides to add `leading-tight` for display headings (text-3xl+) via `@layer base`. If added to the existing `h1, h2, h3, h4` rule, it would apply `leading-tight` to ALL headings including H2/H3 at smaller sizes. The token-size boundary (text-3xl+) doesn't align neatly with heading levels because H3s use `text-2xl`. The safer approach: add `leading-tight` only to H1 elements in `@layer base`, and leave H2/H3 to Tailwind defaults.
**How to avoid:** Either narrow the `@layer base` rule to `h1` only for `leading-tight`, or add it as a Tailwind utility on each H1 class individually. The per-class approach is explicit and avoids unintended cascade.

### Pitfall 6: Research page container mismatch
**What goes wrong:** Research page is `max-w-5xl` (prose) — already correct per SPACE-01 — but it renders a `ResearchGrid` with cards inside that `max-w-5xl` wrapper. The grid itself is not a separate wrapper; cards flow inside the prose container. This is fine at `max-w-5xl`; no change needed. But if someone interprets Research as a "grid" page requiring `max-w-6xl`, they'd break the current layout.
**How to avoid:** Research page = `max-w-5xl` (it has a prose header with an H1 and intro paragraph; the grid is secondary content). SPACE-01 already lists it as `max-w-6xl` in the requirements but the current code is `max-w-5xl` — VERIFY against CONTEXT.md. CONTEXT.md says "Research" is in the grids group (`max-w-6xl`). So this IS a change: `max-w-5xl → max-w-6xl` for research/page.tsx. Add to the change list.

**Updated container width table:**

| File | Current | Target | Change? |
|------|---------|--------|---------|
| `journal-club/page.tsx` | `max-w-4xl` | `max-w-5xl` | YES |
| `contact/page.tsx` | `max-w-4xl` | `max-w-5xl` | YES |
| `publications/page.tsx` | `max-w-4xl` | `max-w-5xl` | YES |
| `people/PeoplePlainSection.tsx` | `max-w-4xl` | `max-w-5xl` | YES |
| `research/page.tsx` | `max-w-5xl` | `max-w-6xl` | YES (grid) |
| `outreach/page.tsx` | `max-w-6xl` | `max-w-6xl` | Already correct |
| `people/PeopleSection.tsx` | `max-w-6xl` | `max-w-6xl` | Already correct |
| `people/page.tsx` (header) | `max-w-6xl` | `max-w-6xl` | Already correct |
| `people/PersonDetail.tsx` | `max-w-5xl` | `max-w-5xl` | Already correct |

**5 files need container changes (not 4 as initially counted).**

---

## Code Examples

### Adding `--text-5xl` and updating `--text-4xl` in globals.css
```css
/* in @theme block, after --text-3xl */
--text-4xl:  2.25rem;   /* 36px — H1 on inner pages; was 2rem/32px */
--text-5xl:  2.5rem;    /* 40px — hero H1 (HeroCarousel) only */
```
No other config needed. `text-4xl` and `text-5xl` utility classes are automatically generated.

### Responsive H1 on inner pages (after token update)
```tsx
<h1 className="font-serif text-3xl md:text-4xl font-semibold">
  {t('title')}
</h1>
```
At 375px: 30px (text-3xl = 1.875rem). At 768px+: 36px (text-4xl = 2.25rem after token update).

### HeroCarousel H1 — no change required
```tsx
{/* text-4xl = 36px on mobile, md:text-5xl = 40px on desktop — correct after token update */}
<h1 className="font-serif font-bold text-4xl md:text-5xl text-stone-200 ...">
```

### Nav link size change (SiteHeader.tsx)
```tsx
{/* Before */}
<NavLink key={item.href} href={item.href} className="text-base lg:text-lg">
{/* After */}
<NavLink key={item.href} href={item.href} className="text-sm">
```

---

## Verification Approach

### Post-change grep checks
```bash
# Confirm no stray max-w-4xl in pages
grep -rn "max-w-4xl" src/app/ src/components/

# Confirm no text-5xl outside globals.css and HeroCarousel
grep -rn "text-5xl" src/app/ src/components/

# Confirm no text-base lg:text-lg in nav
grep -rn "text-base lg:text-lg\|lg:text-lg" src/components/layout/

# Confirm all H1 have responsive classes
grep -n "text-4xl" src/app/[locale]/*/page.tsx src/components/people/PersonDetail.tsx
# Expected: none (all replaced with text-3xl md:text-4xl)
# Exception: HeroCarousel (but that's in components/, not pages/; it's correct)
```

### Visual verification routes
- **375px (mobile):** `/` (hero `text-4xl`=36px), `/people` (H1 `text-3xl`=30px), `/research`, `/contact`
- **768px (tablet):** `/people` (H1 `text-4xl`=36px, confirm heading hierarchy), `/publications`
- **1024px (desktop):** All pages — confirm nav is `text-sm` (no jump from `text-base` to `text-lg`)
- **1440px:** `/` (hero `text-5xl`=40px), `/people` (card grid at `max-w-6xl`)

### Build verification
```bash
pnpm build          # must pass — TypeScript strict + Next.js build
pnpm typecheck      # if separate script exists
```

---

## State of the Art

| Old (v1.0) | New (v1.2) | Impact |
|------------|------------|--------|
| `--text-4xl: 2rem` (32px) | `--text-4xl: 2.25rem` (36px) | H1 pages read bigger, better hierarchy over H2 at 30px |
| No `--text-5xl` token (fell to Tailwind default 48px) | `--text-5xl: 2.5rem` (40px) | Hero H1 controlled at 40px; was visually oversized at 48px on desktop |
| Nav `text-base lg:text-lg` | Nav `text-sm` flat | Removes jarring lg-breakpoint jump; nav reads as secondary chrome |
| Mixed card padding `p-4/p-6/p-8` | Two-tier: dense `p-4`, spacious `p-6` | Consistent rhythm; ResearchCard drops from `p-8` |
| Mixed container widths (`max-w-3xl/4xl/5xl/6xl`) | Codified: prose `max-w-5xl`, grids `max-w-6xl` | Predictable layout grid |

---

## Open Questions

1. **`leading-tight` in `@layer base` vs. per-element**
   - What we know: CONTEXT.md decided "display headings (text-3xl+) → `leading-tight` via `@layer base`."
   - What's unclear: Which heading levels should the `@layer base` rule target? A blanket `h1, h2, h3` rule applying `leading-tight` would affect H3 elements which render at `text-2xl` (below the text-3xl threshold).
   - Recommendation: Apply `leading-tight` only to `h1` in `@layer base`; add it as a utility class on specific H2s that render at `text-3xl` (PeopleSection, JournalClub archive headers, etc.) rather than targeting by HTML element.

2. **Research page `max-w-5xl → max-w-6xl`**
   - What we know: SPACE-01 lists Research in the "grids" group (`max-w-6xl`). Current code is `max-w-5xl`.
   - What's unclear: Research page has a prose `<header>` with H1 + intro paragraph at the top, then a card grid below — all in one `<section>` wrapper. Widening to `max-w-6xl` means the prose header also spans 6xl width.
   - Recommendation: Change to `max-w-6xl` to comply with SPACE-01. The prose header at 6xl width with left-aligned text is standard for academic editorial pages. Acceptable tradeoff.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `/home/tomas/Projects/cosmo/src/` (all files above)
- `/home/tomas/Projects/cosmo/src/app/globals.css` — current `@theme` state
- `/home/tomas/Projects/cosmo/design-system/cosmology-group-uba/MASTER.md` — current type scale
- `/home/tomas/Projects/cosmo/.planning/phases/13-design-tokens-layout-rhythm/13-CONTEXT.md` — locked decisions

---

## Metadata

**Confidence breakdown:**
- Token mechanics (Tailwind v4 `@theme`): HIGH — working codebase demonstrates the pattern
- Files to touch: HIGH — exhaustive grep + manual inspection
- Container width targets: HIGH — requirements are explicit in CONTEXT.md
- `leading-tight` approach: MEDIUM — CONTEXT.md decision is locked but implementation detail (h1 only vs. h1-h2-h3) left to Claude's discretion

**Research date:** 2026-04-19
**Valid until:** Stable — Tailwind v4 CSS-first `@theme` API is stable; no expiry concern.
