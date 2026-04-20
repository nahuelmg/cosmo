# Phase 18: Display Layer - Research

**Researched:** 2026-04-20
**Domain:** Next.js + next-intl display components, source badge extension
**Confidence:** HIGH

## Summary

Phase 18 is an extension-only phase — all five UI components that need changing already exist and are well-structured for adding a third source. No new components are needed. The work is: add `'orcid'` to one type union, add one branch to two ternary chains, add one pill to one array, add four i18n keys to two JSON files, update one footnote string in both locales, and extend one helper function's URL logic.

The data is already present: `content/publications.json` contains 15 ORCID-sourced entries (87 fetched, 72 deduped against InspireHEP/arXiv). All have `source: "orcid"` and `doi` set (except one preprint with no DOI). The SiPM paper (DOI `10.1016/j.nima.2020.164490`, 11 authors) is present.

Schema.org `ScholarlyArticle` is only emitted on `/publications` — not on `/people/[slug]`. The people slug page only emits `Person` schema via `buildPersonSchema`. Requirement UI-05 ("Schema.org ScholarlyArticle on `/people/[slug]` continues to emit correctly") is therefore a no-op: the builder already handles ORCID entries correctly because it only reads `pub.title`, `pub.authors`, `pub.year`, `pub.journal`, `pub.arxiv`, and `pub.doi` — none of which are source-specific.

**Primary recommendation:** Make the five smallest-possible edits across five files. Do not restructure any component.

---

## Standard Stack

This phase uses no new libraries. Existing stack:

| Tool | Purpose |
|------|---------|
| next-intl | i18n message lookup via `useTranslations` / `getTranslations` |
| Tailwind v4 OKLCH | Inline color values for badge tones |
| Vitest | Unit tests for helpers |

---

## Architecture Patterns

### Existing Component Map

```
src/
├── components/publications/
│   ├── SourceFilter.tsx          # Filter pill group — needs 'orcid' pill
│   ├── PublicationEntry.tsx      # Source badge + links — needs orcid tone/label
│   ├── PublicationsClientShell.tsx  # Filter state — needs 'orcid' in type
│   └── PublicationsYearGroup.tsx # Renders entries — no change needed
├── lib/
│   ├── publications-helpers.ts   # getSourcePillHref — needs orcid URL branch
│   └── publications-helpers.test.ts  # tests for helpers
├── lib/schemas.ts                # buildScholarlyArticleSchema — no change needed
└── app/[locale]/publications/page.tsx  # footnote — needs updated i18n key
messages/
├── es.json                       # publications.filter + footnote keys
└── en.json                       # same
```

### Pattern 1: SourceFilter pill extension

**File:** `src/components/publications/SourceFilter.tsx`

Current `SourceFilterValue` type (line 5):
```typescript
export type SourceFilterValue = 'all' | 'inspirehep' | 'arxiv' | 'manual';
```

Current options array (lines 15–20): four entries ending with `manual`.

**Change:** Add `'orcid'` to the union type. Add one entry to the options array:
```typescript
{ key: 'orcid', label: t('filter.orcid') }
```

No structural changes. Filter state in `PublicationsClientShell.tsx` (line 29) uses `useState<SourceFilterValue>('all')` — the type change propagates automatically. The `filteredGroups` memo (line 40) does `p.source === source` — already correct for any string value.

### Pattern 2: Source badge extension in PublicationEntry

**File:** `src/components/publications/PublicationEntry.tsx`

Lines 48–58 contain a two-branch ternary for `tone` and `label`. The fallback branch (`"bg-surface-alt text-ink-muted"` / `"Manual"`) currently catches both `"manual"` and any unknown source including `"orcid"`.

**Change:** Add an explicit `orcid` branch before the fallback. Pattern follows exactly the same inline OKLCH style:
```typescript
const tone =
  publication.source === "inspirehep"
    ? "bg-[oklch(0.95_0.04_235)] text-[oklch(0.38_0.10_235)]"
    : publication.source === "arxiv"
      ? "bg-[oklch(0.95_0.05_30)] text-[oklch(0.42_0.12_30)]"
      : publication.source === "orcid"
        ? "bg-[oklch(0.95_0.05_118)] text-[oklch(0.40_0.12_118)]"
        : "bg-surface-alt text-ink-muted";  // manual fallback

const label =
  publication.source === "inspirehep"
    ? "InspireHEP"
    : publication.source === "arxiv"
      ? "arXiv"
      : publication.source === "orcid"
        ? "ORCID"
        : "Manual";
```

ORCID entries have `doi` but not `arxiv`. The `getSourcePillHref` function returns `null` for ORCID currently — so the badge renders as a non-link `<span>`. That is acceptable behavior, but the planner should decide: ORCID source badge could optionally link to `https://orcid.org/{person.contact.orcid}` but that information is not on the `Publication` object. The simplest correct path is a non-link span for ORCID (same as `manual`). However, the DOI link in the link row below (`pub.doi`) already handles discoverability.

### Pattern 3: getSourcePillHref for ORCID

**File:** `src/lib/publications-helpers.ts`, lines 173–186

Current function has no `orcid` branch — falls through to `return null`. No code change is strictly required (the badge renders as a non-link span, which is correct). The test file (`publications-helpers.test.ts`) line 249 has a `"manual → null"` test; an analogous `"orcid → null"` test should be added for completeness.

If the planner decides ORCID badges should link somewhere (e.g., `https://doi.org/${pub.doi}` for ORCID entries that have a DOI), that branch can be added here. But that duplicates the DOI link row already present in `PublicationEntry.tsx` line 96–101. **Recommendation: return null for ORCID — let the DOI link row handle discoverability.**

### Pattern 4: i18n message keys

**Files:** `messages/es.json` and `messages/en.json`

Keys needed:
- `publications.filter.orcid` — the pill label ("ORCID" in both locales, it's a proper noun)
- `publications.footnote` — update wording (see below)

Current footnote strings:
- ES (line 75): `"Las publicaciones provienen de InspireHEP y arXiv. Un mismo trabajo puede aparecer duplicado si fue indexado por ambas fuentes."`
- EN (line 75): `"Publications are sourced from InspireHEP and arXiv. The same paper may appear twice if indexed by both sources."`

New wording must:
1. Mention three sources: InspireHEP, arXiv, and ORCID
2. Include a plain-language DOI precedence rule note

Suggested EN: `"Publications are sourced from InspireHEP, arXiv, and ORCID. The same paper may appear once even if indexed by multiple sources — entries with a DOI are merged into a single record."`

Suggested ES: `"Las publicaciones provienen de InspireHEP, arXiv y ORCID. Un mismo trabajo puede aparecer una sola vez aunque haya sido indexado por varias fuentes; los registros con DOI se fusionan en una única entrada."`

### Pattern 5: Schema.org JSON-LD

**File:** `src/lib/schemas.ts`, `buildScholarlyArticleSchema` (line 114)

This function reads `pub.title`, `pub.authors`, `pub.year`, `pub.journal`, `pub.arxiv`, `pub.doi` — none source-specific. ORCID entries have these fields populated. **No change needed.**

The function is only called from `src/app/[locale]/publications/page.tsx` (line 62) — it is NOT called from `/people/[slug]/page.tsx`. That page only emits `buildPersonSchema`. UI-05 verification therefore means: confirm the existing `buildScholarlyArticleSchema` already handles ORCID entries (it does, because the SiPM paper has `doi`, `title`, `authors`, `year`, `journal` all populated).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| ORCID badge color | Custom CSS class | Inline OKLCH same as existing badge pattern |
| ORCID filter logic | New filter component | Extend existing `SourceFilterValue` union |
| ORCID i18n | Hardcoded strings | Add keys to messages/*.json, use `t()` |

---

## Common Pitfalls

### Pitfall 1: SourceFilterValue type is exported and consumed

**What goes wrong:** `SourceFilterValue` is exported from `SourceFilter.tsx` and imported in `PublicationsClientShell.tsx` (line 5). Adding `'orcid'` to the union requires no downstream change because the filter state is initialized to `'all'` and the filter comparison is `p.source === source` — a string equality that works for any value.

**Warning sign:** TypeScript will not error even if you forget to add the pill to the options array — the type change alone is sufficient. But the pill won't render. Add both.

### Pitfall 2: Hardcoded "two sources" in footnote copy

**What goes wrong:** The footnote text currently names only InspireHEP and arXiv. It lives in message JSON, not in component code — but both locale files must be updated in the same commit. Missing one locale silently shows stale text to Spanish readers.

**How to avoid:** Update both `es.json` and `en.json` in the same task.

### Pitfall 3: Badge falls through to "Manual" label

**What goes wrong:** Currently, `source === "orcid"` hits the final `else` branch and renders with `"Manual"` label and neutral styling. This is the existing behavior since no ORCID pill existed. After adding the pill, clicking it filters to ORCID entries — but those entries would show "Manual" badge. Adding the explicit branch in `PublicationEntry.tsx` fixes this.

**Warning sign:** If you add the filter pill but not the badge branch, you get a working filter pill that reveals entries with wrong badge labels.

### Pitfall 4: ORCID entry with no DOI

**What goes wrong:** One ORCID entry (`id: "orcid-118302459"`) has `journal: "Preprint"` and no `doi` field. The `PublicationEntry` component handles this correctly: the DOI link row (line 80) is wrapped in `{(publication.arxiv || publication.doi) && (…)}` — so it simply doesn't render. No change needed, but verify this entry renders without a broken link row.

### Pitfall 5: getSourcePillHref not extended for ORCID

**What goes wrong:** ORCID entries have `doi` but the `getSourcePillHref` function currently returns `null` for ORCID source. The badge renders as a `<span>` (non-link). This is acceptable and by design — the DOI link row handles it. If `getSourcePillHref` is changed to return `doi.org` links for ORCID, it would duplicate the DOI link in the link row below the badge. Keep it returning `null`.

### Pitfall 6: Schema.org on people page (UI-05 misread)

**What goes wrong:** UI-05 says "Schema.org ScholarlyArticle JSON-LD on `/people/[slug]` continues to emit correctly for ORCID-only entries." The people slug page does NOT emit `ScholarlyArticle` — it only emits `Person` schema. The `ScholarlyArticle` schema is on `/publications`. UI-05 may be a spec imprecision. Verify by confirming the ORCID entries render in the publications list with valid JSON-LD — that is the actual test.

---

## Code Examples

### PublicationEntry badge tone chain (verified from source)

Existing pattern at `src/components/publications/PublicationEntry.tsx` lines 48–52:
```typescript
// Source: file directly read
const tone =
  publication.source === "inspirehep"
    ? "bg-[oklch(0.95_0.04_235)] text-[oklch(0.38_0.10_235)]"
    : publication.source === "arxiv"
      ? "bg-[oklch(0.95_0.05_30)] text-[oklch(0.42_0.12_30)]"
      : "bg-surface-alt text-ink-muted";
```

ORCID branch to insert before the fallback:
```typescript
      : publication.source === "orcid"
        ? "bg-[oklch(0.95_0.05_118)] text-[oklch(0.40_0.12_118)]"
```

### SourceFilter options array (verified from source)

Existing at `src/components/publications/SourceFilter.tsx` lines 15–20:
```typescript
const options: { key: SourceFilterValue; label: string }[] = [
  { key: 'all', label: t('filter.all') },
  { key: 'inspirehep', label: t('filter.inspirehep') },
  { key: 'arxiv', label: t('filter.arxiv') },
  { key: 'manual', label: t('filter.manual') },
];
```

Entry to add (position: before or after `manual` — suggest after `arxiv`, before `manual`):
```typescript
  { key: 'orcid', label: t('filter.orcid') },
```

---

## ORCID Brand Color — OKLCH Tradeoff

**ORCID brand green:** `#A6CE39` → OKLCH: `oklch(0.80 0.171 118)`

**Tradeoff for the planner:**

Option A — Brand color: Use `oklch(0.80 0.171 118)` as text color on light tint. Visually distinctive, green hue clearly different from blue (InspireHEP) and orange (arXiv). Matches ORCID's recognizable brand identity.

Option B — Muted tint matching existing convention: Both InspireHEP and arXiv badges use `oklch(0.95 0.04–0.05 hue)` background and `oklch(0.38–0.42 0.10–0.12 hue)` text. Using the same lightness convention at hue 118 gives `bg-[oklch(0.95_0.05_118)] text-[oklch(0.40_0.12_118)]`. The text reads as a muted olive-green, which is visually distinct without being garish.

**Recommendation:** Option B (muted tint at hue 118) — consistent with existing badge visual grammar, clearly distinct from blue and orange, recognizable as green-adjacent. The site palette is warm academic; a saturated ORCID brand green at full chroma would be visually loud.

---

## State of the Art

No library version changes relevant. This is a pure configuration extension.

| Component | Current State | After Phase 18 |
|-----------|--------------|----------------|
| `SourceFilterValue` | `'all' \| 'inspirehep' \| 'arxiv' \| 'manual'` | + `\| 'orcid'` |
| `SourceFilter` options | 4 pills | 5 pills |
| `PublicationEntry` badge | 2 explicit tones + fallback | 3 explicit tones + fallback |
| `getSourcePillHref` | returns null for orcid | unchanged (null) |
| `publications.filter.*` i18n | 4 keys | 5 keys (`filter.orcid` added) |
| `publications.footnote` | "two sources" | "three sources + DOI precedence" |

---

## Open Questions

1. **UI-05 spec precision**
   - What we know: `buildScholarlyArticleSchema` is only emitted on `/publications`, not `/people/[slug]`
   - What's unclear: Whether UI-05 intends to add `ScholarlyArticle` emission to the people page, or just verify the existing publisher-page JSON-LD handles ORCID entries
   - Recommendation: Interpret as "verify existing JSON-LD covers ORCID entries" — no new code needed. If the planner interprets it as adding JSON-LD to the people page, that is a scope expansion.

2. **ORCID badge link destination**
   - What we know: ORCID entries all have `doi`, most are peer-reviewed. The DOI link row already links to `doi.org`
   - What's unclear: Whether the source badge pill should also be a link (to ORCID record? to DOI?)
   - Recommendation: Keep ORCID badge as non-link `<span>` matching the `manual` behavior. The DOI link row provides the canonical external link.

3. **Filter pill ordering**
   - What we know: Current order is `all | inspirehep | arxiv | manual`
   - What's unclear: Where `orcid` belongs in the ordering
   - Recommendation: `all | inspirehep | arxiv | orcid | manual` — ORCID between arXiv and manual, ordered by approximate data volume descending

---

## Sources

### Primary (HIGH confidence)
- Direct file reads of all relevant source files (no ambiguity — code is authoritative)
  - `src/components/publications/SourceFilter.tsx`
  - `src/components/publications/PublicationEntry.tsx`
  - `src/components/publications/PublicationsClientShell.tsx`
  - `src/lib/publications-helpers.ts`
  - `src/lib/schemas.ts`
  - `src/app/[locale]/publications/page.tsx`
  - `src/app/[locale]/people/[slug]/page.tsx`
  - `src/components/people/PersonDetail.tsx`
  - `messages/es.json`
  - `messages/en.json`
  - `content/publications.json` (verified 15 ORCID entries present)

### Secondary (MEDIUM confidence)
- OKLCH conversion: manual computation from ORCID brand hex `#A6CE39` using standard sRGB → OKLab → OKLCH formulas. Result: `oklch(0.80 0.171 118)`.

---

## Metadata

**Confidence breakdown:**
- File locations and line numbers: HIGH — verified by reading source files
- Badge color values: MEDIUM — computed from brand color, matches visual convention
- Schema.org analysis (UI-05 no-op): HIGH — confirmed by reading both schemas.ts and people slug page
- Test strategy: HIGH — Vitest is the test runner, existing test files identified

**Research date:** 2026-04-20
**Valid until:** Stable — no external dependencies, all findings are from the local codebase

---

## RESEARCH COMPLETE
