---
phase: quick-001-code-cleanup-sweep
plan: 001
subsystem: cleanup
tags: [zod, i18n, json-ld, schema, design-system, documentation]

# Dependency graph
requires:
  - phase: v1.1-arXiv-InspireHEP
    provides: publications_selected field + orphaned accessors that are now removed
  - phase: v1.2-aesthetic-polish
    provides: NavLink text-lg/max-w-6xl post-seal commits that needed doc recording
  - phase: v1.3-orcid-sync
    provides: schemas.ts:132 identifier.value bare-DOI deferral now resolved
provides:
  - Dead Zod field (publications_selected), three orphaned accessors, and dead i18n key removed
  - JSON-LD ScholarlyArticle.identifier.value now emits URL form https://doi.org/{doi}
  - Design-system docs (MASTER.md + OVERRIDES.md) reflect post-Phase-15 reality
  - v1.1-REQUIREMENTS.md PR-flow deferral resolved in-place with strikethrough
affects: [next-milestone-planning, audit-milestone]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dead-code removal: verify zero runtime callers with grep before deleting exports"
    - "JSON-LD identifier: identifier.value and sameAs[] both carry URL form https://doi.org/{doi}"

key-files:
  created: []
  modified:
    - src/content/schemas/people.schema.ts
    - src/content/accessors/publications.ts
    - content/people.json
    - content/people.schema.json
    - content/SYNC.md
    - messages/en.json
    - messages/es.json
    - src/lib/schemas.ts
    - .planning/milestones/v1.1-REQUIREMENTS.md
    - design-system/cosmology-group-uba/MASTER.md
    - design-system/cosmology-group-uba/OVERRIDES.md

key-decisions:
  - "OVERRIDES.md Desktop NavLink intentional UA focus ring — no focus-visible:ring-* needed because active-state uses font-weight+color (per MICRO-01 spec)"
  - "HeroCarousel tagline removal (b3f697c) has zero design-system impact — tagline never appeared in MASTER.md recipe block"
  - "publications_selected field removed without migration — 13 of 15 members had the empty array; strictObject parse would have thrown if any value were non-empty"

patterns-established: []

# Metrics
duration: 15min
completed: 2026-04-21
---

# Quick Task 001: Code Cleanup Sweep Summary

**Removed publications_selected Zod field + 3 orphaned accessors + dead i18n key, aligned JSON-LD identifier.value to URL form, and recorded post-Phase-15 design-system drift in MASTER.md + OVERRIDES.md.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-21T10:40:00Z
- **Completed:** 2026-04-21T10:55:00Z
- **Tasks:** 3/3
- **Files modified:** 11

## Accomplishments

- All five preflight sanity checks passed before any file edits — zero runtime callers for the three orphaned accessors confirmed
- Removed `publications_selected` Zod field, 3 orphaned accessors (`getPublicationById`, `getPublicationsByTopic`, `getAllTopics`), dead `people.selectedPublications` i18n key, and corresponding content/schema/docs echoes
- `identifier.value` in ScholarlyArticle JSON-LD now emits `https://doi.org/{doi}` (URL form) instead of bare DOI, matching the sameAs[] surface and the v1.3 milestone spec
- MASTER.md Nav Link "Visible chrome" updated to text-lg / ~36 px with attribution to commit 1cf9cf8 + SiteHeader caller
- OVERRIDES.md v1.2 table gains post-seal NavLink text-lg + max-w-6xl row; new "Post-seal decisions" subsection documents intentional Desktop NavLink UA focus ring + HeroCarousel tagline no-drift confirmation

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove dead code** — `717f66f` (chore)
2. **Task 2: JSON-LD identifier URL form** — `0c250c2` (fix)
3. **Task 3: Documentation amendments** — `c4c20cc` (docs)

## Files Created/Modified

- `src/content/schemas/people.schema.ts` — removed @deprecated `publications_selected` field (lines 74–81)
- `src/content/accessors/publications.ts` — removed `getPublicationsByTopic`, `getPublicationById`, `getAllTopics` functions and corresponding module-level JSDoc bullets; 4 accessors remain
- `content/people.json` — stripped `"publications_selected": []` from 13 of 15 members (2 members never had the key)
- `content/people.schema.json` — regenerated via `pnpm generate-schemas`; `publications_selected` property and required-array entry removed
- `content/SYNC.md` — removed `"publications_selected": []` from paste-ready example snippet (line 284)
- `messages/en.json` — removed `"selectedPublications": "Selected Publications"` from `people` namespace
- `messages/es.json` — removed `"selectedPublications": "Publicaciones seleccionadas"` from `people` namespace
- `src/lib/schemas.ts` — `buildScholarlyArticleSchema` line 132: `value: pub.doi` → `` value: `https://doi.org/${pub.doi}` ``
- `.planning/milestones/v1.1-REQUIREMENTS.md` — PR-flow deferral bullet marked resolved in-place with strikethrough + "resolved v1.4" note
- `design-system/cosmology-group-uba/MASTER.md` — Nav Link "Visible chrome" bullet updated to text-lg / ~36 px
- `design-system/cosmology-group-uba/OVERRIDES.md` — new v1.2 table row + "Post-seal decisions" subsection

## Decisions Made

- **OVERRIDES.md strikethrough approach:** Used strikethrough-in-place for the v1.1-REQUIREMENTS.md PR-flow deferral (not outright deletion) to preserve archive auditability in the milestones/ directory.
- **Desktop NavLink UA focus ring:** Intentionally left without `focus-visible:ring-*`; documented as deliberate in OVERRIDES.md. BTN-02 scope applies to buttons/non-inline links with padding-based hit targets; NavLink already uses active-state font-weight+color per MICRO-01.
- **HeroCarousel MASTER.md:** No update needed — tagline only existed in live JSX, never in a MASTER recipe block. `siteConfig.tagline` retained for SEO `<meta>` description.

## Deviations from Plan

None — plan executed exactly as written.

### Minor observation (not a deviation)

The plan stated "14 member records" in `content/people.json`. Actual count is 15 members; 13 had `publications_selected` (2 never had the key). The `delete` call is a no-op for members that never had it, so the result is correct: zero `publications_selected` keys in the file.

## Grep-Proofs (Dead Code Gone)

All three grep checks returned zero hits after Task 1 commit:

```
grep -rn "publications_selected" src/ scripts/ messages/ content/    → 0 hits
grep -rn "getPublicationById\|getPublicationsByTopic\|getAllTopics" src/ scripts/  → 0 hits
grep -rn "selectedPublications" src/ messages/                        → 0 hits
```

JSON-LD URL form present:

```
grep -n "https://doi.org/\${pub.doi}" src/lib/schemas.ts  → 1 hit (line 132, identifier block)
grep -n "value: pub.doi" src/lib/schemas.ts               → 0 hits
```

## Toolchain Verification Results

Final HEAD after all three commits:

| Check | Result |
|-------|--------|
| `pnpm tsc --noEmit` | PASS |
| `pnpm test` | PASS (104/104 tests) |
| `pnpm validate-content` | PASS |
| `pnpm check-translations` | PASS (no missing/asymmetric keys) |
| `pnpm build` | PASS (47 static routes emitted) |

## Issues Encountered

None.

## Note for Next Milestone

STATE.md "Open Items Carried Forward" can now strike through:

**v1.1 code cleanup (deferred) — CLOSED:**
- `publications_selected` Zod field removed
- Orphaned accessor exports removed
- Dead `people.selectedPublications` i18n key removed
- REQUIREMENTS.md PR-flow deferral marked resolved

**v1.2 post-milestone doc drift — CLOSED:**
- MASTER.md Nav Link recipe updated to text-lg + max-w-6xl state
- HeroCarousel recipe confirmed tagline-free (no MASTER update needed)
- Desktop NavLink intentional UA focus ring documented

**v1.3 deferrals — PARTIALLY CLOSED:**
- `schemas.ts:132` identifier.value URL form — CLOSED
- (Remaining: 6 members with `orcid_id` lacking `contact.orcid`, Tomás' own `contact.orcid` empty — content tasks, not code)

---
*Phase: quick-001-code-cleanup-sweep*
*Completed: 2026-04-21*
