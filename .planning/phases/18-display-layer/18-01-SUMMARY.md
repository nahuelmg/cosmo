---
phase: 18-display-layer
plan: "01"
subsystem: ui
tags: [publications, orcid, filter, pills, i18n, next-intl, oklch, vitest]

# Dependency graph
requires:
  - phase: 17-orcid-fetcher
    provides: 15 ORCID-only publications in content/publications.json; orcid_id field in people.json
  - phase: 11-display-layer
    provides: PublicationEntry, PublicationsYearGroup, PublicationsClientShell, publications-helpers.ts
provides:
  - SourceFilter pill with 'orcid' option (four-way: all | inspirehep | arxiv | orcid)
  - Source badge on PublicationEntry for ORCID-source pubs (olive-green non-link span)
  - Author-ORCID link pill on InspireHEP/arXiv/Manual pubs whose author has contact.orcid set
  - Three-source footnote (EN + ES) explaining all badge types
  - buildMemberOrcidMap + getAuthorOrcidUrl helpers with 5 unit tests
  - Serializable RSC→client ORCID map pattern ([string,string][] via memberOrcidList)
affects:
  - 19-docs-verification
  - content/people.json data reconciliation (9 members flagged — see below)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RSC→client Map serialization: convert Map to [string,string][] on server, rebuild via useMemo in client shell"
    - "Surname-keyed ORCID map matching normalizeName for diacritic-folded substring lookup"
    - "Source pill suppression guard: authorOrcidUrl && publication.source !== 'orcid' avoids double olive chips"

key-files:
  created:
    - src/lib/publications-helpers.ts (buildMemberOrcidMap, getAuthorOrcidUrl added)
  modified:
    - src/components/publications/PublicationEntry.tsx
    - src/components/publications/PublicationsYearGroup.tsx
    - src/components/publications/PublicationsClientShell.tsx
    - src/app/[locale]/publications/page.tsx
    - src/components/people/PersonDetail.tsx
    - src/app/[locale]/people/[slug]/page.tsx
    - src/lib/publications-helpers.test.ts
    - messages/en.json
    - messages/es.json

key-decisions:
  - "contact.orcid chosen as canonical display field (not orcid_id) — matches PersonDetail.tsx convention"
  - "Author-ORCID pill suppressed when source === 'orcid' — avoids double olive-green chips"
  - "Map serialized as [string,string][] for RSC→client boundary (Map not JSON-serializable)"
  - "9-person people.json data reconciliation deferred; flagged in SUMMARY for manual resolution"
  - "Filter pill unchanged — still source === 'orcid' only (data-source filter, not author-link)"

patterns-established:
  - "ORCID OKLCH tokens: bg-[oklch(0.95_0.05_118)] text-[oklch(0.40_0.12_118)] — used for both source pill (non-link) and author-link pill (anchor)"
  - "RSC→client boundary: serialize Set as string[], Map as [string,string][]; rebuild via useMemo in 'use client' shell"

# Metrics
duration: ~45min
completed: 2026-04-20
---

# Phase 18 Plan 01: ORCID Source Parity Summary

**ORCID filter pill + source badge for ORCID-fetched papers + per-author ORCID link pill for member-authored InspireHEP/arXiv/Manual papers, with serializable RSC→client Map pattern**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-04-20T21:10:00Z (continuation from checkpoint)
- **Completed:** 2026-04-20T21:55:00Z
- **Tasks:** 6 (Tasks 1–2 prior session; Tasks 4–6 this session; Task 3 was human-verify checkpoint)
- **Files modified:** 9

## Accomplishments

- SourceFilter extended to four-way: `all | inspirehep | arxiv | orcid`; ORCID option shows with olive-green accent
- ORCID source badge renders on all 15 ORCID-fetched publications as non-link olive-green span (source pill IIFE unchanged)
- Author-ORCID link pill renders on InspireHEP/arXiv/Manual publications whose first matched author has `contact.orcid` set — currently Calzetta, Lopez Nacir, Landau
- Three-source footnote added in EN + ES explaining InspireHEP / arXiv / ORCID provenance
- `buildMemberOrcidMap` + `getAuthorOrcidUrl` helpers with 5 unit tests; total suite 98 → 104
- Serializable `[string,string][]` pattern established for RSC→client Map boundary

## Task Commits

1. **Task 1: SourceFilter pill (SourceFilterValue + options + filter.orcid i18n)** — `9d8d6ac` (feat)
2. **Task 2: Source badge + footnote i18n + orcid→null test** — `c06252a` (feat)
3. **Task 3: Human browser verification checkpoint** — no commit (gate only; user approved all 5 checks)
4. **Task 4: buildMemberOrcidMap + getAuthorOrcidUrl helpers + unit tests** — `b78b9d9` (feat)
5. **Task 5: Thread memberOrcidMap into PublicationEntry + render author-ORCID link pill** — `a13c779` (feat)
6. **Task 6: Full gate battery + SUMMARY + STATE** — this docs commit (docs)

## Files Created/Modified

- `src/components/publications/SourceFilter.tsx` — added `orcid` to SourceFilterValue union + filter option pill
- `src/components/publications/PublicationEntry.tsx` — ORCID source badge in pill IIFE; memberOrcidMap prop; authorOrcidUrl link pill (suppressed when source === 'orcid')
- `src/components/publications/PublicationsYearGroup.tsx` — thread memberOrcidMap prop
- `src/components/publications/PublicationsClientShell.tsx` — accept memberOrcidList:[string,string][]; rebuild Map via useMemo
- `src/app/[locale]/publications/page.tsx` — buildMemberOrcidMap + serialize as memberOrcidList
- `src/components/people/PersonDetail.tsx` — memberOrcidMap prop threaded to PublicationEntry
- `src/app/[locale]/people/[slug]/page.tsx` — buildMemberOrcidMap(allPeople) + pass to PersonDetail
- `src/lib/publications-helpers.ts` — buildMemberOrcidMap + getAuthorOrcidUrl added (lines 197–243)
- `src/lib/publications-helpers.test.ts` — 5 new tests; +buildMemberOrcidMap + getAuthorOrcidUrl imports
- `messages/en.json` — filter.orcid, source.orcid, footnote keys
- `messages/es.json` — filter.orcid, source.orcid, footnote keys (ES translations)

## ORCID OKLCH Design Tokens (locked)

```
bg-[oklch(0.95_0.05_118)] text-[oklch(0.40_0.12_118)]
```

Used in both:
- Source pill ORCID branch (non-link `<span>`) — existing
- Author-ORCID link pill (new `<a>` anchor) — Task 5

## Footnote Strings

**EN:** `"Publications sourced from InspireHEP, arXiv, and ORCID. InspireHEP and arXiv entries link to the respective record; ORCID entries are fetched directly from member profiles."`

**ES:** `"Publicaciones obtenidas de InspireHEP, arXiv y ORCID. Las entradas de InspireHEP y arXiv enlazan al registro correspondiente; las entradas de ORCID se obtienen directamente de los perfiles de los miembros."`

## Test Count Delta

| Phase | Count | Change |
|-------|-------|--------|
| Before 18-01 | 98 | — |
| After Task 2 (orcid→null branch test) | 99 | +1 |
| After Task 4 (buildMemberOrcidMap ×2 + getAuthorOrcidUrl ×3) | 104 | +5 |
| **Final** | **104** | **+6 total** |

## Browser Verification Outcome

User approved all 5 manual checks at the Task 3 checkpoint:
1. ORCID filter pill visible and functional
2. ORCID source badge (olive-green non-link) on ORCID-fetched papers
3. InspireHEP/arXiv pills unchanged
4. Footnote visible with correct three-source text
5. SiPM paper (Tomás's) shows single olive-green non-link "ORCID" source pill

## Decisions Made

- **contact.orcid as canonical display field:** Matches `PersonDetail.tsx:177` convention (public ORCID link on profile pages). The `orcid_id` field is used only by the sync script. This decision locks `buildMemberOrcidMap` to read from `contact.orcid`.
- **Author-ORCID pill suppressed when source === "orcid":** Tomas's SiPM paper and other ORCID-fetched entries already have the olive-green source pill. Adding an author-link pill on top would duplicate the visual. Suppression guard: `authorOrcidUrl && publication.source !== "orcid"`.
- **Map serialization as [string,string][]:** `Map<string,string>` is not JSON-serializable across the RSC→client boundary in Next.js. Serialize as entry-array on the server page; rebuild via `useMemo(new Map(memberOrcidList), [memberOrcidList])` in `PublicationsClientShell`.
- **9-person people.json reconciliation deferred:** Only 3 members currently have `contact.orcid` set. 9 others have data quality issues (see Data Reconciliation section). Their papers do not gain the author-link pill until resolved manually.
- **Filter pill unchanged:** The `source === "orcid"` filter is a data-source filter (15 ORCID-fetched papers), not an author-link filter. No change to filter logic.

## Deviations from Plan

### Post-Checkpoint Scope Addition (User Request)

**"ORCID pill should appear on any publication with a member-author having contact.orcid ALSO"**

- **Requested at:** Task 3 checkpoint (human-verify)
- **Decision authority:** User ("you decide")
- **Implementation:** Tasks 4 + 5 (new helper functions + component threading)
- **Scope:** Additional olive-green anchor chip on InspireHEP/arXiv/Manual pubs with a Calzetta/Lopez Nacir/Landau author; suppressed on ORCID-source pubs to avoid double chips
- **Files added:** buildMemberOrcidMap, getAuthorOrcidUrl in publications-helpers.ts
- **Tests added:** 5 new unit tests

No other deviations. Plan tasks 1–2 executed exactly as written.

## Data Reconciliation Needed

**ACTION REQUIRED: 9 members in content/people.json need manual review before the author-ORCID pill works fully.**

### Mismatched ORCID IDs (3 members — decide which value is canonical)

The sync script uses `orcid_id` and has fetched real data with those values. The `contact.orcid` field (used for display) holds different values — likely stale from an earlier manual entry.

| Person | `orcid_id` (sync field) | `contact.orcid` (display field — currently used) |
|--------|-------------------------|---------------------------------------------------|
| Esteban Calzetta | `0000-0002-3083-3420` | `0000-0001-7842-3105` |
| Diana Lopez Nacir | `0000-0003-4398-1147` | `0000-0001-5533-9821` |
| Susana Landau | `0000-0003-2645-9197` | `0000-0002-4411-8732` |

**Recommendation:** Verify which ORCID ID actually belongs to each person by visiting both `https://orcid.org/{orcid_id}` and `https://orcid.org/{contact.orcid}`. Whichever is correct should be set in BOTH fields. The sync script currently runs successfully against the `orcid_id` values — those are known to return data.

### Missing contact.orcid (6 members — backfill after resolving mismatches above)

These members have `orcid_id` set (sync works) but `contact.orcid: null` (no author-link pill appears on their papers).

| Person | `orcid_id` (sync field) | `contact.orcid` (current) |
|--------|-------------------------|---------------------------|
| Cecilia Scannapieco | `0000-0003-0376-333X` | null |
| Nahuel Miron Granese | `0000-0003-0770-1865` | null |
| Javier Badia | `0000-0002-9095-9594` | null |
| Tomás Ferreira Chase | `0009-0001-0286-2136` | null |
| Matias Leizerovich | `0000-0002-6438-2285` | null |
| Augusto Chantada | `0000-0002-4480-9595` | null |

**Note on Tomás's SiPM paper:** Until `contact.orcid` is backfilled for Tomás, his SiPM paper continues to show the single olive-green non-link "ORCID" source pill (correct behavior — the publication was fetched via ORCID sync, so source = "orcid" and the author-link pill is suppressed anyway). Once backfilled, his InspireHEP papers would gain the author-link pill, but the SiPM paper remains unchanged.

## Issues Encountered

None — all implementation proceeded without blocking issues. The RSC→client Map serialization was anticipated and handled by the `[string,string][]` pattern.

## User Setup Required

None — all changes are UI/display layer. No environment variables, external service configuration, or manual deployment steps required.

## Next Phase Readiness

- Phase 18 (Display Layer) is complete pending the Phase 19 verifier step
- Phase 19 (Docs & Verification) is next: `v1.3` milestone docs, REQUIREMENTS.md update, audit
- **Blocker before Phase 19:** Optionally resolve the 9-person `people.json` reconciliation (not a blocker for docs/verification, but any backfill should happen before the milestone seal)

---
*Phase: 18-display-layer*
*Completed: 2026-04-20*
