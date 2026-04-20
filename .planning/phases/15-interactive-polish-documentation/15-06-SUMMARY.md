---
phase: 15-interactive-polish-documentation
plan: 06
subsystem: ui
tags: [accessibility, axe-core, ci, github-actions, focus-ring, tailwind, documentation]

# Dependency graph
requires:
  - phase: 15-interactive-polish-documentation
    provides: "15-01..05 complete — all 19 focus-ring sites unified on ring-accent-ring + ring-offset, tap targets ≥44px, motion animations"
provides:
  - "pnpm axe script invoking @axe-core/cli@4 against 8 Spanish pages, 0 violations confirmed"
  - ".github/workflows/lint-rings.yml CI drift gate on push/PR — prevents reintroduction of stray ring colors"
  - "MASTER.md Component Specs rewritten from raw CSS blocks to Tailwind recipes for 6 v1.2 components"
  - "OVERRIDES.md v1.2 Overrides table (15 data rows) appended, v1.0 list preserved"
  - "Manual visual sweep APPROVED at 375 / 1024 / 1440 px — all surfaces pass"
affects:
  - "Future contributors — drift gate enforces focus-ring uniformity on every push/PR"
  - "Any phase that introduces new interactive components (must follow ring-accent-ring recipe in MASTER.md)"

# Tech tracking
tech-stack:
  added:
    - "@axe-core/cli@4 (npx on demand — no devDep entry)"
  patterns:
    - "pnpm axe: npx -y @axe-core/cli@4 with hardcoded 8 URL list + --load-delay 1500"
    - "CI drift gate: grep -rEnP PCRE lookahead on focus-visible:ring- pattern in src/"
    - "MASTER.md Component Specs: Tailwind inline utility recipes (no CSS class abstractions)"

key-files:
  created:
    - .github/workflows/lint-rings.yml
  modified:
    - package.json
    - design-system/cosmology-group-uba/MASTER.md
    - design-system/cosmology-group-uba/OVERRIDES.md

key-decisions:
  - "Hardcoded URL list in pnpm axe (mirrors Phase 6 pattern — 8 slugs stable across 14 phases)"
  - "CHROME_TEST_PATH workaround required for axe-core/cli to find Chromium binary"
  - "MASTER.md Component Specs: REPLACE raw .btn-primary CSS blocks entirely (zero codebase analogues) — not preserve"
  - "OVERRIDES.md: Option 1 (append) — v1.2 table after existing v1.0 numbered list, both preserved"
  - "Drift gate regex uses PCRE negative lookahead on ubuntu-latest (GNU grep + PCRE2)"

patterns-established:
  - "Drift gate pattern: grep -rEnP PCRE in CI to block disallowed Tailwind pattern variants"
  - "ring-accent-ring is the only permitted focus-visible ring color — enforced by lint-rings.yml"

# Metrics
duration: ~20min
completed: 2026-04-20
---

# Phase 15 Plan 06: Axe + Drift Gate + Docs + Visual Sweep Summary

**`pnpm axe` 0 violations across 8 Spanish pages, `lint-rings.yml` CI drift gate live, MASTER.md Component Specs rewritten as Tailwind recipes, OVERRIDES.md v1.2 table appended (15 rows), visual sweep APPROVED at 375/1024/1440 px**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-20T02:10:00Z
- **Completed:** 2026-04-20T02:30:00Z
- **Tasks:** 3 (Tasks 1, 2A, 2B automated; Task 3 human checkpoint — approved)
- **Files modified:** 4

## Accomplishments

- `pnpm axe` script added to `package.json`; axe-core CLI confirmed 0 violations across all 8 Spanish pages using `CHROME_TEST_PATH` workaround for Playwright Chromium binary
- `.github/workflows/lint-rings.yml` CI drift gate created — runs on push to `main` and all PRs; PCRE lookahead regex blocks any `focus-visible:ring-*` outside `ring-accent-ring` / `ring-offset-*` / `ring-2`; dry-run confirms PASS (0 violations in current `src/`)
- `MASTER.md` `## Component Specs` section replaced (lines 130–243): raw `.btn-primary` / `.card` / `.input` / `.modal` CSS blocks (no codebase analogues) replaced with Tailwind inline recipes for 6 v1.2 components — button (carousel pause/play + MobileNav), pill (SourceFilter), dot (HeroCarousel), nav link, locale toggle, PersonCard — plus Universal Rules subsection documenting focus-ring pattern, tap-target rule, and motion scope
- `OVERRIDES.md` `## v1.2 Overrides` table appended at line 135 (after v1.0 numbered list at lines 1–133): 15 data rows covering token and component changes from Phases 13–15; existing v1.0 content fully preserved
- Manual visual sweep approved by user: HeroCarousel focus halos, SourceFilter crossfade, PersonCard zoom (including motion-safe reduced-motion path), and header hit zones all read correctly at 375 / 1024 / 1440 px

## Task Commits

1. **Task 1: Add `pnpm axe` script + CI drift-gate workflow + run axe** - `283cde9` (feat)
2. **Task 2A: Rewrite MASTER.md Component Specs as Tailwind recipes** - `8c8806b` (docs)
3. **Task 2B: Append v1.2 overrides table to OVERRIDES.md** - `82ff79b` (docs)
4. **Task 3: Final visual sweep** — checkpoint:human-verify, user APPROVED (no commit needed)

**Plan metadata:** (docs commit follows — `docs(15-06): complete axe + drift gate + docs + visual sweep plan`)

## Files Created/Modified

- `package.json` — added `"axe"` script (line 18): `npx -y @axe-core/cli@4` invocation against 8 hardcoded Spanish page URLs with `--load-delay 1500`
- `.github/workflows/lint-rings.yml` — CI drift gate; runs on push/PR; `grep -rEnP` PCRE lookahead; fails build on any `focus-visible:ring-*` not matching `ring-2`, `ring-accent-ring`, or `ring-offset-`
- `design-system/cosmology-group-uba/MASTER.md` — `## Component Specs` section replaced (lines 130–243 in final file): 6 Tailwind recipes + Universal Rules subsection (~114 lines of content)
- `design-system/cosmology-group-uba/OVERRIDES.md` — `## v1.2 Overrides (Phases 13–15)` table appended starting at line 135; 15 data rows; v1.0 numbered list (lines 1–133) fully preserved

## Decisions Made

- **Hardcoded URL list in `pnpm axe`:** Mirrors Phase 6 invocation exactly; slug stability has been zero-change across 14 phases; avoids devDep churn (axe runs via `npx -y`)
- **CHROME_TEST_PATH workaround documented:** Axe required `CHROME_TEST_PATH=~/.cache/ms-playwright/chromium-{version}/chrome-linux64/chrome` to locate the Playwright Chromium binary; this is the same workaround used in Phase 6 (per 06-01-SUMMARY.md lines 224–226)
- **MASTER.md Component Specs fully replaced:** Raw `.btn-primary` CSS blocks have zero codebase analogues (codebase is Tailwind utility-only); replacing them with actual copy-pasteable Tailwind recipes is a net improvement with no information loss
- **OVERRIDES.md append (Option 1):** Preserves all existing v1.0 detail; v1.2 deltas land in requested table format; matches "in-place edit" decision style from CONTEXT.md
- **Drift gate regex:** `focus-visible:ring-(?!2($|\s|"|'|/|\\)|accent-ring|offset-)` — negative lookahead anchors `ring-2` on word-boundary chars to avoid false positive on `ring-200`; PCRE available on `ubuntu-latest` via GNU grep PCRE2

## Deviations from Plan

None — plan executed exactly as written. The `CHROME_TEST_PATH` workaround was anticipated in the plan (Sub-step 1C fallback branch) and does not constitute a deviation.

## Issues Encountered

- **Playwright Chromium path:** `pnpm axe` failed on first run because the system Chrome binary path differed from the default. Fixed by using `CHROME_TEST_PATH` pointing to the Playwright-installed Chromium binary (same approach as Phase 6). Axe then ran cleanly and reported 0 violations across all 8 pages.

## Authentication Gates

None.

## Visual Sweep Results (Task 3 — APPROVED)

**User approved at all 3 viewports. Specific surfaces verified:**

| Surface | 375 px | 1024 px | 1440 px |
|---------|--------|---------|---------|
| HeroCarousel pause/play focus halos | PASS | PASS | PASS |
| HeroCarousel dot focus halos + hit area | PASS | PASS | PASS |
| SourceFilter pill crossfade (tone toggle) | PASS | PASS | PASS |
| PersonCard photo zoom (1.02, 200ms, motion-safe) | PASS | PASS | PASS |
| PersonCard zoom ABSENT under prefers-reduced-motion | PASS | PASS | PASS |
| Header hit zones (MobileNav trigger, NavLink row, LocaleToggle) | PASS | PASS | PASS |

**Axe scan details:**
- Invocation: `CHROME_TEST_PATH=~/.cache/ms-playwright/chromium-{version}/chrome-linux64/chrome npx -y @axe-core/cli@4 http://localhost:3000/es http://localhost:3000/es/personas http://localhost:3000/es/personas/esteban-calzetta http://localhost:3000/es/investigacion http://localhost:3000/es/publicaciones http://localhost:3000/es/contacto http://localhost:3000/es/divulgacion http://localhost:3000/es/journal-club --load-delay 1500`
- Result: **0 violations across all 8 Spanish pages**

**Drift gate dry-run:**
- Command: `grep -rEnP 'focus-visible:ring-(?!2($|\s|"|'"'"'|/|\\)|accent-ring|offset-)' src/ || echo "PASS: no violations"`
- Result: **PASS — 0 violations**
- Final regex: `focus-visible:ring-(?!2($|\s|"|'|/|\\)|accent-ring|offset-)`

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 15 (Interactive Polish + Documentation) is fully complete across plans 01–06
- All 19 `focus-visible:ring-*` sites in `src/` use `ring-accent-ring + ring-offset-2 + ring-offset-{surface|black/40}`
- CI drift gate active — any future contributor introducing a stray ring color will fail the build on push/PR
- MASTER.md and OVERRIDES.md are current source-of-truth for v1.2 design system state
- `pnpm axe` can be re-run at any time against a running dev server to verify zero accessibility violations

---
*Phase: 15-interactive-polish-documentation*
*Completed: 2026-04-20*
