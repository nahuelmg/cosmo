---
phase: 13-design-tokens-layout-rhythm
plan: 03
subsystem: ui
tags: [tailwind, spacing, cards, SPACE-03, padding]

# Dependency graph
requires:
  - phase: 13-01
    provides: design tokens (OKLCH, spacing scale)
provides:
  - ResearchCard compliant with SPACE-03 two-tier padding (p-6)
  - Audit confirmation: PersonCard (p-4), OutreachCard (p-6), SessionRow (py-5) already compliant
affects: [any future card component additions should follow the dense/spacious tier rule]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SPACE-03 two-tier card padding: dense = p-4 (grid cards), spacious = p-6 (feature cards), flat across breakpoints"

key-files:
  created: []
  modified:
    - src/components/research/ResearchCard.tsx

key-decisions:
  - "p-8 → p-6 on ResearchCard: aligns with spacious tier; p-8 was out-of-spec"
  - "No codified CSS class for tiers (e.g. .card-spacious) — CONTEXT.md explicitly declines that abstraction"
  - "No responsive padding variants — CONTEXT.md locks card padding as flat across breakpoints"

patterns-established:
  - "SPACE-03 two-tier rule: dense (p-4) for grid/thumbnail cards, spacious (p-6) for feature/article cards"

# Metrics
duration: 5min
completed: 2026-04-19
---

# Phase 13 Plan 03: Card Padding Audit Summary

**ResearchCard reduced from p-8 to p-6; all four SPACE-03 candidate components audited and confirmed compliant with the two-tier dense/spacious rule.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-19T22:25:00Z
- **Completed:** 2026-04-19T22:30:00Z
- **Tasks:** 2 completed (1 edit + 1 read-only audit)
- **Files modified:** 1

## Accomplishments

- Applied SPACE-03: ResearchCard outer wrapper changed from `p-8` (32px) to `p-6` (24px)
- Confirmed all four card/row components now comply with the two-tier padding convention
- Build passes (45/45 static pages, 0 errors)

## Task Commits

1. **Task 1: Reduce ResearchCard padding p-8 → p-6** - `c6cb2a4` (refactor)
2. **Task 2: Audit PersonCard, OutreachCard, SessionRow** - read-only, no commit

**Plan metadata:** TBD (docs: complete card-padding-audit plan)

## ResearchCard Change

| Element | Before | After |
|---|---|---|
| Outer `<article>` wrapper | `p-8` (32px) | `p-6` (24px) |

```tsx
// Before
<article aria-labelledby={`research-${id}`} className="rounded-md bg-surface-alt p-8">

// After
<article aria-labelledby={`research-${id}`} className="rounded-md bg-surface-alt p-6">
```

No other classes were touched.

## Audit: SPACE-03 Compliance Table

| Component | File | Padding Class | Tier | Compliant? |
|---|---|---|---|---|
| PersonCard | `src/components/people/PersonCard.tsx:39` | `p-4` | Dense (grid card) | Yes |
| OutreachCard | `src/components/outreach/OutreachCard.tsx:36` | `p-6` | Spacious (feature card) | Yes |
| SessionRow | `src/components/journal-club/SessionRow.tsx:31` | `py-5` | Dense (list row — py-* not p-*) | Yes |
| ResearchCard | `src/components/research/ResearchCard.tsx:21` | `p-6` (after edit) | Spacious (feature card) | Yes |

Note on OutreachCard: the `p-6` lives on the inner content `<div>` (not the `<article>` wrapper) because the card has an optional `16/9` image above. The article itself is `overflow-hidden` with no padding — the padded region is the text content area. This is structurally consistent with the spacious tier intent and does not need adjustment.

Note on SessionRow: uses `py-5` (vertical-only padding) because it is a list row (`<li>`) with a bottom border divider, not a card. This is the correct dense-row equivalent per CONTEXT.md.

## Flagged for Review

None. All four components matched expected values exactly.

## Deviations from Plan

None — plan executed exactly as written.

## Build Result

```
✓ Compiled successfully in 3.9s
✓ Generating static pages using 7 workers (45/45) in 986ms
```

Zero errors, zero warnings.

## Decisions Made

- Confirmed SPACE-03 two-tier rule: dense = `p-4` for grid/thumbnail cards, spacious = `p-6` for feature/article cards
- No new CSS abstractions introduced (per CONTEXT.md)
- No responsive variants added (per CONTEXT.md)
