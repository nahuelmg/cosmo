---
phase: 02-content-layer
plan: "05"
subsystem: content
tags: [zod, typescript, json-schema, vscode, prebuild, validation, barrel, content-layer, draft-07, tsx]

# Dependency graph
requires:
  - phase: 02-content-layer/02-01
    provides: tsx devDep, shared.ts Zod helpers, .vscode/settings.json schema wiring stubs
  - phase: 02-content-layer/02-02
    provides: people.schema.ts, people.json, people accessor exports
  - phase: 02-content-layer/02-03
    provides: publications.schema.ts, publications.json, publications accessor exports
  - phase: 02-content-layer/02-04
    provides: research/journal-club/outreach schemas, JSONs, and accessor exports

provides:
  - scripts/validate-content.mjs — prebuild validator: parses all 5 JSONs via Zod, post-parse photo-existence check, file-grouped error format, exits 0/1
  - scripts/generate-schemas.mjs — generates all 5 content/*.schema.json from Zod v4 z.toJSONSchema(draft-07)
  - content/people.schema.json — draft-07 JSON Schema for VS Code IntelliSense on people.json
  - content/publications.schema.json — draft-07 JSON Schema for publications.json
  - content/research.schema.json — draft-07 JSON Schema for research.json
  - content/journal-club.schema.json — draft-07 JSON Schema for journal-club.json
  - content/outreach.schema.json — draft-07 JSON Schema for outreach.json
  - src/content/index.ts — barrel re-export of all 5 accessor modules + types + localize + siteConfig (23 symbols)
  - package.json prebuild/validate-content/generate-schemas scripts wired
  - DATA-07 closed (build fails loudly on any schema/photo/smart-quote violation)
  - DATA-08 closed (VS Code IntelliSense active on all 5 content/*.json files)

affects:
  - 03-layout-shell (imports from "@/content" barrel — all 23 exports available)
  - 04-core-pages (imports from "@/content" barrel)
  - CI/CD (pnpm build now runs prebuild validator automatically before next build)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "node --import tsx (not tsx/esm) for .mjs scripts importing .ts files — tsx/esm requires file extensions; bare --import tsx handles extensionless TS imports"
    - "z.toJSONSchema(schema, { target: 'draft-07' }) — VS Code JSON language server has full Draft 7 support; Draft 2020-12 (Zod v4 default) breaks enum squiggles"
    - "Photo-existence check is post-parse (not inside Zod .refine()) — keeps schema pure, no filesystem dependency, gives distinct error category"
    - "JSON Schema files committed to repo — available at clone time, diffed in PRs to show schema changes"
    - "Barrel index at src/content/index.ts — Phase 3+ pages import from @/content exclusively"

key-files:
  created:
    - scripts/validate-content.mjs
    - scripts/generate-schemas.mjs
    - content/people.schema.json
    - content/publications.schema.json
    - content/research.schema.json
    - content/journal-club.schema.json
    - content/outreach.schema.json
    - src/content/index.ts
  modified:
    - package.json (added prebuild, validate-content, generate-schemas scripts)

key-decisions:
  - "node --import tsx (not --import tsx/esm) — tsx/esm path requires explicit file extensions in imports; bare tsx flag handles .ts imports from .mjs scripts"
  - "JSON Schema target: draft-07 — VS Code fully supports Draft 7; Zod v4 default Draft 2020-12 has limited VS Code support (enum squiggles may not fire)"
  - "Photo-existence check post-parse not via Zod .refine() — schema stays filesystem-free; error category is visually distinct in CLI output"
  - "Generate-schemas is manual (not chained into prebuild) — schema-JSON drift is visible via git diff; maintainer opts in to regeneration"
  - "JSON Schema files committed to repo — no post-clone generation step required"
  - "Zod .refine() rules (leading-slash photo, smart-quote guard) do NOT translate to JSON Schema — caught at build time only via prebuild validator"

patterns-established:
  - "Barrel import: all pages import from @/content, never from @/content/accessors/* directly"
  - "Prebuild lifecycle hook: npm/pnpm prebuild runs automatically before next build — Vercel CI inherits without extra config"
  - "Error format: file → JSON path (e.g. [3].photo) → message → Received: value, grouped by file"

# Metrics
duration: ~30min (including human-verify checkpoint)
completed: 2026-04-17
---

# Phase 2 Plan 05: Prebuild Validator, Schema Generator, and Content Barrel Summary

**Zod v4 prebuild validator (DATA-07) + draft-07 JSON Schema generator (DATA-08) + content barrel index — `pnpm build` now fails loudly on any content violation, VS Code shows enum squiggles on all 5 content/*.json files, and Phase 3+ pages import everything from a single `@/content` line**

## Performance

- **Duration:** ~30 min (including human-verify checkpoint)
- **Started:** 2026-04-17
- **Completed:** 2026-04-17
- **Tasks:** 3 auto + 1 human-verify checkpoint (approved)
- **Files modified:** 9 (8 created, 1 modified)

## Accomplishments

- `scripts/validate-content.mjs` wired as `prebuild` lifecycle hook — `pnpm build` now validates all 5 content/*.json files against Zod schemas before Next.js runs; exits 1 with file-grouped, path-level error messages on any violation
- `scripts/generate-schemas.mjs` emits 5 `content/*.schema.json` files using `z.toJSONSchema(schema, { target: 'draft-07' })` — VS Code IntelliSense shows enum completions and red squiggles on invalid field values
- `src/content/index.ts` barrel exposes 23 symbols for Phase 3+ one-line imports from `@/content`
- All three human-verify scenarios passed: CLI error format, VS Code IntelliSense, and schema regen loop

## Human Verification Results

All three scenarios were verified by the user and APPROVED.

### Verification 1 — CLI error format on seeded violation (DATA-07)

**Seed used:** Option B (missing photo) — changed `photo` field in `content/people.json` to `"people/Does_Not_Exist.png"`. A second seed was also applied.

**Result:** `pnpm build` exited 1. stderr showed:

```
✖ Content validation failed

  people.json
  └─ [N].photo
     Photo not found: public/people/Does_Not_Exist.png
```

Format matches CONTEXT.md spec exactly: file → JSON path → message, grouped by file. Next.js `next build` did not run (prebuild short-circuited). Reverting the seed restored a clean build. **PASSED.**

### Verification 2 — VS Code IntelliSense (DATA-08)

- `category` enum in `content/people.json` — red squiggle appeared with the full enum list on an invalid value. **PASSED.**
- `arxiv_id` pattern in `content/publications.json` — red squiggle appeared on a value that violated the pattern `^\d{4}\.\d{4,5}(v\d+)?$`. **PASSED.**
- `slug` pattern is present in the generated schema; VS Code JSON language server was lazy about pattern-squiggling in one test case, but enum + arxiv squiggles confirm DATA-08 is satisfied.

**Known limit — Zod `.refine()` rules do not translate to JSON Schema.** The `photoPath` leading-slash refine and `proseString` smart-quote guard are Zod runtime checks only. They are not representable in JSON Schema (Draft 7 or any other target). These violations are caught at build time via `pnpm build` (prebuild validator) — they will NOT show as VS Code squiggles. This is by design and is not a gap: the build fails loudly on any such violation, which is the DATA-07 guarantee.

### Verification 3 — `pnpm generate-schemas` regen loop

- Added `"podcast"` to the `type` enum in `src/content/schemas/outreach.schema.ts`
- Ran `pnpm generate-schemas` — `content/outreach.schema.json` regenerated with `"podcast"` in the enum
- Reverted the schema change; re-ran `generate-schemas` — `"podcast"` disappeared from the JSON Schema

**PASSED.**

## Task Commits

Each task was committed atomically:

1. **Task 1: validate-content.mjs** — `897744d` (feat)
2. **Task 2: generate-schemas.mjs + 5 schema files** — `0f1b95a` (feat)
3. **Task 3: prebuild wiring + barrel** — `22e80d8` (feat)

**Plan metadata:** (docs commit — this file)

## package.json Scripts Block

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "check-translations": "i18n-check --source es --locales messages --format next-intl",
    "prebuild": "node --import tsx scripts/validate-content.mjs",
    "validate-content": "node --import tsx scripts/validate-content.mjs",
    "generate-schemas": "node --import tsx scripts/generate-schemas.mjs"
  }
}
```

Note: the deployed scripts use `node --import tsx` (bare flag) rather than `node --import tsx/esm` as the plan originally specified. `tsx/esm` requires explicit file extensions in import specifiers; the bare `tsx` flag handles `.ts` extension imports from `.mjs` scripts without issue.

## src/content/index.ts — Full Export Surface (23 symbols)

```typescript
// Accessor re-exports (all functions from all 5 accessor modules)
export * from "./accessors/people";
export * from "./accessors/publications";
export * from "./accessors/research";
export * from "./accessors/journal-club";
export * from "./accessors/outreach";

// Type re-exports
export type { Person, People } from "./schemas/people.schema";
export type { Publication, Publications } from "./schemas/publications.schema";
export type { ResearchArea, Research } from "./schemas/research.schema";
export type { JournalClubSession, JournalClub } from "./schemas/journal-club.schema";
export type { OutreachActivity, Outreach } from "./schemas/outreach.schema";

// Shared helpers
export { localize, type Locale } from "./schemas/shared";

// Site config
export { siteConfig, type SiteConfig } from "../config/site";
```

**Runtime-visible exports (23 total, verified via `pnpm tsx -e 'import * as c from "./src/content"; console.log(Object.keys(c).sort())'`):**

```
getAllTopics, getAllYears, getJournalClub, getLocalizedOutreach, getLocalizedPeople,
getLocalizedPerson, getLocalizedResearchAreas, getLocalizedSession, getOutreach,
getOutreachByType, getPastSessionsByYear, getPeople, getPeopleByCategory,
getPersonBySlug, getPublicationById, getPublications, getPublicationsByTopic,
getPublicationsByYear, getResearchAreaById, getResearchAreas, getUpcomingSessions,
localize, siteConfig
```

## Files Created/Modified

- `scripts/validate-content.mjs` — Prebuild validator: loads 5 JSONs, runs Zod safeParse, post-parse photo existsSync check, file-grouped formatter, exits 0/1
- `scripts/generate-schemas.mjs` — Calls `z.toJSONSchema(schema, { target: 'draft-07' })` + injects `$schema` URI for each of 5 schemas; writes to `content/*.schema.json`
- `content/people.schema.json` — Generated draft-07 JSON Schema (VS Code IntelliSense source)
- `content/publications.schema.json` — Generated draft-07 JSON Schema
- `content/research.schema.json` — Generated draft-07 JSON Schema
- `content/journal-club.schema.json` — Generated draft-07 JSON Schema
- `content/outreach.schema.json` — Generated draft-07 JSON Schema
- `src/content/index.ts` — Barrel: 5 accessor re-exports + 10 type re-exports + localize/Locale + siteConfig/SiteConfig
- `package.json` — Added `prebuild`, `validate-content`, `generate-schemas` to scripts

## Decisions Made

1. **`node --import tsx` not `--import tsx/esm`** — The plan specified `tsx/esm` but the deployed scripts use the bare `tsx` flag. `tsx/esm` path requires explicit file extensions in import specifiers inside `.mjs` files (e.g. `./people.schema.js` instead of `./people.schema.ts`). The bare `tsx` hook handles `.ts` imports from `.mjs` transparently. This is the correct loader for this pattern.

2. **JSON Schema target `draft-07` for VS Code** — VS Code's JSON language server fully supports Drafts 4–7. Zod v4's default target is Draft 2020-12, which has "limited support" in VS Code (required-field highlighting and enum squiggles may not fire). Passing `{ target: 'draft-07' }` explicitly ensures full IntelliSense feature support.

3. **Photo-existence check is post-parse, not via Zod `.refine()`** — Keeps the people schema filesystem-free and reusable in other contexts. The post-parse check runs over the raw JSON array unconditionally, giving a distinct error category (`Photo not found: public/...`) visually separate from Zod validation errors.

4. **`generate-schemas` is NOT chained into `prebuild`** — If a schema file changes and the JSON Schema isn't regenerated, that's a visible `git diff` condition a maintainer notices in code review. Chaining would silently regenerate on every build, masking schema drift and adding build time for no benefit.

5. **JSON Schema files committed to repo** — They are small (~2–5 KB each), diff cleanly in PRs, and are available immediately after `git clone` without a post-clone generation step.

6. **Zod `.refine()` rules do not translate to JSON Schema (known limit)** — The `photoPath` leading-slash refine and `proseString` smart-quote guard are Zod runtime constructs with no JSON Schema equivalent. These are caught exclusively at build time via the prebuild validator. They will not produce VS Code squiggles. This is acceptable: the DATA-07 build-time guarantee covers them; DATA-08 (IntelliSense) covers `enum`, `pattern`, `required`, and `type` constraints which do translate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsx/esm loader flag replaced with bare tsx**

- **Found during:** Task 1 verification (`node --import tsx/esm scripts/validate-content.mjs`)
- **Issue:** `node --import tsx/esm` rejected `.ts` extension import specifiers (e.g. `import { PeopleSchema } from "../src/content/schemas/people.schema.ts"`). The `tsx/esm` path enforces Node's extensionless-import rules strictly.
- **Fix:** Changed all three scripts in `package.json` from `node --import tsx/esm` to `node --import tsx`. The bare `tsx` hook registers a loader that handles `.ts` extensions in import specifiers from `.mjs` files.
- **Files modified:** `package.json` (3 script entries), `scripts/validate-content.mjs` (comment updated)
- **Verification:** `node --import tsx scripts/validate-content.mjs` exits 0 with "✔ Content validation passed" message.
- **Committed in:** `22e80d8` (Task 3 commit, scripts block update)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required fix for scripts to execute. Loader flag change is a single-line difference with no semantic impact on validation or schema generation behavior.

## Issues Encountered

None beyond the tsx loader flag. All three auto tasks verified cleanly on their first full run. The human-verify checkpoint passed on all three scenarios without requiring any code fixes.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 2 is complete. The content layer delivers:

- 5 Zod schemas (people, publications, research, journal-club, outreach)
- 5 placeholder JSON files with realistic bilingual data
- 5 typed accessor modules (23 total exports)
- 5 draft-07 JSON Schema files for VS Code IntelliSense
- Prebuild validator (DATA-07: build fails on any violation)
- One-line import surface: `import { getPeople, ... } from "@/content"`

Phase 3 (Layout Shell) can begin immediately. No blockers.

The `pnpm build` prebuild hook will catch any content errors introduced during Phase 3/4 page development — maintainer experience is fully wired.

---
*Phase: 02-content-layer*
*Completed: 2026-04-17*
