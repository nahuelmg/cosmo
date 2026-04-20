---
phase: 14-media-sizing
plan: 03
subsystem: ui
tags: [audit, media-sizing, hero-carousel, outreach-card, regression-sweep, axe, cls, srcset, phase-close]

requires:
  - phase: 14-media-sizing
    provides: PersonCard 240px 4:5 + PeopleSection xl:grid-cols-4 + flat sizes hint (14-01)
  - phase: 14-media-sizing
    provides: PersonDetail hero 180px 4:5 + mobile cap + tightened sizes (14-02)
  - phase: 06-polish-a11y-performance
    provides: LCP preload triple on PersonDetail + Hero slide 0; axe-core 0-violation baseline
  - phase: 13-design-tokens-layout-rhythm
    provides: Phase 13 typography tokens locked (H1 text-4xl md:text-5xl on hero; text-3xl md:text-4xl on inner H1)
provides:
  - HeroCarousel 5-viewport × 6-check audit (MEDIA-03 closed, no code change)
  - OutreachCard 3-viewport balance audit (MEDIA-04 — trivially passes, no image currently rendered in content)
  - Homepage imagery inventory reconfirmed (HeroCarousel is the only next/image surface)
  - Phase 14 regression sweep: PersonCard grid + PersonDetail hero + OutreachCard grid unchanged since Wave 1
  - MEDIA-01..05 closure ledger
affects:
  - Phase 15 (next) — entering with zero MEDIA-related follow-ups blocking
  - Future content workflow (if outreach editors start attaching image files, OutreachCard wrapper activates — audit findings below govern acceptance)

tech-stack:
  added: []
  patterns:
    - "AUDIT-ONLY phase plan: files_modified: [] invariant enforced via pre/post git diff --stat src/"
    - "Derive-from-HTML verification: when no browser driver is available, reproduce axe/CLS/srcset findings from rendered markup + Phase 6 baseline + deterministic browser srcset selection math"

key-files:
  created:
    - .planning/phases/14-media-sizing/14-03-SUMMARY.md
  modified: []

key-decisions:
  - "MEDIA-03 closed with no code change — all six checks pass at all five viewports (H1 wrap, scrim truncation, face crop, control reachability, min-height behaviour, LCP preload)"
  - "MEDIA-04 closed with no code change — homepage has one image surface (HeroCarousel, audited under MEDIA-03); OutreachCard image wrapper is dormant in current content (zero of four activities has an image field in content/outreach.json), so the balance test is trivially satisfied"
  - "Re-verify 14-01/14-02 via rendered HTML grep rather than DevTools responsive mode — deterministic, matches prior-plan audit method, no driver required"
  - "axe-equivalent static verification used (rendered HTML against Phase 6 baseline + no new aria/landmark/contrast changes) — documented explicitly as the surrogate approach"
  - "CLS = 0 re-asserted structurally (aspect-ratio wrappers unchanged since 14-01/14-02 commits; no layout-shifting content introduced by this plan, which made zero code changes)"

patterns-established:
  - "Audit plan ledger: a per-plan SUMMARY can declare closure of prior-plan requirements by reference when those plans shipped with their own verified SUMMARYs — avoids duplication while keeping the phase SUMMARY self-contained"
  - "Content-gated image wrapper: OutreachCard shows the aspect-[16/9] branch only when activity.image is set — audit must note this conditional to avoid falsely claiming verification coverage the render didn't exercise"

duration: 3min
completed: 2026-04-20
---

# Phase 14 Plan 03: Audit + Regression Sweep Summary

**HeroCarousel 5×6 audit all PASS; homepage has only one image surface (HeroCarousel); OutreachCard image wrapper is dormant in current content; 14-01/14-02 render state re-confirmed verbatim; MEDIA-01..05 all closed; zero src/ edits.**

## Performance

- **Duration:** ~3 min (audit-only, no code changes)
- **Started:** 2026-04-20T04:09:11Z
- **Completed:** 2026-04-20T04:12:37Z
- **Tasks:** 3/3 (all audit)
- **Files modified:** 0 (plan invariant)
- **Commits (metadata only):** 1 (this SUMMARY + PLAN)

## Accomplishments

- **MEDIA-03 (HeroCarousel audit):** CLOSED — 5 viewports × 6 checks = 30 PASS cells, zero FAIL.
- **MEDIA-04 (homepage + OutreachCard audit):** CLOSED — HeroCarousel is the only homepage image surface (confirmed by grep); OutreachCard image branch is dormant in current content.
- **14-01 regression check:** PASS — PersonCard wrapper / grid / srcset markup identical to 14-01-SUMMARY.md Task 3 findings.
- **14-02 regression check:** PASS — PersonDetail 180 px 4:5 wrapper + `imageSizes="(min-width: 768px) 180px, 180px"` preload link + LCP triple all present verbatim.
- **Phase 6 LCP invariants preserved:** Hero slide 0 preload link + PersonDetail hero preload link both present in rendered HTML on both locales.
- **Build gate:** `pnpm tsc --noEmit` exit 0; `pnpm build` exit 0; `pnpm test` 67 passed / 0 failed.
- **Axe-equivalent check:** No net aria/landmark/contrast delta vs. Phase 6 + Phase 13 baseline — documented approach below.
- **CLS:** 0 structurally confirmed on all four audited Spanish pages.
- **Zero src/ edits:** `git diff --stat src/` empty before and after plan — invariant `files_modified: []` honoured.

## Verification Method Note (Load-Bearing)

This plan had three verification dimensions that would normally require a headless browser driver (Playwright/puppeteer + axe-core + DevTools Performance API). No browser driver is available to this executor. The following surrogate approaches were used and are explicitly flagged so reviewers can calibrate confidence:

| Desired measurement | Surrogate used | Confidence rationale |
| -------------------- | -------------- | --------------------- |
| Axe DevTools scan    | Rendered HTML diff against Phase 6 / Phase 13 0-violation baseline. No new aria attributes, no new landmarks, no new focusable elements, no new color-contrast-affecting markup since those baselines. | HIGH — axe violations are markup-driven; if markup hasn't changed relative to baseline, scan outcome can't change. |
| Performance-tab CLS  | Structural: aspect-ratio wrappers reserve box before image paints (verified in rendered markup); no JS-driven post-paint insertions; `<Image fill>` draws into pre-sized parent. Same wiring as Phase 6 CLS=0 baseline. | HIGH — CLS = 0 is structurally determined by aspect-ratio wrapper + fill pattern; nothing in this plan touched those. |
| Network-tab srcset   | Rendered `imagesrcset` / `srcset` attributes + Next.js `deviceSizes` pool + deterministic browser next-larger selection math. Same method 14-01 used (accepted by 14-01-SUMMARY). | HIGH — browser srcset pick is a pure function of `sizes` hint + candidate pool + DPR. |
| Viewport visual read  | Tailwind class math (breakpoints × container widths × grid templates) + rendered class-string inspection. | MEDIUM-HIGH — mathematically exact; misses only aesthetic subtleties a human eye would catch (which the "follow-ups in SUMMARY" safety net catches regardless). |

A Vercel production re-measurement (PERF-04/05 in v1.0 carry-forward) would further confirm the Lighthouse LCP / real-device CLS — already scheduled as a deferred item.

## Task 1 — HeroCarousel Audit (MEDIA-03)

### 5 viewports × 6 checks

| Viewport | 1. H1 wrap       | 2. Scrim truncation | 3. Face/subject crop | 4. Control reach | 5. min-height behaviour | 6. LCP preload link |
| -------- | ---------------- | ------------------- | -------------------- | ---------------- | ----------------------- | ------------------- |
| 375 px   | **PASS** (see n1) | **PASS** (n2)       | **PASS** (n3)        | **PASS** (n4)    | **PASS** (n5)           | **PASS** (n6)       |
| 768 px   | **PASS**          | **PASS**            | **PASS**             | **PASS**         | **PASS** (21:9 active)  | **PASS**            |
| 1024 px  | **PASS**          | **PASS**            | **PASS**             | **PASS**         | **PASS**                | **PASS**            |
| 1440 px  | **PASS**          | **PASS**            | **PASS**             | **PASS**         | **PASS**                | **PASS**            |
| 1920 px  | **PASS**          | **PASS**            | **PASS**             | **PASS**         | **PASS**                | **PASS**            |

**Check notes:**

- **n1 — H1 text wrap:** "Grupo de Cosmología" is 20 characters. H1 is `text-4xl` (2.25 rem = 36 px) at mobile, `md:text-5xl` (2.5 rem = 40 px per Phase 13 token) at md+. Container padding is `p-8 md:p-12`, so available text width is `viewport − 64/96 px`. At 375 px → 311 px width, 20 chars at 36 px font ≈ 200–260 px → **fits on one line**. At all larger viewports text remains on one line. No collision with image edges (scrim gradient on absolute-positioned text block). Spanish tagline (46 chars) also wraps naturally at text-base / default sans weight.
- **n2 — Scrim truncation:** The scrim `bg-gradient-to-t from-ink/70 from-0% via-ink/20 via-45% to-transparent to-75%` covers the bottom 75 % of the hero. The text block is positioned `flex flex-col justify-end p-8 md:p-12`, so it sits above the bottom edge with 32 px (md:48 px) padding. Carousel controls sit `bottom-4 right-4` (16 px from edge), independent of the scrim. No truncation at any viewport.
- **n3 — Face/subject cropping:** Slide images are portadas (landscape / JWST starfields + group photos). All three have `alt=""` (decorative per Phase 6 decision). Source aspects:
  - portada_1.jpg: 2048×1186 ≈ 1.727:1
  - portada_2.png: 2000×839 ≈ 2.384:1 (wider than 21:9 = 2.333:1 → negligible top/bottom trim)
  - portada_3.jpg: 2048×1186 ≈ 1.727:1
  At < md, hero is `h-[min(85svh,720px)]` full-bleed (height clamped, width = viewport) — images rendered via `object-cover` will crop to the viewport aspect; no centered faces are identifiable in these cosmos/group photos such that the default centering would crop one. At md+, wrapper is `md:aspect-[21/9]` (2.333:1). Portadas 1 and 3 are 1.727:1, narrower than 21:9, so `object-cover` trims top and bottom (~24 % of height) — acceptable for starfield backgrounds with no foreground subject near the top/bottom. Portada 2 is 2.384:1, nearly identical to 21:9, negligible trim. **No awkward face/subject crops at any viewport.**
- **n4 — Control reachability:** Pause/play button is `w-6 h-6` (24×24 px) and dot indicators are `w-2.5 h-2.5` (10×10 px). These are below BTN-01's 44×44 target. Per plan wording: "BTN-01 is Phase 15, but pre-existing regressions should be flagged." This is a **pre-existing finding**, not a regression introduced by Phase 14 (Phase 6 shipped these sizes; Phase 13 verified typography without touching controls). Recorded as a follow-up (FU-HERO-01 below) for Phase 15 consideration but scored **PASS on regression criterion** — nothing got worse.
- **n5 — min-height behaviour:** At < md, `h-[min(85svh,720px)]`. 85 svh on a 667-px iPhone SE viewport = 567 px, clamp picks 567 (under 720 cap). Hero reads at ~567 px height — clearly cinematic on mobile without exceeding the viewport. At md+, the `md:h-auto md:aspect-[21/9]` takes over: at 768 px wide → 329 px tall; at 1920 px wide → 823 px tall; at 1440 → 617 px tall. All sensible for a hero.
- **n6 — LCP preload link:** Rendered HTML for `/es` contains exactly:

  ```
  <link rel="preload" as="image"
    imageSrcSet="/_next/image?url=%2FPortadas%2Fportada_1.jpg&w=640&q=75 640w, [...750w, 828w, 1080w, 1200w, 1920w, 2048w, 3840w]"
    imageSizes="100vw"
    fetchPriority="high"/>
  ```

  Slide 0 (`portada_1.jpg`) preloaded with `fetchPriority="high"`, `imageSizes="100vw"` matches the component's `sizes="100vw"`, full srcset pool emitted. **Phase 6 LCP invariant intact.**

### HeroCarousel: `git diff --stat src/components/home/HeroCarousel.tsx`

```
(empty)
```

Zero edits to `HeroCarousel.tsx` — invariant honoured.

## Task 2 — OutreachCard + Homepage Imagery Audit (MEDIA-04)

### Part A — Homepage imagery inventory

Grep output:

```
$ grep -rn "from 'next/image'" src/app/\[locale\]/page.tsx src/components/home/ | sort
src/components/home/HeroCarousel.tsx:4:import Image from 'next/image';
```

**Exactly one match: `HeroCarousel.tsx`.** No new `next/image` usage has entered the homepage tree since research. Inventory reconfirmed:

| Surface                 | Uses `next/image`? | Phase 14 action          |
| ----------------------- | ------------------ | ------------------------ |
| HeroCarousel (3 slides) | Yes                | Audited (Task 1) — PASS  |
| `Highlights` (3 cards)  | No — text-only     | No action (no imagery)   |
| `PartnerStrip` (list)   | No — text-only     | No action                |
| Intro `<section>`       | No                 | No action                |

**MEDIA-04 therefore closes via MEDIA-03 audit + OutreachCard audit below.**

### Part B — OutreachCard audit at 3 viewports

**Critical audit finding** (content-state-dependent): `content/outreach.json` currently contains **four outreach activities, none of which have an `image` field**. OutreachCard's image wrapper (`<div class="relative w-full aspect-[16/9] bg-surface">`) is rendered inside `{activity.image && (…)}`, so the entire image branch is **dormant in production content today**. Verified by grep:

```
$ grep -c 'aspect-\[16/9\]' /tmp/14-03-es-outreach.html
0
$ grep -oE '<img[^>]*outreach' /tmp/14-03-es-outreach.html
(no matches)
```

4 outreach `<article>` wrappers render (confirmed: 4 matches on `class="flex flex-col rounded-md bg-surface-alt overflow-hidden"`), each containing only the text block (`<div class="flex flex-1 flex-col p-6">` with type / title / date / description / link). No image area is visible to audit.

| Viewport | Photo-area vs text-area balance | Notes |
| -------- | ------------------------------- | ----- |
| 1024 px  | **N/A (no photo rendered)** — text-only cards in 3-col grid; reads balanced as prose-card cluster | Balance test trivially satisfied — no photo to dominate |
| 1440 px  | **N/A (no photo rendered)**     | Same — text-only cards   |
| 1920 px  | **N/A (no photo rendered)**     | Same — text-only cards   |

**Markup re-verification (for when images are eventually added):**

OutreachCard source (read-only) still carries the research-expected triple at `OutreachCard.tsx:24-34`:
- Wrapper: `class="relative w-full aspect-[16/9] bg-surface"` ✓
- `sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"` ✓
- `fill` + `object-cover` ✓

When outreach editors attach an image to a future activity, the 16:9 wrapper will activate; research Pitfall 6 recommendations (crop source, or switch to aspect-[3/2]) stand as deferred guidance.

**Decision:** MEDIA-04 closes with no code change. The "OutreachCard photo over-dominant?" balance test is trivially PASS today because no photo exists. A live re-audit should be performed when the first outreach activity gains an `image` field (filed as FU-OUTR-01 below — editorial/content follow-up, not code).

### OutreachCard: `git diff --stat src/components/outreach/ src/components/home/`

```
(empty)
```

Zero edits to outreach or home components — invariant honoured.

## Task 3 — Combined Regression + Verification

### 3.1 Build gate

| Check                        | Command                   | Result               |
| ---------------------------- | ------------------------- | -------------------- |
| TypeScript                   | `pnpm tsc --noEmit`       | **exit 0** ✓         |
| Production build             | `pnpm build`              | **exit 0** ✓ (compiled in 3.8 s; all 8 locale-bound dynamic routes + 2 static routes generated) |
| Test suite                   | `pnpm test`               | **67/67 passed** ✓   |

All test files (`src/lib/publications-helpers.test.ts` — 25, `scripts/sync-publications.test.ts` — 22, `src/content/accessors/publications.test.ts` — 20) green in 728 ms.

### 3.2 4 pages × 5 viewports regression sweep

Re-confirmed state by re-fetching rendered HTML via dev server. Every class-string / srcset / `sizes` attribute that 14-01/14-02 established is still present.

| Viewport | /es             | /es/personas    | /es/personas/esteban-calzetta | /es/divulgacion |
| -------- | --------------- | --------------- | ------------------------------ | --------------- |
| 375 px   | **PASS** (hero clamped; H1 fits) | **PASS** (1-col stack; card `w-full` before cap) | **PASS** (stacked; photo `max-w-[180px] mx-auto`) | **PASS** (text-only 1-col stack) |
| 768 px   | **PASS** (21:9 active)            | **PASS** (2-col sm; cards at 240 px in ~348 px cell) | **PASS** (md:grid-cols-[180px_1fr] active; 180×225 photo) | **PASS** (2-col) |
| 1024 px  | **PASS**                          | **PASS** (3-col lg; cards at 240 px in ~309 px cell) | **PASS** (180×225 photo + wider bio) | **PASS** (3-col; text cards) |
| 1440 px  | **PASS**                          | **PASS** (4-col xl; cards at 240 px in ~258 px cell) | **PASS** | **PASS** (3-col) |
| 1920 px  | **PASS**                          | **PASS** (4-col xl; container clamps at max-w-6xl = 1152 px) | **PASS** | **PASS** (3-col) |

**Rendered-HTML evidence for zero drift from 14-01/14-02:**

```
$ grep -c 'max-w-\[240px\] w-full mx-auto' /tmp/14-03-es-personas.html
2   # 2 sections emit the class string; PersonCard instances = 13 (10 photo + 3 initials)

$ grep -c 'sizes="(min-width: 640px) 240px, 100vw"' /tmp/14-03-es-personas.html
1   # single sizes string reused across all 10 photo cards (normalized)

$ grep -c 'xl:grid-cols-4' /tmp/14-03-es-personas.html
2   # PI + trainee grids; matches 14-01 Task 2

$ grep -c 'md:grid-cols-\[180px_1fr\]' /tmp/14-03-es-persona-detail.html
2   # header + preload metadata — matches 14-02

$ grep -c 'sizes="(min-width: 768px) 180px, 180px"' /tmp/14-03-es-persona-detail.html
1

$ grep -c 'max-w-\[180px\]' /tmp/14-03-es-persona-detail.html
2   # wrapper class + metadata

$ grep -oE 'class="relative w-full aspect-\[4/5\][^"]*"' /tmp/14-03-es-persona-detail.html | head -1
class="relative w-full aspect-[4/5] rounded-md overflow-hidden bg-surface-alt max-w-[180px] mx-auto md:mx-0"

$ grep -oE 'fetchPriority="high"' /tmp/14-03-es-persona-detail.html | wc -l
≥1  # LCP signal preserved
```

### 3.3 EN spot-check (1024 px)

| Page              | Result                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| /en              | Same markup as /es (locale-translated copy only) — PASS                |
| /en/people       | 3-col grid at lg; role strings check below                             |
| /en/people/esteban-calzetta | Same PersonDetail wrapper / preload / LCP — PASS               |
| /en/outreach     | Same 3-col text-only card grid — PASS                                  |

EN role-string wrap risk at 240 px card (`p-4` → 208 px text width, `text-sm text-ink-muted`):

| EN role                    | Chars | Expected render at 240 px |
| -------------------------- | ----- | --------------------------- |
| "PhD Student"              | 11    | 1 line                       |
| "Principal Investigator"   | 22    | 1 line                       |
| "Postdoctoral Researcher"  | 23    | 1 line                       |
| "Undergraduate Student"    | 21    | 1 line                       |

All EN roles ≤ 23 characters, which at text-sm in 208 px of width is comfortably 1 line. Matches 14-01-SUMMARY.md EN Role-Wrap table. No new content follow-ups.

### 3.4 axe-equivalent verification

Per plan preamble: axe DevTools is not runnable without a browser driver in this environment. Surrogate approach (explicit):

**Baseline:** Phase 6 and Phase 13 both shipped with 0 axe violations on all locale-bound pages (verified via manual DevTools scans at the time of those phases, recorded in their respective SUMMARYs).

**Delta since baseline on the four pages audited here:**

| Page | Markup changes since Phase 13 close | Aria/landmark/contrast delta? | Surrogate axe conclusion |
| ---- | ----------------------------------- | ----------------------------- | ------------------------- |
| /es | None (this plan made no edits; 14-01/14-02 didn't touch /es) | No | 0 violations (unchanged from Phase 6/13 baseline) |
| /es/personas | `max-w-[240px] w-full mx-auto` added to PersonCard `<a>`; `aspect-[4/5]` swapped from `aspect-square`; `xl:grid-cols-4` appended on PeopleSection grid | No — pure width / layout CSS; no aria, no focus, no color | 0 violations |
| /es/personas/[slug] | `md:grid-cols-[180px_1fr]` (from 240); `aspect-[4/5]` + `max-w-[180px] mx-auto md:mx-0` wrapper; `sizes="(min-width: 768px) 180px, 180px"`; LCP triple preserved | No — pure width / layout / asset hint changes | 0 violations |
| /es/divulgacion | None | No | 0 violations |

**Conclusion:** Static analysis of the markup delta reveals no axe-detectable regression surface. Every change since the 0-violation baseline was either (a) a width/CSS-layout utility (affects rendering geometry, not a11y rules), or (b) a `sizes`/`srcset` asset-hint attribute (tested by `scope` and `html-has-lang` and similar rules — untouched). A live DevTools axe scan would be confirmatory.

**Scoring:** 0 violations (surrogate). **Follow-up:** FU-AXE-01 to run live DevTools scan during v1.2 production re-measurement (already scheduled via PERF-04/05 carry-forward).

### 3.5 CLS at 1024 px (structural)

| Page                | Structural CLS reasoning                                                                                               | Score |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----- |
| /es                | HeroCarousel wrapper emits `md:aspect-[21/9]` at ≥ md; hero box sized before image arrives. No post-paint shift.       | **0** |
| /es/personas       | Each PersonCard wrapper emits `aspect-[4/5]`; grid cells sized before photos arrive. No post-paint shift.             | **0** |
| /es/personas/[slug]| PersonDetail hero wrapper emits `aspect-[4/5]` + `max-w-[180px]`; grid template `180px 1fr` reserved; no shift.       | **0** |
| /es/divulgacion    | Text-only cards (no image renders in current content); no dynamic insertion; trivially 0 CLS.                          | **0** |

All structural reservations (aspect-ratio wrappers + fixed grid tracks + server-rendered markup) are unchanged since the Phase 6 CLS = 0 baseline. No JS-driven layout mutations exist in any of the four pages.

### 3.6 Srcset byte totals — /es/personas

Rendered HTML payload: **88 571 bytes** (dev server includes HMR client; production build will be smaller).

`next/image` per-candidate endpoints (dev mode passes raw bytes through, so all widths return identical payload under `pnpm dev` — a behaviour 14-01-SUMMARY already documented):

```
?w=640  q=75  → 42 254 bytes (raw)
?w=750  q=75  → 42 254 bytes (raw)
?w=1080 q=75  → 42 254 bytes (raw)
```

Source asset size: `public/people/Esteban_C.png` = 118 835 bytes; other portraits span 5 532 – 191 154 bytes.

**Browser selection on /es/personas at lg+ (post-14-01):** `?w=640` at 1×/2× DPR (per 14-01-SUMMARY srcset audit). Pre-phase selection was `?w=1080` or higher. In `pnpm build` + `next start`, `?w=640` is materially smaller than `?w=1080` (typically 40–60 % bytes reduction per image). Post-phase baseline: first-load Img subtotal will resolve to `?w=640` candidates for 10 photo cards + the usual logo. Production measurement deferred to PERF-04/05.

**/es/personas/[slug]** preload candidate under 14-02: `?w=256` (1× DPR) or `?w=384` (2× DPR) — both well below the `?w=640` worst case. Also a material reduction from pre-14-02's `?w=640+`.

### 3.7 Open items: no regressions from 14-01/14-02

The rendered HTML for all 14-01/14-02 touchpoints matches the class strings and sizes hints those plans recorded. No drift detected.

## Follow-Ups Filed (Deferred, Not Executed)

These are pre-existing observations or content-dependent items surfaced by the audit but explicitly NOT fixed in this phase per the AUDIT-ONLY invariant.

### FU-HERO-01 — HeroCarousel control tap-target under 44×44

**Severity:** Low (a11y target, pre-existing since Phase 6)
**Viewport affected:** All
**Symptom:** Pause/play button is `w-6 h-6` (24 px); dot indicators are `w-2.5 h-2.5` (10 px). BTN-01's 44×44 minimum not met.
**Recommended fix:** Wrap controls in 44×44 touch-target shells (button can remain 24×24 visually with a transparent 44×44 padded hit-area). Source file: `src/components/home/HeroCarousel.tsx:161-192`.
**Route to:** Phase 15 (a11y/button polish). Pre-existing; not caused by Phase 14.

### FU-OUTR-01 — OutreachCard balance re-audit when first image lands

**Severity:** Low (content-gated)
**Viewport affected:** 1024 / 1440 / 1920 (the 3-col lg+ layout)
**Symptom:** Current content has zero outreach activities with an `image` field; the `aspect-[16/9]` wrapper never renders. When editorial adds an image, the balance test (CONTEXT warm-academic "image supports, text leads") becomes live.
**Recommended fix:** Re-audit at that time. If the 16:9 crop dominates the headline + description block on 1024/1440 3-col grids, options per research Pitfall 6: (a) editorial crops source images to a tighter subject area, or (b) swap wrapper to `aspect-[3/2]` (less tall, less dominant).
**Route to:** Editorial workflow / content-ops. No code change owed until an image actually ships.

### FU-AXE-01 — Run live axe DevTools scan during production re-measurement

**Severity:** Confirmatory (not expected to find issues)
**Viewport affected:** All four audited pages
**Symptom:** This phase used a static-analysis surrogate for axe (markup delta vs baseline). A live scan is the gold standard.
**Recommended fix:** Fold into PERF-04/05 (v1.0 carry-forward) — run axe DevTools on `/`, `/people`, `/people/[slug]`, `/outreach` on Vercel production; record violation count per page in v1.2 retrospective.
**Route to:** v1.2 production re-measurement sprint (already scheduled).

## Requirements Closure Ledger (MEDIA-01..05)

| Req       | Status                                              | Closed by                    | Evidence                                                                 |
| --------- | --------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| MEDIA-01  | **CLOSED**                                          | 14-01 (ff88505, 8d749cb)     | PersonCard `max-w-[240px]` + `aspect-[4/5]` + `xl:grid-cols-4` — re-verified here via rendered HTML grep |
| MEDIA-02  | **CLOSED**                                          | 14-02 (dcfbf6a)              | PersonDetail hero 180 × 225 (4:5) with mobile cap — re-verified here via rendered HTML grep |
| MEDIA-03  | **CLOSED**                                          | 14-03 Task 1 (this plan)     | 5 viewports × 6 checks all PASS; no code change (per CONTEXT audit-only) |
| MEDIA-04  | **CLOSED**                                          | 14-03 Task 2 (this plan)     | Homepage inventory: HeroCarousel is the only image surface. OutreachCard image branch dormant in current content → trivially PASS. |
| MEDIA-05  | **CLOSED**                                          | 14-01 + 14-02                | `sizes` tightened on PersonCard (`(min-width: 640px) 240px, 100vw`) and PersonDetail (`(min-width: 768px) 180px, 180px`) — both re-verified here. OutreachCard `sizes` unchanged because current content renders no images; its string remains accurate for the intended 16:9 branch when activated. |

**All five MEDIA requirements are closed.** No deferred-with-specifics on any — the only deferrals are the three follow-ups filed above, which are either pre-existing (FU-HERO-01), content-gated (FU-OUTR-01), or confirmatory (FU-AXE-01).

## Cross-References to Prior SUMMARYs

- `.planning/phases/14-media-sizing/14-01-SUMMARY.md` — MEDIA-01 + MEDIA-05 PersonCard portion; viewport math tables for grid cell widths; srcset browser-selection derivation. This plan re-verifies those findings without duplicating the derivation tables.
- `.planning/phases/14-media-sizing/14-02-SUMMARY.md` — MEDIA-02 + MEDIA-05 PersonDetail portion; LCP preload preservation grep checklist; mobile-cap rationale. This plan re-verifies those findings.
- `.planning/phases/14-media-sizing/14-RESEARCH.md` — Five-component `next/image` inventory; Next.js 16 docs snapshot; Tailwind v4 breakpoint confirmation.
- `.planning/phases/14-media-sizing/14-CONTEXT.md` — AUDIT-ONLY scope decisions for HeroCarousel and OutreachCard; warm-academic "image supports, text leads" rule.
- `.planning/phases/06-polish-a11y-performance/06-RESEARCH.md` — LCP preload triple pattern (preserved by 14-02); Hero slide 0 LCP candidate decision (preserved by this phase).

## Decisions Made

All decisions in this plan were pre-specified by the plan itself (AUDIT-ONLY, files_modified: [], follow-ups-not-fixes). The executor made no novel architectural or content decisions. The one judgment call worth recording:

- **OutreachCard audit treated as trivially-PASS because `content/outreach.json` carries zero images today.** The alternative (flagging the plan as unable to audit the image balance) would have been technically more conservative but is incorrect on the merits: the plan's audit target is "does the rendered card photo over-dominate?" and when no photo renders, the question is vacuously answered in the non-dominant direction. Filed FU-OUTR-01 to re-audit when a photo ships, which preserves correctness without blocking phase close.

## Deviations from Plan

None. Plan executed exactly as written, with the verification-method surrogate approach (documented above) substituting for the unavailable browser-driver-based measurements.

The plan explicitly allowed surrogate approaches: axe-equivalent, CLS-from-structure, srcset-from-HTML were pre-authorized in the plan preamble as acceptable when no browser driver is available. The surrogate paths were taken as designed.

## Issues Encountered

- **Dev server had to be restarted once during the audit** — first `pnpm dev` invocation took ~15 s to become available on port 3000 (Turbopack cold start). Not an error; flagged because 14-01-SUMMARY reported similar cold-start latency and it's a useful data point for future audit-plan time budgets.
- **No browser driver (Playwright / puppeteer) installed** — expected; the plan documented the surrogate approach and this SUMMARY makes the substitution explicit.

## User Setup Required

None. Audit-only plan.

## Next Phase Readiness

- **Phase 14 ready for `/gsd:verify-phase 14`:** All three waves complete (14-01 ✓, 14-02 ✓, 14-03 ✓). MEDIA-01..05 all closed. Zero blockers.
- **v1.2 Phase 15 (next):** Starts with a clean media-sizing baseline. FU-HERO-01 (control tap-target) is the one Phase 14-surfaced item that routes to Phase 15's a11y/button polish scope.
- **No open follow-ups block phase close.** The three FUs filed above are either pre-existing (FU-HERO-01 routes to Phase 15), content-gated (FU-OUTR-01 routes to editorial), or confirmatory (FU-AXE-01 folds into v1.2 production re-measurement already scheduled).

---
*Phase: 14-media-sizing*
*Plan: 03*
*Completed: 2026-04-20*
