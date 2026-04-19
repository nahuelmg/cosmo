# Phase 7: Schema Extension - Research

**Researched:** 2026-04-18
**Domain:** Zod v4 schema extension, JSON Schema regeneration, content migration
**Confidence:** HIGH — all findings from direct codebase inspection

---

## Executive Summary

Phase 7 is heavily pre-decided via CONTEXT.md and milestone SUMMARY.md. This document adds
codebase-anchored specifics the planner needs to write executable tasks: exact file paths,
verbatim current schema shapes, the generate-schemas pipeline internals, confirmed command
names, and content/people.json structure. Zero duplication of SUMMARY.md — cite that document
for architectural rationale and pitfall explanations; cite this document for "where exactly does
the code live and what does it look like right now."

**Primary recommendation:** All schema edits, `arxivId` helper update in `shared.ts`, and
`pnpm generate-schemas` run must ship in one atomic commit. The `z.strictObject` constraint
on both schemas makes any half-committed state break `pnpm validate-content` (SUMMARY.md
Pitfalls 1 and 7).

---

## Q1 — PublicationSchema: `z.strictObject` or `z.object`? Exact shape for adding `source`.

**File:** `src/content/schemas/publications.schema.ts` (line 26)

```ts
export const PublicationSchema = z.strictObject({
```

It is `z.strictObject`. The `source` field must be added **inside** the existing
`z.strictObject({...})` block. Because `.default()` is applied on the enum itself (not
wrapping the whole field), this is the correct v4 syntax:

**Before (line 87, closing brace):**
```ts
  abstract: z.string().optional(),
});
```

**After — insert before the closing `});`:**
```ts
  /**
   * Where this publication record originated.
   * @default "manual"
   * @see content/SYNC.md
   */
  source: z.enum(["manual", "inspirehep", "arxiv"]).default("manual"),

  abstract: z.string().optional(),
});
```

The `.default("manual")` means existing v1.0 entries in `content/publications.json` — which
have no `source` key — will parse correctly and receive `source: "manual"` at runtime.
Without `.default("manual")`, all 20 current entries fail on the first build (SUMMARY.md
Pitfall 1 — CRITICAL).

---

## Q2 — Current arXiv ID validation in PublicationSchema: where, verbatim regex.

**File:** `src/content/schemas/shared.ts` (lines 125–130)

```ts
export const arxivId = z
  .string()
  .regex(
    /^\d{4}\.\d{4,5}(v\d+)?$/,
    "arXiv ID format: YYMM.NNNNN or YYMM.NNNN, optional vN suffix (e.g. 2501.12345, 0706.0001v2)",
  );
```

This helper is used in `PublicationSchema` at line 65 of `publications.schema.ts`:
```ts
  arxiv: arxivId.optional(),
```

**Problem:** The current regex `/^\d{4}\.\d{4,5}(v\d+)?$/` rejects pre-2007 IDs like
`gr-qc/9209007`. SCHEMA-02 requires both formats. The fix is in `shared.ts`, not in
`publications.schema.ts` directly:

**New `arxivId` regex (SCHEMA-02):**
```ts
export const arxivId = z
  .string()
  .regex(
    /^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/,
    "arXiv ID: modern YYMM.NNNNN or pre-2007 category/NNNNNNN, optional vN suffix",
  );
```

This regex is also used as the `arxiv_id` validator on PersonSchema (SCHEMA-03). The same
`arxivId` helper exported from `shared.ts` will serve both uses.

---

## Q3 — How to regenerate JSON Schema: exact command and files written.

**Command:** `pnpm generate-schemas`  
**Maps to:** `tsx scripts/generate-schemas.mjs` (package.json line 14)

**Script internals** (`scripts/generate-schemas.mjs`, lines 34–53):
- Uses `z.toJSONSchema(zodSchema, { target: "draft-07" })` — Zod v4 native, **no third-party
  package** (not `zod-to-json-schema`)
- Sets `$schema: "http://json-schema.org/draft-07/schema#"` explicitly
- Writes **5 files** in a single run:

```
content/people.schema.json
content/publications.schema.json
content/research.schema.json
content/journal-club.schema.json
content/outreach.schema.json
```

The generated files are committed to the repo (not gitignored). This means schema change +
`pnpm generate-schemas` + `git add content/*.schema.json` must all be in the same commit.
Running `pnpm generate-schemas` regenerates all 5 files even though Phase 7 only changes 2.

---

## Q4 — Schema tests: do any exist? Where should new ones live?

**Finding:** There are **zero test files** in the project source tree (`src/`, `scripts/`).
No vitest, jest, or node:test configuration exists in `package.json`. The project relies on:

1. `pnpm validate-content` — integration-level schema parse of all 5 JSON files
2. `pnpm typecheck` — TypeScript type correctness
3. `prebuild` hook — runs `validate-content` before every build

**Recommendation for Phase 7:** No new test framework setup is needed or expected. SCHEMA-06
("pnpm check-content passes on existing v1.0 JSON") is verified by running
`pnpm validate-content` after the schema change. The planner should write this as the
verification step, not as a new test file.

If the planner decides to add schema unit tests (planner discretion), the natural location is
`src/content/schemas/__tests__/` with vitest (the natural choice given the Next.js + TS stack,
but not currently installed — adding vitest would require a devDependency).

---

## Q5 — `publications_selected` current shape (verbatim, for JSDoc deprecation placement).

**File:** `src/content/schemas/people.schema.ts` (lines 72–78)

```ts
  /**
   * References to publication IDs from content/publications.json.
   * Cross-file ID validation is deferred to the Plan 05 prebuild script.
   */
  publications_selected: z.array(z.string()).optional().default([]),
```

The `@deprecated` JSDoc marker goes on this existing comment block:

```ts
  /**
   * References to publication IDs from content/publications.json.
   * Cross-file ID validation is deferred to the Plan 05 prebuild script.
   *
   * @deprecated v1.1 — field is inert; sync script manages publications.
   *   Field tolerated through v1.1; removal in v1.2. The sync script
   *   (Phase 9) will emit a warning if this array is non-empty.
   */
  publications_selected: z.array(z.string()).optional().default([]),
```

The field definition and Zod type are **unchanged** (SCHEMA-04). No data migration needed.
All current entries in `content/people.json` have `"publications_selected": []`.

---

## Q6 — `content/SYNC.md` voice/tone reference.

**Finding:** No `content/README.md` exists. The closest reference is the top-level `README.md`
(16 lines), which is a short English-only developer doc with `##` headings, code blocks, and
concise bullet lists.

**Internal ops docs in this repo are English-only.** Bilingual content lives in
`messages/{es,en}.json` and content JSON bio fields — never in developer/maintainer docs.
The schema JSDoc comments, `CLAUDE.md`, `GUIDE.md`, and all script comments are English-only.

**SYNC.md target style:** English-only, internal ops. Suggested structure (1 screen):
```
# content/SYNC.md — Maintainer Lookup Guide

## Finding Your InspireHEP BAI Identifier
## Finding Your arXiv Author ID
## display_name_normalized Format
## Field Summary
```

Match the terse, imperative tone of the existing script file headers (e.g.
`scripts/generate-schemas.mjs` line 1–14: numbered instructions, code examples, no filler prose).

---

## Q7 — Test commands for SCHEMA-06 verification.

Commands currently wired in `package.json`:

| Command | Maps to | Purpose |
|---------|---------|---------|
| `pnpm validate-content` | `tsx scripts/validate-content.mjs` | Parses all 5 JSON files against Zod schemas + photo existence check |
| `pnpm generate-schemas` | `tsx scripts/generate-schemas.mjs` | Regenerates all 5 JSON Schema files |
| `pnpm typecheck` | `tsc --noEmit` | TypeScript strict-mode check |
| `pnpm lint` | `eslint src` | ESLint check |
| `pnpm build` | `next build` (with prebuild hook) | Also runs `validate-content` via prebuild |

**Note:** `pnpm check-content` is **not** the correct command name. The actual script alias
is `pnpm validate-content`. CONTEXT.md and REQUIREMENTS.md reference "pnpm check-content" but
that alias does not exist in `package.json`. Plans should use `pnpm validate-content`.

**SCHEMA-06 verification sequence:**
1. `pnpm generate-schemas` — regenerate JSON Schema files
2. `pnpm validate-content` — confirm all 20 existing entries parse
3. `pnpm typecheck` — confirm TypeScript types are clean

---

## Q8 — How PersonSchema handles optional fields (syntax style to match).

**File:** `src/content/schemas/people.schema.ts`

The existing optional field pattern is `.optional()` chained (not `z.optional(wrapper)` style):

```ts
photo: optionalPhoto,                                    // exported helper wrapping .optional()
publications_selected: z.array(z.string()).optional().default([]),
years: z.strictObject({ ... }).optional(),
thesis_topic: bilingualString("thesis_topic").optional(),
current_position: bilingualString("current_position").optional(),
```

**New optional fields for PersonSchema must follow the same chaining pattern:**

```ts
  /**
   * InspireHEP BAI identifier (e.g. "E.Calzetta.1").
   * Optional — students may not have one yet.
   * @see content/SYNC.md
   */
  inspirehep_id: z.string().regex(
    /^[A-Z]\.[A-Za-z-]+\.\d+$/,
    "InspireHEP BAI format: Initial.Surname.N (e.g. E.Calzetta.1)",
  ).optional(),

  /**
   * Claimed arXiv author ID (modern or pre-2007 format).
   * Optional — students may not have one yet.
   * Populate once you have your first paper on arXiv and have claimed authorship.
   * @see content/SYNC.md
   */
  arxiv_id: arxivId.optional(),

  /**
   * ASCII-folded lowercase display name for author string matching.
   * Used by Phase 11 sync to substring-match normalized author strings.
   * Format: "firstname lastname" (all lowercase, ASCII only, no diacritics).
   * Example: "esteban calzetta", "diana lopez nacir"
   * @see content/SYNC.md
   */
  display_name_normalized: z.string().min(1),
```

`inspirehep_id` needs a new inline regex (BAI format). `arxiv_id` reuses the updated
`arxivId` helper from `shared.ts` (same helper updated for SCHEMA-02). Import `arxivId`
in `people.schema.ts` imports block (line 19–25).

---

## Q9 — Precedent for `@see` JSDoc pointers on schema fields.

**Finding:** No existing `@see` JSDoc pointers on any schema field in the codebase. The
current JSDoc style is inline prose comments on field declarations, as seen throughout
`people.schema.ts` and `publications.schema.ts`.

**Style to match — existing field comment pattern:**
```ts
  /** kebab-case URL segment — e.g. "ana-maria-torres" */
  slug: slugString,

  /**
   * Multi-line for fields with more detail.
   * Second sentence explains constraint or example.
   */
  fieldName: z.string(),
```

`@see` is standard JSDoc and will render in VS Code hover tooltips. It is appropriate to
introduce it here as the fields genuinely reference an external document. Keep it as the
last tag in the block, per JSDoc convention.

---

## Q10 — `content/people.json` structure and new field placement.

**Structure:** Flat top-level JSON array — no wrapping object, no `members:` key.

```json
[
  { "slug": "...", ... },
  { "slug": "...", ... }
]
```

**Current field order on a person entry** (from PI entry "esteban-calzetta"):
```
slug, name, role, category, photo, short_bio, full_bio,
research_interests, publications_selected, contact, social_links
```

**Recommended placement for new fields** (after `publications_selected`, before `contact`):
```json
{
  "slug": "esteban-calzetta",
  "name": "Esteban Calzetta",
  ...
  "publications_selected": [],
  "inspirehep_id": "E.Calzetta.1",
  "arxiv_id": "calzetta_e_1",
  "display_name_normalized": "esteban calzetta",
  "contact": { ... },
  "social_links": [ ... ]
}
```

`display_name_normalized` is ASCII-fold + lowercase of `name`. For the example entry:
`"Esteban Calzetta"` → `"esteban calzetta"` (no diacritics to fold for this name;
`"Diana Lopez Nacir"` → `"diana lopez nacir"`).

Members without an InspireHEP profile omit `inspirehep_id` and `arxiv_id` (both optional).
`display_name_normalized` is **required** by the schema (`.min(1)`, no `.optional()`),
so every entry in `people.json` must have it populated in Plan 07-02 (the human-action plan).

---

## Files Touched by Phase 7

| Path | Operation | Requirement |
|------|-----------|-------------|
| `src/content/schemas/shared.ts` | Modify — update `arxivId` regex | SCHEMA-02 |
| `src/content/schemas/publications.schema.ts` | Modify — add `source` field | SCHEMA-01 |
| `src/content/schemas/people.schema.ts` | Modify — add 3 fields + deprecate `publications_selected`, add `arxivId` import | SCHEMA-03, SCHEMA-04, CONTEXT.md |
| `content/publications.schema.json` | Regenerate via `pnpm generate-schemas` | SCHEMA-05 |
| `content/people.schema.json` | Regenerate via `pnpm generate-schemas` | SCHEMA-05 |
| `content/research.schema.json` | Regenerate (side effect — same command regenerates all 5) | SCHEMA-05 |
| `content/journal-club.schema.json` | Regenerate (side effect) | SCHEMA-05 |
| `content/outreach.schema.json` | Regenerate (side effect) | SCHEMA-05 |
| `content/people.json` | Modify — add `inspirehep_id`, `arxiv_id`, `display_name_normalized` for all current members | DATA-09, DATA-10, CONTEXT.md |
| `content/SYNC.md` | Create — maintainer lookup guide | CONTEXT.md |

---

## Open Decisions for the Planner

1. **Plan 07-01 vs 07-03 split (planner discretion per CONTEXT.md).**
   All code changes are tightly coupled: `shared.ts` regex → `publications.schema.ts` →
   `people.schema.ts` → `pnpm generate-schemas` → `pnpm validate-content`. This is
   naturally one plan (07-01) or two (07-01 = PublicationSchema; 07-02 = PersonSchema +
   SYNC.md). Splitting along schema file lines makes sense for review granularity; keeping
   atomic makes sense for the z.strictObject constraint. Recommend: one plan for all schema
   code + regen, a second plan for the human-action data population.

2. **Helper `normalizeName()` export decision (planner discretion per CONTEXT.md).**
   Phase 11 will need to compute `display_name_normalized` from `name`. Whether to export
   a `normalizeName(name: string): string` helper from `shared.ts` now (so maintainers can
   verify their manual entries) or defer to Phase 11 is a planner call. Adding it now is
   ~5 lines and low risk; it documents the spec for the human doing Plan 07-02.

3. **Test file location (planner discretion per CONTEXT.md).**
   No test framework is currently installed. The planner should decide: (a) add vitest as a
   devDependency and write `src/content/schemas/__tests__/publications.schema.test.ts`, or
   (b) rely on `pnpm validate-content` as the sole verification gate. Option (b) requires
   no new tooling and is consistent with how the project operates today.

4. **Command name mismatch: `pnpm check-content` vs `pnpm validate-content`.**
   REQUIREMENTS.md (SCHEMA-06) and CONTEXT.md reference `pnpm check-content`. The actual
   command in `package.json` is `pnpm validate-content`. Plans should use
   `pnpm validate-content`. If `check-content` is desired as an alias, the planner can add
   it to `package.json` scripts as `"check-content": "tsx scripts/validate-content.mjs"`.

---

## Sources

All findings from direct file inspection on 2026-04-18. No external sources consulted —
the codebase is fully self-contained for Phase 7 purposes.

| File | Key finding |
|------|-------------|
| `src/content/schemas/publications.schema.ts` | `z.strictObject`, no `source` field, uses `arxivId` from shared |
| `src/content/schemas/people.schema.ts` | `z.strictObject`, `publications_selected` shape, optional field chaining style |
| `src/content/schemas/shared.ts` | `arxivId` regex `/^\d{4}\.\d{4,5}(v\d+)?$/` — needs update for SCHEMA-02 |
| `scripts/generate-schemas.mjs` | `z.toJSONSchema` (Zod v4 native), writes 5 files, draft-07 |
| `scripts/validate-content.mjs` | Full validation pipeline; command is `pnpm validate-content` |
| `package.json` | Zod `^4.3.6`, `tsx ^4.21.0`, no test runner, confirmed script names |
| `content/people.json` | Flat array, field order, `publications_selected: []` for all current entries |
| `content/publications.json` | 20 entries, no `source` field — confirms `.default("manual")` is required |
| `src/content/index.ts` | Barrel pattern, `export *` from each accessor, type re-exports |
| `README.md` | English-only, terse tone — reference for `content/SYNC.md` voice |

**Research date:** 2026-04-18
**Valid until:** 2026-05-18 (stable schema layer — unlikely to change)
