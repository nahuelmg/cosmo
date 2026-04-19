# Phase 8: Accessor Layer - Research

**Researched:** 2026-04-18
**Domain:** TypeScript content accessor, string normalization, arXiv sort
**Confidence:** HIGH — all findings from direct codebase inspection and live Node.js verification

## Summary

Phase 8 adds a single pure function to an existing accessor file. The codebase's conventions are fully established; this phase follows them exactly. Two correctness traps need nailing before planning: (1) the normalization strategy in CONTEXT.md ("NFC") conflicts with how `display_name_normalized` is generated (`normalizeName` in `shared.ts` uses NFD-stripping, not NFC), and (2) there is no existing test infrastructure — Vitest is not installed, no `*.test.ts` files exist — so the planner must decide whether to install Vitest or validate via the existing `validate-content` script.

**Primary recommendation:** Use the NFD-strip approach (`normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()`) that matches `normalizeName` in `shared.ts`, not NFC-only, so that ASCII variants from `display_name_normalized` actually match diacritic-bearing author strings in `publications.json`. CONTEXT.md says "NFC-normalized" but testing shows NFC alone fails the `acuna` → `Acuña` match.

## Existing Accessor Conventions

### File: `src/content/accessors/publications.ts`

This file already exists and already owns the module-load parse:

```typescript
import rawPublications from "../../../content/publications.json";
import { PublicationsSchema, type Publication } from "../schemas/publications.schema";
const publications: Publication[] = PublicationsSchema.parse(rawPublications);
```

The new function goes in this same file. The planner does NOT create a new file.

**JSDoc pattern** (from existing functions in the file):

```typescript
/**
 * One-sentence summary of what is returned.
 * Phase N consumption: brief caller context.
 * @example
 * getPublicationsByAuthor(["García", "garcia"], { lastNYears: 10 })
 */
```

**Existing sort pattern** (from `getPublications`): `[...publications].sort((a, b) => b.year - a.year)` — spread to avoid mutation, sort inline. The new function uses the same non-mutating pattern.

**Barrel re-export** (`src/content/index.ts`): already contains `export * from "./accessors/publications"`. Adding the new export from the same file requires **no changes to index.ts**. The barrel already covers all exports from that module.

### Import structure

- All accessor files import only from `"../schemas/[name].schema"` and `"../../../content/[name].json"`.
- `people.ts` is the only accessor that imports from `"../schemas/shared"` (for `localize`).
- The new function must import nothing from `people.ts` (ACC-05). The publications accessor file has no existing import from people.ts — this constraint is already satisfied structurally.

## Test Infrastructure

**Vitest is NOT installed.** Zero `*.test.ts` files exist in `src/`. No `vitest.config*` file exists. Vitest does not appear in `pnpm-lock.yaml`. The project has no unit test runner.

**Existing test-adjacent scripts:**
- `pnpm validate-content` — runs `tsx scripts/validate-content.mjs`, which Zod-parses all JSON files. This is the data-integrity boundary, not behavioral testing.
- `pnpm typecheck` — `tsc --noEmit` catches type errors.

**Implication for the planner:** The plan must decide: (a) install Vitest and write `*.test.ts`, or (b) inline behavioral tests as a runnable script (e.g., `tsx scripts/test-accessor.mjs`). CONTEXT.md's "test with v1.0 placeholder data" success criterion points toward some form of executable verification. The planner should default to installing Vitest (standard pattern for this type of pure-function unit test) since no other test runner is present.

## Normalization: Critical Correctness Finding

**CONTEXT.md says:** "NFC-normalized" substring match.

**`shared.ts` `normalizeName` uses:** NFD-decompose → strip combining marks → lowercase (ASCII-fold). This is what populates `display_name_normalized` on every `Person`.

**Live data proof:**
- `people.json` entry: `display_name_normalized: "guadalupe ahumada acuna"` (acuña → acuna, no diacritic)
- Callers in Phase 11 will pass `person.display_name_normalized` as a variant.
- Author strings in `publications.json`: could be `"Ahumada Acuña, G."` (with ñ).

**Test results (Node 20, confirmed):**

```
NFC: "ahumada acuna" in "Ahumada Acuña" → false  ← BROKEN
NFD-strip: "ahumada acuna" in "Ahumada Acuña" → true  ← CORRECT
```

NFC normalization preserves diacritics as single codepoints (`ñ` stays `ñ`). A variant `"acuna"` (no ñ) will not match `"acuña"` under NFC, breaking the primary use case.

**Correct approach:** Apply the same NFD-strip transform to both the author string and the variant before comparing. This is exactly what `normalizeName` in `shared.ts` does. Import and reuse it.

```typescript
import { normalizeName } from "../schemas/shared";
// normalizeName is NOT re-exported from the barrel — must import from shared directly
// (or inline: value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase())
```

Note: `normalizeName` is exported from `shared.ts` but not from `src/content/index.ts` (the barrel only exports `localize` and `type Locale` from shared). The accessor imports it directly from `"../schemas/shared"` — same as how `people.ts` imports `localize`.

**Node 20 support:** `String.prototype.normalize()` has been stable since Node 6. No polyfill needed. The Unicode `/\p{M}/gu` regex flag is supported since Node 10. Engine floor is `20.x` — fully covered.

## arXiv ID Sort Correctness

**arXiv ID formats in this codebase** (from `shared.ts` `arxivId` regex):
- Modern (post-2007): `YYMM.NNNNN` — zero-padded, lexicographic order equals chronological order within same YYMM prefix.
- Legacy (pre-2007): `category/NNNNNNN` — e.g. `gr-qc/9209007`.

**Live data:** All 13 publications use modern format only. No legacy IDs in `publications.json`.

**Cross-format lex comparison:** `"2..."` < `"g..."` (ASCII code 50 < 103), so legacy IDs sort AFTER modern IDs when sorting descending. This is counter-chronological for cross-era comparisons, but irrelevant in practice — this cosmology group has no papers pre-2007 and won't mix formats within the same year bucket.

**Confirmed comparator pattern** (verified with live data):

```typescript
function compare(a: Publication, b: Publication): number {
  if (b.year !== a.year) return b.year - a.year;
  if (a.arxiv && b.arxiv) return b.arxiv.localeCompare(a.arxiv);
  if (a.arxiv) return -1;  // a has arxiv → a sorts first
  if (b.arxiv) return 1;   // b has arxiv → b sorts first
  return 0;                // both lack arxiv → preserve relative order
}
```

Result verified: year desc, then arxiv desc, then no-arxiv entries maintain stability at bottom.

## Year Window Guard

CONTEXT.md locked: `options.lastNYears !== undefined` (not falsy check) so `lastNYears: 0` (current year only) is treated as a valid filter. Implementation:

```typescript
const currentYear = new Date().getFullYear();
const yearMin = options?.lastNYears !== undefined
  ? currentYear - options.lastNYears
  : -Infinity;
```

`year >= yearMin` handles: no option → always true; `lastNYears: 10` in 2026 → `year >= 2016`; `lastNYears: 0` → `year >= 2026`.

## Circular Dependency (ACC-05)

**No lint rule enforces the no-people.ts-import constraint.** ESLint config (`eslint.config.mjs`) uses only `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. No `eslint-plugin-import`, no `no-restricted-imports` rules, no `import/no-cycle`.

**Current structural guarantee:** `publications.ts` has no import from `people.ts` today. The new function must not add one. The plan's verification step should confirm this structurally — e.g., `grep "from.*people" src/content/accessors/publications.ts` returns nothing.

**No automated enforcement exists.** The planner may optionally add a `no-restricted-imports` ESLint rule, but given project scope this is optional.

## 4-Character Guard and Substring Collision

**Live data check:** Current `people.json` surnames (normalized): calzetta, lopez nacir, landau, scanapiecco, miron granese, armaleo, badia, ferreira chase, leizerovitch, santa cruz, chantada, ahumada acuna, elia, pineau, cicarella.

No two people share a 4-char-or-longer substring that would cause false positive matches given the current data. The 4-char guard handles initials like "F." (2 chars) and abbreviations like "Bel." (3 chars). CONTEXT.md's known trade-off ("García" matches "García-Bellido") is acceptable — confirmed no current member collision.

## Minimum Variant Length Implementation

CONTEXT.md: variants shorter than 4 chars are **silently skipped before matching**. Implementation:

```typescript
const validVariants = nameVariants
  .map(v => normalizeName(v))
  .filter(v => v.length >= 4);
if (validVariants.length === 0) return [];
```

Note: length check is on the **post-normalization** string. NFD-strip will not change length for ASCII or common Latin-1 variants; NFC can change codepoint count but not character count for Latin. The 4-char check on normalized form is safe.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Name ASCII-folding | Custom diacritic map | `normalizeName` from `"../schemas/shared"` |
| Array sort | Custom stable-sort | `[...arr].sort(comparator)` — V8 stable since ES2019 |

## Code Sketch (for planner reference)

```typescript
// src/content/accessors/publications.ts — add after existing exports

import { normalizeName } from "../schemas/shared";  // add to existing imports

/**
 * Returns publications where any author matches any name variant.
 * Matching: substring, case-insensitive, diacritic-folded (NFD-strip).
 * Variants shorter than 4 chars are silently ignored.
 * Optionally filtered to the last N calendar years (inclusive).
 * Results sorted year desc → arXiv ID desc → no-arXiv last.
 *
 * ACC-01, ACC-02, ACC-03, ACC-04, ACC-05
 *
 * @example
 * getPublicationsByAuthor(["López", "lopez"], { lastNYears: 10 })
 */
export function getPublicationsByAuthor(
  nameVariants: string[],
  options?: { lastNYears?: number },
): Publication[] {
  const validVariants = nameVariants
    .map((v) => normalizeName(v))
    .filter((v) => v.length >= 4);

  if (validVariants.length === 0) return [];

  const currentYear = new Date().getFullYear();
  const yearMin =
    options?.lastNYears !== undefined
      ? currentYear - options.lastNYears
      : -Infinity;

  return [...publications]
    .filter((pub) => {
      if (pub.year < yearMin) return false;
      const normalizedAuthors = pub.authors.map((a) => normalizeName(a));
      return validVariants.some((variant) =>
        normalizedAuthors.some((author) => author.includes(variant)),
      );
    })
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (a.arxiv && b.arxiv) return b.arxiv.localeCompare(a.arxiv);
      if (a.arxiv) return -1;
      if (b.arxiv) return 1;
      return 0;
    });
}
```

## Open Questions

1. **Test runner installation**
   - What we know: No Vitest, no test files. CONTEXT.md says "test with v1.0 placeholder data."
   - What's unclear: Whether the planner installs Vitest (1 plan step) or validates via a standalone script.
   - Recommendation: Install Vitest. The pure-function nature is ideal for unit tests. A standalone script would be non-standard and harder to run in CI later.

2. **`normalizeName` import in publications.ts**
   - What we know: `normalizeName` is exported from `"../schemas/shared"` but not from the barrel.
   - What's unclear: Whether importing from `"../schemas/shared"` violates any internal convention (none found — `people.ts` does the same with `localize`).
   - Recommendation: Import directly from `"../schemas/shared"`. This is the established pattern.

## Sources

### Primary (HIGH confidence)
- Direct file reads: `src/content/accessors/publications.ts`, `src/content/accessors/people.ts`, `src/content/accessors/research.ts`, `src/content/index.ts`, `src/content/schemas/publications.schema.ts`, `src/content/schemas/people.schema.ts`, `src/content/schemas/shared.ts`
- Live Node 20 execution: normalization tests, sort comparator verification, arXiv lex ordering
- `content/publications.json` (13 entries, all modern arXiv IDs, diacritic-bearing author names)
- `content/people.json` (15 entries, `display_name_normalized` all ASCII-folded via NFD-strip)
- `package.json`, `pnpm-lock.yaml`, `eslint.config.mjs` — confirmed no Vitest, no circular-dep lint rules

## Metadata

**Confidence breakdown:**
- Accessor conventions: HIGH — read actual source files
- Normalization strategy: HIGH — live Node.js execution confirms NFC fails, NFD-strip works
- arXiv sort: HIGH — live execution + regex inspection; legacy-format caveat is theoretical only
- Test infrastructure: HIGH — confirmed absent via lockfile + filesystem search
- Circular dep enforcement: HIGH — ESLint config read directly, no import plugin present

**Research date:** 2026-04-18
**Valid until:** Stable — only changes if Phase 7 schema changes or shared.ts normalizeName changes
