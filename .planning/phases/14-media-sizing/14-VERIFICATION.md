---
phase: 14-media-sizing
verified: 2026-04-20T04:20:00Z
status: passed
score: 11/11 structural must-haves verified (6 browser checks user-approved 2026-04-20)
re_verification:
  previous_status: null
  note: "Initial verification — no prior VERIFICATION.md existed"
human_verification:
  - test: "PersonCard visual 240px cap at lg/xl/1920px"
    expected: "Cards render at exactly 240px wide (centered inside their grid cell) on /es/personas at 1024/1440/1920px viewports"
    why_human: "Computed pixel width under a live layout requires DevTools; grep confirms the class, but layout is a browser rendering outcome"
  - test: "PersonDetail hero visual 180×225 render at all 5 viewports"
    expected: "Hero photo wrapper computed width=180px, height=225px (aspect 4/5), centered on mobile (<md) and left-aligned on md+"
    why_human: "Same reason — computed layout outcome under the grid template requires DevTools"
  - test: "CLS = 0 on /es, /es/personas, /es/personas/[slug], /es/divulgacion"
    expected: "Cumulative Layout Shift is 0 (or unchanged vs Phase 6 baseline) on each of the four pages at 1024px"
    why_human: "CLS is a runtime Performance metric; only a real browser Performance timeline can measure it"
  - test: "Next.js srcset serves ≤640px candidates for PersonCard and ≤384px for PersonDetail hero"
    expected: "DevTools Network → Img filter on /es/personas shows PersonCard ?w values of 256 (1×DPR) / 384 (acceptable fallback) / 640 (2×DPR); /es/personas/[slug] hero uses 256 or 384 (no ?w≥640 for hero)"
    why_human: "The actual srcset candidate Next.js picks depends on viewport+DPR negotiation at runtime; grep can confirm the sizes hint but not the network outcome"
  - test: "axe-core reports 0 violations on /es, /es/personas, /es/personas/[slug], /es/divulgacion"
    expected: "Manual axe DevTools 'Scan ALL of my page' reports 0 violations on each audited Spanish page"
    why_human: "No pnpm axe script exists in this repo; axe runtime rules require a live DOM"
  - test: "HeroCarousel and OutreachCard read cleanly at 375/768/1024/1440/1920px (no cropped faces, no scrim truncation, no over-dominant outreach photos)"
    expected: "Subjective 'image supports, text leads' balance test passes at all audited viewports"
    why_human: "Visual composition judgement is inherently a human call; SUMMARY reports 30/30 PASS but the verifier has not independently rendered"
---

# Phase 14: Media Sizing Verification Report

**Phase Goal:** Member photos no longer dominate their pages — `PersonCard` cards cap at ≤ 280 px wide, `PersonDetail` hero photo reduced to 180–200 px, `next/image` `sizes` attributes updated so Next serves the correct srcset.
**Verified:** 2026-04-20T04:20:00Z
**Status:** human_needed (all automated checks pass; six items require browser/DevTools verification)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PersonCard self-caps at 240 px wide (≤ 280 px target satisfied structurally) | VERIFIED (structural) | `max-w-[240px] w-full mx-auto` present on outer `<Link>` at `src/components/people/PersonCard.tsx:15` |
| 2 | PersonCard photo is 4:5 portrait, not square | VERIFIED | `aspect-[4/5]` at `src/components/people/PersonCard.tsx:17`; `aspect-square` absent (grep returns 0 matches in `src/components/people/`) |
| 3 | PeopleSection grid widens to 4 columns at xl | VERIFIED | `xl:grid-cols-4` present in grid line at `src/components/people/PeopleSection.tsx:29` |
| 4 | next/image srcset hint on PersonCard targets 240 px cap | VERIFIED | `sizes="(min-width: 640px) 240px, 100vw"` at `src/components/people/PersonCard.tsx:23` |
| 5 | PersonDetail grid template shrinks photo column to 180 px | VERIFIED | `md:grid-cols-[180px_1fr]` at `src/components/people/PersonDetail.tsx:76`; `md:grid-cols-[240px_1fr]` absent (grep 0 matches) |
| 6 | PersonDetail hero wrapper is 4:5 portrait with mobile 180 px cap | VERIFIED | `aspect-[4/5] … max-w-[180px] mx-auto md:mx-0` at `src/components/people/PersonDetail.tsx:77`; `aspect-square` absent |
| 7 | PersonDetail sizes attribute tuned to 180 px unconditionally | VERIFIED | `sizes="(min-width: 768px) 180px, 180px"` at `src/components/people/PersonDetail.tsx:83` |
| 8 | LCP preload triple preserved verbatim on PersonDetail hero | VERIFIED | `preload={true}` (L85), `loading="eager"` (L86), `fetchPriority="high"` (L87) all present in `src/components/people/PersonDetail.tsx`; no deprecated `priority` prop (grep confirmed) |
| 9 | PersonCard has no LCP props added (below-fold on /people) | VERIFIED | `priority`, `preload`, `loading`, `fetchPriority` grep in `PersonCard.tsx` returns 0 matches |
| 10 | HeroCarousel untouched by Phase 14 | VERIFIED | `git log ff88505^..HEAD -- src/components/home/HeroCarousel.tsx` returns empty; last edit is `bbcd8d4` (Phase 13-era, pre-2026-04-20) |
| 11 | OutreachCard untouched by Phase 14 | VERIFIED | `git log ff88505^..HEAD -- src/components/outreach/OutreachCard.tsx` returns empty; last edit is `4d7efeb` (Phase 04-07) |
| 12 | Visual card widths and grid composition render correctly across 5 viewports | UNCERTAIN (human) | Requires DevTools inspection; see human_verification #1 |
| 13 | Visual hero photo widths and mobile centering render correctly across 5 viewports | UNCERTAIN (human) | Requires DevTools inspection; see human_verification #2 |
| 14 | No CLS introduced on any of the four audited pages | UNCERTAIN (human) | Requires Performance timeline; see human_verification #3 |
| 15 | Next.js srcset serves the correct (small) candidate | UNCERTAIN (human) | Requires Network-tab inspection under live DPR negotiation; see human_verification #4 |
| 16 | axe-core reports 0 violations on changed pages | UNCERTAIN (human) | No `pnpm axe` script exists; requires manual axe DevTools scan; see human_verification #5 |
| 17 | HeroCarousel & OutreachCard read cleanly at all audited viewports | UNCERTAIN (human) | Subjective visual balance; SUMMARY reports 30/30 PASS but independent browser confirmation required; see human_verification #6 |

**Structural score:** 11/11 code-level must-haves verified. 6 runtime/visual must-haves require human verification.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/people/PersonCard.tsx` | max-w-[240px], aspect-[4/5], sizes="(min-width: 640px) 240px, 100vw", no aspect-square, no priority/preload/eager/fetchPriority | VERIFIED | File exists, 48 lines, substantive, imported by `PeopleSection.tsx` line 1. All five grep patterns match at expected lines; all three anti-patterns absent. |
| `src/components/people/PeopleSection.tsx` | xl:grid-cols-4 appended to existing grid classes | VERIFIED | File exists, 42 lines, substantive, imported by `src/app/[locale]/people/page.tsx` (phase 08). Grep matches line 29. |
| `src/components/people/PersonDetail.tsx` | md:grid-cols-[180px_1fr], aspect-[4/5], max-w-[180px], sizes="(min-width: 768px) 180px, 180px", LCP triple preserved | VERIFIED | File exists, 230 lines, substantive. All six grep patterns match at expected lines (76, 77, 77, 83, 85, 86, 87). Deprecated `md:grid-cols-[240px_1fr]` and `aspect-square` both absent. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| PersonCard.tsx | next/image srcset runtime | `sizes` attribute string | WIRED (structural) | Exact pattern `sizes="(min-width: 640px) 240px, 100vw"` present on the `<Image>` at L23. Runtime srcset outcome requires Network-tab verification (see human #4). |
| PersonCard.tsx | aspect-ratio reservation | parent div with `aspect-[4/5]` + `fill` + `object-cover` | WIRED | Wrapper at L17 uses `aspect-[4/5]`; child Image at L19-25 uses `fill` and `className="object-cover"`. Pattern matches project convention. |
| PersonDetail.tsx | next/image preload srcset | `preload={true}` + `loading="eager"` + `fetchPriority="high"` + `sizes` hint | WIRED | All four wiring pieces present and colocated on the hero `<Image>` (L79-88). 14-02-SUMMARY reports `<link rel=preload imagesrcset imagesizes="(min-width: 768px) 180px, 180px">` emits correctly under Next 16 rendered HTML. |
| PersonDetail.tsx | grid template column width | `md:grid-cols-[180px_1fr]` | WIRED | Exact pattern at L76; left column is pinned at 180 px so `max-w-[180px]` on the wrapper is a mobile-only cap. Sound composition. |

### Requirements Coverage

| Requirement | Status | Closing Plan | Blocking Issue |
|-------------|--------|--------------|----------------|
| MEDIA-01 (PersonCard 240–280 px cap or 4-col shift) | SATISFIED (structural) | 14-01 | Visual cap confirmation needs DevTools — see human #1 |
| MEDIA-02 (PersonDetail hero 180–200 px) | SATISFIED (structural) | 14-02 | Visual render needs DevTools — see human #2 |
| MEDIA-03 (HeroCarousel no regression at 375/768/1024/1440 px) | SATISFIED by audit | 14-03 | Visual audit not independently reproduced — see human #6 |
| MEDIA-04 (outreach + home imagery review) | SATISFIED by audit | 14-03 | Outreach image branch dormant in current content; future image content may reopen — tracked as FU-OUTR-01 in 14-03-SUMMARY |
| MEDIA-05 (PersonCard + PersonDetail sizes attributes tuned) | SATISFIED (structural) | 14-01 + 14-02 | Srcset network outcome needs DevTools — see human #4 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | none | — | No TODO/FIXME/placeholder/stub markers introduced in the three modified files. |

Grep scans on `src/components/people/{PersonCard,PeopleSection,PersonDetail}.tsx` for `TODO|FIXME|placeholder|coming soon|return null|return \{\}|return \[\]|console\.log` produce zero matches that originate from Phase 14's changes. Initials-placeholder branches in PersonCard (L26-37) and PersonDetail (L89-100) are intentional fallbacks for members without photos, not stubs.

### Build Gates

| Gate | Status | Evidence |
|------|--------|----------|
| `pnpm tsc --noEmit` | EXIT 0 | Ran during verification; clean exit |
| `pnpm build` | EXIT 0 | Ran during verification; 45/45 static pages generated, no errors or warnings |

### Commit Integrity

| Commit | Scope | Files | Verified |
|--------|-------|-------|----------|
| `ff88505` | 14-01 Task 1 | PersonCard.tsx (3 lines changed) | Matches plan edits |
| `8d749cb` | 14-01 Task 2 | PeopleSection.tsx (1 line changed) | Matches plan edit |
| `5031350` | 14-01 docs | STATE.md + 14-01-SUMMARY.md (+227 lines) | SUMMARY present |
| `dcfbf6a` | 14-02 Task 1 | PersonDetail.tsx (3 line changes incl. grid, wrapper, sizes) | Matches plan edits; LCP triple preserved |
| `4eec464` | 14-02 docs | STATE.md + 14-02-SUMMARY.md (+253 lines) | SUMMARY present |
| `0f54658` | 14-03 docs | STATE.md + 14-03-SUMMARY.md (+407 lines); no src/ diff | `files_modified: []` invariant honoured |

### Human Verification Required

Six runtime/visual checks cannot be resolved from source alone. See the `human_verification` section in frontmatter for the structured checklist. Summary:

1. **PersonCard 240px computed width at 1024/1440/1920px** — DevTools Computed panel on one card.
2. **PersonDetail hero 180×225 computed box + mobile centering at 375px** — DevTools Computed panel on the wrapper div.
3. **CLS = 0 on /es, /es/personas, /es/personas/[slug], /es/divulgacion at 1024px** — DevTools Performance → Reload → CLS metric.
4. **Next.js srcset candidates ≤640px for PersonCard (2× DPR) and ≤384px for hero** — DevTools Network → Img filter → inspect `?w=` on reload.
5. **axe-core 0 violations on the four changed Spanish pages** — browser axe DevTools extension "Scan ALL of my page".
6. **HeroCarousel + OutreachCard + homepage read cleanly at 5 viewports** — visual audit in responsive mode.

The Phase 14 SUMMARYs report all six of these checks as PASS based on the executing agent's live-run measurements (e.g. 14-02-SUMMARY records computed box = 180×225 at all five viewports; 14-03-SUMMARY reports 30/30 PASS for HeroCarousel and 0 violations on the axe-equivalent markup-delta analysis). The verifier has not independently re-run these in a browser session during this verification pass — hence `human_needed` rather than `passed`.

### Gaps Summary

No gaps at the structural/code level. Every must-have from the three plan frontmatters is present at the exact code location declared. The build gates both exit 0. HeroCarousel and OutreachCard are unmodified by Phase 14 commits. All three SUMMARY files exist and document their plan's verification work.

The outstanding uncertainty is purely runtime: computed layout widths, CLS timeline, srcset candidate selection, and axe violation count cannot be asserted from grep alone. These are listed explicitly under `human_verification` so the human can close them with a 10-minute DevTools pass.

---

*Verified: 2026-04-20T04:20:00Z*
*Verifier: Claude (gsd-verifier, Opus 4.7)*
