---
phase: 06
plan: "01"
subsystem: accessibility-audit
tags: [axe-core, wcag-aa, color-contrast, a11y, audit]

dependency-graph:
  requires: []
  provides: [a11y-violation-inventory, partition-06-02, partition-06-03]
  affects: [06-02, 06-03]

tech-stack:
  added: []
  patterns: [axe-core-cli-audit, playwright-chromium-runner]

key-files:
  created:
    - .planning/phases/06-polish-a11y-performance/06-01-SUMMARY.md
  modified: []

decisions:
  - id: CHROME-PATH
    what: "Used CHROME_TEST_PATH env var pointing to Playwright-installed Chromium (v147) to work around missing system Chrome"
    why: "No system Chrome/Chromium installed; axe-core/cli@4 uses selenium-webdriver which reads CHROME_TEST_PATH when set"
    impact: "audit-only — no production code affected"

metrics:
  duration: "~6 min"
  completed: "2026-04-18"
---

# Phase 6 Plan 01: A11y Audit — Violation Inventory Summary

**One-liner:** axe-core 4.11.3 found a single `color-contrast` violation class (rule `color-contrast`, impact `serious`) across all 8 Spanish pages, totalling 15 node instances; zero other rule families fired.

---

## Per-Page Violation Count

| # | Page | URL | Critical | Serious | Moderate | Minor | Total |
|---|------|-----|----------|---------|----------|-------|-------|
| 1 | Home | `/es` | 0 | 1 | 0 | 0 | **1** |
| 2 | People list | `/es/personas` | 0 | 1 | 0 | 0 | **1** |
| 3 | Person detail | `/es/personas/esteban-calzetta` | 0 | 1 | 0 | 0 | **1** |
| 4 | Research | `/es/investigacion` | 0 | 1 | 0 | 0 | **1** |
| 5 | Publications | `/es/publicaciones` | 0 | 1 | 0 | 0 | **1** |
| 6 | Contact | `/es/contacto` | 0 | 5 | 0 | 0 | **5** |
| 7 | Outreach | `/es/divulgacion` | 0 | 5 | 0 | 0 | **5** |
| 8 | Journal Club | `/es/journal-club` | 0 | 1 | 0 | 0 | **1** |
| | **TOTAL** | | **0** | **15** | **0** | **0** | **15** |

All 15 nodes belong to a single rule: `color-contrast` (WCAG 1.4.3, Level AA).  
No critical violations. No moderate/minor violations. No other rule families fired.

---

## Violations — HeroCarousel-owned (06-02 will fix)

**NONE.** axe-core found zero violations inside the carousel component.

The carousel's `h1`, overlay text (`.text-white`), and dot button labels did NOT generate violations. The gradient-background text elements (slide `h1` and caption spans) appeared in the **Incomplete** list for `/es` (see Notes section below) because axe cannot resolve gradient contrast — those are NOT confirmed violations and require manual DevTools spot-check in 06-02.

The carousel is also missing required ARIA attributes (no `aria-label` on root, `aria-live` region absent, slide `role="group"` absent, pause button absent) — these are structural deficiencies that axe DID NOT flag as rule violations because the current markup does not expose them as testable roles. They will be addressed in 06-02 as a proactive WCAG 2.2.2 + WAI-ARIA APG compliance fix.

---

## Violations — Component-owned (06-03 will fix)

All 15 confirmed violations are `color-contrast` with the same root cause: **`text-ink-subtle` token (`#8b8580`) on the primary surface background (`#fbf7f2` or `#fefdfb`) yields ratio ~3.41–3.58:1, below the 4.5:1 AA threshold for normal-weight text.**

### Group A — SiteFooter copyright line (appears on ALL 8 pages)

| Rule | Severity | Page | Selector | Owning file | Summary |
|------|----------|------|----------|-------------|---------|
| `color-contrast` | serious | `/es` | `.text-xs` | `src/components/layout/SiteFooter.tsx:116` | fg #8b8580 / bg #fbf7f2 = 3.41:1 (need 4.5:1) |
| `color-contrast` | serious | `/es/personas` | `.text-xs` | `src/components/layout/SiteFooter.tsx:116` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |
| `color-contrast` | serious | `/es/personas/esteban-calzetta` | `.text-xs` | `src/components/layout/SiteFooter.tsx:116` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |
| `color-contrast` | serious | `/es/investigacion` | `.text-xs` | `src/components/layout/SiteFooter.tsx:116` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |
| `color-contrast` | serious | `/es/publicaciones` | `.text-xs` | `src/components/layout/SiteFooter.tsx:116` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |
| `color-contrast` | serious | `/es/contacto` | `.text-xs` | `src/components/layout/SiteFooter.tsx:116` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |
| `color-contrast` | serious | `/es/divulgacion` | `.pb-6 > .text-xs.text-ink-subtle` | `src/components/layout/SiteFooter.tsx:116` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |
| `color-contrast` | serious | `/es/journal-club` | `.text-xs` | `src/components/layout/SiteFooter.tsx:116` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |

**Root cause:** `<p className="text-xs text-ink-subtle">` on the footer copyright line. Present on every page.  
**Fix:** Darken `--color-ink-subtle` token OR add a `text-ink-muted` override on this specific element.

### Group B — ContactDetails `<dt>` labels (only on `/es/contacto`)

| Rule | Severity | Page | Selector | Owning file | Summary |
|------|----------|------|----------|-------------|---------|
| `color-contrast` | serious | `/es/contacto` | `dt:nth-child(1)` | `src/components/contact/ContactDetails.tsx:31` | fg #8b8580 / bg #fefdfb = 3.58:1, font-size 15px normal weight |
| `color-contrast` | serious | `/es/contacto` | `dt:nth-child(3)` | `src/components/contact/ContactDetails.tsx:38` | fg #8b8580 / bg #fefdfb = 3.58:1 |
| `color-contrast` | serious | `/es/contacto` | `dt:nth-child(5)` | `src/components/contact/ContactDetails.tsx:43` | fg #8b8580 / bg #fefdfb = 3.58:1 |
| `color-contrast` | serious | `/es/contacto` | `dt:nth-child(7)` | `src/components/contact/ContactDetails.tsx:50` | fg #8b8580 / bg #fefdfb = 3.58:1 |

**Root cause:** `<dt className="font-serif text-sm uppercase tracking-wider text-ink-subtle">` — 4 label terms (Dirección, Teléfono, Correo, Redes). Font-size 15px at normal weight requires 4.5:1.  
**Note:** These `dt` labels are NOT large text (< 18pt / not bold ≥ 14pt), so normal-text 4.5:1 threshold applies.  
**Fix:** Replace `text-ink-subtle` with `text-ink-muted` on `dt` elements in ContactDetails, OR darken the global token.

### Group C — OutreachCard activity type tag (only on `/es/divulgacion`)

| Rule | Severity | Page | Selector | Owning file | Summary |
|------|----------|------|----------|-------------|---------|
| `color-contrast` | serious | `/es/divulgacion` | `article:nth-child(1) > .p-6.flex-1.flex-col > .uppercase.tracking-wider.text-xs` | `src/components/outreach/OutreachCard.tsx:37` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |
| `color-contrast` | serious | `/es/divulgacion` | `article:nth-child(2) > .p-6.flex-1.flex-col > .uppercase.tracking-wider.text-xs` | `src/components/outreach/OutreachCard.tsx:37` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |
| `color-contrast` | serious | `/es/divulgacion` | `article:nth-child(3) > .p-6.flex-1.flex-col > .uppercase.tracking-wider.text-xs` | `src/components/outreach/OutreachCard.tsx:37` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |
| `color-contrast` | serious | `/es/divulgacion` | `article:nth-child(4) > .p-6.flex-1.flex-col > .uppercase.tracking-wider.text-xs` | `src/components/outreach/OutreachCard.tsx:37` | fg #8b8580 / bg #fbf7f2 = 3.41:1 |

**Root cause:** `<p className="text-xs uppercase tracking-wider text-ink-subtle">{activity.type}</p>` — 4 activity type badges. All-caps text at 13px still counts as normal weight for contrast purposes (WCAG distinguishes uppercase only by point size ≥ 18pt or bold ≥ 14pt).  
**Fix:** Same token fix as Group A.

---

## Rule-Family Roll-Up

| Rule | WCAG | Total nodes | Owning file(s) | Fix hint |
|------|------|-------------|----------------|----------|
| `color-contrast` | 1.4.3 AA | 15 | `SiteFooter.tsx` (8), `ContactDetails.tsx` (4), `OutreachCard.tsx` (3\*) | Darken `--color-ink-subtle` from oklch(0.62) to oklch ≤ 0.50 (or override per context). Target ratio ≥ 4.5:1 for all affected text. |

\* Three of the four OutreachCard nodes; the fourth counted under SiteFooter for `/es/divulgacion` (the `.pb-6 > .text-xs.text-ink-subtle` selector is the footer copyright on that page).

**No other rule families fired.** Zero violations for: `button-name`, `image-alt`, `link-name`, `html-has-lang`, `page-has-heading-one`, `region`, `landmark-*`, `scrollable-region-focusable`, `duplicate-id`, `frame-title`, `aria-required-children`, `aria-required-parent`.

---

## Notes

### `text-ink-subtle` contrast — RESEARCH Open Q #1 confirmed

Axe confirmed the failure: `oklch(0.62 ...)` maps to `#8b8580` in sRGB, yielding:
- **3.41:1** on `#fbf7f2` (primary surface) — fails 4.5:1 by 1.09 points
- **3.58:1** on `#fefdfb` (ContactDetails alt surface) — fails 4.5:1 by 0.92 points

The token is used across SiteFooter, ContactDetails, and OutreachCard. Suggested fix: darken to approximately `oklch(0.48 0.015 60)` — RESEARCH.md's recommendation of ≤ 0.45 is safe headroom. The affected elements are not large text, so 4.5:1 applies.

### Carousel gradient contrast — axe correctly skipped (Pitfall 4)

For `/es`, axe reported 3 **Incomplete** entries (not violations):
- `h1` — background gradient could not be determined
- `.text-white.[text-shadow:...]` — background gradient could not be determined  
- `.text-white/90` — background gradient could not be determined

This is expected per RESEARCH.md Pitfall 4. The carousel text-on-gradient check must be done manually via Chrome DevTools eyedropper in 06-02. These are NOT counted in violation totals.

### `scrollable-region-focusable` — correctly absent (RESEARCH Pitfall 6)

This rule did not fire on any page, consistent with RESEARCH.md's analysis: the carousel uses `overflow-hidden`, which axe correctly excludes from this rule.

### Contact page `.underline` — Incomplete (not a violation)

For `/es/contacto`, axe reported 1 **Incomplete** item:
- `Rule: color-contrast` on `.underline` — "background color could not be determined because it is overlapped by another element"

This is likely the Google Maps fallback anchor (`src/components/contact/MapEmbed.tsx:48`) which has `text-accent underline` and sits in a position-relative container with an overlapping iframe. Not a confirmed violation. The `text-accent` token is `oklch(0.55 0.12 45)` — warrants a manual contrast spot-check in 06-03.

### Axe runner record

```
Runner: @axe-core/cli@4 (axe-core 4.11.3)
Browser: Playwright Chromium 147.0.7727.15 (CHROME_TEST_PATH)
Server: pnpm build + pnpm start (localhost:3000)
Load delay: 1500ms
Pages audited: 8
Total violations: 15 nodes / 1 unique rule
Total incomplete: 5 nodes / 1 unique rule
Date: 2026-04-18
```

### Axe raw output (first 40 lines)

```
Running axe-core 4.11.3 in chrome-headless

Testing http://localhost:3000/es ... please wait, this may take a minute.
Waiting for 1500 milliseconds after page loads...

  Violation of "color-contrast" with 1 occurrences!
    Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds. Correct invalid elements at:
     - .text-xs
    For details, see: https://dequeuniversity.com/rules/axe/4.11/color-contrast

1 Accessibility issues detected.

Testing http://localhost:3000/es/personas ... please wait, this may take a minute.
Waiting for 1500 milliseconds after page loads...

  Violation of "color-contrast" with 1 occurrences!
    Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds. Correct invalid elements at:
     - .text-xs
    For details, see: https://dequeuniversity.com/rules/axe/4.11/color-contrast

1 Accessibility issues detected.

Testing http://localhost:3000/es/personas/esteban-calzetta ... please wait, this may take a minute.
Waiting for 1500 milliseconds after page loads...

  Violation of "color-contrast" with 1 occurrences!
    Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds. Correct invalid elements at:
     - .text-xs
    For details, see: https://dequeuniversity.com/rules/axe/4.11/color-contrast

1 Accessibility issues detected.

Testing http://localhost:3000/es/investigacion ... please wait, this may take a minute.
Waiting for 1500 milliseconds after page loads...

  Violation of "color-contrast" with 1 occurrences!
    Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds. Correct invalid elements at:
     - .text-xs
    For details, see: https://dequeuniversity.com/rules/axe/4.11/color-contrast

1 Accessibility issues detected.
```

---

## Deviations from Plan

### Auto-handled: Chrome binary discovery

**Rule 3 — Blocking**

- **Found during:** Task 1
- **Issue:** No system Chrome/Chromium installed; `@axe-core/cli@4` (selenium-webdriver) could not find Chrome binary.
- **Fix:** Ran `npx playwright install chromium` (one-time download of 112 MiB) then set `CHROME_TEST_PATH` env var to the Playwright-cached binary (`~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`). axe-cli's source reads this env var via `utils.js:CHROME_TEST_PATH`.
- **Impact:** Audit-only tooling — no source code or production assets affected. Raw JSON results identical to what `@axe-core/cli` would produce with a system Chrome.
- **Commit:** included in docs(06-01) commit

---

## 06-02 Work List (HeroCarousel — proactive ARIA compliance)

Zero confirmed violations are carousel-owned. However, the carousel is missing required WAI-ARIA APG structure that axe did not flag (because the current markup does not trigger the relevant rules). 06-02 must add:

1. `aria-label` on the carousel root (`aria-roledescription="carousel"` present but name missing)
2. `aria-live` region with polite/off toggle based on pause state
3. `role="group"` + `aria-label="N / total"` on each slide `<div>`
4. Visible pause button (WCAG 2.2.2 — Level A; currently missing)
5. Manual DevTools eyedropper contrast spot-check for carousel text-on-gradient (3 slides)
6. Remove `aria-pressed` from dot buttons (replace with dynamic `aria-label` per WAI-ARIA APG)

---

## 06-03 Work List (Component-owned — all axe violations)

All 15 confirmed violations share one fix: darken `--color-ink-subtle` token.

**Recommended approach:**
- Change `--color-ink-subtle` in `globals.css` from `oklch(0.62 ...)` to approximately `oklch(0.48 0.015 60)` — this fixes all three affected components in one token change.
- Verify the token change does not over-darken non-flagged usages of `text-ink-subtle` (PersonCard placeholder, PersonDetail position label, PartnerStrip heading).
- Spot-check the MapEmbed `.underline` element contrast manually (incomplete item from `/contacto`).

**Files to touch:**
1. `src/app/globals.css` — `--color-ink-subtle` token
2. Verify: `src/components/layout/SiteFooter.tsx` (copyright line — Group A)
3. Verify: `src/components/contact/ContactDetails.tsx` (dt labels — Group B)
4. Verify: `src/components/outreach/OutreachCard.tsx` (type badge — Group C)
5. Spot-check: `src/components/contact/MapEmbed.tsx` (`.underline` — incomplete item)
