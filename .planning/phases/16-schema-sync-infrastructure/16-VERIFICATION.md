---
phase: 16-schema-sync-infrastructure
verified: 2026-04-20T15:10:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 16: Schema & Sync Infrastructure Verification Report

**Phase Goal:** The codebase accepts `"orcid"` as a valid publication source and the sync pipeline has the DOI-based dedup logic, extended CLI flags, and CI wiring needed to run all three sources — before a single ORCID API call is made.
**Verified:** 2026-04-20T15:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Runtime Gate Results

All four runtime checks executed and passed:

| Command | Exit code | Notes |
|---|---|---|
| `pnpm tsc --noEmit` | 0 | Clean — no type errors |
| `pnpm test` | 0 | 76 tests passed across 3 files; `normalizeDoi` (5 tests) and `dedupByDoi` (4 tests) all pass |
| `pnpm build` | 0 | prebuild `validate-content` hook ran cleanly; 45 static pages generated |
| `pnpm sync-publications --no-arxiv --no-inspire --no-orcid` | 1 | stderr: `No sources enabled` — guard fires before any network I/O |

---

## Observable Truths

### Truth 1 — `"orcid"` accepted as publication source; existing sources unchanged; `_meta.counts` has `orcid` + `deduped` fields

**Status: VERIFIED**

Evidence:
- `src/content/schemas/publications.schema.ts:86` — `source: z.enum(["manual", "inspirehep", "arxiv", "orcid"]).default("manual")`
- `src/content/schemas/publications.schema.ts:139-145` — `PublicationsMetaSchema.counts` requires `orcid: z.number().int().min(0)` and `deduped: z.number().int().min(0)`
- `src/content/schemas/publications.schema.ts:138` — `sources: z.array(z.enum(["inspirehep", "arxiv", "orcid"]))` in meta block
- `content/publications.schema.json:17-22` — JSON schema `sources.items.enum` includes `"orcid"`
- `content/publications.schema.json:43-59` — `counts` object requires `orcid` and `deduped` properties
- Runtime confirmed via `tsx` Zod validation: `{ source: "orcid" }` → `safeParse` success; `{ source: "manual" | "inspirehep" | "arxiv" }` → all pass; full file with `counts.orcid = 3, counts.deduped = 1` → pass
- `content/publications.json:8-14` — live data file has `"orcid": 0` and `"deduped": 0` in `_meta.counts`

### Truth 2 — `--no-orcid` flag wired; `--no-arxiv --no-inspire --no-orcid` exits 1 with "No sources enabled"

**Status: VERIFIED**

Evidence:
- `scripts/sync-publications.ts:42` — `"no-orcid": { type: "boolean", default: false }` in `parseArgs` options
- `scripts/sync-publications.ts:617-619` — guard: `if (flags["no-arxiv"] && flags["no-inspire"] && flags["no-orcid"]) { process.stderr.write("No sources enabled\n"); process.exit(1); }`
- `scripts/sync-publications.ts:628` — `const runOrcid = !flags["no-orcid"];`
- Runtime: `pnpm sync-publications --no-arxiv --no-inspire --no-orcid` printed `No sources enabled` on stderr and exited 1 (confirmed in test above; guard fires before any file reads)

### Truth 3 — Per-member progress line includes ORCID cell; final summary includes `deduped` count

**Status: VERIFIED**

Evidence:
- `scripts/sync-publications.ts:655-659` — progress line emitted as:
  ```
  `${r.slug} — InspireHEP: ${inspireCell}, arXiv: ${arxivCell}, ORCID: ${orcidCell}\n`
  ```
  where `orcidCell = runOrcid ? String(r.orcidPubs.length) : "skipped"` (line 657)
- `scripts/sync-publications.ts:740` — dry-run summary: `${dedupedCount} deduped`
- `scripts/sync-publications.ts:751` — live summary: `${dedupedCount} deduped`
- `scripts/sync-publications.ts:702` — `_meta.counts.deduped` populated from `dedupedCount`

### Truth 4 — DOI-based dedup preserves higher-precedence source (InspireHEP > ORCID > arXiv); `deduped` count accurate

**Status: VERIFIED**

Evidence (static analysis):
- `scripts/sync-publications.ts:447-478` — `normalizeDoi` + `dedupByDoi` exported; first-seen-wins logic; pipeline caller at line 676-684 concatenates in order `manual → inspire → orcid → arxiv` before calling `dedupByDoi`
- `scripts/sync-publications.ts:676` — `const priorityOrdered = [...manualEntries, ...allInspire, ...allOrcid, ...allArxiv]`
- `scripts/sync-publications.ts:684` — `const [postDoiDedup, dedupedCount] = dedupByDoi(postArxivDedup)`

Evidence (unit tests in `scripts/sync-publications.test.ts`):
- Line 287-295 — `"keeps InspireHEP over ORCID over arXiv when DOIs match (DEDUP-02)"`: input `[inspire, orcid, arxiv]` with same DOI → `deduped.length === 1`, `deduped[0].source === "inspirehep"`, `dropped === 2`
- Line 298-305 — `"normalises DOIs before comparison (DEDUP-03)"`: `"10.1234/TEST"` vs `"https://doi.org/10.1234/test"` collapse to single entry
- Line 307-313 — `"passes entries without DOI through unchanged (DEDUP-04)"`: no-DOI entries pass through with `dropped === 0`
- Line 315-325 — `"reports dedupedCount accurately (DEDUP-05)"`: 5-entry list with 2 dups → `dropped === 2`
- All 4 `dedupByDoi` tests passed in the `pnpm test` run (76/76 tests green)

### Truth 5 — CI workflow runs all three sources by default; CI-01 traceability comment present; no `--no-*` flags on `pnpm sync-publications` invocation

**Status: VERIFIED**

Evidence:
- `.github/workflows/sync-publications.yml:38-39` — CI-01 comment: `# CI-01: no --no-* flags passed → InspireHEP + arXiv + ORCID all run by default.`
- `.github/workflows/sync-publications.yml:42-45` — sync step runs `pnpm sync-publications` with no flags:
  ```yaml
  run: |
    pnpm sync-publications > /tmp/sync-stdout.txt 2>/tmp/sync-stderr.txt
  ```
- `.github/workflows/sync-publications.yml:47-48` — `pnpm validate-content` runs after sync as a post-write gate

---

## Required Artifacts

| Artifact | Status | Evidence |
|---|---|---|
| `src/content/schemas/publications.schema.ts` | VERIFIED | `"orcid"` in source enum (line 86); `orcid` + `deduped` in `PublicationsMetaSchema.counts` (lines 143-144) |
| `content/publications.schema.json` | VERIFIED | `"orcid"` in `sources.items.enum`; `orcid` + `deduped` in `counts.required` |
| `content/publications.json` | VERIFIED | `_meta.counts` has `"orcid": 0` and `"deduped": 0`; file passes `pnpm build` validate-content prebuild |
| `scripts/sync-publications.ts` | VERIFIED | `--no-orcid` flag; `fetchOrcid` stub; `normalizeDoi` + `dedupByDoi` exports; three-cell progress line; `deduped` in summary; pipeline order correct |
| `scripts/sync-publications.test.ts` | VERIFIED | `normalizeDoi` (5 tests) + `dedupByDoi` (4 tests) present and passing |
| `.github/workflows/sync-publications.yml` | VERIFIED | No `--no-*` flags; CI-01 comment at line 38 |

---

## Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `sync-publications.ts` CLI | No-sources guard | `parseArgs` + `flags["no-orcid"]` combined check | WIRED — line 617 |
| `syncMember()` | `fetchOrcid()` stub | `if (runOrcid)` branch, line 599-605 | WIRED — stub returns `[]` as specified |
| Priority concat order | `dedupByDoi` | `priorityOrdered` line 676 → `postArxivDedup` line 679 → `dedupByDoi` line 684 | WIRED — order preserved |
| `dedupedCount` | `_meta.counts.deduped` | line 702 | WIRED |
| `dedupedCount` | summary line output | lines 740, 751 | WIRED |
| `PublicationsFileSchema` | Zod gate before write | `safeParse(fileData)` at line 710 | WIRED |

---

## Requirements Coverage

| Requirement | Status |
|---|---|
| SCHEMA-01 — `"orcid"` in `Publication.source` enum | SATISFIED — `publications.schema.ts:86` |
| SCHEMA-02 — `"orcid"` in `PublicationsMetaSchema.sources` enum | SATISFIED — `publications.schema.ts:138` |
| SCHEMA-03 — `counts.orcid` required integer field | SATISFIED — `publications.schema.ts:143` |
| SCHEMA-04 — `counts.deduped` required integer field | SATISFIED — `publications.schema.ts:144` |
| DEDUP-01 — Cross-source DOI dedup function exists | SATISFIED — `dedupByDoi` at `sync-publications.ts:460` |
| DEDUP-02 — InspireHEP wins over ORCID wins over arXiv on DOI collision | SATISFIED — priority concat order + first-seen-wins; tested at test:287 |
| DEDUP-03 — DOI normalization (lowercase, strip prefix) | SATISFIED — `normalizeDoi` at `sync-publications.ts:447`; tested at test:249 |
| DEDUP-04 — Entries without DOI pass through unchanged | SATISFIED — `dedupByDoi` null-DOI branch at `sync-publications.ts:465`; tested at test:307 |
| DEDUP-05 — `droppedCount` return value accurate | SATISFIED — tested at test:315 |
| CLI-01 — `--no-orcid` flag accepted | SATISFIED — `sync-publications.ts:42` |
| CLI-02 — `--no-arxiv --no-inspire --no-orcid` exits 1 | SATISFIED — guard at `sync-publications.ts:617`; confirmed at runtime |
| CLI-03 — Per-member line shows ORCID cell | SATISFIED — `sync-publications.ts:659` |
| CLI-04 — Summary line shows `deduped` count | SATISFIED — `sync-publications.ts:751` |
| CI-01 — Workflow invokes sync with all three sources; traceability comment | SATISFIED — `sync-publications.yml:38-45` |

---

## Anti-Patterns Found

None blocking. The `fetchOrcid` stub (`sync-publications.ts:313`) is intentional per phase specification — it returns `[]` and is clearly documented as a Phase 17 placeholder. This is not a defect.

---

## Human Verification Required

One item cannot be auto-verified:

**`pnpm sync-publications --no-orcid --dry-run` live network output**

- **Test:** Run `pnpm sync-publications --no-orcid --dry-run` from repo root (requires real InspireHEP + arXiv connectivity)
- **Expected stdout:** Per-member lines ending with `ORCID: skipped`; final line containing `deduped`; no write to `content/publications.json`
- **Why human:** Network-dependent (real InspireHEP + arXiv calls); skipped to avoid external I/O in automated verification. The code path is structurally verified — `orcidCell = "skipped"` when `runOrcid === false` (line 657), `dedupedCount` always appears in the dry-run summary (line 740).

---

## Summary

Phase 16 goal is achieved. Every structural requirement is present and wired:

1. The Zod schema, JSON schema, and live `content/publications.json` all carry `"orcid"` as a valid source value and expose `counts.orcid` + `counts.deduped` fields.
2. The sync CLI accepts `--no-orcid`, enforces the "no sources" guard before any I/O, routes through the `fetchOrcid` stub, emits the three-cell progress line, and includes `deduped` in the summary.
3. `normalizeDoi` and `dedupByDoi` are fully implemented, exported, and covered by unit tests that assert all five DEDUP requirements (precedence, normalization, no-DOI pass-through, accurate count).
4. The CI workflow invokes `pnpm sync-publications` with no suppression flags and carries the CI-01 traceability comment.
5. `pnpm tsc --noEmit`, `pnpm test` (76/76), and `pnpm build` (prebuild validate-content + Next.js build) all exit 0.

---

*Verified: 2026-04-20T15:10:00Z*
*Verifier: Claude (gsd-verifier)*
