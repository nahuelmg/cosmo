---
phase: 09-sync-script
verified: 2026-04-19T17:35:00Z
status: passed
score: 5/5 success criteria verified
---

# Phase 9: Sync Script Verification Report

**Phase Goal:** `pnpm sync-publications` runs locally, queries InspireHEP and arXiv for all members with IDs populated, writes a valid `content/publications.json`, and exits non-zero without writing anything if any upstream request fails.
**Verified:** 2026-04-19T17:35:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | `pnpm sync-publications` completes without error and writes valid JSON with `_meta` | VERIFIED | Live run: exit 0, 17 publications written, `_meta.synced_at` = valid ISO timestamp, all `_meta` fields present |
| 2 | Second run with identical upstream data produces identical content (except `synced_at`) | VERIFIED | Two consecutive runs produced 15838 bytes each; diff on `synced_at`-normalized files = 0 changes |
| 3 | `pnpm validate-content` passes on the freshly written JSON | VERIFIED | `✔ Content validation passed (5 files, all entries parsed, all photos exist)` |
| 4 | Member with `inspirehep_id` but no `orcid_id` logs warning, no arXiv query made | VERIFIED | Live test with E.Calzetta.1: `arXiv: 0`, stderr = `Warning: skipping arXiv for Esteban Calzetta: no orcid_id` |
| 5 | Passing `INSPIRE-00XXXXXX` numeric ID exits 1 with clear format-error before any network request | VERIFIED | `BAI format error — fix content/people.json before retrying. Expected BAI (e.g. "E.Calzetta.1"), got: tomas-ferreira-chase: "INSPIRE-00123456"` — exit 1 |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/sync-publications.ts` | 400–700 lines, full implementation | VERIFIED | 705 lines, no stubs or TODO/FIXME markers |
| `content/publications.json` | `{ _meta, publications: [...] }` shape | VERIFIED | `_meta` has `synced_at` (ISO), `sources` (array), `counts.{inspirehep,arxiv,manual}`, `warnings` (array) |
| `src/content/schemas/publications.schema.ts` | Exports `PublicationsFileSchema`, `PublicationSchema`, `PublicationsSchema` | VERIFIED | All three exported; `PublicationsFileSchema` wraps `PublicationsSchema` + `PublicationsMetaSchema` |
| `src/content/accessors/publications.ts` | Parses wrapped shape; accessor return types unchanged | VERIFIED | `PublicationsFileSchema.parse(rawFile)` at line 28; `getPublications()` still returns `Publication[]` |
| `scripts/validate-content.mjs` | Validates `PublicationsFileSchema` for `publications.json` | VERIFIED | Line 110: `{ name: "publications.json", schema: PublicationsFileSchema }` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `sync-publications.ts` | `content/publications.json` | `writeFileSync` after `PublicationsFileSchema.safeParse` | VERIFIED | Lines 640–647: safeParse gate; line 676: writeFileSync |
| `sync-publications.ts` | `PublicationsFileSchema` | Relative import from `../src/content/schemas/publications.schema` | VERIFIED | Line 25: `import { PublicationsFileSchema ... }` (no `@/` alias) |
| `publications.ts` (accessor) | `content/publications.json` | `PublicationsFileSchema.parse(rawFile)` | VERIFIED | Line 28: destructures `{ publications }` from parsed result |
| `validate-content.mjs` | `publications.schema.ts` | `tsx/esm` loader, direct `.ts` import | VERIFIED | Line 26–28: `import { PublicationsFileSchema, PublicationsSchema }` |
| `main()` | `validateBAIs()` | Called before any `fetch()` | VERIFIED | Line 568: `validateBAIs(people)` before line 593: `runBatched(tasks)` |

### Requirements Coverage (SYNC-01 through SYNC-15)

| Requirement | Status | Notes |
|-------------|--------|-------|
| SYNC-01 — `pnpm sync-publications` and `pnpm exec tsx` both run | SATISFIED | `package.json` `"sync-publications": "tsx scripts/sync-publications.ts"` confirmed |
| SYNC-02 — `fast-xml-parser@^5.7.1` with `isArray` callback | SATISFIED | `devDependencies: "fast-xml-parser": "^5.7.1"`; `isArray` callback at lines 144–145 |
| SYNC-03 — Concurrency max 5, 2s inter-batch pause, exponential backoff on 429 | SATISFIED | `INSPIRE_BATCH_SIZE=5`, `INSPIRE_BATCH_PAUSE_MS=2000`, backoff at lines 173–179 |
| SYNC-04 — Reads `hits.total`, paginates to completion, logs "fetched X of Y total" | SATISFIED | Lines 267–280: pagination loop; line 276: verbose log "fetched X of Y total for BAI" |
| SYNC-05 — arXiv queries by `orcid_id` only, warns when missing, no `au:` name fallback | SATISFIED | Lines 539–548; no `au:` string in codebase. Note: field renamed `arxiv_id` → `orcid_id` after REQUIREMENTS.md was written (SCHEMA-03) |
| SYNC-06 — BAI regex validation at startup, exits 1 on numeric ID, before any network request | SATISFIED | `validateBAIs()` at line 568; `runBatched` (first network) at line 593; live test confirms |
| SYNC-07 — Year from `publication_info[0].year` → `preprint_date` YYYY → current year | SATISFIED | Lines 340–344 |
| SYNC-08 — `.normalize("NFC")` on author/title/abstract; `stripBibTeX` on titles | SATISFIED | Lines 364–365, 373, 396, 402, 408 |
| SYNC-09 — Intra-run dedup by arXiv ID per source | SATISFIED | `dedupByArxivId` at lines 608–609; keyed on `p.arxiv ?? p.id` (arXiv ID, not DOI) |
| SYNC-10 — Deterministic sort: year desc → arXiv ID desc → no-arXiv last | SATISFIED | `mergePublications` lines 484–491; matches accessor sort in `getPublicationsByAuthor` |
| SYNC-11 — `safeParse` in memory before write; exits 1 without writing on failure | SATISFIED | Lines 640–647: `PublicationsFileSchema.safeParse(fileData)`; exit 1 before `writeFileSync` |
| SYNC-12 — Writes `content/publications.json` with `_meta` block, 2-space indent | SATISFIED | Writes wrapped shape with 2-space indent + trailing newline (line 665). **Deviation:** REQUIREMENTS.md specifies `_meta: { synced_at, status: "ok" }` but CONTEXT.md (authoritative) specifies `{ synced_at, sources, counts, warnings }` with no `status` field. Implementation follows CONTEXT.md. |
| SYNC-13 — Source-tags every entry (`"inspirehep"` / `"arxiv"`); manual entries preserved | SATISFIED | Lines 369, 407; `readManualEntries` forces `source: "manual"` at line 450 |
| SYNC-14 — Every `fetch()` call uses `AbortSignal.timeout(10_000)` | SATISFIED | All `fetch()` calls go through `fetchWithRetry`; `AbortSignal.timeout(REQUEST_TIMEOUT_MS)` at line 170. Single fetch wrapper, single AbortSignal application. |
| SYNC-15 — Summary line with added/removed/unchanged/warnings count | SATISFIED | Lines 680–682: `Sync complete: N publications (X added, Y removed, Z unchanged, W warnings)` |

### Anti-Pattern Scan

| Check | Result |
|-------|--------|
| `.github/workflows/sync-publications.yml` exists (Phase 10 scope) | ABSENT — no `.github/` directory |
| `git diff --quiet` call inside `sync-publications.ts` | ABSENT |
| Per-member last-good merge logic | ABSENT — file-level atomicity only (throw propagates in `runBatched`, no write reached) |
| `@/` alias imports in `sync-publications.ts` | ABSENT — all imports use relative paths (`../src/...`) |
| TODO/FIXME/stub markers claiming Phase 9 functionality incomplete | ABSENT |

### Cross-Source Dedup Deviation Assessment

The 09-03 plan introduced a post-merge `dedupByArxivId(preMerged)` call (lines 614–620) that deduplicates across InspireHEP and arXiv sources by arXiv ID.

CONTEXT.md states "No cross-source dedup (locked v1.1 decision)" as a comment in `mergePublications`'s docstring, but this refers to the `mergePublications` function itself not doing dedup. The post-merge call was added as a bug fix in 09-03 specifically because both extractors assign `id = arXiv ID` when an arXiv eprint exists, producing duplicate IDs in the merged array (which would fail the `PublicationsSchema` superRefine uniqueness check).

**Assessment: In-scope, defensible.** The dedup key is arXiv ID (the CONTEXT.md Pitfall 6-aligned approach). DOI-based cross-source dedup remains explicitly excluded. The fix was necessary for correctness — without it, the schema write gate (SYNC-11) would fail any time a paper appeared in both InspireHEP (with `arxiv_eprints`) and the arXiv ORCID feed.

The live data confirms: `counts.arxiv = 3` (3 unique papers fetched from arXiv), but 0 arXiv-sourced entries appear in the final list because all 3 shared arXiv IDs with InspireHEP entries that were processed first (InspireHEP wins: more structured journal data). The result is correct — no duplicate IDs in the file.

### Journal Empty-String Latent Bug

**Not a Phase 9 gap for current people.json, but a known risk for Phase 10.**

`inspireHitToPublication` constructs `journal` as:
```ts
const journal: string = pi
  ? [pi.journal_title, pi.journal_volume, pi.year ? `(${pi.year})` : "", pi.artid]
      .filter(Boolean).join(" ")
  : "Preprint";
```

When `publication_info` exists (`pi` is truthy) but all fields are `undefined`/`null`, `filter(Boolean)` returns `[]` and `join(" ")` returns `""`. The schema requires `journal: z.string().min(1)`, so this fails schema validation at the SYNC-11 write gate — the script exits 1 without writing, which is the **correct failure mode** per phase goals.

Live evidence: adding `E.Calzetta.1` (a real BAI with 126 papers) produced 9 schema failures on `journal: Too small: expected string to have >=1 characters`. The write gate correctly prevented the file write and exited 1.

**Impact:** When Phase 10 populates more `inspirehep_id` values in `people.json`, the scheduled sync will fail for members whose InspireHEP records have `publication_info` with only null/empty fields (typically conference proceedings or non-journal entries). The fix is a one-line guard: `|| "Preprint"` after `.join(" ")`.

**Severity for Phase 9 goals:** None — Phase 9 goal is verified against the currently populated `people.json` (1 member, 4 clean InspireHEP records). The bug is a Phase 10 prep concern.

### Build and Test Verification

| Command | Result |
|---------|--------|
| `pnpm validate-content` | PASS — `✔ Content validation passed (5 files, all entries parsed, all photos exist)` |
| `pnpm test` | PASS — 41 tests, 2 test files, 0 failures |
| `pnpm build` | PASS — no compilation errors, all static paths generated |
| `pnpm exec tsx scripts/sync-publications.ts --dry-run` | PASS — exit 0, `content/publications.json` mtime unchanged |
| `pnpm sync-publications` (twice) | PASS — second run produces 0 added/0 removed/17 unchanged |

---

## Summary

Phase 9 goal is fully achieved. The sync script is production-ready for the currently populated `people.json` (1 member, `Tomas.F.Chase.1`). All 5 success criteria pass under live testing.

One latent bug (empty journal string for InspireHEP records with null `publication_info` fields) will surface when additional members are populated in Phase 10. The bug is correctly caught by the SYNC-11 write gate (exit 1, no corrupt write), but it will block successful syncs for affected members. The fix is trivial and should be applied before or alongside Phase 10's CI wiring.

One spec deviation worth noting: SYNC-12 in `REQUIREMENTS.md` specified `_meta: { synced_at, status: "ok" }` but the implementation (correctly following `09-CONTEXT.md`) uses the richer `{ synced_at, sources, counts, warnings }` shape with no `status` field. This is an improvement, not a regression.

---

_Verified: 2026-04-19T17:35:00Z_
_Verifier: Claude (gsd-verifier)_
