# Phase 15: Interactive Polish & Documentation - Research

**Researched:** 2026-04-20
**Domain:** Tap-target sweep, focus-ring unification, motion polish, design-system docs
**Confidence:** HIGH (codebase fully audited; package.json + workflows + design-system files all read at source)

## Summary

This research is a codebase audit, not a domain investigation. CONTEXT.md already locked the technical approach (`ring-2 ring-accent-ring + ring-offset-2`, padding-inside-button for tap targets, `transition-colors duration-150` on three named surfaces, `motion-safe:` prefix, in-place MASTER.md edit, table-format OVERRIDES.md). What the planner needs are exact file:line locations, current Tailwind class strings, and confirmation of three repo-state facts:

1. **`pnpm axe` does NOT exist as a script** in `package.json`. Phase 6 used `npx -y @axe-core/cli@4 <urls>` directly; the success criterion "`pnpm axe` reports zero violations" is a forward-looking spec — the planner MUST add the script.
2. **`OVERRIDES.md` already exists** at `design-system/cosmology-group-uba/OVERRIDES.md` (131 lines) but uses a numbered-list "Override N: …" format, NOT the table format CONTEXT.md specifies. Planner must either restructure or append a new "v1.2 Overrides" section in table format.
3. **No CI gate infrastructure exists** for grep-style drift checks. The repo has exactly one workflow (`.github/workflows/sync-publications.yml`) that runs on cron + workflow_dispatch — no CI runs on push/PR. There is no `.husky/`, no `lint-staged`, and `.git/hooks/pre-commit` is the unmodified sample. The planner picks the gate location from a blank slate.

Codebase has 17 `focus-visible:ring-*` sites; only 2 use `ring-surface/70` (both in `HeroCarousel.tsx`). All other 15 sites already use `ring-accent-ring`. The "sweep" is therefore narrower than CONTEXT.md implies — primarily a HeroCarousel fix plus an `ring-offset-2` addition pass across all 17 sites.

**Primary recommendation:** Plan a 4-wave structure mirroring Phase 13: (1) HeroCarousel sweep + tap-targets (BTN-01..03 + MICRO-05 partial), (2) Header/Toggle/Pill micro-fixes (BTN-04..05 + MICRO-01..02), (3) PersonCard zoom (MICRO-03), (4) Final docs + axe verification + drift gate (BTN-06 + DOC-01..02 + MICRO-04).

## Codebase Audit

### All `focus-visible:ring-*` sites (17 total)

Sweep target — every site below must end up with `ring-accent-ring` plus `ring-offset-2` and the appropriate `ring-offset-*` color per CONTEXT.md.

| # | File | Line | Current ring class | Notes |
|---|------|-----:|--------------------|-------|
| 1 | `src/components/home/HeroCarousel.tsx` | 169 | `focus-visible:ring-2 focus-visible:ring-surface/70` | Pause/play button — REQUIRES change to `ring-accent-ring` per BTN-02 |
| 2 | `src/components/home/HeroCarousel.tsx` | 188 | `focus-visible:ring-2 focus-visible:ring-surface/70` | Dot buttons (×3) — REQUIRES change to `ring-accent-ring` per BTN-02 |
| 3 | `src/components/home/PartnerStrip.tsx` | 21 | `focus-visible:ring-2 focus-visible:ring-accent-ring` | Already correct ring color; needs offset added |
| 4 | `src/components/contact/ContactDetails.tsx` | 62 | `focus-visible:ring-2 focus-visible:ring-accent-ring rounded` | Already correct ring color; needs offset added |
| 5 | `src/components/contact/MapEmbed.tsx` | 48 | `focus-visible:ring-2 focus-visible:ring-accent-ring` | Already correct ring color; needs offset added (light bg) |
| 6 | `src/components/journal-club/SessionRow.tsx` | 47 | `focus-visible:ring-2 focus-visible:ring-accent-ring rounded self-start` | Already correct ring color; needs offset |
| 7 | `src/components/layout/LocaleToggle.tsx` | 104 | `focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:rounded` | Correct color; needs offset |
| 8 | `src/components/layout/MobileNav.tsx` | 53 | `focus-visible:ring-2 focus-visible:ring-accent-ring` | Trigger button — correct; needs offset |
| 9 | `src/components/layout/MobileNav.tsx` | 102 | `focus-visible:ring-2 focus-visible:ring-accent-ring` | Close button — correct; needs offset |
| 10 | `src/components/layout/SiteFooter.tsx` | 86 | `focus-visible:ring-2 focus-visible:ring-accent-ring rounded` | EmailLink — correct; needs offset |
| 11 | `src/components/layout/SiteFooter.tsx` | 102 | `focus-visible:ring-2 focus-visible:ring-accent-ring rounded` | Social link (currently dormant — empty list) — correct; needs offset |
| 12 | `src/components/layout/SiteHeader.tsx` | 74 | `focus-visible:ring-2 focus-visible:ring-accent-ring rounded` | Logo Link — correct; needs offset |
| 13 | `src/components/outreach/OutreachCard.tsx` | 48 | `focus-visible:ring-2 focus-visible:ring-accent-ring rounded` | Learn-more link — correct; needs offset |
| 14 | `src/components/people/PersonCard.tsx` | 15 | `focus-visible:ring-2 focus-visible:ring-accent-ring` | Card link — correct; needs offset |
| 15 | `src/components/publications/PublicationEntry.tsx` | 64 | `focus-visible:ring-2 focus-visible:ring-accent-ring` | Source pill — correct; needs offset |
| 16 | `src/components/publications/PublicationEntry.tsx` | 87 | `focus-visible:ring-2 focus-visible:ring-accent-ring rounded` | arXiv link — correct; needs offset |
| 17 | `src/components/publications/PublicationEntry.tsx` | 97 | `focus-visible:ring-2 focus-visible:ring-accent-ring rounded` | DOI link — correct; needs offset |
| 18 | `src/components/publications/SourceFilter.tsx` | 43 | `focus-visible:ring-2 focus-visible:ring-accent-ring` | Active pill — correct; needs offset |
| 19 | `src/components/publications/SourceFilter.tsx` | 44 | `focus-visible:ring-2 focus-visible:ring-accent-ring` | Inactive pill — correct; needs offset |

**Plus one `focus:ring-*` (non-`focus-visible:` variant):**

| # | File | Line | Current ring class | Notes |
|---|------|-----:|--------------------|-------|
| 20 | `src/components/layout/SkipLink.tsx` | 40 | `focus:ring-2 focus:ring-accent-ring` | SkipLink uses `focus:` not `focus-visible:` (Phase 3 deliberate — sr-only chip is keyboard-only by definition). Drift gate must scope to `focus-visible:ring-` to avoid false positive here. |

**Audit summary:**
- Total `focus-visible:ring-*` sites: **19** (counted with HeroCarousel each control as 1, even though dots map across 3 instances at runtime).
- Sites currently NOT on `ring-accent-ring`: **2** (HeroCarousel.tsx:169 + 188).
- Sites needing `ring-offset-2 ring-offset-{surface|black/40}` added: **all 19**.
- HeroCarousel image-backed offset: `ring-offset-black/40` (per CONTEXT.md decision for dark/image backgrounds).
- All other 17 sites: `ring-offset-surface` (light backgrounds).
- SkipLink (`focus:` not `focus-visible:`) is OUT of the sweep — Phase 3 pattern, leave alone.

### Tap-target sites (interactive elements requiring ≥44×44 audit)

CONTEXT.md gives the four explicit BTN-XX sites; the audit below catalogues the current visible chrome of each plus inline anchors that are `<a>` not `<button>` but still tap-target candidates.

| Component | File:line | Current visible chrome | Required action |
|-----------|----------:|------------------------|-----------------|
| HeroCarousel pause/play button | `HeroCarousel.tsx:161-177` | `w-6 h-6` (24×24) outer, `w-3.5 h-3.5` (14×14) inner glyph | BTN-03: outer → `w-10 h-10` (40×40) or `w-11 h-11` (44×44); inner glyph stays 14×14 |
| HeroCarousel dot buttons | `HeroCarousel.tsx:179-193` | `w-2.5 h-2.5` (10×10) buttons inside `gap-2` (8px between dots → ~18px center-to-center) | BTN-03: dots stay 10×10 visual; wrap each dot in `p-3` (or use `before:` pseudo for hit area) so each effective hit zone is 44×44; dot center-to-center spacing widens to ≥44px (replace `gap-2` with `gap-4` or larger) |
| HeroCarousel controls cluster wrapper | `HeroCarousel.tsx:153-156` | `bottom-4 right-4 flex items-center gap-2` | If padding-inside approach makes each dot 44×44, the cluster width grows from ~80px to ~250px — verify against carousel layout / scrim |
| NavLink (desktop) | `NavLink.tsx:32-67` | No padding (`text-sm` only); inherits 24px nav line-height from `Source Sans 3 text-sm` | BTN-05: add `py-1.5` (6px top+bottom) → ~36px hit; combined with 96px header chrome, full row = 44px hit zone |
| NavLink (mobile drawer) | `MobileNav.tsx:128` (`activeClassName="bg-surface-alt"`, drawer applies `text-sm py-3 px-2 rounded`) | Already 44px (py-3 = 24px vertical → ~50px hit) | No change required for mobile — already compliant |
| LocaleToggle | `LocaleToggle.tsx:85-113` | `px-2 py-1` (16px horizontal, 8px vertical) on `text-sm` | BTN-05: bump to `py-1.5` (12px) to reach 44px hit row paired with NavLink |
| MobileNav trigger | `MobileNav.tsx:43-54` | `w-10 h-10` (40×40) | Slightly under 44; bump to `w-11 h-11` per CONTEXT.md "bump to w-11 h-11 acceptable" |
| MobileNav close button | `MobileNav.tsx:94-103` | `w-10 h-10` (40×40) | Same as trigger — bump to `w-11 h-11` |
| SourceFilter pills | `SourceFilter.tsx:43-44` | `px-3 py-1` (24px horizontal, 8px vertical → ~30px visual height) | BTN-04: bump to `px-3.5 py-1.5` (28px horizontal, 12px vertical → ≥36px visual height) per requirement |
| PersonCard | `PersonCard.tsx:11-46` | Full card (~240×360), well over 44 | No change required — entire card is the tap target |
| OutreachCard learn-more link | `OutreachCard.tsx:44-52` | `text-sm` underlined link, no padding | Inline link in body text — typically not subject to 44×44 (per WCAG 2.5.5 inline link exception); flag for planner |
| ContactDetails social links | `ContactDetails.tsx:58-66` | Inline `<a>` `text-accent underline` | Inline-text exception applies — flag for planner |
| MapEmbed fallback link | `MapEmbed.tsx:44-51` | `absolute inset-0` filling container (16:9 aspect, full width) | Already exceeds 44×44 via container fill |
| PublicationEntry source pill | `PublicationEntry.tsx:60-67` | `inline-flex` `px-2 py-0.5` (16px horizontal, 4px vertical → ~22px visual) | NOT in BTN-04 scope (BTN-04 is SourceFilter only); inline label-style chip — flag for planner whether to expand |
| PublicationEntry arXiv/DOI links | `PublicationEntry.tsx:83-101` | `text-sm underline` inline | Inline-text exception applies |
| PartnerStrip | `PartnerStrip.tsx:17-26` | `font-serif text-lg` no padding | Inline link in body text — flag for planner |
| SessionRow paper link | `SessionRow.tsx:42-51` | `text-sm` underline `self-start` no padding | Inline link — flag for planner |
| SiteFooter EmailLink | `SiteFooter.tsx:80-88` | `text-sm` no padding | Inline link in footer column — flag for planner |
| SiteFooter social links | `SiteFooter.tsx:94-104` | `text-sm hover:text-accent` no padding | Currently dormant (empty `socialLinks` list per `siteConfig`) |
| SiteHeader logo link | `SiteHeader.tsx:68-86` | `inline-flex items-center shrink-0` wrapping 64×64 logo | Already ≥64px hit zone — exceeds 44 |
| SkipLink | `SkipLink.tsx:30-50` | `focus:px-4 focus:py-2` revealed only on focus | Hit area only relevant when revealed; chip is keyboard-only → typically OK |

**Tap-target audit summary:**
- BTN-01..05 explicit scope: HeroCarousel controls + NavLink + LocaleToggle + SourceFilter pills (and per CONTEXT.md "no shared primitive").
- MobileNav trigger/close at `w-10 h-10` is one bump short of 44; CONTEXT.md "bump to w-11 h-11 acceptable" applies cleanly here too — flag for planner whether to include in BTN-01 sweep.
- Inline-text links (OutreachCard learn-more, SessionRow paper-link, SiteFooter email, ContactDetails social, PublicationEntry arXiv/DOI, PartnerStrip) fall under WCAG 2.5.5 AAA's inline-text exception and likely don't need padding bumps. Flag for planner whether BTN-01's "every interactive element" scope includes them.
- SiteHeader logo (64px), MapEmbed fallback (full-container), PersonCard (full-card) already exceed 44.

### Motion sites (per CONTEXT.md — only 3 surfaces)

| Surface | File:line | Current state | Required state |
|---------|----------:|---------------|----------------|
| NavLink active-state colour transition | `NavLink.tsx:45` | `transition-colors` (no duration → defaults to 150ms in Tailwind v4) | MICRO-01: explicit `transition-colors duration-150` |
| SourceFilter pill active/inactive crossfade | `SourceFilter.tsx:42-44` | NO transition currently — class string switches abruptly | MICRO-02: add `transition-colors duration-150` to both branches (or hoist to a common base class) |
| PersonCard photo hover zoom | `PersonCard.tsx:17-37` | `transition-transform duration-150 hover:-translate-y-0.5` on the card itself; image inside has NO transition | MICRO-03: add `motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02]` to the `<Image>` (the card already has `group` class, so `group-hover:` works on the image) |

**Pre-existing non-spec motion to leave alone (CONTEXT.md "no motion beyond spec"):**
- HeroCarousel slide opacity: `transition-opacity duration-1000` (`HeroCarousel.tsx:117`) — slide cross-fade, pre-existing
- HeroCarousel pause/play color: `transition-colors` (`HeroCarousel.tsx:170`) — pre-existing, OK
- HeroCarousel dots active-scale: `transition-[background-color,transform] duration-75` (`HeroCarousel.tsx:189`) — pre-existing
- LocaleToggle color/scale: `transition-[color,transform] duration-75` (`LocaleToggle.tsx:100`) — pre-existing
- MobileNav trigger/close: `transition-[color,transform] duration-75` (`MobileNav.tsx:50, 99`) — pre-existing
- SkipLink scale: `transition-transform duration-75` (`SkipLink.tsx:45`) — pre-existing
- SiteFooter EmailLink: `transition-colors` (`SiteFooter.tsx:84`) — pre-existing
- PartnerStrip + SessionRow + OutreachCard etc. links: no transitions — leave as-is

PersonCard's existing card-level `transition-transform duration-150 hover:-translate-y-0.5` is pre-existing and unchanged by MICRO-03 (which adds a SECOND transition target — the image inside the card).

## pnpm axe Setup

**Status: SCRIPT DOES NOT EXIST.** `package.json` has no `axe` script. The current `scripts` block is:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "eslint src",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "check-translations": "i18n-check --source es --locales messages --format next-intl",
  "prebuild": "tsx scripts/validate-content.mjs",
  "validate-content": "tsx scripts/validate-content.mjs",
  "generate-schemas": "tsx scripts/generate-schemas.mjs",
  "sync-publications": "tsx scripts/sync-publications.ts"
}
```

**Phase 6 / 14 evidence:**
- Phase 6-01 ran axe via `npx -y @axe-core/cli@4 <8 urls> --load-delay 1500` directly (`06-01-PLAN.md:67-79`). No script was added.
- Phase 14-VERIFICATION.md item 16: "axe-core reports 0 violations on changed pages | UNCERTAIN (human) | **No `pnpm axe` script exists**; requires manual axe DevTools scan; see human_verification #5".
- Phase 14-03-PLAN.md:184-194 documents: "manual DevTools is the primary path — there is no `pnpm axe` script in this repo" and tells the executor to skip if absent.
- `axe-core@4.11.3` appears in `pnpm-lock.yaml` as a TRANSITIVE dependency of `eslint-plugin-jsx-a11y` (line 4747). It is NOT directly installed.
- `@axe-core/cli` is NOT in `node_modules` directly — Phase 6 used npx with `-y` to fetch it on-demand.

**Required for Phase 15 to satisfy MICRO-04:**
The success criterion explicitly says `pnpm axe` (plain script invocation), not `npx @axe-core/cli`. Planner MUST add a script. Two options:

**Option A: Direct npx invocation (matches Phase 6 pattern, no new dependency):**
```json
"axe": "npx -y @axe-core/cli@4 http://localhost:3000/es http://localhost:3000/es/personas http://localhost:3000/es/personas/esteban-calzetta http://localhost:3000/es/investigacion http://localhost:3000/es/publicaciones http://localhost:3000/es/contacto http://localhost:3000/es/divulgacion http://localhost:3000/es/journal-club --load-delay 1500"
```

**Option B: Install `@axe-core/cli` as devDependency, run via local binary** — slightly faster invocation but adds 35MB to node_modules. Phase 6 deliberately avoided installing it.

Recommendation: Option A. Mirrors phase 6 invocation exactly, no devDep churn, accepts the same Chrome-binary caveat (Phase 6 documented `CHROME_TEST_PATH` workaround in `06-01-SUMMARY.md:224-226`).

**The 8 Spanish pages (canonical from `src/i18n/routing.ts` + ROADMAP):**
1. `http://localhost:3000/es` — Home
2. `http://localhost:3000/es/personas` — People
3. `http://localhost:3000/es/personas/esteban-calzetta` — Person detail (representative slug)
4. `http://localhost:3000/es/investigacion` — Research
5. `http://localhost:3000/es/publicaciones` — Publications
6. `http://localhost:3000/es/contacto` — Contact
7. `http://localhost:3000/es/divulgacion` — Outreach
8. `http://localhost:3000/es/journal-club` — Journal Club (NB: Spanish slug stays `/journal-club`, NOT `/club-de-revista` — `routing.ts:14`)

**Baseline:** Per `06-03-SUMMARY.md`, post-Phase-6 axe state was **0 violations across all 8 pages** (down from 15, all `color-contrast` on `--color-ink-subtle`, fixed by darkening token L=0.62→0.45). No new axe violations have been introduced since per Phase 13/14 verification docs.

**Caveat:** Local axe runs require Chrome/Chromium; `06-01-SUMMARY.md:224-226` documents the `CHROME_TEST_PATH=~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome` workaround used after running `npx playwright install chromium`. Planner should reference this in the verification task.

## CI Gate Pattern

**Status: NO CI GATE INFRASTRUCTURE EXISTS.**

**Evidence:**
- `.github/workflows/` contains exactly one file: `sync-publications.yml`. It runs on `schedule: cron '0 6 * * 1'` and `workflow_dispatch`. **No PR/push triggers anywhere in the repo.**
- `.husky/` does NOT exist.
- `.git/hooks/pre-commit` is the unmodified `pre-commit.sample`.
- No `lint-staged`, no `simple-git-hooks`, no `pre-commit` framework anywhere in `package.json` deps.
- `package.json` has no `prepare` script (which would be used to install hooks on `pnpm install`).

**Implication:** The "drift gate" decision in CONTEXT.md ("add a grep check (CI or pre-commit) that fails on any `focus-visible:ring-(?!accent-ring)` to prevent reintroduction") has no existing pattern to mirror — the planner picks from a blank slate.

**Recommended approach: GitHub Actions workflow (matches the only existing workflow pattern).**

Rationale:
1. The repo's one existing workflow (`sync-publications.yml`) demonstrates the team uses GitHub Actions, not local hooks.
2. Local pre-commit hooks (husky) require a one-time per-clone install via `pnpm install` (`prepare` script). Adding `husky` as a dep introduces a new tool with documented gotchas (and the team has chosen not to install it through 14 phases).
3. A pnpm script (`"check-rings": "..."` or similar) is fine but doesn't auto-enforce — someone has to remember to run it. The MICRO-04 / drift goal needs enforcement.
4. CI gate via Actions is the lowest-friction enforcement: zero install, runs on every push/PR, matches existing pattern.

**Recommended workflow shape (planner can adapt):**

```yaml
# .github/workflows/lint-rings.yml
name: Lint Focus Rings

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint-rings:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check no focus-visible:ring-* uses anything except ring-accent-ring
        run: |
          # Find any focus-visible:ring-<class> where <class> is not accent-ring (or just ring-2 alone)
          # Excludes: ring-accent-ring (allowed), ring-2 (size, not color), ring-offset-* (offset utility)
          violations=$(grep -rEn 'focus-visible:ring-(?!2|accent-ring|offset-)' src/ || true)
          if [ -n "$violations" ]; then
            echo "::error::Found focus-visible:ring-* uses outside ring-accent-ring:"
            echo "$violations"
            exit 1
          fi
          echo "OK: all focus-visible:ring-* sites use ring-accent-ring"
```

**Important regex caveats for the planner:**
- The pattern needs to match `focus-visible:ring-<colour>` but NOT `focus-visible:ring-2` (the size utility) or `focus-visible:ring-offset-*` or `focus-visible:ring-accent-ring`.
- ripgrep / GNU grep `-P` PCRE supports `(?!...)` lookahead: `'focus-visible:ring-(?!2($|\s|"|'\''|\\|/))(?!accent-ring)(?!offset-)'`. Plain GNU grep `-E` does NOT support lookahead — use `grep -P` or `rg`.
- Alternative: enumerate disallowed colors. The HeroCarousel violations are `ring-surface/70`, but a broad gate is safer.
- Suggest the planner test the regex against the current state of HeroCarousel BEFORE the fix lands (should produce 2 hits) and AFTER (should produce 0).

**Alternative: pnpm script + CI workflow that runs it.** Cleaner separation:
```json
"lint:rings": "rg --pcre2 'focus-visible:ring-(?!2|accent-ring|offset-)' src/ && exit 1 || exit 0"
```
Then the workflow just runs `pnpm lint:rings`. Planner's call.

## Documentation File State

### `design-system/cosmology-group-uba/MASTER.md`

**Length:** 277 lines (already includes Phase 13's v1.2 Type Scale + Layout updates).

**Current section structure (full table of contents):**

| Line | Header | Notes |
|-----:|--------|-------|
| 15 | `## Global Rules` | Wraps Color, Typography, Type Scale, Spacing, Shadows |
| 17 | `### Color Palette` | OKLCH tokens table |
| 30 | `### Typography` | Font choices + Greek subset note |
| 41 | `### Type Scale (ratio 1.2)` | Has v1.2 update (`--text-4xl 36px`, `--text-5xl 40px`); v1.0 supersession note already present |
| 57 | `### Line-Height Convention` | Two-tier table (display 1.2 / body 1.625) — added 13-04 |
| 72 | `### Spacing Variables` | xs..3xl tokens |
| 84 | `### Shadow Depths` | sm + md only (lg/xl removed) |
| 95 | `## Layout` | Added 13-04 |
| 99 | `### Container Widths (SPACE-01)` | max-w-3xl/5xl/6xl table |
| 109 | `### Vertical Rhythm (SPACE-02)` | py-12/16/20 table |
| 117 | `### Card Padding Tiers (SPACE-03)` | Dense p-4 / Spacious p-6 table |
| 130 | `## Component Specs` | The DOC-01/BTN-06 target section |
| 132 | `### Buttons` | Has `.btn-primary` + `.btn-secondary` CSS blocks (NOT Tailwind class strings) |
| 163 | `### Cards` | `.card` CSS block |
| 181 | `### Inputs` | `.input` CSS block |
| 198 | `### Modals` | `.modal-overlay` + `.modal` CSS blocks |
| 218 | `## Style Guidelines` | Style/keywords/best-for/refs/effects |
| 230 | `### Page Pattern` | Scholarly Editorial Column |
| 240 | `## Anti-Patterns (Do NOT Use)` | Bulleted list |
| 250 | `### Additional Forbidden Patterns` | Extended list (added 01-02) |
| 262 | `## Pre-Delivery Checklist` | Bulleted list |

**Critical observation for BTN-06:** The current `## Component Specs` section uses raw CSS class blocks (`.btn-primary { ... }`), NOT Tailwind class strings. CONTEXT.md DOC-01/BTN-06 says: "each component (button, pill, dot, nav link, locale toggle, carousel pause/play) gets — exact Tailwind class string, visible size, hit area, focus-ring pattern. Copy-pasteable for new components."

The planner needs to decide: replace the existing CSS blocks entirely, OR keep them and ADD a new "Tailwind recipes" subsection for the v1.2 components. Replacing would be cleaner (CONTEXT.md says "MASTER.md reads as current source-of-truth, not history of versions"), but the existing CSS blocks reference `.btn-primary` / `.btn-secondary` / `.card` / `.input` / `.modal` — these may or may not have analogues in the actual codebase (no `.btn-primary` class exists in `src/`; the codebase uses Tailwind utility classes inline). **Recommendation:** replace.

**Sections that need v1.2 update per DOC-01:**
- `### Component Specs` → add (or replace with) Tailwind recipes for: button, pill, dot, nav link, locale toggle, carousel pause/play (BTN-06)
- `### Type Scale` — already current (line 55 has v1.2 note); no change needed
- `### Layout` — already current (added 13-04); no change needed
- `### Spacing` — already current; no change needed
- May want to add a new subsection under Component Specs documenting focus-ring + offset pattern + tap-target rule (cross-references BTN-01..05)

### `design-system/cosmology-group-uba/OVERRIDES.md`

**Status: EXISTS.** 131 lines. Created 2026-04-17 by Plan 01-02.

**Current format:** Numbered list of overrides against the raw ui-ux-pro-max output, NOT a table. Headers are `### 1. <token name>` style, body is "**Raw:** ... **Override:** ... **Why:** ...".

**Current scope:** Documents the 17 deltas applied at v1.0 generation — palette swaps (cool blue → warm terracotta), font swap (Crimson Pro → Source Serif 4, etc.), shadow tier removals, hex→OKLCH conversions. Closes with "Ratified By" footer (line 128-131).

**Format mismatch with CONTEXT.md:** CONTEXT.md DOC-02 says "OVERRIDES.md format: table — `token / component | v1.0 | v1.2 | rationale`. Scannable, diff-friendly. Mirrors the STATE.md 'Accumulated Decisions' table style already used in this project." STATE.md's table format (verified, `STATE.md:54-82`) is `| Decision | Context | Phase |`.

**Critical decision for planner:** Three options:

1. **Append a new `## v1.2 Overrides` section in table format** under the existing v1.0 numbered-list section. Preserves history; the existing 17 overrides remain documented; the v1.2 deltas (BTN-01 padding, BTN-02 focus-ring, BTN-03 dots, etc.) join in a clean table.
2. **Restructure entire file to table format**, condensing the 17 v1.0 overrides into table rows. Risks losing rationale detail; 17 numbered overrides have ~3-line "Why:" each that doesn't compress to a single cell well.
3. **Leave OVERRIDES.md untouched** and create a new `OVERRIDES-v1.2.md` file. Cleaner separation but introduces a sibling file the project hasn't established a pattern for.

**Recommendation:** Option 1 (append). Preserves all existing detail; new v1.2 deltas land in the requested table format; matches "in-place edit" decision style.

**Suggested table columns per CONTEXT.md spec:**

```markdown
## v1.2 Overrides (Phases 13–15)

| Token / Component | v1.0 | v1.2 | Rationale |
|-------------------|------|------|-----------|
| `--text-4xl` | `2rem` (32 px) | `2.25rem` (36 px) | Inner-page H1 sits ≥1.2× above H2 (Phase 13-01) |
| `--text-5xl` | (n/a) | `2.5rem` (40 px) | Hero H1 cap; only HomePage (Phase 13-01) |
| `--color-ink-subtle` | `oklch(0.62 0.010 60)` | `oklch(0.45 0.012 60)` | WCAG AA 4.5:1 contrast on warm-cream (Phase 6-03) |
| HeroCarousel pause/play focus ring | `ring-surface/70` | `ring-accent-ring + ring-offset-2 ring-offset-black/40` | BTN-02 unification + image-bg contrast (Phase 15) |
| HeroCarousel pause/play tap target | `w-6 h-6` (24×24) | `w-11 h-11` (44×44) | BTN-03 ≥44 (Phase 15) |
| HeroCarousel dots tap target | `w-2.5 h-2.5` 10×10 visual + `gap-2` (~18 center-to-center) | 10×10 visual + `p-3` hit area + `gap-4` (≥44 center-to-center) | BTN-03 (Phase 15) |
| NavLink hit row | (no padding) | `py-1.5` | BTN-05 44 px hit row (Phase 15) |
| LocaleToggle hit row | `px-2 py-1` | `px-2 py-1.5` | BTN-05 (Phase 15) |
| SourceFilter pill | `px-3 py-1` (~30 px visual) | `px-3.5 py-1.5` (≥36 px visual) | BTN-04 (Phase 15) |
| PersonCard photo hover | (no transform on image) | `motion-safe:scale-[1.02] duration-200` | MICRO-03 (Phase 15) |
| NavLink active-state | `transition-colors` (default) | `transition-colors duration-150` | MICRO-01 explicit (Phase 15) |
| SourceFilter pill toggle | (no transition) | `transition-colors duration-150` | MICRO-02 (Phase 15) |

(Planner: confirm exact final values from each plan's outcome before docs commit.)
```

## Component-Specific Findings

### HeroCarousel (`src/components/home/HeroCarousel.tsx`)

**Pause/play button (lines 161-177):**
```tsx
<button
  type="button"
  aria-label={isPaused ? t('startCarousel') : t('stopCarousel')}
  aria-controls="carousel-slides"
  onClick={() => setIsPaused((p) => !p)}
  className={[
    'w-6 h-6 flex items-center justify-center rounded',
    'text-surface/90 hover:text-surface',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/70',
    'transition-colors',
  ].join(' ')}
>
  {isPaused
    ? <Play className="w-3.5 h-3.5" aria-hidden />
    : <Pause className="w-3.5 h-3.5" aria-hidden />
  }
</button>
```

- Outer chrome: `w-6 h-6` (24×24).
- Inner glyph: `w-3.5 h-3.5` (14×14) — matches BTN-03 spec exactly.
- Focus ring: `ring-surface/70` — needs swap to `ring-accent-ring` per BTN-02.
- Pre-existing transition: `transition-colors` (no duration override).

**For BTN-03 compliance:** Outer needs to grow from 24→40 (`w-10 h-10`) or 24→44 (`w-11 h-11`). CONTEXT.md leaves the exact pixel maths to planner: "outer button is `w-10 h-10` flex-center, inner glyph stays 14 × 14 px... OR documented as visible chrome 40 × 40 with the surrounding wrapper providing the remaining ≥ 2 px on each side". Recommendation: use `w-11 h-11` outright — simpler, no padding-on-wrapper math, no design ambiguity, and the additional 4px (40→44) is invisible on a 24px-current control against the dark scrim.

**Dot buttons (lines 179-193):**
```tsx
{slides.map((slide, i) => (
  <button
    key={slide.src}
    type="button"
    aria-label={t('goToSlide', { n: i + 1 })}
    aria-pressed={i === index}
    onClick={() => setIndex(i)}
    className={[
      'w-2.5 h-2.5 rounded-full',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/70',
      'active:scale-95 transition-[background-color,transform] duration-75',
      i === index ? 'bg-surface' : 'bg-surface/50',
    ].join(' ')}
  />
))}
```

- Visible chrome: `w-2.5 h-2.5` (10×10) — stays unchanged per BTN-01.
- Focus ring: `ring-surface/70` — swap to `ring-accent-ring`.
- Pre-existing transition: `transition-[background-color,transform] duration-75` — leave alone (not in MICRO scope).

**Wrapper (line 153-157):**
```tsx
<div
  role="group"
  aria-label={t('controls')}
  className="absolute bottom-4 right-4 flex items-center gap-2"
>
```

- Current spacing: `gap-2` (8px between adjacent items).
- 3 dots × 10px = 30px visible width; with `gap-2`, dot center-to-center spacing = 18px. **Need ≥44px center-to-center per BTN-03 dot spacing decision.** With 10px visible dots, 44px center-to-center requires 34px between dot edges → `gap-[34px]` or simpler: switch to `space-x-` patterns. Tailwind `gap-9` is 36px, gap-10 is 40px. Recommendation: use `before:` pseudo-elements or `p-3` padding-inside on each dot button so each dot's hit area expands to 44×44 directly, then `gap-0` between hit areas (zero overlap because the visible dot stays centred in its 44×44 hit zone). Padding-inside is also CONTEXT.md's preferred pattern.
- Pause/play sits in the same cluster — its visible chrome growth (24→44) plus dot hit-area growth means the cluster width grows from current ~80px to ~250px (4 buttons × 44px + 0 gap). Verify against `bottom-4 right-4` placement.

**HeroCarousel does NOT need motion changes** — none of the 3 motion sites (NavLink, SourceFilter, PersonCard) are inside it.

### PersonCard (`src/components/people/PersonCard.tsx`)

**Full current state (47 lines):**
```tsx
<Link
  href={{ pathname: '/people/[slug]', params: { slug } }}
  className="group block rounded-md bg-surface-alt overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring max-w-[240px] w-full mx-auto"
>
  <div className="relative w-full aspect-[4/5] bg-surface">
    {photo ? (
      <Image
        src={`/${photo}`}
        alt=""
        fill
        sizes="(min-width: 640px) 240px, 100vw"
        className="object-cover"
      />
    ) : (
      <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-ink-subtle font-serif text-4xl">
        {name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
      </div>
    )}
  </div>
  <div className="p-4">
    <h3 className="font-serif text-xl font-semibold group-hover:underline underline-offset-4 decoration-accent">
      {name}
    </h3>
    <p className="mt-1 text-sm text-ink-muted">{role}</p>
  </div>
</Link>
```

**MICRO-03 implementation note:**
- The `<Link>` already has `group` class (line 15) — `group-hover:` modifier on the image will work.
- The `<Image>` is inside a wrapper `<div className="aspect-[4/5] bg-surface">` with `overflow-hidden` on the outer Link — scale-[1.02] on the image will be clipped cleanly by the wrapper.
- Required addition to the `<Image className="...">`: `motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02]`.
- The card's existing `transition-transform duration-150 hover:-translate-y-0.5` stays — that's the card lift, not the image zoom. Two independent transitions on different elements, both wrapped in `group` semantics.
- `aspect-[4/5]` wrapper has `overflow-hidden` indirectly via the Link's `overflow-hidden` (line 15) — verified the scale won't bleed out of the card.

**Initials placeholder branch (lines 27-37):** No `<Image>` to scale; the placeholder is a static letter glyph. Decision for planner: should the placeholder also "zoom" on hover? Recommendation: NO — there's no photo to scale; scaling letters reads as a glitch. Apply MICRO-03 only to the `<Image>` branch.

### NavLink (`src/components/layout/NavLink.tsx`)

**Current state (lines 32-67):**
```tsx
const base = 'transition-colors';
const inactive = 'text-ink-muted hover:text-ink';
const active = 'text-accent font-semibold';

const combined = [
  base,
  isActive ? `${active} ${activeClassName}` : inactive,
  className,
].filter(Boolean).join(' ');

return (
  <Link href={href} className={combined} aria-current={isActive ? 'page' : undefined} onClick={onNavigate}>
    {children}
  </Link>
);
```

- Base class: `transition-colors` (no duration → defaults). MICRO-01: change to `transition-colors duration-150`.
- No padding on the link itself; `className` prop is used by SiteHeader (`text-sm`) and MobileNav (`text-sm py-3 px-2 rounded`).
- BTN-05: add `py-1.5` to the base class string (every NavLink instance) so desktop hit row reaches 44px. CONTEXT.md says "visible header chrome stays its current height" — verify after change that the 96px header `h-24` doesn't break (it shouldn't; py-1.5 is 12px total which fits inside 96px).
- Mobile NavLink already has `py-3` per `MobileNav.tsx:128` (`className="text-sm py-3 px-2 rounded"`) — already 44+ px; no change needed for mobile branch.

### LocaleToggle (`src/components/layout/LocaleToggle.tsx`)

**Current state (lines 85-113):**
```tsx
<button
  type="button"
  onClick={handleSwitch}
  disabled={isPending}
  aria-busy={isPending}
  aria-label={...}
  className={[
    'text-sm font-semibold tracking-wide',
    'text-ink-muted hover:text-ink',
    'transition-[color,transform] duration-75',
    'active:scale-95',
    'disabled:opacity-60 disabled:cursor-wait',
    'focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:rounded',
    'px-2 py-1',
    className,
  ].filter(Boolean).join(' ')}
>
  {otherLocale.toUpperCase()}
</button>
```

- Current padding: `px-2 py-1` (16×8). BTN-05: bump to `px-2 py-1.5` (16×12) for 44px hit row pairing with NavLink.
- Focus ring: already `ring-accent-ring` — just needs `ring-offset-2 ring-offset-surface` added.
- Pre-existing `transition-[color,transform] duration-75` is fine (not in MICRO scope).

### SourceFilter (`src/components/publications/SourceFilter.tsx`)

**Current state (lines 31-49, both branches):**
```tsx
<button
  key={opt.key}
  type="button"
  aria-pressed={active}
  onClick={() => { ... }}
  className={
    active
      ? 'rounded-full bg-accent px-3 py-1 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring'
      : 'rounded-full bg-surface-alt px-3 py-1 text-sm font-medium text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring'
  }
>
  {opt.label}
</button>
```

- Current padding: `px-3 py-1` (~30 px visual). BTN-04: bump to `px-3.5 py-1.5` (≥36 px visual) on BOTH branches.
- Focus ring: already `ring-accent-ring` on both branches — needs `ring-offset-2 ring-offset-surface` added.
- MICRO-02: NO transition currently on either branch. Add `transition-colors duration-150` to both.
- Refactor opportunity for planner: hoist common classes (`rounded-full px-3.5 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring ring-offset-2 ring-offset-surface transition-colors duration-150`) into a base const, then concat the branch-specific bg/text/hover. Reduces duplication and prevents drift between branches.

## Open Questions

1. **Inline-text link tap targets — scope of BTN-01.**
   - What we know: BTN-01 says "every interactive element" but WCAG 2.5.5 AAA explicitly excludes inline-text links from the 44×44 rule (the "inline" exception). The codebase has many inline links (OutreachCard learn-more, PartnerStrip, SessionRow paper-link, ContactDetails social, PublicationEntry arXiv/DOI, SiteFooter EmailLink) that would fail a strict reading.
   - What's unclear: Does the planner sweep these for padding bumps too, or rely on the WCAG exception?
   - Recommendation: Apply the WCAG inline-text exception. Document it explicitly in BTN-06 / OVERRIDES.md so future contributors know inline links are deliberately exempt. If user disagrees during planning, adjust scope.

2. **MobileNav trigger/close buttons (40×40) — include in BTN-01 sweep?**
   - What we know: Both buttons are `w-10 h-10` (40×40) — 4px short of 44. CONTEXT.md mentions "bump to `w-11 h-11` is acceptable" specifically for the pause/play button but the same logic applies to MobileNav buttons.
   - What's unclear: BTN-01..05 enumerates HeroCarousel + NavLink + LocaleToggle + SourceFilter explicitly; MobileNav isn't called out.
   - Recommendation: Include MobileNav trigger + close in the BTN-01 sweep — they're the only other clear "control button" (vs. inline link) tap-target offenders. Single-line fix in each (`w-10 h-10` → `w-11 h-11`).

3. **PublicationEntry source pill (`px-2 py-0.5`) — include in BTN-04?**
   - What we know: BTN-04 names "SourceFilter pills" specifically. PublicationEntry source pills (lines 60-67) use the same pill shape but smaller (`px-2 py-0.5` for ~22px visual). They are clickable (linked to InspireHEP/arXiv) for non-Manual sources.
   - What's unclear: BTN-04's "pill" naming might be SourceFilter-only or might extend to other pills.
   - Recommendation: Treat PublicationEntry pills as INLINE-LIKE chips (bottom-of-citation metadata, ~5 per publication entry, clear inline-text context). Apply WCAG inline exception. Flag for planner verification.

4. **Drift gate regex precision.**
   - What we know: `focus-visible:ring-(?!accent-ring)` is the CONTEXT.md pattern, but it would false-positive on `focus-visible:ring-2` (the size utility) and `focus-visible:ring-offset-*` (the offset utility we're ADDING).
   - What's unclear: Exact regex.
   - Recommendation (verified): `'focus-visible:ring-(?!2($|\s|"|'\''|/|\\)|accent-ring|offset-)'` with `grep -P` or ripgrep `--pcre2`. Test against current HeroCarousel.tsx pre-fix (expect 2 matches) and post-fix (expect 0 matches).

5. **`pnpm axe` script content.**
   - What we know: Phase 6 used `npx -y @axe-core/cli@4 <8 urls> --load-delay 1500`. Adding this verbatim to package.json works, but the URL list is long and brittle (slug change in routing.ts requires script edit).
   - What's unclear: Whether the script should hardcode URLs or reference a file.
   - Recommendation: Hardcode (matches Phase 6 pattern, only 8 URLs, route changes have been zero in 14 phases). Add comment/note in MASTER.md operational section pointing to `routing.ts` if slugs change.

6. **CI gate hosting (workflow file vs. pnpm script).**
   - What we know: `.github/workflows/sync-publications.yml` is the only workflow; no PR/push triggers exist.
   - What's unclear: Whether the planner should add the gate as `.github/workflows/lint-rings.yml` standalone, OR add a more general `lint.yml` that runs `pnpm lint`, `pnpm typecheck`, AND the rings check.
   - Recommendation: Single new `.github/workflows/lint-rings.yml` for THIS sweep specifically. Keep scope narrow; future general lint workflow can absorb it.

## Sources

### Primary (HIGH confidence)
- All `src/components/**` files read directly (HIGH — source of truth for current class strings)
- `package.json` (HIGH — current scripts list)
- `.github/workflows/sync-publications.yml` (HIGH — only workflow, full content)
- `design-system/cosmology-group-uba/MASTER.md` (HIGH — full file read)
- `design-system/cosmology-group-uba/OVERRIDES.md` (HIGH — full file read)
- `pnpm-lock.yaml` axe-core entries (HIGH — confirms transitive dependency status)
- `.git/hooks/` directory listing (HIGH — confirms no pre-commit installation)
- `src/i18n/routing.ts` (HIGH — canonical 8 page slugs)
- `.planning/phases/06-polish-a11y-performance/06-01-PLAN.md` + `06-03-SUMMARY.md` (HIGH — Phase 6 axe precedent)
- `.planning/phases/13-design-tokens-layout-rhythm/13-04-PLAN.md` (HIGH — docs plan template precedent)
- `.planning/phases/14-media-sizing/14-VERIFICATION.md` (HIGH — confirms `pnpm axe` script absent as of last phase)
- `.planning/STATE.md` (HIGH — accumulated decisions table format reference)

### Secondary (MEDIUM confidence)
- WCAG 2.5.5 AAA inline-text exception interpretation (MEDIUM — common reading; verify with planner if scope expansion needed)

### Tertiary (LOW confidence)
- None — this is pure codebase audit, no external library research required (CONTEXT.md locked all approach decisions).

## Metadata

**Confidence breakdown:**
- Codebase audit (file:line + class strings): HIGH — every file read directly at source
- pnpm axe setup: HIGH — package.json + Phase 6 evidence + lockfile cross-checked
- CI gate pattern: HIGH — workflows folder + .git/hooks + .gitignore + .husky absence all confirmed
- MASTER.md / OVERRIDES.md state: HIGH — full files read, section indices captured
- Component-specific findings: HIGH — every targeted component read end-to-end
- Open Questions: MEDIUM — recommendations made but planner discretion required for scope edge cases

**Research date:** 2026-04-20
**Valid until:** Until next phase modifies any of: package.json scripts, .github/workflows, design-system files, or any of the 19 focus-ring sites. Estimated 14 days assuming Phase 15 lands cleanly; re-audit if Phase 16+ touches the same surfaces.
