---
phase: 16-schema-sync-infrastructure
plan: 01
subsystem: database
tags: [zod, typescript, json-schema, publications, orcid, dedup]

# Dependency graph
requires:
  - phase: 09-sync-script
    provides: PublicationsMetaSchema and PublicationsFileSchema shape established in sync script
provides:
  - Extended PublicationSchema.source enum accepting "orcid" as fourth valid value
  - Extended PublicationsMetaSchema.sources accepting "orcid"
  - Extended PublicationsMetaSchema.counts with required orcid and deduped integer fields
  - Regenerated content/publications.schema.json reflecting all schema changes
  - Patched content/publications.json _meta.counts with orcid:0 and deduped:0
affects:
  - 16-03-orcid-fetch (depends on orcid enum being valid source)
  - 16-04-dedup (depends on deduped count field)
  - sync-publications.ts (must always write orcid + deduped to counts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Schema-first gating: all downstream phase 16 work blocked on orcid enum being accepted"
    - "Atomic schema+data commit: schema change and content/publications.json patch land in same commit to avoid validate-content regression window"

key-files:
  created: []
  modified:
    - src/content/schemas/publications.schema.ts
    - content/publications.schema.json
    - content/publications.json
    - scripts/sync-publications.ts

key-decisions:
  - "orcid and deduped counts are REQUIRED (not optional) in the schema — defensive defaults would mask bugs in sync script"
  - "JSON Schema regenerated immediately after Zod change and committed separately for clarity"
  - "scripts/sync-publications.ts counts object fixed in same commit as schema change (Rule 1 - type error)"

patterns-established:
  - "Schema-data co-commit: when adding required fields to Zod schema, always patch content JSON in same commit to keep validate-content green"

# Metrics
duration: 8min
completed: 2026-04-20
---

# Phase 16 Plan 01: Schema Extension Summary

**Zod schema extended with "orcid" source enum + required orcid/deduped counts; JSON Schema regenerated; publications.json patched; pnpm build passes 45 static pages**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-20T00:00:00Z
- **Completed:** 2026-04-20T00:08:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `PublicationSchema.source` enum extended from 3 to 4 values (added "orcid")
- `PublicationsMetaSchema.sources` and `counts` extended with orcid/deduped fields (both required)
- `content/publications.schema.json` regenerated via `pnpm generate-schemas` — VS Code IntelliSense now accepts orcid source entries
- `content/publications.json` `_meta.counts` patched so validate-content prebuild hook passes throughout the transition

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Zod schema and patch content/publications.json counts** - `a05c10e` (feat)
2. **Task 2: Regenerate JSON Schema and confirm build passes** - `07f6264` (chore)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/content/schemas/publications.schema.ts` - source enum + sources enum + counts schema extended with orcid and deduped
- `content/publications.json` - `_meta.counts` patched with orcid: 0, deduped: 0
- `content/publications.schema.json` - regenerated draft-07 JSON Schema matching extended Zod schema
- `scripts/sync-publications.ts` - counts object extended with orcid: 0 and deduped: 0 placeholder fields

## Decisions Made

- `orcid` and `deduped` fields in `PublicationsMetaSchema.counts` are **required** (not optional). Rationale: the sync script will always compute these values; making them optional would mask bugs where the script forgets to write them.
- Schema change and `content/publications.json` patch were bundled in the same commit (Task 1) to avoid a window where `validate-content` would fail between commits.
- JSON Schema regeneration committed separately (Task 2) for clarity of what each commit changes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error in scripts/sync-publications.ts**

- **Found during:** Task 1 (schema extension)
- **Issue:** `pnpm tsc --noEmit` failed with `TS2739: Type '{ inspirehep: number; arxiv: number; manual: number; }' is missing the following properties from type ... : orcid, deduped`. The sync script constructs a `PublicationsMeta` literal without the new required fields.
- **Fix:** Added `orcid: 0` and `deduped: 0` to the `counts` literal in `scripts/sync-publications.ts` line 630 (placeholder values — the real ORCID fetch in Plan 16-03 will replace them with actual counts).
- **Files modified:** `scripts/sync-publications.ts`
- **Verification:** `pnpm tsc --noEmit` exits 0 after fix
- **Committed in:** `a05c10e` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix necessary for TypeScript to compile. Placeholder zeros are intentional — Plan 16-03 (fetchOrcid stub) will update the sync script to compute real orcid counts.

## Issues Encountered

None beyond the auto-fixed TypeScript error above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema foundation complete. All Phase 16 downstream plans can now proceed:
  - Plan 16-02 (CI gate) can reference the orcid enum without type errors
  - Plan 16-03 (fetchOrcid stub) can write `source: "orcid"` entries that pass Zod validation
  - Plan 16-04 (DOI dedup) can write `deduped` count to `_meta.counts`
- No blockers. `pnpm build` passes 45 static pages cleanly.

---
*Phase: 16-schema-sync-infrastructure*
*Completed: 2026-04-20*
