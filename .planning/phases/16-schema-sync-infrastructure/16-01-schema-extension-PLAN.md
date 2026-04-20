---
phase: 16-schema-sync-infrastructure
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/content/schemas/publications.schema.ts
  - content/publications.schema.json
  - content/publications.json
autonomous: true

must_haves:
  truths:
    - "PublicationSchema.source accepts 'orcid' as a valid enum value"
    - "PublicationsMeta.sources array accepts 'orcid'"
    - "PublicationsMeta.counts has required integer 'orcid' and 'deduped' fields"
    - "pnpm tsc --noEmit passes with extended schema"
    - "pnpm validate-content passes on existing content/publications.json after counts patch"
    - "Existing 'manual' | 'inspirehep' | 'arxiv' entries still parse cleanly under the extended schema"
    - "A synthetic { source: 'orcid' } publication entry passes Zod validation"
    - "content/publications.schema.json JSON Schema reflects the new enum + counts shape after regen"
  artifacts:
    - path: "src/content/schemas/publications.schema.ts"
      provides: "Extended PublicationSchema.source enum and PublicationsMetaSchema with orcid + deduped counts"
      contains: "orcid"
    - path: "content/publications.schema.json"
      provides: "Regenerated draft-07 JSON Schema matching extended Zod schema"
      contains: "orcid"
    - path: "content/publications.json"
      provides: "_meta.counts hand-patched with orcid: 0 and deduped: 0 so validate-content passes in the same commit"
      contains: "\"deduped\""
  key_links:
    - from: "src/content/schemas/publications.schema.ts"
      to: "content/publications.schema.json"
      via: "pnpm generate-schemas (tsx scripts/generate-schemas.mjs)"
      pattern: "z.toJSONSchema"
    - from: "content/publications.json _meta.counts"
      to: "PublicationsMetaSchema.counts"
      via: "validate-content prebuild hook"
      pattern: "\"orcid\":\\s*0"
---

<objective>
Extend the Zod schema to accept `"orcid"` as a fourth publication source and add `orcid` + `deduped` count fields to `_meta.counts`. Regenerate the JSON Schema artifact. Hand-patch the existing `content/publications.json` `_meta.counts` in the SAME commit so `validate-content` keeps passing through the transition.

Purpose: All downstream work in Phase 16 (CLI flag, stub `fetchOrcid`, DOI dedup) depends on the schema accepting `"orcid"` first. Bundling the schema change, JSON-schema regen, and counts patch into one commit avoids a circular dependency where the sync script must run before validate passes but validate must pass before the script can be merged.

Output: Schema accepts `"orcid"` sources and new counts. `pnpm tsc --noEmit`, `pnpm validate-content`, and `pnpm build` all pass cleanly.
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/16-schema-sync-infrastructure/16-RESEARCH.md

@src/content/schemas/publications.schema.ts
@content/publications.schema.json
@content/publications.json
@scripts/generate-schemas.mjs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extend Zod schema and patch content/publications.json counts</name>
  <files>src/content/schemas/publications.schema.ts, content/publications.json</files>
  <action>
Edit `src/content/schemas/publications.schema.ts`:

1. Line 86 — extend `PublicationSchema.source` enum. Current:
   ```ts
   source: z.enum(["manual", "inspirehep", "arxiv"]).default("manual"),
   ```
   Change to:
   ```ts
   source: z.enum(["manual", "inspirehep", "arxiv", "orcid"]).default("manual"),
   ```

2. Line 138 — extend `PublicationsMetaSchema.sources`. Current:
   ```ts
   sources:   z.array(z.enum(["inspirehep", "arxiv"])),
   ```
   Change to:
   ```ts
   sources:   z.array(z.enum(["inspirehep", "arxiv", "orcid"])),
   ```

3. Lines 139–143 — add `orcid` and `deduped` to `counts`. Current:
   ```ts
   counts: z.object({
     inspirehep: z.number().int().min(0),
     arxiv:      z.number().int().min(0),
     manual:     z.number().int().min(0),
   }),
   ```
   Change to:
   ```ts
   counts: z.object({
     inspirehep: z.number().int().min(0),
     arxiv:      z.number().int().min(0),
     manual:     z.number().int().min(0),
     orcid:      z.number().int().min(0),
     deduped:    z.number().int().min(0),
   }),
   ```
   Make both fields REQUIRED (not `.optional()`). The sync script will always write them; defensive defaults would mask bugs.

Edit `content/publications.json` in the SAME commit to add the two new count fields. Find the `_meta.counts` block (around lines 8–12) which currently reads:
```json
"counts": {
  "inspirehep": 317,
  "arxiv": 73,
  "manual": 0
},
```
Add `"orcid": 0,` and `"deduped": 0` so it becomes:
```json
"counts": {
  "inspirehep": 317,
  "arxiv": 73,
  "manual": 0,
  "orcid": 0,
  "deduped": 0
},
```

CRITICAL: This patch MUST land in the same commit as the schema change — the prebuild `validate-content` hook runs `PublicationsFileSchema.parse()` and will reject the file if `orcid` / `deduped` are missing from `counts`.

Do NOT touch any publication entries, warnings, or synced_at. Only `_meta.counts` gets the two new integer fields.
  </action>
  <verify>
Run from repo root:
```
pnpm tsc --noEmit
pnpm validate-content
```
Both must exit 0. If validate-content fails with a path like `_meta.counts.orcid: Required`, re-check the JSON patch.

Also sanity-test the enum: synthesise a Publication with `source: "orcid"` and confirm it parses. Use:
```
node -e "const { PublicationSchema } = require('./src/content/schemas/publications.schema.ts'); console.log(PublicationSchema.parse({ id: 't', authors: ['A'], title: 'T', journal: 'J', year: 2024, topic_tags: [], source: 'orcid' }));"
```
(If `require` fails because the file is TS-only, run a tiny inline tsx script instead — the important check is that tsc and validate-content pass.)
  </verify>
  <done>
- `publications.schema.ts` line 86 enum includes `"orcid"`.
- `publications.schema.ts` line 138 sources enum includes `"orcid"`.
- `publications.schema.ts` counts object has required `orcid` and `deduped` integer fields.
- `content/publications.json` `_meta.counts` has `"orcid": 0` and `"deduped": 0`.
- `pnpm tsc --noEmit` exits 0.
- `pnpm validate-content` exits 0.
  </done>
</task>

<task type="auto">
  <name>Task 2: Regenerate JSON Schema and confirm build passes</name>
  <files>content/publications.schema.json</files>
  <action>
Run `pnpm generate-schemas` from the repo root. This invokes `tsx scripts/generate-schemas.mjs`, which calls `z.toJSONSchema(PublicationsFileSchema, { target: "draft-07" })` and writes the result to `content/publications.schema.json`.

After the script finishes, inspect the regenerated file and confirm:
1. The `source` enum under the publication item shape now contains `["manual", "inspirehep", "arxiv", "orcid"]` (order may differ — set equality is what matters).
2. The `_meta.counts` required array includes `"orcid"` and `"deduped"` and its `properties` block has integer schemas for both.
3. The `_meta.sources` items enum contains `["inspirehep", "arxiv", "orcid"]`.
4. `additionalProperties: false` is still enforced on `counts` — expected, `z.object()` maps to that with `strict: true` in the generator (confirm generator behaviour; if generator flips it to `true`, no action needed unless existing JSON starts failing).

Run a full build to close the gate:
```
pnpm tsc --noEmit
pnpm validate-content
pnpm build
```

All three must exit 0. `pnpm build` triggers `validate-content` via the prebuild hook, so a failure there will surface as a build failure — this is the canonical CI gate.

If `pnpm build` fails for any other reason (unrelated lint/typecheck drift), do NOT try to fix downstream code in this plan — surface the error and stop. This plan only owns the schema trio.
  </action>
  <verify>
- `content/publications.schema.json` regenerated; diff shows only additions related to `orcid` / `deduped`.
- `pnpm build` exits 0.
- `git diff content/publications.schema.json` shows `"orcid"` appearing under the source enum and `"deduped"` appearing under `_meta.counts`.
  </verify>
  <done>
- `content/publications.schema.json` is in sync with the updated Zod schema.
- `pnpm build` exits 0 end-to-end.
- No unrelated files changed.
  </done>
</task>

</tasks>

<verification>
Phase-level gates satisfied after this plan:
- Success criterion 1 (schema): existing entries parse, `{ source: "orcid" }` synthetic entry parses, `pnpm tsc --noEmit` and `pnpm build` pass.

Deferred to Plan 16-03:
- CLI flag behaviour (`--no-orcid`, all-sources-disabled guard)
- Stub `fetchOrcid`
- DOI dedup
- Progress and summary line updates
</verification>

<success_criteria>
- `src/content/schemas/publications.schema.ts` contains `"orcid"` in both source enums and `orcid`/`deduped` required fields under `counts`.
- `content/publications.schema.json` regenerated and committed alongside the TS change.
- `content/publications.json` `_meta.counts` has `orcid: 0` and `deduped: 0`.
- `pnpm tsc --noEmit`, `pnpm validate-content`, `pnpm build` all exit 0.
</success_criteria>

<output>
After completion, create `.planning/phases/16-schema-sync-infrastructure/16-01-SUMMARY.md`
</output>
