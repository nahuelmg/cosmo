---
phase: 06
plan: "03"
subsystem: accessibility-remediation
tags: [axe-core, wcag-aa, color-contrast, a11y, css-tokens, globals-css]

dependency-graph:
  requires: [06-01]
  provides: [a11y-zero-violations-confirmed, color-contrast-fixed]
  affects: []

tech-stack:
  added: []
  patterns: [single-token-contrast-fix, axe-post-fix-verification]

key-files:
  created:
    - .planning/phases/06-polish-a11y-performance/06-03-SUMMARY.md
  modified:
    - src/app/globals.css

decisions:
  - id: INK-SUBTLE-DARKEN
    what: "Darkened --color-ink-subtle from oklch(0.62 0.010 60) to oklch(0.45 0.012 60)"
    why: "oklch(0.62) → #8b8580 yields 3.41–3.58:1 on warm-cream surfaces; WCAG AA requires 4.5:1 for normal-weight text below 18pt. Darkening to 0.45 L exceeds 4.5:1 on both surface tiers."
    impact: "Fixes all 15 axe color-contrast nodes across 8 pages in one token change. ink-subtle is now slightly darker than ink-muted (L=0.48) — visual hierarchy de-emphasis now comes from font-size/case/tracking rather than color alone."

metrics:
  duration: "~4 min"
  completed: "2026-04-18"
---

# Phase 6 Plan 03: Axe Remediation Sweep Summary

**One-liner:** Single CSS token change `--color-ink-subtle` from oklch(0.62) → oklch(0.45) closes all 15 `color-contrast` violations across 8 Spanish pages; post-fix axe run confirms 0 violations.

---

**Completed:** 2026-04-18
**Source inventory:** .planning/phases/06-polish-a11y-performance/06-01-SUMMARY.md

---

## Per-violation Fix Log

All 15 violations shared one root cause and one fix — the `--color-ink-subtle` token in `src/app/globals.css`.

| # | Rule | Page(s) | Nodes | Selector | Owning File | Fix Site | Commit |
|--:|------|---------|------:|----------|-------------|----------|--------|
| 1–8 | `color-contrast` | All 8 pages | 8 | `.text-xs.text-ink-subtle` (footer copyright) | `src/components/layout/SiteFooter.tsx:116` | `src/app/globals.css` — `--color-ink-subtle` oklch(0.62→0.45) | c20c4c3 |
| 9–12 | `color-contrast` | `/es/contacto` | 4 | `dt:nth-child(1,3,5,7)` (ContactDetails labels) | `src/components/contact/ContactDetails.tsx:31,38,43,50` | Same token change | c20c4c3 |
| 13–15 | `color-contrast` | `/es/divulgacion` | 3 | `article:nth-child(N) > .uppercase.tracking-wider.text-xs` (OutreachCard type badge) | `src/components/outreach/OutreachCard.tsx:37` | Same token change | c20c4c3 |

**Total distinct files changed:** 1 (`src/app/globals.css`)
**Total lines changed:** 1

---

## Pre → Post Axe Counts

| Page | Before (06-01) | After (06-03) | Delta |
|------|---:|---:|---:|
| `/es` | 1 | **0** | -1 |
| `/es/personas` | 1 | **0** | -1 |
| `/es/personas/esteban-calzetta` | 1 | **0** | -1 |
| `/es/investigacion` | 1 | **0** | -1 |
| `/es/publicaciones` | 1 | **0** | -1 |
| `/es/contacto` | 5 | **0** | -5 |
| `/es/divulgacion` | 5 | **0** | -5 |
| `/es/journal-club` | 1 | **0** | -1 |
| **TOTAL** | **15** | **0** | **-15** |

All component-owned violations resolved. No HeroCarousel-owned violations existed in 06-01 (carousel had 0 axe violations); 06-02 independently added proactive ARIA compliance (pause button, aria-live, slide role="group").

---

## No-regression Checks

- **PERF-01:** `pnpm build` prerendered all **45 static routes** (43 content + `_not-found` + `_global-error`) — confirmed via build output showing `45/45` generated pages.
- **NAV-03:** `grep -r "mailto\|@.*\." .next/server/app --include="*.html" | grep -v twitter | grep -v schema.org` returns **0 lines** in content pages (`_not-found.html` and `_global-error.html` have 2 hits from Next.js framework inline CSS, not content).
- **No outline-style borders:** Fix is a CSS token value change only. No focus-ring modifications made.
- **No files owned by 06-02 modified:** Only `src/app/globals.css` was touched. `git diff --name-only HEAD~1 HEAD` = `src/app/globals.css` only.

---

## Visual Regression Spot-check

After the token change, the following were confirmed visually not regressed:
- **ContactDetails dt labels** (`/es/contacto`): Small-caps tracking labels remain readable; now slightly darker medium-gray vs. before — no readability concern.
- **OutreachCard type badge** (`/es/divulgacion`): Activity type badges ("CONFERENCIA", "TALLER", etc.) unchanged in layout; contrast improved.
- **SiteFooter copyright** (all pages): Copyright line visually indistinct from ink-muted — de-emphasis now comes from `text-xs` font-size + font weight rather than color alone, which is the correct a11y-safe hierarchy signal.

---

## Token Change Details

```css
/* BEFORE (src/app/globals.css) */
--color-ink-subtle: oklch(0.62 0.010 60);  /* #8b8580 — 3.41:1 on surface (FAILS 4.5:1) */

/* AFTER */
--color-ink-subtle: oklch(0.45 0.012 60);  /* ~#696260 — ≥4.5:1 on both surface tiers (PASSES) */
```

The new value sits at L=0.45 — slightly darker than `--color-ink-muted` at L=0.48. This inverts the intended lightness hierarchy for these two tokens, but maintains the semantic distinction through the other typographic means (font-size, uppercase, tracking, font-weight) that all three affected components already use.

---

## Axe Runner Record (Post-fix)

```
Runner:     @axe-core/cli@4 (axe-core 4.11.3)
Browser:    Playwright Chromium 147.0.7727.15 (CHROME_TEST_PATH)
Server:     pnpm build + pnpm start (localhost:3000)
Load delay: 1500ms
Pages audited: 8
Total violations: 0 (was 15 before fix)
Date: 2026-04-18
Note: Run split into 2 batches (3+5 pages) — Chrome/selenium crashed mid-run on first batch at /es/investigacion; second batch ran cleanly. First batch (es, es/personas, es/personas/esteban-calzetta) showed 0 violations before crash.
```

---

## Deviations from Plan

### Auto-handled: Chrome crash mid axe run

**Rule 3 — Blocking**

- **Found during:** Task 2 (axe run)
- **Issue:** Chrome/selenium crashed with `WebDriverError: unknown error: net::ERR_CONNECTION_REFUSED` after completing 3 of 8 pages in a single axe invocation. The Next.js server remained available.
- **Fix:** Split the run into two batches: first batch (3 pages, results available from pre-crash), second batch (remaining 5 pages). Both batches returned 0 violations.
- **Impact:** Audit-only — no production code affected. Coverage complete across all 8 pages.

### None — code changes

Plan executed exactly as written. Single token change resolved all 15 violations.

---

## Next Phase Readiness

- A11Y-01 (zero critical violations): SATISFIED — 0 critical, 0 serious post-fix
- A11Y-02 (4.5:1 contrast): SATISFIED — all text-ink-subtle usages now ≥4.5:1
- 06-02 (carousel ARIA): Runs independently in Wave 2; see 06-02-SUMMARY.md for its scope
- Remaining Phase 6 plans (06-04 performance, 06-05 final audit): Can proceed
