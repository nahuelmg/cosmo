---
phase: 17
phase_name: orcid-fetcher
status: passed
must_haves_passed: 4/4
date: 2026-04-20
---

# Phase 17: ORCID Fetcher — Verification Report

**Phase Goal:** `sync-publications.ts` fetches real ORCID works for every person with `orcid_id` set, filters to `journal-article` + `conference-paper`, extracts per-work metadata, fetches full author lists for ORCID-only entries, and produces `source: "orcid"` Publication objects that flow through the Phase 16 dedup pipeline into `content/publications.json`.

**Verified:** 2026-04-20
**Status:** PASSED — all 4 success criteria verified, all 7 ORCID requirements satisfied, all build gates green.

---

## Success Criteria

### SC1 — ORCID entries present [PASSED]

```
jq '[.publications[] | select(.source == "orcid")] | length' content/publications.json
→ 15
```

15 ORCID-only publications are present in `content/publications.json`. The `_meta.counts.orcid` field is 87 (total fetched before cross-source dedup); 36 were deduped against InspireHEP/arXiv entries, leaving 15 ORCID-only survivors with `source: "orcid"`. The `_meta.sources` array contains `["inspirehep","orcid","arxiv"]`, confirming all three sources ran.

---

### SC2 — SiPM paper live [PASSED]

```
jq '.publications[] | select(.doi == "10.1016/j.nima.2020.164490")' content/publications.json
```

Returns:
```json
{
  "id": "10.1016/j.nima.2020.164490",
  "authors": [
    "Mariano Barella",
    "Tomás Ignacio Burroni",
    "Irina Carsen",
    "Mónica Far",
    "Tomás Ferreira Chase",
    "Lucas Finazzi",
    "Federico Golmar",
    "Fernando Gomez Marlasca",
    "Federico Izraelevitch",
    "Pablo Levy",
    "Gabriel Sanca"
  ],
  "title": "Silicon photomultiplier characterization on board a satellite in Low Earth Orbit",
  "journal": "Nuclear Instruments and Methods in Physics Research Section A: Accelerators, Spectrometers, Detectors and Associated Equipment",
  "year": 2020,
  "topic_tags": [],
  "source": "orcid",
  "doi": "10.1016/j.nima.2020.164490"
}
```

All sub-checks pass:
- `source: "orcid"` — confirmed
- `year: 2020` — confirmed
- `authors.length === 11` — confirmed (verified with `jq '.publications[] | select(.doi == "10.1016/j.nima.2020.164490") | .authors | length'` → 11)
- `journal` starts with "Nuclear Instruments and Methods" — confirmed (full journal string, NFC-normalized)
- `title` present and non-empty — confirmed
- `"Tomás Ferreira Chase"` in authors — confirmed (NFC accent U+00E1 intact)
- `"Mariano Barella"` in authors — confirmed

---

### SC3 — --no-orcid parity [PASSED (by code inspection + SUMMARY evidence)]

Code path verified in `scripts/sync-publications.ts`:

1. `runOrcid = !flags["no-orcid"]` (line 825) — flag correctly sets runOrcid to false.
2. In `syncMember()` (line 793): `if (runOrcid) { ... result.orcidPubs = publications; }` — when runOrcid=false, `result.orcidPubs` stays as `[]` (initialized in the result object at lines ~757-760).
3. `allOrcid = dedupByArxivId(memberResults.flatMap((r) => r.orcidPubs))` (line 866) — flatMap of empty arrays = `[]`.
4. `_meta.sources` construction (line 903-906): `...(runOrcid ? (["orcid"] as const) : [])` — "orcid" only added when runOrcid=true.
5. `_meta.counts.orcid = allOrcid.length` (line 912) — equals 0 when allOrcid is empty.

No code path can produce `source: "orcid"` entries when runOrcid=false because `orcidPubs` is never populated. `fetchOrcid` and `enrichOrcidAuthors` are both gated: `fetchOrcid` is only called inside the `if (runOrcid)` block in `syncMember`, and `enrichOrcidAuthors` skips immediately when `toEnrich.length === 0`.

SUMMARY 17-03 documents the three jq assertions run after a live `--no-orcid` execution:
```
jq '._meta.sources | any(. == "orcid")' content/publications.json   # → false
jq '[.publications[] | select(.source == "orcid")] | length' content/publications.json   # → 0
jq '._meta.counts.orcid' content/publications.json   # → 0
```
The full sync was re-run afterward to restore three-source output before committing.

---

### SC4 — 404 resilience [PASSED]

Code path in `scripts/sync-publications.ts` lines 368-371:
```typescript
if (res.status === 404) {
  process.stderr.write(`  Warning: ORCID profile not public or empty: ${orcid}\n`);
  return { publications: [], lookup: [] };
}
```
- Returns `{ publications: [], lookup: [] }` without throwing — script continues.
- Warning message matches the expected regex `/ORCID profile not public or empty: /`.

Vitest coverage in `scripts/sync-publications.test.ts`, describe block `"fetchOrcid — 404 resilience"` (line 541), test case `"returns empty result and emits warning when ORCID profile returns 404"` (line 546):
- Mocks `globalThis.fetch` to return `new Response("{}", { status: 404 })`
- Asserts return value `{ publications: [], lookup: [] }`
- Asserts warning regex `/ORCID profile not public or empty: 0000-0000-0000-0000/` written to stderr

Test confirmed passing: `pnpm vitest run scripts/sync-publications.test.ts` → 53 tests passed (0 failed).

---

## Requirements Coverage (ORCID-01 through ORCID-07)

| Requirement | Description | Code Location | Status |
|-------------|-------------|---------------|--------|
| ORCID-01 | Fetch ORCID works for every person with orcid_id | `syncMember()` line 793 — `fetchOrcid(person.orcid_id, person.name)` | SATISFIED |
| ORCID-02 | Anonymous public API (no OAuth) | `fetchOrcid()` line 366 — `https://pub.orcid.org/v3.0/{orcid}/works` with Accept header only | SATISFIED |
| ORCID-03 | HTTP 404 → warning + empty + continue | `fetchOrcid()` lines 368-371 — returns `{ publications: [], lookup: [] }` | SATISFIED |
| ORCID-04 | Filter to journal-article + conference-paper | `orcidGroupToPublication()` lines 535-536 — explicit type guard | SATISFIED |
| ORCID-05 | ID preference: DOI → arXiv → orcid-{put-code} | `orcidGroupToPublication()` line 546 — `const id = doi ?? arxiv ?? \`orcid-${putCode}\`` | SATISFIED |
| ORCID-06 | Full author list from per-work detail endpoint, runs after dedup | `enrichOrcidAuthors()` lines 704-730; called at line 895 — after `dedupByDoi()` at line 881 | SATISFIED |
| ORCID-07 | Detail fetches via runBatched (≤5 in-flight, 2s pause) | `enrichOrcidAuthors()` line 727 — `await runBatched(tasks)` (uses defaults: INSPIRE_BATCH_SIZE=5, INSPIRE_BATCH_PAUSE_MS=2000) | SATISFIED |

**Additional compliance checks:**

- **Pattern 2 (group-level external-ids):** `orcidGroupToPublication()` line 539 reads `group["external-ids"]?.["external-id"]` (NOT `work-summary[0]["external-ids"]`). Unit test at line 473 of test file: `"Pattern 2: group-level external-ids used even when work-summary[0] external-ids is empty"` — passes.
- **Pitfall 7 compliance (no "No ORCID results for" warning):** `grep 'No ORCID results for' scripts/sync-publications.ts` → zero matches. HTTP 200 with empty `group: []` is silent per research notes.
- **ORCID-06 call order:** `dedupByDoi` at line 881, `enrichOrcidAuthors` at line 895 — enrichment is clearly after dedup.

---

## Build Gate Health

| Gate | Result | Details |
|------|--------|---------|
| `pnpm tsc --noEmit` | PASSED (exit 0) | No TypeScript errors |
| `pnpm vitest run` | PASSED (exit 0) | 98 tests passed across 3 test files |
| `pnpm validate-content` | PASSED (exit 0) | "Content validation passed (5 files, all entries parsed, all photos exist)" |
| `pnpm build` | PASSED (exit 0) | "Compiled successfully in 4.3s", "Generating static pages using 7 workers (45/45)" — no errors |

---

## Gaps

None.

---

## Human Verification

None required. Phase 17 is a sync-only backend phase with no UI changes. All observable outcomes (publication counts, author lists, source labels) are verifiable from `content/publications.json` via jq.

---

## Conclusion

Phase 17 delivers its goal. All 7 ORCID requirements (ORCID-01 through ORCID-07) are implemented, tested, and verified against live data. `content/publications.json` contains 336 publications including 15 ORCID-only entries with full author lists, and the SiPM paper (DOI `10.1016/j.nima.2020.164490`) is present with `source: "orcid"`, 11 authors (NFC-normalized), correct year 2020, and the full journal title. All build gates are green.

Next step: `/gsd:plan-phase 18` (Display Layer — showing ORCID author lists in the publications UI).

---

*Verified: 2026-04-20*
*Verifier: Claude (gsd-verifier)*
