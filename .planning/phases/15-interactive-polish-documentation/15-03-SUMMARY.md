---
phase: 15-interactive-polish-documentation
plan: "03"
subsystem: ui
tags: [tailwind, accessibility, wcag, focus-ring, publications, pills, transition]

# Dependency graph
requires:
  - phase: 15-interactive-polish-documentation
    provides: BTN-02/BTN-04/MICRO-02 audit findings and WCAG inline-text exception decision
provides:
  - SourceFilter pills at px-3.5 py-1.5 with transition-colors duration-150 and full ring-offset pattern
  - PublicationEntry 3 focus-ring sites with ring-offset-2 ring-offset-surface
  - Hoisted base const in SourceFilter preventing active/inactive drift
affects:
  - 15-06-BTN-06 (documents the WCAG 2.5.5 inline-text exception for PublicationEntry source pill)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hoist shared Tailwind class strings to a base const to prevent active/inactive branch drift"
    - "WCAG 2.5.5 inline-text exception: inline metadata chips in citation context do not require 24px+ padding bump"

key-files:
  created: []
  modified:
    - src/components/publications/SourceFilter.tsx
    - src/components/publications/PublicationEntry.tsx

key-decisions:
  - "SourceFilter active/inactive branches unified via hoisted base const — prevents drift on future edits"
  - "PublicationEntry source pill padding (px-2 py-0.5) deliberately NOT bumped — WCAG 2.5.5 inline-text exception applies to inline citation metadata chips"

patterns-established:
  - "base const pattern: hoist shared multi-class strings above map() to prevent per-branch drift"
  - "ring-offset-2 ring-offset-surface required on all interactive elements on light cream (surface) background"

# Metrics
duration: 8min
completed: 2026-04-20
---

# Phase 15 Plan 03: Publications Pills + Rings Summary

**SourceFilter bumped to px-3.5 py-1.5 with transition-colors duration-150 via hoisted base const; all 5 focus-ring sites in publication components gain ring-offset-2 ring-offset-surface**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-20T01:57:00Z
- **Completed:** 2026-04-20T02:05:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- BTN-04 closed: SourceFilter pills bumped from px-3 py-1 to px-3.5 py-1.5 (~36px visual height per REQUIREMENTS)
- MICRO-02 closed: transition-colors duration-150 added to both SourceFilter pill branches (tone toggle now crossfades smoothly)
- BTN-02 ring-offset pass: all 5 focus-ring sites in this slice (SourceFilter base const + PublicationEntry lines 64/87/97) include ring-offset-2 ring-offset-surface
- Refactor: SourceFilter active/inactive branches unified via hoisted base const — prevents future drift
- WCAG exception documented: PublicationEntry inline source pill (px-2 py-0.5) intentionally not bumped per planner decision (RESEARCH open-question #3)

## Task Commits

Each task was committed atomically:

1. **Task 1: SourceFilter pill sizing + transition + ring offset** - `17c52ff` (feat)
2. **Task 2: PublicationEntry add ring offset to 3 focus sites** - `9d7e64f` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/components/publications/SourceFilter.tsx` — Hoisted base const with px-3.5 py-1.5, transition-colors duration-150, ring-offset-2 ring-offset-surface; both active/inactive branches use base + tone
- `src/components/publications/PublicationEntry.tsx` — Added focus-visible:ring-offset-2 focus-visible:ring-offset-surface to source pill link (line 64), arXiv link (line 87), DOI link (line 97)

## Final SourceFilter base const

```ts
const base = 'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface';
```

## PublicationEntry source pill — WCAG inline-text exception

Source pill padding `px-2 py-0.5` was **NOT** changed. Per RESEARCH.md open-question #3 (planner decision): the pill is an inline-flex metadata chip in citation context (~5 per publication entry), clearly inline-text. WCAG 2.5.5 inline-text exception applies. The exemption is formally documented in plan 15-06 (BTN-06).

## Decisions Made

- Hoisted SourceFilter classes to `base` const rather than repeating on both branches — prevents drift when contributors edit active branch without updating inactive branch
- PublicationEntry source pill not padding-bumped: WCAG 2.5.5 inline-text exception per planner decision (RESEARCH open-question #3); documented in 15-06 BTN-06

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BTN-04, MICRO-02 closed
- All 5 publication-component focus-ring sites now have ring-offset-surface
- Drift-gate passes: zero ring-accent-ring sites in these files lack ring-offset-surface
- Ready for remaining Phase 15 plans (BTN-05 onwards)

---
*Phase: 15-interactive-polish-documentation*
*Completed: 2026-04-20*
