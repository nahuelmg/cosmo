# Phase 19: Docs & Verification - Research

**Researched:** 2026-04-20
**Domain:** Documentation authoring + post-deploy ORCID sync verification
**Confidence:** HIGH (all findings from codebase inspection, no external research required)

---

## Summary

Phase 19 is entirely a documentation + verification phase. There is no new code to write. The work splits into two independent tasks: (1) extend `content/SYNC.md` with ORCID-specific sections, and (2) trigger a post-deploy `workflow_dispatch` sync and confirm Tomas Chase's SiPM paper appears on the live site.

The SiPM paper (`10.1016/j.nima.2020.164490`) is **already present** in `content/publications.json` with source `"orcid"` and the full 11-author list. Tomas Chase's `orcid_id: "0009-0001-0286-2136"` is **already in** `people.json`. VERIFY-01 therefore depends only on the site being deployed and a sync run completing — no data entry is required.

For DOC-01, `content/SYNC.md` already has solid coverage of InspireHEP BAI lookup, ORCID sign-up/linking (v1.1-era), `display_name_normalized` format, and operational troubleshooting. What is missing is ORCID-specific sync mechanics: the API endpoints used by the script, the three-source `_meta` schema, the DOI dedup precedence rule, and ORCID-specific error handling.

**Primary recommendation:** Two-task plan. Task 1: extend SYNC.md with 5 new sections mapped directly to DOC-01's (a)–(e) success criteria. Task 2: post-deploy workflow_dispatch trigger + visual check of live `/people/tomas-ferreira-chase`.

---

## Standard Stack

No new libraries. This phase operates entirely in:
- Markdown (`content/SYNC.md`)
- GitHub Actions UI (`workflow_dispatch` button)
- Browser (live site verification)

---

## Architecture Patterns

### Existing SYNC.md Structure (as of Phase 18)

Current sections (all present, all good):
1. `## Finding Your InspireHEP BAI Identifier`
2. `## Finding Your ORCID` — covers sign-up, locating the 16-digit ID, linking to arXiv + InspireHEP, pasting into `people.json`; uses `orcid_id` field
3. `## display_name_normalized Format`
4. `## Field Summary` — table + full `diana-lopez-nacir` example JSON
5. `## Operational Troubleshooting` — `workflow_dispatch` steps, summary reading, cron failures, dry-run CLI

**What the existing ORCID section does NOT cover:**
- The ORCID Public API endpoint that the sync script queries
- The distinction between `orcid_id` (sync field) and `contact.orcid` (display field)
- DOI precedence dedup rule (InspireHEP > ORCID > arXiv)
- The three-source `_meta` JSON block
- ORCID-specific troubleshooting: 404 (invalid ID), 200-empty (private/empty profile), missing work types

### Sections to Add to SYNC.md

The five DOC-01 sub-requirements map to these insertions:

**(a) ORCID Works API endpoint and how it's queried**

Location: New subsection under or following `## Finding Your ORCID`

From `scripts/sync-publications.ts`:
- Works list: `https://pub.orcid.org/v3.0/{orcid}/works` (line 365) — requires `Accept: application/json` header (Pitfall 1 in code; default returns XML)
- Per-work detail: `https://pub.orcid.org/v3.0/{orcid}/work/{putCode}` (line 400) — called after dedup to fetch full contributor list for ORCID-only survivors (ORCID-06)
- arXiv ORCID feed (separate): `https://arxiv.org/a/{orcid}.atom2` (line 338) — the only working ORCID endpoint on arXiv; standard `search_query` does NOT support ORCID
- Filtered work types: only `journal-article` and `conference-paper` (line 536); preprints/datasets/other types silently dropped

**(b) Step-by-step guidance: finding/adding ORCID to people.json**

Already present (v1.1 era). However, the existing section references only `orcid_id`. Should add clarifying note:
- `orcid_id` — used by the sync script to query ORCID and arXiv APIs
- `contact.orcid` — used for the author-link ORCID pill on publication entries (Phase 18 decision 18-01; `buildMemberOrcidMap` in `src/lib/publications-helpers.ts` line 202 reads this field)
- Best practice: set **both** to the same 16-digit ID; `orcid_id` drives sync, `contact.orcid` drives display

**(c) DOI precedence rule**

From `scripts/sync-publications.ts` lines 870–881:
```
Concat order: manual → inspirehep → orcid → arxiv
```
- Cross-source dedup by arXiv ID first (line 876), then by DOI (line 881)
- Both dedup passes are first-seen-wins → manual and InspireHEP entries are never dropped when DOI matches
- Effective precedence: **Manual > InspireHEP > ORCID > arXiv**
- Comment at line 879: "CRITICAL: must run BEFORE the sort in mergePublications; the sort scrambles source order and would break first-seen-wins precedence"

**(d) Three-source `_meta` JSON example**

Current real example from `content/publications.json` (synced 2026-04-20):
```json
{
  "_meta": {
    "synced_at": "2026-04-20T20:45:58.468Z",
    "sources": ["inspirehep", "orcid", "arxiv"],
    "counts": {
      "inspirehep": 317,
      "arxiv": 73,
      "manual": 0,
      "orcid": 87,
      "deduped": 36
    },
    "warnings": [
      "No arXiv results for Esteban Calzetta (0000-0002-3083-3420)",
      "No arXiv results for Susana Landau (0000-0003-2645-9197)",
      "No arXiv results for Javier Badia (0000-0002-9095-9594)"
    ]
  }
}
```
Fields: `synced_at` (ISO timestamp), `sources` (array of active sources), `counts.inspirehep`, `counts.arxiv`, `counts.manual`, `counts.orcid`, `counts.deduped` (cross-source DOI matches removed), `warnings` (non-fatal per-member messages).

Schema: `src/content/schemas/publications.schema.ts` — `orcid` and `deduped` are REQUIRED (decision 16-01).

**(e) ORCID troubleshooting section**

Error modes from `scripts/sync-publications.ts`:

| Symptom | Root cause | Script behavior | Fix |
|---------|-----------|-----------------|-----|
| `Warning: ORCID profile not public or empty: {id}` | HTTP 404 from `pub.orcid.org` — invalid ORCID iD | `fetchOrcid` returns empty (line 368–370) | Verify ID at `https://orcid.org/{id}` |
| No warning but ORCID count stays 0 for a member | HTTP 200 with `group: []` — profile exists but is private or has no works | Silent (Pitfall 7, line 357) | Member must make their works public in ORCID settings |
| Papers exist in ORCID profile but aren't synced | Work type not `journal-article` or `conference-paper` | `orcidGroupToPublication` returns null (line 536) | Only journal articles and conference papers surface; preprints/datasets/book chapters are filtered |
| Per-work detail fetch fails mid-run | HTTP 404 on `/work/{putCode}` — profile changed between works-list and detail fetch | Placeholder author list preserved (decision 17-03, line 403) | Non-fatal; paper appears with owner name as sole author |
| `ORCID {statusCode} for {orcid}` error | Non-404, non-200 response (5xx, 429) | Throws; `fetchWithRetry` wraps 503 (decision 17-01) | Transient: re-run via `workflow_dispatch`; persistent 429 → upstream rate limit, wait and retry |

---

## VERIFY-01 Mechanics

### Current State of the SiPM Paper

The SiPM paper is **already in `content/publications.json`** with all required fields:
- `"id": "10.1016/j.nima.2020.164490"`
- `"source": "orcid"`
- `"title": "Silicon photomultiplier characterization on board a satellite in Low Earth Orbit"`
- `"journal": "Nuclear Instruments and Methods in Physics Research Section A: ..."`
- `"year": 2020`
- Full 11-author list (Mariano Barella, Tomás Ignacio Burroni, Irina Carsen, Mónica Far, **Tomás Ferreira Chase**, Lucas Finazzi, Federico Golmar, Fernando Gomez Marlasca, Federico Izraelevitch, Pablo Levy, Gabriel Sanca)

### Tomas Chase in people.json

Entry at `content/people.json` (slug: `tomas-ferreira-chase`):
- `"orcid_id": "0009-0001-0286-2136"` — PRESENT (used by sync script)
- `"contact": { "email": "..." }` — `contact.orcid` NOT SET (no author-link pill will show on his papers; deferred per 18-01)
- `"inspirehep_id": "Tomas.F.Chase.1"` — PRESENT

VERIFY-01 only requires the paper to be visible on the live page. Since the data is already in `publications.json`, VERIFY-01 is a matter of:
1. Ensuring the site is deployed (Vercel, per STATE.md line 203)
2. Triggering a post-deploy `workflow_dispatch` run (SYNC.md already documents exactly how to do this)
3. Visiting `https://{site-url}/people/tomas-ferreira-chase` and confirming the paper appears

The `workflow_dispatch` may result in "No changes — skipping commit" if publications.json already has the paper (which it does). The verification step is visual confirmation on the live site, not the sync run changing anything.

### Deployment Platform

Vercel (confirmed in `references/deployment/vercel.md` and STATE.md decision log). Deployment triggers on push to main. The GitHub Actions sync workflow is at `.github/workflows/sync-publications.yml` — already has `workflow_dispatch` trigger (line 6).

---

## Common Pitfalls

### Pitfall 1: VERIFY-01 may be trivially passable from current state
**What goes wrong:** The SiPM paper is already in the deployed publications.json. A "post-deploy sync" may show no changes. VERIFY-01 asks for the paper to be visible on the live site, not for the sync to add it anew.
**How to avoid:** Check the live site directly. If the site is deployed and the paper is visible, VERIFY-01 is already satisfied. The `workflow_dispatch` run is still worth executing as a smoke test.

### Pitfall 2: contact.orcid vs orcid_id confusion in docs
**What goes wrong:** Existing SYNC.md text refers only to `orcid_id`. Phase 18 introduced `contact.orcid` for the author-link pill. A maintainer adding only `orcid_id` will have sync coverage but no ORCID pill on their papers.
**How to avoid:** DOC-01(b) update should clarify both fields and recommend setting both.

### Pitfall 3: SYNC.md uses "ORCID" ambiguously
**What goes wrong:** The existing SYNC.md text uses "ORCID" to mean both the organization (orcid.org) and the sync source. Post-Phase 17, "ORCID" also means the third publication source in the sync pipeline.
**How to avoid:** Be explicit: "the ORCID Works API" (sync source) vs "your ORCID iD" (identifier).

### Pitfall 4: arXiv ORCID feed endpoint is distinct from InspireHEP/ORCID
**What goes wrong:** Documenting `pub.orcid.org` for everything; the arXiv papers come from `arxiv.org/a/{orcid}.atom2`.
**How to avoid:** Document both endpoints clearly — arXiv uses `orcid_id` as a query key but hits the arXiv atom2 feed, not the ORCID API.

---

## Code Examples

### ORCID Works List Endpoint (script/sync-publications.ts:365)
```typescript
const url = `https://pub.orcid.org/v3.0/${orcid}/works`;
const res = await fetchWithRetry(url, { headers: { Accept: "application/json" } });
```

### ORCID Work Detail Endpoint (scripts/sync-publications.ts:400)
```typescript
const url = `https://pub.orcid.org/v3.0/${orcid}/work/${putCode}`;
```

### arXiv ORCID Feed (scripts/sync-publications.ts:338)
```typescript
const url = `https://arxiv.org/a/${orcid}.atom2`;
```

### DOI Dedup Priority Concat (scripts/sync-publications.ts:873)
```typescript
const priorityOrdered = [...manualEntries, ...allInspire, ...allOrcid, ...allArxiv];
// first-seen-wins for both arXiv-ID and DOI dedup passes
```

---

## Open Questions

1. **Is the live site currently deployed with the Phase 18 changes?**
   - What we know: Phase 18 merged to main on 2026-04-20; Vercel auto-deploys on push to main
   - What's unclear: Whether the Vercel deploy completed and whether the SiPM paper is visually appearing
   - Recommendation: Planner should scope VERIFY-01 as a simple browser check + optional workflow_dispatch. If site is live and paper shows, VERIFY-01 is done.

2. **Should contact.orcid backfill be in Phase 19 or deferred?**
   - What we know: 6 members have `orcid_id` but missing `contact.orcid`; 18-01-SUMMARY.md flags this as a data quality item deferred from Phase 18
   - What's unclear: Whether Phase 19 should include this backfill or leave it for a separate task
   - Recommendation: VERIFY-01 does not require `contact.orcid` for Tomas (SiPM paper has `source: "orcid"` so the author-link pill is suppressed anyway per 18-01 decision). The backfill is a separate quality task, not a Phase 19 requirement.

---

## Sources

### Primary (HIGH confidence)
- `scripts/sync-publications.ts` — All ORCID API endpoints, error handling, dedup logic (direct code inspection)
- `content/SYNC.md` — Existing documentation structure (direct file read)
- `content/publications.json` — Current `_meta` block + SiPM paper entry (direct file read)
- `content/people.json` — Tomas Chase entry confirming `orcid_id` present, `contact.orcid` absent (direct file read)
- `.github/workflows/sync-publications.yml` — `workflow_dispatch` trigger confirmed (direct file read)
- `.planning/phases/18-display-layer/18-01-SUMMARY.md` — contact.orcid vs orcid_id distinction, backfill deferrals
- `.planning/STATE.md` — v1.3 decisions, deployment platform (Vercel)

---

## Metadata

**Confidence breakdown:**
- Documentation scope: HIGH — current SYNC.md fully read; gaps are clear and well-defined
- ORCID API endpoints: HIGH — all URLs extracted from actual code (not from memory)
- DOI precedence rule: HIGH — concat order + comment at lines 870–881 is authoritative
- VERIFY-01 preconditions: HIGH — SiPM paper confirmed in publications.json with required fields
- Deployment: HIGH — Vercel confirmed in references and STATE.md

**Research date:** 2026-04-20
**Valid until:** Stable — no fast-moving tech dependencies
