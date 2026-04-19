---
phase: 13-design-tokens-layout-rhythm
verified: 2026-04-19T22:32:57Z
status: passed
score: 9/9 must-haves verified
---

# Phase 13: Design Tokens + Layout Rhythm — Verification Report

**Phase Goal:** The type scale, page-container widths, and vertical rhythm reflect the audited polish targets — `text-5xl` token exists, `text-4xl` bumped to 36 px, page widths standardised, vertical spacing codified. All other v1.2 phases depend on these tokens.

**Verified:** 2026-04-19T22:32:57Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `--text-5xl` token defined at 2.5rem/40px | VERIFIED | `globals.css` line 37: `--text-5xl: 2.5rem;  /* 40px — hero H1 */` |
| 2 | `--text-4xl` token at 2.25rem/36px | VERIFIED | `globals.css` line 36: `--text-4xl: 2.25rem; /* 36px — inner page H1s */` |
| 3 | 7 inner-page H1s use `text-3xl md:text-4xl font-semibold` without `tracking-tight` | VERIFIED | All 7 H1s confirmed below; `tracking-tight` on line 68 of journal-club/page.tsx is on an H2, not H1 |
| 4 | HeroCarousel H1 unchanged at `text-4xl md:text-5xl` | VERIFIED | HeroCarousel.tsx line 145: `text-4xl md:text-5xl` |
| 5 | Nav consolidated to `text-sm` | VERIFIED | SiteHeader NavLink `className="text-sm"` (line 94); LocaleToggle has `text-sm` baked in (line 96); MobileNav passes `text-sm` to both NavLink and LocaleToggle |
| 6 | Page wrappers use `max-w-5xl` (prose) or `max-w-6xl` (grid) | VERIFIED | Zero `max-w-4xl` found; all pages confirmed below |
| 7 | Vertical rhythm: `py-16` page wrappers, `py-12` sub-sections | VERIFIED | All page sections use `py-16`; PeopleSection/PeoplePlainSection use `py-12` |
| 8 | Card padding tiers enforced (dense p-4/py-5, spacious p-6) | VERIFIED | PersonCard `p-4`, SessionRow `py-5`, ResearchCard `p-6`, OutreachCard inner `p-6`; zero `p-8` in cards |
| 9 | MASTER.md documents type scale + layout with all cross-references | VERIFIED | `--text-4xl` row revised, `--text-5xl` row added, v1.0 scale superseded note present, Line-Height Convention subsection present, Layout section with SPACE-01/02/03 all present |

**Score:** 9/9 truths verified

---

## Per-Requirement Verification

### TYPO-01: `--text-5xl` token at 2.5rem/40px in `@theme` block

**Status: PASSED**

- File: `src/app/globals.css` line 37
- Actual: `--text-5xl:  2.5rem;  /* 40px — hero H1 (HeroCarousel only) */`
- Located in `@theme {}` block (lines 12–52), not `@theme inline`

### TYPO-02: `--text-4xl` at 2.25rem/36px (was 2rem)

**Status: PASSED**

- File: `src/app/globals.css` line 36
- Actual: `--text-4xl:  2.25rem; /* 36px — inner page H1s */`
- Located in `@theme {}` block

### TYPO-03: 7 inner-page H1s use `text-3xl md:text-4xl font-semibold` (no `tracking-tight`)

**Status: PASSED**

All 7 H1s verified:

| File | Line | Class | tracking-tight? |
|------|------|-------|----------------|
| `people/page.tsx` | 41 | `font-serif text-3xl md:text-4xl font-semibold` | No |
| `research/page.tsx` | 43 | `font-serif text-3xl md:text-4xl font-semibold` | No |
| `contact/page.tsx` | 46 | `font-serif text-3xl md:text-4xl font-semibold` | No |
| `journal-club/page.tsx` | 57 | `font-serif text-3xl md:text-4xl font-semibold` | No |
| `outreach/page.tsx` | 36 | `font-serif text-3xl md:text-4xl font-semibold` | No |
| `publications/page.tsx` | 68 | `font-serif text-3xl md:text-4xl font-semibold` | No |
| `PersonDetail.tsx` | 103 | `font-serif text-3xl md:text-4xl font-semibold` | No |

Note: `tracking-tight` found at `journal-club/page.tsx:68` is on an `h2` element (the "upcoming sessions" section header), not the page H1. This is acceptable.

HeroCarousel H1 unchanged: `HeroCarousel.tsx:145` — `font-serif font-bold text-4xl md:text-5xl`

### TYPO-04: Nav consolidated to `text-sm`

**Status: PASSED**

| Location | Evidence |
|----------|----------|
| SiteHeader NavLink | `className="text-sm"` (line 94) |
| SiteHeader LocaleToggle (desktop) | Uses component default `text-sm font-semibold tracking-wide` (LocaleToggle.tsx:96) |
| MobileNav NavLink | `className="text-sm py-3 px-2 rounded"` (MobileNav.tsx:128) |
| MobileNav LocaleToggle wrapper | `className="w-full text-left px-2 py-3 text-sm"` (MobileNav.tsx:148) |

### TYPO-05: MASTER.md type scale table updated

**Status: PASSED**

- `--text-4xl` row: `2.25rem / 36px` — revised from v1.0 2rem
- `--text-5xl` row: `2.5rem / 40px` — added
- v1.0 superseded note: Present (MASTER.md:55)
- Line-Height Convention subsection: Present (MASTER.md:57–68)

### SPACE-01: Page wrappers codified

**Status: PASSED**

Zero `max-w-4xl` found in `src/app/` or `src/components/`.

| Page / Component | Wrapper width | Expected | Pass? |
|-----------------|---------------|----------|-------|
| Contact | `max-w-5xl` | prose → `max-w-5xl` | Yes |
| PersonDetail | `max-w-5xl` | prose → `max-w-5xl` | Yes |
| Journal Club | `max-w-5xl` | prose → `max-w-5xl` | Yes |
| Publications | `max-w-5xl` | prose → `max-w-5xl` | Yes |
| PeoplePlainSection | `max-w-5xl` | prose → `max-w-5xl` | Yes |
| People (page header) | `max-w-6xl` | grid → `max-w-6xl` | Yes |
| PeopleSection | `max-w-6xl` | grid → `max-w-6xl` | Yes |
| Outreach | `max-w-6xl` | grid → `max-w-6xl` | Yes |
| Research | `max-w-6xl` | grid → `max-w-6xl` | Yes |
| HomePage intro | `max-w-3xl` | inline prose → `max-w-3xl` | Yes |
| Highlights, PartnerStrip | `max-w-6xl` | grid → `max-w-6xl` | Yes |

### SPACE-02: Vertical rhythm

**Status: PASSED**

- Page wrapper `py-16`: Contact, Journal Club, Research, Publications, Outreach, PersonDetail, HomePage intro, Highlights all confirmed
- Sub-section `py-12`: PeopleSection, PeoplePlainSection confirmed
- Hero `py-20` is reserved (documented in MASTER.md as future convention; HeroCarousel uses internal `p-8 md:p-12` + image height — acceptable per spec)

Zero unexpected spacing patterns found.

### SPACE-03: Card padding tiers

**Status: PASSED**

| Card | Padding | Expected tier | Pass? |
|------|---------|---------------|-------|
| PersonCard | `p-4` | dense | Yes |
| SessionRow | `py-5` | dense row | Yes |
| ResearchCard | `p-6` | spacious | Yes |
| OutreachCard | `p-6` | spacious | Yes |

Zero `p-8` found in card contexts. (The `p-8` in HeroCarousel is on the overlay text container, not a card — acceptable.)

### SPACE-04: MASTER.md `## Layout` section

**Status: PASSED**

MASTER.md `## Layout` section (lines 95–127) contains:
- Container Widths (SPACE-01) table with all pages listed
- Vertical Rhythm (SPACE-02) table with scope/padding/applies-to
- Card Padding Tiers (SPACE-03) table with both tiers and four exemplar cards
- Cross-references to SPACE-01, SPACE-02, SPACE-03 via section headings

---

## Build Verification

**`pnpm build`: PASSED**

Output: `✓ Compiled successfully in 4.0s` / `✓ Generating static pages using 7 workers (45/45) in 1092ms`

All 45 static pages generated without errors.

---

## Key Greps — Expected vs Actual

| Grep | Expected | Actual |
|------|----------|--------|
| `grep -n "text-4xl\|text-5xl" globals.css` | Both tokens present in `@theme` | CONFIRMED: lines 36–37 |
| `grep -rn "max-w-4xl" src/app/ src/components/` | Zero results | Zero results |
| `grep -rn "text-base lg:text-lg" src/` | Zero results | Zero results |
| `grep -rn "p-8" src/components/` | Zero in card context | Zero in cards; `p-8` found only in HeroCarousel overlay div (non-card) |
| `grep -rn "text-5xl\|text-4xl" design-system/MASTER.md` | Both rows in type scale table | CONFIRMED: lines 52–53 |
| `pnpm build` | Exit 0 | Exit 0 |

---

## Anti-Patterns Found

None blocking. No TODO/FIXME/placeholder patterns found in modified files. The `tracking-tight` in `journal-club/page.tsx:68` is on an H2, which is explicitly permitted by the convention (MASTER.md:66 — "H2 elements that render at `text-3xl` add `leading-tight` per-component").

---

## Human Verification Required

The following items cannot be verified programmatically and require visual inspection:

### 1. Heading Hierarchy on People Page

**Test:** Open `/en/people` at 375 px, 768 px, 1024 px, and 1440 px viewport widths.
**Expected:** H1 ("People" / "Equipo") reads distinctly larger than section H2s ("Principal Investigator", etc.). At mobile (375 px), H1 is `text-3xl` (30px), H2s are also `text-3xl` — check if visual weight or context distinguishes them sufficiently.
**Why human:** Responsive type rendering at 375 px mobile; can't verify visual hierarchy programmatically.

### 2. Heading Hierarchy on Research Page

**Test:** Open `/en/research` at 375/768/1024/1440 px.
**Expected:** H1 "Research" reads clearly above the research area cards. No cramped spacing between the H1 and first card row.
**Why human:** Visual spacing feel between `py-16` section and first grid card row.

### 3. Heading Hierarchy on Contact Page

**Test:** Open `/en/contact` at 375/768/1024/1440 px.
**Expected:** H1 "Contact" clearly at display scale; body copy and form below reads as subordinate without feeling detached.
**Why human:** Visual proportion of `max-w-5xl` single-column prose layout.

### 4. Nav Text Scale

**Test:** Compare nav link and locale toggle text size to body copy on any page.
**Expected:** Nav labels (`text-sm` = 15px per token) read clearly but smaller than page body copy (`text-base` = 16px). Should feel compact without feeling micro.
**Why human:** Requires visual calibration at actual render size.

---

## Gaps Summary

No gaps found. All 9 must-haves verified against actual code. The phase goal is achieved: `--text-5xl` token exists at 2.5rem, `--text-4xl` is confirmed at 2.25rem/36px, all 7 inner-page H1s use the correct class without `tracking-tight`, page widths are standardised to `max-w-5xl`/`max-w-6xl` with zero `max-w-4xl` occurrences, vertical rhythm is codified (`py-16` / `py-12`), card padding tiers are enforced, MASTER.md is fully updated, and `pnpm build` passes cleanly.

---

_Verified: 2026-04-19T22:32:57Z_
_Verifier: Claude (gsd-verifier)_
