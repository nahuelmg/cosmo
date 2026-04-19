---
phase: 11-display-layer
plan: 01
subsystem: publications-display
tags: [publications, helpers, i18n, components, vitest]
requires: [10-01]
provides: [getPublicationsMeta, publications-helpers, PublicationEntry-v2, i18n-publications-keys]
affects: [11-02, 11-03]
tech-stack:
  added: []
  patterns: [pure-helpers-module, surname-based-matching, et-al-member-visible-invariant, two-chip-badge-cluster]
key-files:
  created:
    - src/lib/publications-helpers.ts
    - src/lib/publications-helpers.test.ts
  modified:
    - src/content/accessors/publications.ts
    - src/content/index.ts
    - src/components/publications/PublicationEntry.tsx
    - messages/es.json
    - messages/en.json
decisions:
  - surname-based matching: last word of display_name_normalized (not full string) — empirically verified that "tomas ferreira chase" does NOT substring-match "chase, tomas ferreira"
  - buildMemberSurnameSet consumes ALL people unfiltered (past + current) — CONTEXT locked decision for group historical continuity
  - et al. expansion invariant: member never hidden under "et al." — CONTEXT locked decision
  - preprint detection via pub.journal === "Preprint" (semantic signal, not source field)
  - Manual source pill renders as <span> (non-link); InspireHEP/arXiv render as <a>
  - OKLCH bespoke literals for source pill tones (chroma <= 0.05 bg / 0.12 text) — subdued, no saturated brand colors
  - people.selectedPublications key left in messages/*.json (v1.2 cleanup, RESEARCH Pitfall 5)
metrics:
  duration: "4 minutes"
  completed: "2026-04-19"
---

# Phase 11 Plan 01: Shared Publication Entry Helpers + i18n Summary

**One-liner:** Surname-based author matching + et-al member-visible invariant + two-chip source/status badges + seven i18n keys — pure Wave 1 foundation for parallel 11-02/11-03.

---

## Exported Symbols Added

### `src/content/accessors/publications.ts`

```ts
export function getPublicationsMeta(): PublicationsMeta
```
Returns the `_meta` block (synced_at, sources, counts, warnings) from `content/publications.json`. Previously `_meta` was destructured and discarded. Required for PUBS-09 "Actualizado el [date]" staleness line in 11-02.

### `src/content/index.ts`

```ts
export type { Publication, Publications, PublicationsMeta } from "./schemas/publications.schema";
```
Added `PublicationsMeta` to the type-only re-export line.

### `src/lib/publications-helpers.ts`

```ts
export function deriveNameVariants(
  person: Pick<Person, "display_name_normalized">
): string[]
```
Returns up to 3 name variants for `getPublicationsByAuthor`: last word (surname), last two words (compound surname), full normalized name. Surname-based strategy empirically verified to work with InspireHEP `"Surname, First"` format.

```ts
export function buildMemberSurnameSet(
  people: Pick<Person, "display_name_normalized">[]
): Set<string>
```
Extracts the last word (surname, >= 3 chars) of each person's `display_name_normalized`. Consumes ALL people regardless of status — past AND current members highlighted.

```ts
export function isMember(
  authorStr: string,
  memberSurnameSet: Set<string>
): boolean
```
True when any member surname appears as NFD-normalized substring in the author string. Works for both `"Chase, Tomás Ferreira"` (InspireHEP) and `"Chase"` (arXiv token).

```ts
export interface AuthorToken {
  display: string;
  isMember: boolean;
  isEllipsis?: boolean;
}

export function formatAuthors(
  authors: string[],
  memberSurnameSet: Set<string>
): { tokens: AuthorToken[]; etAl: boolean }
```
Formats author list: ≤5 authors → all tokens; >5 authors → first 3 + ellipsis + tail-through-last-member if member is beyond index 2. Invariant: no member hidden under "et al.".

```ts
export function getSourcePillHref(pub: Publication): string | null
```
Five branches: inspirehep+arxiv → literature?q=arxiv:{id}; inspirehep+inspire-N id → literature/{N}; arxiv+arxiv → arxiv.org/abs/{id}; manual → null; fallback → null.

---

## Test Cases Added (23 total)

**`deriveNameVariants`:**
- "tomas ferreira chase" → includes "chase" and "ferreira chase"
- "diana lopez nacir" → includes "nacir" and "lopez nacir"
- Full normalized name included as fallback variant
- Empty string returns empty array

**`buildMemberSurnameSet`:**
- Extracts last word as surname for each person
- Past member entry (display_name_normalized includes "alumni past member") produces "member" in set — proves past-and-current coverage
- Surnames < 3 chars excluded
- Empty array returns empty Set

**`isMember`:**
- "Chase, Tomás Ferreira" + Set(["chase"]) → true
- "Smith, John" + Set(["chase"]) → false
- Diacritic-insensitive (NFD normalization)
- Empty set → false

**`formatAuthors`:**
- 3 authors, empty set → 3 tokens, etAl: false
- 6 authors, empty set → 3 tokens, etAl: true, no ellipsis
- 7 authors with member at index 6 → tokens include isEllipsis:true AND isMember:true for "Chase, Tomas"; etAl: true (ET AL. MEMBER-VISIBLE INVARIANT)
- Short list annotates isMember correctly

**`getSourcePillHref`:**
- inspirehep + arxiv: "https://inspirehep.net/literature?q=arxiv:2501.12345"
- inspirehep + inspire-1234567 id: "https://inspirehep.net/literature/1234567"
- arxiv + arxiv: "https://arxiv.org/abs/2406.00891"
- manual: null
- inspirehep + non-inspire id: null

---

## i18n Keys Added

Both `messages/es.json` and `messages/en.json` extended under `"publications"`:

| Key | ES | EN |
|-----|----|----|
| `published` | `"Publicado"` | `"Published"` |
| `filter.all` | `"Todos"` | `"All"` |
| `filter.inspirehep` | `"InspireHEP"` | `"InspireHEP"` |
| `filter.arxiv` | `"arXiv"` | `"arXiv"` |
| `filter.manual` | `"Manual"` | `"Manual"` |
| `updatedAt` | `"Actualizado el {date}"` | `"Last updated {date}"` |
| `footnote` | `"Las publicaciones provienen de InspireHEP y arXiv. Un mismo trabajo puede aparecer duplicado si fue indexado por ambas fuentes."` | `"Publications are sourced from InspireHEP and arXiv. The same paper may appear twice if indexed by both sources."` |

`pnpm check-translations` exits 0 — zero key drift confirmed.

---

## PublicationEntry New Prop Shape

```tsx
interface PublicationEntryProps {
  publication: Publication;        // full Publication type (was inline shape)
  memberSurnameSet: Set<string>;   // NEW — set of normalized member surnames
  labels: {
    arxiv: string;      // existing
    doi: string;        // existing
    preprint: string;   // existing
    published: string;  // NEW — from publications.published
  };
}
```

**Render additions:**
- Author tokens via `formatAuthors()`: `<strong className="font-bold">` for member tokens, plain span for others, "…" for ellipsis token, " et al." appended when `etAl: true`
- Two-chip cluster (source pill + preprint/published chip) placed after the title/journal/year paragraph, before the existing arXiv/DOI link row
- Source pill: InspireHEP = blue-tinted OKLCH, arXiv = orange-tinted OKLCH, Manual = neutral surface tokens
- Manual source pill is `<span>` (non-link); InspireHEP/arXiv is `<a>` with `href` from `getSourcePillHref()`

---

## Known-Open Issue (Intentional)

`PublicationsYearGroup.tsx` and `PersonDetail.tsx` still call `PublicationEntry` with the OLD minimal prop shape (`{ id, authors, title, journal, year, arxiv?, doi? }` + `labels: { arxiv, doi }`). This produces two TypeScript errors at compile time:

```
PublicationsYearGroup.tsx(30,42): Type 'PublicationEntryPublication' is missing: topic_tags, source
PublicationsYearGroup.tsx(30,60): Type '{ arxiv: string; doi: string; }' is missing: preprint, published
```

These errors are INTENTIONAL and expected. 11-02 fixes `PublicationsYearGroup` and the publications page. 11-03 fixes `PersonDetail` and the people slug page. Both Wave-2 plans are unblocked — they receive the updated component interface and patch their respective call sites.

---

## Deviations from Plan

None — plan executed exactly as written. The `makePub` test helper required a minor TypeScript fix (spreading override after the base object instead of inlining `source` twice — rule: TS2783 duplicate key error), tracked as a micro-fix within Task 2 scope.

---

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 12bb816 | feat(11-01): expose publications _meta via getPublicationsMeta accessor |
| 2 | 90fba73 | feat(11-01): add publications-helpers with deriveNameVariants, isMember, formatAuthors, getSourcePillHref |
| 3 | a1bab29 | feat(11-01): extend PublicationEntry with two-chip badges and member author highlighting |
| 4 | c7784fd | feat(11-01): add publications.{published,filter,updatedAt,footnote} i18n keys |
