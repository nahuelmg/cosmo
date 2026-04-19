# Phase 11: Display Layer — Research

**Researched:** 2026-04-19
**Domain:** Next.js 15 Server/Client Components, next-intl 4.x, Tailwind v4 OKLCH tokens
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## Summary

Phase 11 is a pure UI layer on top of frozen Phase 7–10 outputs. The accessor, schema, and sync outputs are all valid and in place. The main work is: (1) building a shared `PublicationEntry` component with two-chip badges and author highlighting, (2) a client-side `SourceFilter` segmented control, (3) wiring the `/publications` page to use `getPublicationsMeta()` for staleness display, and (4) replacing `publications_selected` on `/people/[slug]` with `getPublicationsByAuthor`.

**Critical finding:** The `display_name_normalized` field stores names in `"firstname surname"` order, but InspireHEP author strings are stored as `"Surname, First Middle"`. A plain substring match of the full `display_name_normalized` against the author string FAILS. The planner must build `deriveNameVariants()` to produce word-level substrings that work with the accessor's substring matching. Surname extraction is the most reliable strategy (see Section 5).

**PEOP-14 / SC5 note:** Count subtitle is DROPPED ENTIRELY per locked decision. Profile section heading is just `Publicaciones` / `Publications` with no count, no "últimos 10 años" framing. Planner must NOT re-introduce it.

---

## 1. Existing /publications Page — What to Preserve, What to Change

**File:** `src/app/[locale]/publications/page.tsx`

**Current data flow:**
```
getAllYears() -> [2026, 2025, ...] (from publications.json via accessor)
getPublicationsByYear(year) -> Publication[] (already reads synced JSON)
```

The "data source flip" is ALREADY DONE — the accessor (`publications.ts` line 28) parses `PublicationsFileSchema` which reads the wrapped `{ _meta, publications }` format. No import change needed for publications array access.

**What changes in 11-02:**
1. Add import of `getPublicationsMeta` (new function to add in 11-01)
2. Add import of `getPeople` to build the member set for author highlighting
3. Render `<SourceFilter>` client component above the year groups
4. Pass `memberNormalizedSet` (Set of display_name_normalized strings from all people) to `PublicationsYearGroup` → `PublicationEntry`
5. Render staleness indicator from `_meta.synced_at`
6. Render bilingual footnote below the list
7. Remove the `JsonLd` per-pub loop at the top (or keep it — not in scope to change; confirm with planner)

**Existing i18n namespace:** `publications` — currently has keys: `title`, `arxiv`, `doi`, `preprint`

**Labels currently passed as props:**
```ts
const labels = { arxiv: t('arxiv'), doi: t('doi') };
```
This will expand to include source badge labels, filter labels, staleness, footnote.

---

## 2. Existing /people/[slug] Page — What to Preserve, What to Remove

**File:** `src/app/[locale]/people/[slug]/page.tsx`

**Current `publications_selected` consumption (lines 76–87):**
```ts
const selectedPubs = person.publications_selected
  .map((id) => getPublicationById(id))
  .filter((p): p is NonNullable<typeof p> => p !== undefined)
  .map((p) => ({ id, authors, title, journal, year, arxiv, doi }));
// → passed to PersonDetail as selectedPubs prop
```

**What gets stripped in 11-03:**
- Remove `getPublicationById` import (no longer used)
- Remove the `selectedPubs` construction block
- Remove `selectedPubs` prop from `<PersonDetail>`

**What gets added in 11-03:**
- Import `getPublicationsByAuthor`, `getPeople` from `@/content`
- Import `deriveNameVariants` from `@/lib/publications-helpers`
- Build `memberPubs = getPublicationsByAuthor(deriveNameVariants(rawPerson), { lastNYears: 10 })`
- Build `memberNormalizedSet` (same set used on /publications — reuse same helper)
- Pass `memberPubs` and `memberNormalizedSet` to `PersonDetail`

**What stays untouched in PersonDetail.tsx:** photo header, bio section, research interests section, contact/links section.

**Surrounding UI preserved:** all sections except the `selectedPubs.length > 0` block (lines 131–172 of PersonDetail.tsx).

**Locale-aware slug resolution:** already handled by `getPersonBySlug(slug)` + `getLocalizedPerson(slug, locale)`. No change needed.

**generateStaticParams:** generates params only for `pi`, `postdoc`, `phd` categories (line 22–30) — past members already excluded (PEOP-17 ✓ — no change needed).

---

## 3. Publication Data Shape

**File:** `src/content/schemas/publications.schema.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes | kebab-case or arXiv ID |
| `authors` | `string[]` | Yes (min 1) | See Section 5 for format |
| `title` | `string` | Yes | Canonical, no bilingual |
| `journal` | `string` (min 1) | Yes | `"Preprint"` = preprint fallback |
| `year` | `number` | Yes | 1900–2100 |
| `arxiv` | `string` (optional) | No | Bare arXiv ID, e.g. `"2505.21383"` |
| `doi` | `string` (optional) | No | Bare DOI |
| `topic_tags` | `string[]` | Yes (default `[]`) | |
| `source` | `"manual" \| "inspirehep" \| "arxiv"` | Yes (default `"manual"`) | |
| `abstract` | `string` (optional) | No | |

**`_meta` shape** (from `PublicationsMetaSchema`):
```ts
{
  synced_at: string;           // ISO-8601 UTC — e.g. "2026-04-19T18:09:02.044Z"
  sources: ("inspirehep" | "arxiv")[];
  counts: { inspirehep: number; arxiv: number; manual: number };
  warnings: string[];
}
```

**Preprint detection:** `pub.journal === "Preprint"` (exact match, case-sensitive). This is the semantic signal — the sync script writes `"Preprint"` as the journal fallback for both InspireHEP entries with no journal info and all arXiv entries. Do NOT derive from source field alone.

**Source enum values in stored JSON** (confirmed from actual `content/publications.json`):
- `"manual"` — 13 entries currently
- `"inspirehep"` — 4 entries currently
- `"arxiv"` — 0 entries currently (arXiv entries would be added when members get `orcid_id`)

**External URL derivation for source pills:**
- `source === "inspirehep"` + `arxiv` present → `https://inspirehep.net/literature?q=arxiv:{arxiv}`
- `source === "inspirehep"` + no `arxiv` (edge case, id = `"inspire-{N}"`) → `https://inspirehep.net/literature/{N}` (parse N from id)
- `source === "arxiv"` + `arxiv` present → `https://arxiv.org/abs/{arxiv}`
- `source === "manual"` → non-link badge (no href)

---

## 4. Accessor Wiring

**File:** `src/content/accessors/publications.ts`

**`getPublicationsByAuthor` signature:**
```ts
function getPublicationsByAuthor(
  nameVariants: string[],
  options?: { lastNYears?: number },
): Publication[]
```
- `nameVariants`: raw strings, internally normalized via `normalizeName(v)` + 4-char minimum filter
- `lastNYears`: year >= (currentYear - lastNYears), inclusive; 0 = current year only; omit = no filter
- Returns pre-sorted: year desc → arXiv ID desc → no-arXiv last within year

**Missing accessor — must add in 11-01:**
The `_meta` is currently destructured but not stored at module scope. Line 28:
```ts
const { publications } = PublicationsFileSchema.parse(rawFile);
```
Change to:
```ts
const { publications, _meta } = PublicationsFileSchema.parse(rawFile);
```
Then add:
```ts
export function getPublicationsMeta(): PublicationsMeta {
  return _meta;
}
```
Also export `PublicationsMeta` type from `src/content/index.ts`.

**Profile page variant list:** the docstring example shows `[person.display_name, person.display_name_normalized]` — but these DO NOT reliably match InspireHEP `"Surname, First"` format (see Section 5). The planner must use `deriveNameVariants(person)` from the new helper instead.

---

## 5. Author Matching Strategy — Cross-Source

**Author string formats in stored publications.json:**
- **InspireHEP:** `"Surname, First Middle"` — e.g., `"Chase, Tomás Ferreira"`, `"López Nacir, Diana"`. One string per author in the `authors[]` array.
- **arXiv (atom2 quirk):** The sync script splits a CSV by `", "` — e.g., `"Chase, Tomás Ferreira, López Nacir, Diana"` → `["Chase", "Tomás Ferreira", "López Nacir", "Diana"]`. Each element alternates surname / given name. This produces individual tokens, not full `"Surname, First"` strings per person.
- **Manual:** Typically `"Last, F."` abbreviated or `"Full Name"` — varies per maintainer.

**`normalizeName` signature** (from `src/content/schemas/shared.ts`):
```ts
function normalizeName(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
```
Unicode NFD decompose → strip combining marks → lowercase. Exported from `shared.ts`.

**Matching problem:** `display_name_normalized` = `"tomas ferreira chase"` (given + surname order). InspireHEP author normalized = `"chase, tomas ferreira"` (surname first). Full substring match fails:
```
"chase, tomas ferreira".includes("tomas ferreira chase") → FALSE
```

**Recommended `deriveNameVariants(person)` strategy:**
Extract from `display_name_normalized` (already normalized):
1. The full `display_name_normalized` string (for manual entries that may match)
2. Words from position 1 onward joined (surname portion): `words.slice(1).join(" ")` if ≥ 4 chars — e.g., `"ferreira chase"` from `"tomas ferreira chase"`
3. Last word (single surname): `words[words.length - 1]` if ≥ 4 chars — e.g., `"chase"`

Verification that this works for all current members:

| display_name_normalized | InspireHEP format | surname match |
|------------------------|-------------------|---------------|
| `tomas ferreira chase` | `chase, tomas ferreira` | `"ferreira chase"` → NOT in `"chase, tomas ferreira"` ❌; `"chase"` ✓ |
| `diana lopez nacir` | `lopez nacir, diana` | `"nacir"` ✓; `"lopez nacir"` ✓ |
| `esteban calzetta` | `calzetta, e.` (abbreviated) | `"calzetta"` ✓ |
| `guadalupe ahumada acuna` | `ahumada acuna, g.` | `"acuna"` ✓; `"ahumada acuna"` ✓ |

**Safe strategy:** use last word (single surname) as primary variant. For compound surnames, also include `words.slice(-2).join(" ")`. This handles all current members and most realistic new additions.

**For author highlighting (`isMember` helper):**
Build `memberNormalizedSet: Set<string>` containing all last-words (surnames) from all people's `display_name_normalized`. For each author in a publication, check:
```ts
function isMember(authorStr: string, memberSurnameSet: Set<string>): boolean {
  const norm = normalizeName(authorStr);
  // Check if any member surname appears as a word in the normalized author string
  for (const surname of memberSurnameSet) {
    if (norm.includes(surname)) return true;
  }
  return false;
}
```
This works for both `"Chase, Tomás Ferreira"` → `"chase"` (surname present) and arXiv token `"Chase"` → `"chase"`.

**Et al. rendering logic for >5-author lists:**
```
authors ≤ 5: render all (annotated with isMember)
authors > 5:
  1. Find all member indices in the author list
  2. If max member index ≤ 2: "A, B, C et al." (first 3 + et al.)
  3. If any member index > 2: "A, B, C, …, Member [, Member2], et al."
     (show first 3, ellipsis span, all members beyond index 2, then "et al.")
  4. If multiple members interleaved: show head through last member position
```
Invariant: no member name hidden under `et al.` on their own group's site.

**New helper file to create:** `src/lib/publications-helpers.ts`
```ts
// Exports:
deriveNameVariants(person: Person): string[]   // variants for accessor call
isMember(authorStr: string, surnameSet: Set<string>): boolean
buildMemberSurnameSet(people: Person[]): Set<string>
formatAuthors(authors: string[], memberSurnameSet: Set<string>): AuthorToken[]
// where AuthorToken = { display: string; isMember: boolean; isEllipsis?: boolean }
getSourcePillHref(pub: Publication): string | null   // null for manual
```

---

## 6. i18n / Translation Pipeline

**Files:** `messages/es.json`, `messages/en.json` (both flat-nested JSON, key-identical)

**Tool:** `@lingual/i18n-check ^0.9.3`
**Script:** `i18n-check --source es --locales messages --format next-intl`
**Enforcement:** checks that every key in `messages/es.json` (the source) exists in all other locale files under `messages/`. Key drift = failure. Nested objects are supported (existing messages have `seo.publications.title` etc.).

**How components consume translations:**
- Server components: `const t = await getTranslations('namespace')` (from `next-intl/server`)
- Client components: `const t = useTranslations('namespace')` (from `next-intl`) — works inside `NextIntlClientProvider` in layout.tsx
- Existing client component examples: `MobileNav.tsx`, `SiteHeader.tsx`, `HeroCarousel.tsx`

**Existing `publications` namespace keys:**
```json
{ "title": "Publicaciones", "arxiv": "arXiv", "doi": "DOI", "preprint": "Preprint" }
```

**New keys to add in 11-01 (all in both `messages/es.json` and `messages/en.json`):**

| Key | ES value | EN value |
|-----|----------|----------|
| `publications.published` | `"Publicado"` | `"Published"` |
| `publications.filter.all` | `"Todos"` | `"All"` |
| `publications.filter.inspirehep` | `"InspireHEP"` | `"InspireHEP"` |
| `publications.filter.arxiv` | `"arXiv"` | `"arXiv"` |
| `publications.filter.manual` | `"Manual"` | `"Manual"` |
| `publications.updatedAt` | `"Actualizado el {date}"` | `"Last updated {date}"` |
| `publications.footnote` | (two-source explanation, see below) | (EN equivalent) |

**`publications.title` (`"Publicaciones"` / `"Publications"`) already exists** — reuse for the profile-page publications section heading. No new key needed for that.

**`people.selectedPublications` key** — this key exists and will become dead code after 11-03 removes the render path. Leave it in place for now; scheduled for cleanup in v1.2 alongside Zod schema field removal.

**Footnote text (planner to finalize wording):**
- ES: `"Las publicaciones provienen de InspireHEP y arXiv. Un mismo trabajo puede aparecer duplicado si fue indexado por ambas fuentes."`
- EN: `"Publications are sourced from InspireHEP and arXiv. The same paper may appear twice if indexed by both sources."`

---

## 7. Design-Token Vocabulary

**File:** `src/app/globals.css` (Tailwind v4 `@theme` block)

| Token | Value | Tailwind class |
|-------|-------|----------------|
| `--color-surface` | `oklch(0.995 0.003 85)` | `bg-surface` |
| `--color-surface-alt` | `oklch(0.978 0.008 80)` | `bg-surface-alt` |
| `--color-ink` | `oklch(0.22 0.015 60)` | `text-ink` |
| `--color-ink-muted` | `oklch(0.48 0.012 60)` | `text-ink-muted` |
| `--color-ink-subtle` | `oklch(0.45 0.012 60)` | `text-ink-subtle` |
| `--color-accent` | `oklch(0.52 0.12 45)` | `text-accent`, `bg-accent` |
| `--color-accent-ring` | `oklch(0.52 0.12 45 / 0.45)` | `ring-accent-ring` |
| `--text-xs` | `0.8125rem` | `text-xs` |
| `--font-weight-bold` | `700` | `font-bold` |

**No existing pill/badge component.** No role badges on people cards. No tag pills anywhere in the component tree. The planner must define a new pill style using existing tokens.

**Recommended pill treatment** (planner's discretion — match existing design language):
- Size: `text-xs px-2 py-0.5 rounded-full`
- Source pill colors (subdued, not saturated brand colors):
  - InspireHEP (blue-family): `bg-blue-50 text-blue-700` in Tailwind default, OR use OKLCH: suggest a light hue-220 tint within the existing value range. Planner picks exact — keep chroma ≤ 0.08
  - arXiv (red/orange-family): suggest hue 20–30 tint. Keep chroma ≤ 0.08
  - Manual (neutral): `bg-surface-alt text-ink-muted` (already have tokens)
  - Preprint/Published chip: `bg-surface-alt text-ink-subtle` (neutral — not source-branded)
- Active filter pill (SourceFilter): filled with `bg-accent text-white` for selected state; unselected: `bg-surface-alt text-ink-muted`

**Typography scale existing pattern** (from `OutreachCard.tsx`):
```tsx
<p className="text-xs uppercase tracking-wider text-ink-subtle">
```
The pill labels should use `text-xs` (matches existing small-label usage).

---

## 8. `_meta.synced_at` Consumption (PUBS-09)

**JSON path:** `content/publications.json → _meta.synced_at`
**Zod type:** `z.string().datetime({ offset: true })` — ISO-8601 with offset, e.g. `"2026-04-19T18:09:02.044Z"`
**Currently required** by `PublicationsMetaSchema` — Zod will throw at import time if missing. No graceful fallback needed at schema level. But the planner may choose to render without the staleness line if `synced_at` parsing fails (defensive).

**Date formatting pattern** (from `SessionRow.tsx` and `OutreachCard.tsx`):
```ts
const formatted = new Intl.DateTimeFormat(
  locale === "es" ? "es-AR" : "en-US",
  { year: "numeric", month: "long", day: "numeric" },
).format(new Date(synced_at));
```
Locale tags confirmed: `"es-AR"` for Spanish, `"en-US"` for English.

**`updatedAt` i18n key** uses `{date}` interpolation placeholder — matches next-intl's ICU message format (`t('updatedAt', { date: formatted })`).

**Staleness line placement:** planner's call — recommend below the `<h1>` header, above the `<SourceFilter>`, e.g.:
```tsx
<p className="mt-2 text-sm text-ink-muted">
  {t('updatedAt', { date: formatted })}
</p>
```

---

## 9. Failure Modes and Edge Cases

| Scenario | What happens | Recommendation |
|----------|-------------|----------------|
| `_meta.synced_at` missing | Zod throws at import time (build fails) | Required by schema; safe to assume present. Add optional fallback render: omit staleness line if `getPublicationsMeta()` returns unexpected shape |
| `authors` array empty | Schema requires min 1 — Zod throws at import time | Impossible at runtime; no guard needed |
| `getPublicationsByAuthor` returns `[]` for a profile | Hide the publications section entirely (per locked decision) | `{memberPubs.length > 0 && <section>...</section>}` |
| Person has no `display_name_normalized` | All 15 current people have it; schema requires it | No guard needed |
| All name variants < 4 chars | Accessor returns `[]` | Already handled by accessor internals; `deriveNameVariants` must ensure at least one ≥ 4-char variant |
| `source` not in `("manual", "inspirehep", "arxiv")` | Zod rejects — build fails | Impossible |
| InspireHEP entry without `arxiv` field | Source pill links to `https://inspirehep.net/literature/{N}` (parse id) | See Section 3 |
| `content/publications.json` missing entirely | Module import throws at build time | Same behavior as pre-Phase-9; not a Phase 11 concern |

---

## 10. Plan Boundary and Parallel Execution

### Wave 1 — Plan 11-01 (prerequisite for both 11-02 and 11-03)

**Rationale:** `PublicationEntry` component and `publications-helpers.ts` are consumed by both downstream plans. All i18n keys must land here to avoid message file conflicts in wave 2.

**Files modified in 11-01:**
- `src/content/accessors/publications.ts` — add `getPublicationsMeta()`
- `src/content/index.ts` — export `PublicationsMeta` type
- `src/lib/publications-helpers.ts` — NEW (deriveNameVariants, isMember, buildMemberSurnameSet, formatAuthors, getSourcePillHref)
- `src/components/publications/PublicationEntry.tsx` — extend props, add source badge, preprint badge, author highlighting
- `messages/es.json` — add 7+ new keys
- `messages/en.json` — add 7+ new keys

### Wave 2 — Plans 11-02 and 11-03 in parallel

**No file overlap confirmed:**

| File | 11-02 | 11-03 |
|------|-------|-------|
| `src/app/[locale]/publications/page.tsx` | MODIFY | — |
| `src/components/publications/SourceFilter.tsx` | NEW | — |
| `src/components/publications/PublicationsYearGroup.tsx` | MODIFY | — |
| `src/app/[locale]/people/[slug]/page.tsx` | — | MODIFY |
| `src/components/people/PersonDetail.tsx` | — | MODIFY |
| `messages/*.json` | READ only | READ only |

**Safe for parallel wave 2 execution.** No merge conflicts possible.

**Plan 11-02 files modified:**
- `src/app/[locale]/publications/page.tsx`
- `src/components/publications/SourceFilter.tsx` (NEW — `'use client'`)
- `src/components/publications/PublicationsYearGroup.tsx`

**Plan 11-03 files modified:**
- `src/app/[locale]/people/[slug]/page.tsx`
- `src/components/people/PersonDetail.tsx`

---

## Architecture Patterns

### Shared entry component interface expansion

Current `PublicationEntry` interface only has `{ id, authors, title, journal, year, arxiv?, doi? }` + labels. Must expand to include `source` and `memberSurnameSet`:

```ts
interface PublicationEntryProps {
  publication: Publication;  // use full Publication type from schema
  memberSurnameSet: Set<string>;
  labels: {
    arxiv: string;
    doi: string;
    preprint: string;        // existing key
    published: string;       // NEW
    // source labels are hardcoded ("InspireHEP", "arXiv", "Manual") — no translation needed
  };
}
```

### SourceFilter client component

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type Source = 'all' | 'inspirehep' | 'arxiv' | 'manual';

interface SourceFilterProps {
  onChange: (source: Source) => void;
  current: Source;
}
```

Since `/publications` is a server component page and `SourceFilter` is a client component, the filter state must live in a wrapper client component that holds the `useState` and passes filtered publications down. Pattern: create a `PublicationsClientShell` client component that receives ALL year-grouped publications from the server, holds `source` state, and renders `SourceFilter` + filtered `PublicationsYearGroup` children.

Alternatively (simpler): pass all publications to a single `PublicationsArchive` client component that handles both filtering and rendering. This avoids prop-drilling `onChange` through server/client boundary.

### Date formatting for staleness

```ts
// In server component (publications page):
const meta = getPublicationsMeta();
const locale = await params.locale;
const formatted = new Intl.DateTimeFormat(
  locale === "es" ? "es-AR" : "en-US",
  { year: "numeric", month: "long", day: "numeric" },
).format(new Date(meta.synced_at));
// Then pass to t('updatedAt', { date: formatted })
```

---

## Don't Hand-Roll

| Problem | Don't build | Use instead |
|---------|-------------|-------------|
| Author name normalization | Custom NFD logic | `normalizeName` from `src/content/schemas/shared.ts` |
| Locale-aware date | `toLocaleDateString` | `new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', ...)` (existing pattern) |
| Translation keys | Inline strings in components | Add to `messages/*.json`, consume via `t()` |
| Author matching | Per-surface ad-hoc matching | Single `isMember()` helper from `publications-helpers.ts` |

---

## Common Pitfalls

### Pitfall 1: Full display_name_normalized doesn't substring-match InspireHEP author format
`"tomas ferreira chase"` does NOT appear in `"chase, tomas ferreira"`. Use surname extraction in `deriveNameVariants`. Confirmed by empirical test.

### Pitfall 2: SourceFilter requires client boundary — page cannot stay fully server-rendered
The `/publications` page is statically generated. Adding a client `useState` filter means wrapping the filterable content in a `'use client'` shell component. The page's outer shell (heading, staleness, footnote) can stay server-rendered; only the filter + year groups need to be in a client component. Use the `PublicationsClientShell` pattern.

### Pitfall 3: `_meta` not currently exposed by any accessor
`src/content/accessors/publications.ts` line 28 only destructures `publications`, discarding `_meta`. Must add `getPublicationsMeta()` in 11-01 or the staleness line in 11-02 has nothing to call.

### Pitfall 4: messages/*.json conflict in parallel wave
If 11-02 or 11-03 adds i18n keys, they will conflict on the same file. ALL new keys must be in 11-01. 11-02 and 11-03 only READ translations.

### Pitfall 5: `publications_selected` key in `messages/people` namespace
`people.selectedPublications` exists and will become dead code. Do NOT delete it in Phase 11 (the key enforcement is one-directional: source → target; having an extra key in both files is fine). Schedule removal for v1.2 cleanup.

### Pitfall 6: arXiv author format quirk (future risk)
Current data has 0 arXiv entries. When arXiv entries are added, authors will be stored as alternating token arrays (`["Chase", "Tomás Ferreira", "López Nacir", "Diana"]`). The `formatAuthors` helper must treat each element as a separate token, not a full person name. For highlighting, each token is individually checked against `memberSurnameSet`.

---

## Open Questions

1. **`PublicationsClientShell` vs passing all pubs as JSON** — The page must pass the full publication dataset to a client component for in-memory filtering. For a large archive, this is fine (statically rendered, data bundled at build time). Planner should use `PublicationsClientShell` that receives `groupedPubs: YearGroup[]` and renders filtered output.

2. **Sticky filter on `/publications`** — Locked as planner's discretion. `position: sticky; top: var(--header-height)` (56px from design token) is the recommended approach. Add `bg-surface` + `z-10` to prevent bleed-through when scrolling.

3. **Source pill for InspireHEP entries without arxiv field** — Currently no such entries exist. If `id` starts with `"inspire-"`, parse the number and link to `https://inspirehep.net/literature/{N}`. Planner should add this guard.

4. **Preprint chip wording** — The existing `publications.preprint = "Preprint"` key works for both locales (loanword). For "published": ES = `"Publicado"`, EN = `"Published"`. No ambiguity.

5. **Et al. ellipsis character** — Spanish typography uses `…` (U+2026) or `[…]`. Either works; planner should pick one and be consistent. Recommend `"…"` bare.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `src/app/[locale]/publications/page.tsx` — current page structure
- `src/app/[locale]/people/[slug]/page.tsx` — current profile page structure
- `src/components/publications/PublicationEntry.tsx` — current entry component
- `src/components/people/PersonDetail.tsx` — full PersonDetail component (250 lines)
- `src/content/accessors/publications.ts` — full accessor (149 lines)
- `src/content/schemas/publications.schema.ts` — complete schema
- `src/content/schemas/shared.ts` — normalizeName, bilingualString helpers
- `src/content/schemas/people.schema.ts` — PersonSchema with display_name_normalized
- `src/content/accessors/people.ts` — getPeople, getLocalizedPerson
- `src/app/globals.css` — all OKLCH design tokens
- `src/components/journal-club/SessionRow.tsx` — date formatting pattern (es-AR / en-US)
- `messages/es.json`, `messages/en.json` — complete i18n key inventory
- `content/publications.json` — actual data shape (20 entries, 4 InspireHEP, 13 manual)
- `content/people.json` — all 15 members, all have display_name_normalized
- `scripts/sync-publications.ts` — inspireEntryToPublication, arxivEntryToPublication
- `.planning/config.json` — commit_docs: true, .planning not gitignored

### Primary (HIGH confidence — empirical Python verification)
- Author matching behavior: substring tests on actual normalized strings confirmed
- displayNameNormalized vs InspireHEP author format: mismatch confirmed, surname strategy validated

---

## Metadata

**Confidence breakdown:**
- Current page/component structure: HIGH — direct code read
- Schema and accessor: HIGH — direct code read
- Author matching strategy: HIGH — empirically verified with actual data
- i18n pipeline: HIGH — direct code read + package.json
- Design tokens: HIGH — globals.css read
- Wave parallelization: HIGH — file overlap analysis

**Research date:** 2026-04-19
**Valid until:** indefinitely (all findings from frozen codebase artifacts)
