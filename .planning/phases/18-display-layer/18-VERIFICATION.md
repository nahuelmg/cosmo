---
phase: 18-display-layer
verified: 2026-04-20T19:02:00Z
status: passed
score: 4/4 must-haves verified
---

# Phase 18: Display Layer Verification Report

**Phase Goal:** `/publications` treats ORCID entries as a first-class source — the filter pill, source badge, bilingual labels, footnote wording, and Schema.org JSON-LD all cover the `"orcid"` source with parity to `"inspirehep"` and `"arxiv"`.

**Verified:** 2026-04-20T19:02:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Gate Results

| Command | Result |
| ------- | ------ |
| `pnpm tsc --noEmit` | 0 errors |
| `pnpm vitest run` | 104 tests passed (3 test files) |
| `pnpm build` | Clean SSG build — /es/publications and /en/publications both prerendered |
| `jq '[.publications[] \| select(.source == "orcid")] \| length'` | 15 (expected 15) |

---

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ORCID filter pill appears in SourceFilter group; clicking shows only ORCID-sourced entries; pill renders `aria-pressed="true"` when active | VERIFIED | `SourceFilter.tsx` line 19: `{ key: 'orcid', label: t('filter.orcid') }` in options array. `aria-pressed={active}` on every button (line 37). Filtering logic in `PublicationsClientShell.tsx` lines 48-56 uses `p.source === source`, which covers `"orcid"` exactly. Both `en.json` and `es.json` have `publications.filter.orcid = "ORCID"`. |
| 2 | Each ORCID publication entry displays a visually distinct "ORCID" source badge using the same component with a new source variant — no new badge component | VERIFIED | `PublicationEntry.tsx` lines 55-56 handle `source === "orcid"` with tone `bg-[oklch(0.95_0.05_118)] text-[oklch(0.40_0.12_118)]` (olive-green). Label "ORCID" returned at line 64. Same inline `href ? <a> : <span>` component pattern as InspireHEP/arXiv. `getSourcePillHref` returns `null` for ORCID (confirmed in test file line 262-267), so ORCID badge renders as a non-link `<span>` — correct since discoverability is served by the DOI link row. |
| 3 | Footnote reads as three-source description in both Spanish and English, includes plain-language DOI precedence rule | VERIFIED | EN: "Publications are sourced from InspireHEP, arXiv, and ORCID. When the same paper is indexed by more than one source, entries are merged by DOI into a single record (precedence: InspireHEP, then ORCID, then arXiv)." ES: "Las publicaciones provienen de InspireHEP, arXiv y ORCID. Cuando un mismo trabajo aparece en más de una fuente, las entradas se fusionan por DOI en un único registro (precedencia: InspireHEP, luego ORCID, luego arXiv)." Rendered in `publications/page.tsx` line 84 via `{t('footnote')}`. |
| 4 | SiPM paper (DOI 10.1016/j.nima.2020.164490) appears in PersonDetail "Publicaciones recientes" section with full 11-author list, rendered identically to InspireHEP/arXiv papers | VERIFIED | `content/publications.json` confirms: `source: "orcid"`, 11 authors, DOI present. `people/[slug]/page.tsx` calls `getPublicationsByAuthor(deriveNameVariants(rawPerson))` and passes result to `PersonDetail` with `memberOrcidMap` — same render path as InspireHEP/arXiv papers via `PublicationEntry`. DOI link row renders because `pub.doi` is set. |

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/publications/SourceFilter.tsx` | ORCID pill in options array | VERIFIED | 57 lines, exports `SourceFilter`, `SourceFilterValue` type includes `'orcid'`, options array has `{ key: 'orcid', label: t('filter.orcid') }` |
| `src/components/publications/PublicationEntry.tsx` | ORCID tone + label branch | VERIFIED | 125 lines, handles `source === "orcid"` at lines 55-56 and 63-64; no new badge component created |
| `src/components/publications/PublicationsClientShell.tsx` | Filter wired to SourceFilter + ORCID filter logic | VERIFIED | 73 lines, wires `SourceFilter` → `filteredGroups` via `p.source === source`; accepts `memberOrcidList` and passes `memberOrcidMap` to year groups |
| `src/components/publications/PublicationsYearGroup.tsx` | Passes memberOrcidMap to entries | VERIFIED | 42 lines, threads `memberOrcidMap` through to each `PublicationEntry` |
| `src/components/people/PersonDetail.tsx` | Renders member pubs via same PublicationEntry | VERIFIED | 232 lines, `memberOrcidMap` prop accepted and passed to each `PublicationEntry` in the publications section |
| `src/lib/publications-helpers.ts` | `buildMemberOrcidMap` + `getAuthorOrcidUrl` exported | VERIFIED | 235 lines; both functions present, exported, tested in 7 unit tests |
| `src/lib/publications-helpers.test.ts` | Tests for new ORCID helper functions | VERIFIED | 337 lines; `buildMemberOrcidMap` (2 tests) and `getAuthorOrcidUrl` (3 tests) + `getSourcePillHref` orcid branch test; 104 total tests pass |
| `messages/en.json` | `publications.filter.orcid` + three-source footnote | VERIFIED | `filter.orcid: "ORCID"`; footnote names InspireHEP, arXiv, and ORCID; includes DOI precedence explanation |
| `messages/es.json` | `publications.filter.orcid` + three-source footnote | VERIFIED | `filter.orcid: "ORCID"`; footnote names InspireHEP, arXiv y ORCID; includes DOI precedence explanation |
| `content/publications.json` | 15 ORCID entries; SiPM paper with full 11-author list | VERIFIED | 15 entries with `source: "orcid"`; SiPM paper `id: "10.1016/j.nima.2020.164490"` has 11 authors and `doi` set |
| `src/app/[locale]/publications/page.tsx` | Builds OrcidMap; passes to client shell; renders footnote | VERIFIED | Imports `buildMemberOrcidMap`, builds map on lines 44-45, serializes to `memberOrcidList`, passes to `PublicationsClientShell`; footnote rendered line 84 |
| `src/lib/schemas.ts` `buildScholarlyArticleSchema` | ORCID entries flow through JSON-LD unchanged | VERIFIED | Function is source-agnostic; uses `pub.arxiv` and `pub.doi` for `sameAs`/`identifier` regardless of source; SiPM paper emits `identifier: { propertyID: "DOI", value: "https://doi.org/10.1016/j.nima.2020.164490" }` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SourceFilter` (ORCID pill click) | filtered publications list | `PublicationsClientShell` `useMemo` on `source` state | WIRED | `onChange={setSource}` in ClientShell; `filteredGroups` filters by `p.source === source` |
| `publications/page.tsx` | `PublicationsClientShell` | `memberOrcidList` prop | WIRED | Serialized from Map, passed as `[string, string][]`, rebuilt as `Map` in `useMemo` |
| `PublicationsClientShell` | `PublicationEntry` | `memberOrcidMap` threaded through `PublicationsYearGroup` | WIRED | YearGroup accepts and forwards `memberOrcidMap` to every entry |
| `PublicationEntry` | author ORCID link pill | `getAuthorOrcidUrl(publication.authors, memberOrcidMap)` | WIRED | Returns URL when member-author matches; suppressed when `publication.source === "orcid"` (line 81) |
| `people/[slug]/page.tsx` | `PersonDetail` pubs section | `buildMemberOrcidMap(allPeople)` passed as `memberOrcidMap` | WIRED | Line 84 builds map, line 99 passes it; PersonDetail passes to each `PublicationEntry` |
| All publications (including ORCID) | Schema.org JSON-LD | `buildScholarlyArticleSchema(pub)` in `publications/page.tsx` | WIRED | Lines 64-68 loop `allPublications` (all sources) emitting `<JsonLd>` per entry |

---

## Post-Checkpoint Deviation (Approved Mid-Flight)

The author-ORCID link pill (a new chip linking to an author's ORCID profile when a member-author has `contact.orcid` set, suppressed when `source === "orcid"`) was implemented and verified:

- `buildMemberOrcidMap` in `publications-helpers.ts` builds `Map<surname, orcid>` from people with `contact.orcid`
- 3 members currently have `contact.orcid` set: Calzetta (`0000-0001-7842-3105`), Lopez Nacir (`0000-0001-5533-9821`), Landau (`0000-0002-4411-8732`)
- Suppression guard at `PublicationEntry.tsx` line 81: `{authorOrcidUrl && publication.source !== "orcid" && (...)}`
- 6 members with `orcid_id` but no `contact.orcid` are an intentional deferral documented in 18-01-SUMMARY.md reconciliation table — not a gap

---

## Requirements Coverage

All 4 ROADMAP must-haves satisfied. The post-checkpoint deviation (author ORCID link pill) is implemented and consistent with its specification.

---

## Anti-Patterns Found

No blocker or warning anti-patterns found across modified files. No TODO/FIXME comments, no placeholder content, no stub handlers.

---

## Human Verification

Per the task specification, Task 3 from plan 18-01 was a blocking human-verify checkpoint that the user approved in-flight (all 5 manual browser checks confirmed: filter pills on /en + /es, SiPM paper on both people pages, Schema.org JSON-LD on view-source). No further human verification is needed.

---

_Verified: 2026-04-20T19:02:00Z_
_Verifier: Claude (gsd-verifier)_
