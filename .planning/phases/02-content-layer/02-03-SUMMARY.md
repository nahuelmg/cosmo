---
phase: 02-content-layer
plan: "03"
subsystem: content
tags: [zod, typescript, publications, arxiv, doi, academic-metadata, json-content]

# Dependency graph
requires:
  - phase: 02-content-layer/02-01
    provides: shared.ts with canonicalString, arxivId, doiId helpers; content/ and src/content/accessors/ directories scaffolded

provides:
  - src/content/schemas/publications.schema.ts with PublicationSchema, PublicationsSchema (id uniqueness superRefine), Publication type, Publications type
  - content/publications.json: 13 realistic cosmology publications spanning 2024-2026, exercising all arXiv/DOI optional combinations
  - src/content/accessors/publications.ts: 6 typed accessor functions (getPublications, getPublicationsByYear, getPublicationsByTopic, getPublicationById, getAllTopics, getAllYears)

affects:
  - 02-05-schema-gen (PublicationSchema must be registered for JSON schema generation)
  - 03-layout-shell (no direct dependency)
  - 04-core-pages (Publications page imports all 6 accessors; PUBS-03 filter uses getAllTopics/getAllYears)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Canonical-only schema: z.strictObject with no bilingual fields — paper-native language preserved"
    - "Academic ID guards: arxivId and doiId from shared.ts — no regex duplication in per-type schemas"
    - "superRefine for id uniqueness on array schemas — same pattern as PeopleSchema.slug uniqueness"
    - "Module-load parse: PublicationsSchema.parse(rawPublications) — throws at import time if invalid JSON"
    - "topic_tags: loose tag set with .optional().default([]) — case-sensitive for stable PUBS-03 filter vocabulary"

key-files:
  created:
    - src/content/schemas/publications.schema.ts
    - content/publications.json
    - src/content/accessors/publications.ts
  modified:
    - src/content/schemas/journal-club.schema.ts (bug fix: removed duplicate export)

key-decisions:
  - "Publications are canonical-only — no bilingual fields, paper-native language preserved (CONTEXT.md)"
  - "id field: explicit kebab-case string, not derived from DOI/arXiv (some papers have neither)"
  - "topic_tags: case-sensitive matching — PUBS-03 filter renders distinct tags directly from getAllTopics()"
  - "No bib_key or cite_count — YAGNI for v1 per DATA-02 spec"

patterns-established:
  - "Canonical-only accessor pattern: no getLocalized* variant needed — contrast with people.ts"
  - "getAllTopics() / getAllYears(): deduplicated sorted sets for Phase 4 filter dropdowns"

# Metrics
duration: 8min
completed: 2026-04-18
---

# Phase 2 Plan 03: Publications Content Model Summary

**Zod v4 PublicationSchema with arXiv/DOI regex guards and id uniqueness, 13 placeholder cosmology publications across 2024–2026 exercising all optional-field combinations, and 6 typed canonical-only accessors for Phase 4 consumption**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-18T00:16:21Z (approx, following 02-01)
- **Completed:** 2026-04-18
- **Tasks:** 3
- **Files modified:** 4 (3 created + 1 bug fix)

## Accomplishments

- Authored `src/content/schemas/publications.schema.ts`: `z.strictObject` with 9 fields, arxivId/doiId from shared.ts (no regex duplication), superRefine enforcing unique publication IDs across the array
- Authored `content/publications.json`: 13 realistic Argentine cosmology group publications (3×2026, 5×2025, 5×2024); arXiv/DOI combos: both=8, arxiv-only=2, doi-only=2, neither=1; 12 distinct topic tags; Greek notation titles (σ₈, H₀, Λ-CDM)
- Authored `src/content/accessors/publications.ts`: 6 typed exports — getPublications (year-desc), getPublicationsByYear, getPublicationsByTopic (case-sensitive), getPublicationById, getAllTopics (sorted dedup), getAllYears (desc dedup)
- `pnpm typecheck` and `pnpm lint` both exit 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Write publications schema** — `92a6e62` (feat)
2. **Task 2: Add 13 placeholder publications JSON** — `3c420f7` (feat)
3. **Task 3: Write publications accessors** — `04fdb5a` (feat)
4. **Deviation fix: journal-club schema duplicate export** — `12699c4` (fix)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/content/schemas/publications.schema.ts` — PublicationSchema (z.strictObject, 9 fields), PublicationsSchema (array + id uniqueness superRefine), Publication and Publications types
- `content/publications.json` — 13 entries, 2024–2026, exercising all arXiv/DOI optional paths, 12 distinct topic tags
- `src/content/accessors/publications.ts` — 6 typed accessor functions, module-load parse
- `src/content/schemas/journal-club.schema.ts` — Bug fix: removed redundant `export { JournalClubSessionSchema }` (was already exported as `export const`)

## Accessor Surface (all 6 exports)

| Export | Purpose |
|--------|---------|
| `getPublications()` | All publications sorted year descending (newest first) — primary Publications page source |
| `getPublicationsByYear(year)` | Filter by exact year; authoring order within year |
| `getPublicationsByTopic(tag)` | Case-sensitive topic_tags filter; PUBS-03 filtered view |
| `getPublicationById(id)` | Single lookup by stable id; undefined if not found |
| `getAllTopics()` | Sorted, deduplicated topic tags — PUBS-03 filter dropdown options |
| `getAllYears()` | Descending, deduplicated years — year filter and grouping anchors |

## Publication Statistics

**Total:** 13 entries

**Year distribution:**
| Year | Count |
|------|-------|
| 2026 | 3 |
| 2025 | 5 |
| 2024 | 5 |

**arXiv/DOI coverage:**
| Combo | Count | Example |
|-------|-------|---------|
| Both arxiv + doi | 8 | "2025-sigma8-cmb-lensing-cross" |
| arXiv only | 2 | "2026-dark-matter-halo-ml-emulator", "2025-inflation-primordial-bispectrum" |
| DOI only | 2 | "2026-gw-neutron-star-cosmo", "2024-weak-lensing-ia-models" |
| Neither | 1 | "2024-proceeding-cata-cosmo-ia" |

**Distinct topic tags (12):**
CMB, N-body simulations, dark energy, dark matter, early universe, galaxy clusters, gravitational waves, halo models, inflation, large-scale structure, machine learning, weak lensing

## Greek-Notation Titles Added

The following titles exercise the Greek font subset wired in Phase 1:
- "Constraints on σ₈ from CMB-Lensing × Galaxy-Survey Cross-Correlations" (2025)
- "The Λ-CDM Tension in Recent H₀ Measurements: A Bayesian Reanalysis" (2026)
- "A Bayesian Reassessment of the Distance Ladder and H₀ Tension" (2024)

## Decisions Made

1. **Publications canonical-only** — No bilingual fields; paper titles and abstracts preserved in the paper's native language (almost universally English for astrophysics). Contrast with people.ts which requires bilingual bio and research_areas.
2. **`id` field: explicit, not derived** — Some publications have neither arXiv nor DOI, so `id` must be maintainer-authored rather than auto-derived. Kebab-case style `YYYY-topic-keywords` is human-debuggable.
3. **`topic_tags` case-sensitive** — Case-sensitive matching keeps the tag vocabulary stable. Phase 4 PUBS-03 renders tags directly from `getAllTopics()`, so normalization happens at the accessor level rather than at query time.
4. **No `bib_key` or `cite_count`** — YAGNI for v1 per DATA-02 spec. arXiv importer deferred to v2.
5. **`abstract` field included as optional string** — No smart-quote check since maintainers paste arXiv/journal abstracts that may contain typographic punctuation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate export of `JournalClubSessionSchema` in journal-club.schema.ts**

- **Found during:** End-to-end verification (`pnpm typecheck`)
- **Issue:** `journal-club.schema.ts` (created by parallel plan 02-04) had both `export const JournalClubSessionSchema = z.strictObject(...)` at line 16 and `export { JournalClubSessionSchema }` at line 75, causing TS2323 (Cannot redeclare exported variable) and TS2484 (Export declaration conflicts).
- **Fix:** Removed the redundant `export { JournalClubSessionSchema }` re-export line. The `export const` declaration at line 16 already exports the identifier.
- **Files modified:** `src/content/schemas/journal-club.schema.ts`
- **Verification:** `pnpm typecheck` exits 0 after fix.
- **Committed in:** `12699c4`

---

**Total deviations:** 1 auto-fixed (1 bug from sibling plan)
**Impact on plan:** Required fix — `pnpm typecheck` is a success criterion. The bug originated in a parallel-executing sibling plan (02-04); fixing it here is the correct action since my verification step surfaced it.

## Issues Encountered

None — schema, JSON, and accessors all validated correctly on first attempt. The journal-club bug was the only unplanned work.

## User Setup Required

None — no external service configuration required. All data is local JSON.

## Next Phase Readiness

- `getPublications()`, `getAllTopics()`, `getAllYears()` are ready for Phase 4 Publications page (PUBS-01/02/03)
- `getPublicationsByTopic()` is ready for PUBS-03 topic filter
- `getPublicationById()` is ready for future publication detail pages
- Plan 02-05 (schema generation) can register `PublicationSchema` for VS Code IntelliSense on `content/publications.json`
- No blockers for Phase 3 Layout Shell

---
*Phase: 02-content-layer*
*Completed: 2026-04-18*
