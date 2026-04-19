---
phase: 09-sync-script
plan: "03"
subsystem: infra
tags: [zod, PublicationsFileSchema, write-gate, safeParse, dry-run, idempotence, InspireHEP, arXiv, cli]

# Dependency graph
requires:
  - phase: 09-01
    provides: fetchInspireHEP, fetchArXiv, fetchWithRetry, runBatched, BAI startup validation
  - phase: 09-02
    provides: extraction helpers, wired main(), merged Publication[] in memory
  - phase: 07-schema
    provides: PublicationSchema, PublicationsSchema — both unchanged by this plan
provides:
  - PublicationsMetaSchema + PublicationsFileSchema + PublicationsMeta + PublicationsFile types
  - content/publications.json in wrapped { _meta, publications } shape
  - Write-gate: PublicationsFileSchema.safeParse before writeFileSync
  - --dry-run: validate and log without writing
  - --member: write to scripts/tmp/sync-<slug>.json only
  - Summary log: "Sync complete: N publications (X added, Y removed, Z unchanged, W warnings)"
  - Cross-source arXiv ID dedup (InspireHEP + arXiv ORCID feed overlap fix)
affects:
  - 10-ci-wiring (consumes pnpm sync-publications + pnpm validate-content as CI steps)
  - 11-display-layer (reads _meta.synced_at for PUBS-08 staleness indicator)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PublicationsFileSchema wraps PublicationsSchema — downstream Publication[] consumers unchanged
    - Defensive accessor bridge (safeParse → fallback) for zero-downtime transition; removed once sync runs
    - Cross-source arXiv ID dedup via dedupByArxivId applied after mergePublications (InspireHEP wins)
    - readAllExistingEntries() handles three file shapes: missing, bare array (v1.0), wrapped object (v1.1)

key-files:
  created: []
  modified:
    - src/content/schemas/publications.schema.ts (PublicationsMetaSchema + PublicationsFileSchema + types appended)
    - src/content/accessors/publications.ts (PublicationsFileSchema.parse — bridge added then removed in Task 3)
    - scripts/validate-content.mjs (PublicationsFileSchema for publications.json)
    - scripts/generate-schemas.mjs (PublicationsFileSchema for publications.schema.json)
    - scripts/sync-publications.ts (write-gate, _meta, summary log, --dry-run / --member, cross-source dedup)
    - content/publications.json (wrapped { _meta, publications } shape, first real sync data)
    - content/publications.schema.json (regenerated — _meta at top level)

key-decisions:
  - "Cross-source arXiv ID dedup applied globally after mergePublications — InspireHEP entries win over arXiv-only duplicates of the same paper (first-seen-wins, merge order: manual → inspire → arxiv)"
  - "Accessor bridge: PublicationsFileSchema.safeParse + PublicationsSchema.parse fallback committed in Task 1, removed in Task 3 after sync has written the wrapped file"
  - "readAllExistingEntries() exported for count calculation — separate from readManualEntries() which filters source=manual only"
  - "generate-schemas.mjs updated to emit PublicationsFileSchema (not PublicationsSchema) — publications.schema.json now describes wrapped shape"

patterns-established:
  - "Schema-validated write gate: safeParse in memory → branch on dry-run / member / default → writeFileSync"
  - "Output sink branching: --member → scripts/tmp/sync-<slug>.json; default → content/publications.json"
  - "Summary line format compatible with future GitHub Action stdout capture (Phase 10)"

# Metrics
duration: 6min
completed: 2026-04-19
---

# Phase 09 Plan 03: Write Gate + E2E Smoke Test Summary

**Schema-validated write gate closes Phase 9: PublicationsFileSchema wraps the existing array, safeParse gates writeFileSync, --dry-run/--member branching works, and pnpm sync-publications produces an idempotent wrapped content/publications.json that passes validate-content and pnpm build**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-19T17:06:45Z
- **Completed:** 2026-04-19T17:13:08Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `PublicationsFileSchema` + `PublicationsMetaSchema` + `PublicationsMeta` + `PublicationsFile` types exported from `publications.schema.ts` — `Publication` / `Publications` types and `PublicationsSchema` untouched
- Write-gate: `PublicationsFileSchema.safeParse(fileData)` in memory before any `writeFileSync` — exits 1 + Zod error detail on failure without writing
- First real sync: `pnpm sync-publications` queries InspireHEP (4 hits for Tomas.F.Chase.1) + arXiv (3 entries for ORCID 0009-0001-0286-2136), deduplicates cross-source (4 unique inspirehep-sourced papers), merges with 13 manual entries → 17 total publications in wrapped JSON
- Three-run idempotence confirmed: identical `.publications` array each run (only `_meta.synced_at` differs)
- `pnpm validate-content` + `pnpm build` both pass on freshly written file
- All 41 Vitest tests green (21 sync + 20 accessor)

## _meta Block from First Real Sync

```json
{
  "_meta": {
    "synced_at": "2026-04-19T17:10:47.382Z",
    "sources": ["inspirehep", "arxiv"],
    "counts": { "inspirehep": 4, "arxiv": 3, "manual": 13 },
    "warnings": []
  },
  "publications": [ ... 17 entries ... ]
}
```

## Task Commits

1. **Task 1: Introduce PublicationsFileSchema + update accessor + validate-content** — `10415e4` (feat)
2. **Task 2: Wire write-gate + summary log + --dry-run / --member branching** — `5cbc4a8` (feat)
3. **Task 3: First real sync + remove accessor bridge** — `0cb3d7a` (feat)

## Files Created/Modified

- `src/content/schemas/publications.schema.ts` — appended `PublicationsMetaSchema`, `PublicationsFileSchema`, `PublicationsMeta`, `PublicationsFile`; existing `PublicationSchema`, `PublicationsSchema`, `Publication`, `Publications` unchanged
- `src/content/accessors/publications.ts` — now uses `PublicationsFileSchema.parse(rawFile)` cleanly; bridge committed in Task 1 + removed in Task 3
- `scripts/validate-content.mjs` — imports `PublicationsFileSchema`; `publications.json` schema entry switched from `PublicationsSchema` to `PublicationsFileSchema`
- `scripts/generate-schemas.mjs` — switched to `PublicationsFileSchema` for publications JSON Schema generation
- `scripts/sync-publications.ts` — added `readAllExistingEntries()`, write-gate, `_meta` construction, output sink branching, cross-source dedup; replaced `Extracted N publications` placeholder with `Sync complete: N publications (...)` format
- `content/publications.json` — wrapped `{ _meta, publications }` shape with 17 entries from first real sync
- `content/publications.schema.json` — regenerated; `_meta` now at top level

## E2E Smoke Test Evidence (6 expectations)

**1. Exit 0, wrapped file written:**
```
Syncing 1 member(s)...
tomas-ferreira-chase — InspireHEP: 4, arXiv: 3
Sync complete: 17 publications (4 added, 0 removed, 13 unchanged, 0 warnings)
```

**2. `_meta` block shape verified** (head -15 content/publications.json):
```json
{
  "_meta": {
    "synced_at": "2026-04-19T17:10:47.382Z",
    "sources": ["inspirehep", "arxiv"],
    "counts": { "inspirehep": 4, "arxiv": 3, "manual": 13 },
    "warnings": []
  },
  "publications": [
```

**3. pnpm validate-content:**
```
✔ Content validation passed (5 files, all entries parsed, all photos exist)
```

**4. pnpm build:** succeeded (all SSG routes rendered including /publications)

**5. Idempotence (3 back-to-back runs):**
```
run1: 4 added, 0 removed, 13 unchanged
run2: 0 added, 0 removed, 17 unchanged
run3: 0 added, 0 removed, 17 unchanged
diff /tmp/sync-pubs-2.json /tmp/sync-pubs-3.json → (empty — identical)
```

**6. BAI-format failure replay:**
```
BAI format error — fix content/people.json before retrying.
Expected BAI (e.g. "E.Calzetta.1"), got:
  tomas-ferreira-chase: "INSPIRE-00140145"
Exit code: 1  ← no network request, no write
```

## Pagination Evidence

```
pnpm sync-publications --member tomas-ferreira-chase --verbose:
  GET https://inspirehep.net/api/literature?q=a%20Tomas.F.Chase.1&size=200&...&page=1
  fetched 4 of 4 total for Tomas.F.Chase.1
  GET https://arxiv.org/a/0009-0001-0286-2136.atom2
```
Pagination logic is exercised (single page for Tomás = new PhD). Stress test deferred to DATA-09/10 follow-up when high-output members (E.Calzetta.1: ~120 papers) are populated.

## Failure Simulation Evidence

**Network failure (exit 1, no write):**
```
# Injected throw new Error("simulated") at top of fetchInspireHEP
Syncing 1 member(s)...
Fatal: simulated
Exit code: 1
git diff --name-only → (empty — content/publications.json unchanged)
```

**--dry-run (never writes):**
```
Sync complete (dry-run): 17 publications (4 added, 0 removed, 13 unchanged, 0 warnings)
Would write 15838 bytes to .../content/publications.json
git diff --name-only → (empty)
```

**--member (writes only to scripts/tmp/):**
```
Wrote per-member output to .../scripts/tmp/sync-tomas-ferreira-chase.json (git-ignored)
git diff --name-only → (empty — content/publications.json unchanged)
```

## Decisions Made

1. **Cross-source arXiv ID dedup applied after mergePublications (new, not in plan):** InspireHEP hits with `arxiv_eprints[0].value` and arXiv ORCID feed entries for the same paper both produce `id: "2505.21383"`. Without cross-source dedup, the merged array has 3 duplicate IDs and `PublicationsSchema.superRefine` fires, failing the write gate. Fixed by applying `dedupByArxivId(preMerged)` on the full merged set — InspireHEP entries win (better metadata: structured journal info) since `mergePublications` puts them before arXiv entries.

2. **Accessor defensive bridge committed and removed within same plan:** Task 1 added the bridge so `pnpm build` wouldn't break before the sync script had run. Task 3 removed it once `content/publications.json` had the wrapped shape. This intra-plan approach avoids the task-ordering hazard described in the plan's note.

3. **generate-schemas.mjs updated to emit PublicationsFileSchema:** The plan spec said to regenerate schemas; updating the generator script ensures future `pnpm generate-schemas` runs reflect the wrapped shape. Both `validate-content.mjs` and `generate-schemas.mjs` now use `PublicationsFileSchema`.

4. **readAllExistingEntries() exported for test accessibility:** Exported alongside `readManualEntries` — handles all three file shapes (missing, bare array, wrapped) for accurate added/removed/unchanged counts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cross-source arXiv ID dedup missing from plan**

- **Found during:** Task 2 (first dry-run test)
- **Issue:** `pnpm sync-publications --dry-run` exited 1 with "Duplicate publication id '2505.21383'" (and two others). InspireHEP returns hits with `arxiv_eprints[0].value` which becomes the Publication `id`; the arXiv ORCID feed independently returns the same papers with the same arXiv ID. `dedupByArxivId` was only applied intra-source, not cross-source.
- **Fix:** Applied `dedupByArxivId(preMerged)` on the full merged array after `mergePublications`. Since merge order is `[manual, inspire, arxiv]`, InspireHEP entries appear first and win first-seen dedup, preserving their richer metadata (journal info, DOI, structured publication_info).
- **Files modified:** `scripts/sync-publications.ts`
- **Verification:** `pnpm sync-publications --dry-run` exits 0 with "17 publications"; `pnpm sync-publications` writes valid file that passes `pnpm validate-content`
- **Committed in:** `5cbc4a8` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — logic bug producing duplicate IDs)
**Impact on plan:** Mandatory fix — without it the write gate always exits 1 for any author whose papers appear in both InspireHEP and arXiv. No scope creep.

## Data Follow-up (Not a Phase 9 Blocker)

13 remaining group members still need `inspirehep_id` + `orcid_id` populated in `content/people.json` (DATA-09/10 follow-up). During this plan's run, they are filtered silently (no warnings — they never enter `syncMember`). Full-group E2E and pagination stress test (E.Calzetta.1 with ~120 papers) require the data commit.

## Hand-off to Phase 10 (CI Wiring)

Phase 10 needs two `pnpm` steps:
1. `pnpm sync-publications` — exits 0 on success, exits 1 on network failure (no write)
2. `pnpm validate-content` — exits 0 if written file passes schema

The CI's job (NOT the script's):
- `git diff --quiet content/publications.json` — detect whether the file changed
- `git commit -m "chore: sync publications"` — commit if changed
- GitHub Actions wiring, schedule, and branch protection bypass (CI-08 from STATE.md blockers)

The script's stdout summary line is GitHub Action step-summary compatible:
```
Sync complete: N publications (X added, Y removed, Z unchanged, W warnings)
```

## Issues Encountered

None beyond the cross-source dedup bug documented above.

## Next Phase Readiness

**Ready for Phase 10 (CI Wiring).** All Phase 9 success criteria met:
- `pnpm sync-publications` runs locally, queries real APIs, exits 0
- Produces valid `content/publications.json` that passes `pnpm validate-content` + `pnpm build`
- Exits 1 without writing on network failure or schema failure
- Idempotent: identical `.publications` array across runs
- No Phase 10 concerns leaked (no `.github/workflows/`, no git diff guard in script)

**Blockers for Phase 10:**
- DATA-09/10 partial: 13 members need IDs (data commit, not a code blocker for CI wiring)
- CI-08: check branch protection rules before wiring the commit step

---
*Phase: 09-sync-script*
*Completed: 2026-04-19*
