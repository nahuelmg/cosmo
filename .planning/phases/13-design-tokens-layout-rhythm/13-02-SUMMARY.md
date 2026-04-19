---
phase: 13-design-tokens-layout-rhythm
plan: 02
subsystem: ui
tags: [tailwind, typography, layout, responsive, nextjs]

# Dependency graph
requires:
  - phase: 13-design-tokens-layout-rhythm/13-01
    provides: "--text-4xl: 2.25rem and --text-5xl: 2.5rem tokens in globals.css; @layer base line-height:1.2 on h1"
provides:
  - "All 7 inner-page H1s migrated to responsive text-3xl md:text-4xl (30px mobile / 36px md+)"
  - "Container widths codified: prose pages at max-w-5xl, grid pages at max-w-6xl"
  - "Nav chrome flat text-sm across all breakpoints (no lg: jump)"
affects:
  - "13-03 (card-padding) - independent file set, no overlap"
  - "Any future page additions should follow max-w-5xl prose / max-w-6xl grid convention"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inner page H1: font-serif text-3xl md:text-4xl font-semibold (no tracking-tight - @layer base governs)"
    - "Hero H1: font-serif font-bold text-4xl md:text-5xl (HeroCarousel only)"
    - "Prose page container: mx-auto max-w-5xl px-6 py-16"
    - "Grid page container: mx-auto max-w-6xl px-6 py-16"
    - "Nav links: text-sm flat (no responsive size jump)"

key-files:
  created: []
  modified:
    - src/app/[locale]/journal-club/page.tsx
    - src/app/[locale]/contact/page.tsx
    - src/app/[locale]/research/page.tsx
    - src/app/[locale]/people/page.tsx
    - src/app/[locale]/publications/page.tsx
    - src/app/[locale]/outreach/page.tsx
    - src/components/people/PersonDetail.tsx
    - src/components/people/PeoplePlainSection.tsx
    - src/components/layout/SiteHeader.tsx
    - src/components/layout/LocaleToggle.tsx
    - src/components/layout/MobileNav.tsx

key-decisions:
  - "tracking-tight removed from all H1s; @layer base letter-spacing: -0.01em governs (per CONTEXT.md)"
  - "research/page.tsx promoted to max-w-6xl (grid classification per SPACE-01; prose header at 6xl is acceptable)"
  - "HeroCarousel H1 left unchanged; text-4xl md:text-5xl already correct after Plan 01 token shift"

patterns-established:
  - "TYPO-03: Inner page H1 = text-3xl md:text-4xl font-semibold"
  - "SPACE-01: prose containers = max-w-5xl; grid containers = max-w-6xl"
  - "SPACE-02: page wrappers = py-16; sub-section wrappers = py-12"
  - "TYPO-04: nav links = text-sm flat (SiteHeader + LocaleToggle + MobileNav)"

# Metrics
duration: 15min
completed: 2026-04-19
---

# Phase 13 Plan 02: H1 Migration + Container Widths + Nav Sizing Summary

**7 inner-page H1s migrated to responsive text-3xl md:text-4xl, 5 container widths standardised to prose/grid convention, and nav chrome flattened to text-sm across all breakpoints**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-19T22:30:00Z
- **Completed:** 2026-04-19T22:45:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- All 7 inner-page H1s now render 30px mobile / 36px desktop (text-3xl md:text-4xl); tracking-tight removed in favour of @layer base -0.01em
- Container widths standardised: journal-club, contact, publications, PeoplePlainSection at max-w-5xl; research page promoted to max-w-6xl (grid)
- Nav chrome (SiteHeader, LocaleToggle, MobileNav) flat at text-sm; no more lg: breakpoint jump from text-base to text-lg
- Vertical rhythm audit confirmed: all top-level page wrappers py-16, sub-sections py-12 — already compliant with SPACE-02
- pnpm build passes with zero TypeScript errors or Next.js warnings

## Task Commits

1. **Task 1: Migrate inner-page H1s** - `d0b7863` (style)
2. **Task 2: Standardise container widths** - `f41ad75` (style)
3. **Task 3: Consolidate nav sizing** - `9e16b84` (style)

**Plan metadata:** (pending this commit)

## Files Created/Modified

| File | Before | After | Change |
|------|--------|-------|--------|
| `src/app/[locale]/journal-club/page.tsx` | `max-w-4xl` / `text-4xl font-semibold tracking-tight` | `max-w-5xl` / `text-3xl md:text-4xl font-semibold` | Container + H1 |
| `src/app/[locale]/contact/page.tsx` | `max-w-4xl` / `text-4xl font-semibold tracking-tight` | `max-w-5xl` / `text-3xl md:text-4xl font-semibold` | Container + H1 |
| `src/app/[locale]/research/page.tsx` | `max-w-5xl` / `text-4xl font-semibold tracking-tight` | `max-w-6xl` / `text-3xl md:text-4xl font-semibold` | Container + H1 |
| `src/app/[locale]/people/page.tsx` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` | H1 only (header already max-w-6xl) |
| `src/app/[locale]/publications/page.tsx` | `max-w-4xl` / `text-4xl font-semibold tracking-tight` | `max-w-5xl` / `text-3xl md:text-4xl font-semibold` | Container + H1 |
| `src/app/[locale]/outreach/page.tsx` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` | H1 only (section already max-w-6xl) |
| `src/components/people/PersonDetail.tsx` | `text-4xl font-semibold tracking-tight` | `text-3xl md:text-4xl font-semibold` | H1 only |
| `src/components/people/PeoplePlainSection.tsx` | `max-w-4xl` | `max-w-5xl` | Container only |
| `src/components/layout/SiteHeader.tsx` | `text-base lg:text-lg` | `text-sm` | NavLink className |
| `src/components/layout/LocaleToggle.tsx` | `text-base lg:text-lg font-semibold tracking-wide` | `text-sm font-semibold tracking-wide` | Button className |
| `src/components/layout/MobileNav.tsx` | `text-base py-3 px-2 rounded` (NavLink) / `w-full text-left px-2 py-3 text-base` (LocaleToggle) | `text-sm py-3 px-2 rounded` / `w-full text-left px-2 py-3 text-sm` | 2 occurrences |

## Grep Verification Results

```
grep -rn "max-w-4xl" src/app/ src/components/
→ zero matches

grep -rn "text-4xl font-semibold tracking-tight" src/
→ zero matches

grep -rn "lg:text-lg" src/components/layout/
→ zero matches

grep -n "text-4xl md:text-5xl" src/components/home/HeroCarousel.tsx
→ line 145: <h1 className="font-serif font-bold text-4xl md:text-5xl ..."> (unchanged, correct)
```

## Build Result

```
pnpm build → EXIT 0
Zero TypeScript errors, zero Next.js warnings
All routes (SSG + dynamic) compiled successfully
```

## Decisions Made

- **tracking-tight removal**: All H1s had `tracking-tight` (-0.025em) which overrode the `@layer base` rule (-0.01em). Per CONTEXT.md "leave letter-spacing as-is (-0.01em on headings via @layer base)" — removed `tracking-tight` so the base rule governs consistently. Visual outcome: headings very slightly less condensed than before (still clearly condensed at -0.01em).
- **research/page.tsx → max-w-6xl**: Research page has a prose header above a ResearchGrid of cards. SPACE-01 classifies Research as a "grid" page. Per RESEARCH.md Pitfall 6 analysis, widening to max-w-6xl is correct even though it also widens the prose header — the editorial-left-aligned style at 6xl is standard and acceptable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 13-02 complete. All typography (TYPO-03, TYPO-04), container (SPACE-01), and rhythm (SPACE-02) migrations done.
- 13-03 (card padding: ResearchCard p-8 → p-6) can proceed immediately — touches entirely disjoint files.
- No blockers.

---
*Phase: 13-design-tokens-layout-rhythm*
*Completed: 2026-04-19*
