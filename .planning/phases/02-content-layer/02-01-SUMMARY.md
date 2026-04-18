---
phase: 02-content-layer
plan: "01"
subsystem: content
tags: [zod, typescript, json-schema, vscode, site-config, bilingual, content-layer]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Next.js 16 scaffolding, TypeScript strict mode, pnpm, Node 20 via nvm, @/* path alias

provides:
  - zod@4.3.6 runtime dependency + tsx@4.21.0 devDep installed
  - src/content/schemas/shared.ts with 10 Zod helpers + Locale type + localize()
  - src/config/site.ts with typed siteConfig (groupName, tagline, affiliations, contactEmail, socialLinks)
  - .vscode/settings.json JSON schema wiring for all 5 content files
  - Empty content/, src/content/accessors/, scripts/ directories (via .gitkeep)

affects:
  - 02-02-people (imports bilingualString, proseString, slugString, optionalPhoto, orcidId from shared.ts)
  - 02-03-publications (imports canonicalString, bilingualString, arxivId, doiId from shared.ts)
  - 02-04-research-etc (imports bilingualString, proseString from shared.ts)
  - 02-05-schema-gen (tsx devDep available for prebuild script)
  - 03-layout-shell (imports siteConfig from src/config/site.ts)
  - 04-core-pages (imports siteConfig + accessors)

# Tech tracking
tech-stack:
  added:
    - "zod@4.3.6 (content validation, JSON schema generation)"
    - "tsx@4.21.0 (zero-config TS runner for prebuild scripts)"
  patterns:
    - "bilingualString(label) wraps z.strictObject({es, en}) — all bilingual fields use this exclusively"
    - "proseString(label) rejects smart quotes with labelled error message"
    - "siteConfig uses satisfies for compile-time shape checking without Zod runtime overhead"
    - "photoPath rejects leading slash (Pitfall #4: path.join treats /path as filesystem root)"
    - ".vscode/settings.json wired ahead of schema generation so IntelliSense auto-activates"

key-files:
  created:
    - src/content/schemas/shared.ts
    - src/config/site.ts
    - .vscode/settings.json
    - content/.gitkeep
    - src/content/accessors/.gitkeep
    - scripts/.gitkeep
  modified:
    - package.json (added zod@^4, tsx@^4.21.0)
    - pnpm-lock.yaml
    - .gitignore (.vscode/* with !.vscode/settings.json exception)

key-decisions:
  - "import * as z from 'zod' — NOT 'zod/v4' (Zod v4 ships as default export from 'zod')"
  - "z.strictObject() for bilingualString — NOT deprecated .strict() chain"
  - "photoPath: refine rejects leading slash — path.join breaks on /foo (filesystem root)"
  - "siteConfig uses TypeScript satisfies not Zod — developer-maintained file needs no runtime parsing"
  - "groupName is single canonical Spanish string — Argentine institutional identity, not bilingual"
  - ".vscode/settings.json committed as team workspace config (.gitignore updated with exception)"

patterns-established:
  - "Bilingual field: always bilingualString('label') from shared.ts — never hand-roll {es,en} objects"
  - "Smart-quote check: proseString() covers all user-visible prose; canonicalString() skips check for academic text"
  - "Photo paths: never start with / — store as 'people/Foo.png'"
  - "ID validators: arxivId, doiId, orcidId enforce bare IDs (no URL prefixes)"

# Metrics
duration: 3min
completed: 2026-04-18
---

# Phase 2 Plan 01: Foundation Schemas Summary

**Zod v4.3.6 installed with shared schema helpers (bilingualString, proseString, slugString, photoPath, arxivId, doiId, orcidId) and typed siteConfig for UBA Cosmology Group — all five content/*.json files wired to VS Code IntelliSense**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-18T00:13:20Z
- **Completed:** 2026-04-18T00:16:21Z
- **Tasks:** 3
- **Files modified:** 8 (3 created + 5 modified/scaffolded)

## Accomplishments

- Installed zod@4.3.6 (runtime) and tsx@4.21.0 (devDep) via pnpm; typecheck passes clean
- Authored `src/content/schemas/shared.ts` with 10 Zod helpers, Locale type, and localize() — the single source of truth all five per-type schemas will import from
- Authored `src/config/site.ts` with UBA Cosmology Group data using TypeScript `satisfies` for compile-time shape enforcement without Zod runtime overhead
- Wired `.vscode/settings.json` mapping all five `content/*.json` files to their future `*.schema.json` URLs — IntelliSense will activate automatically once Plan 05 generates schemas
- Scaffolded `content/`, `src/content/accessors/`, `scripts/` with `.gitkeep` so Plans 02–05 can drop files immediately

## Probe Output (verified, file deleted)

```
smart-quote rejected: true
missing-en rejected: true
groupName: Grupo de Cosmología
first affiliation: Universidad de Buenos Aires
```

All four assertions match expected values.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install zod@^4 and tsx, scaffold folder tree** — `c33862a` (chore)
2. **Task 2: Write src/content/schemas/shared.ts** — `e9e92eb` (feat)
3. **Task 3: Write src/config/site.ts and .vscode/settings.json** — `dff8e02` (feat)

**Plan metadata:** (docs commit — see below)

## Packages Installed

| Package | Version | Type | Purpose |
|---------|---------|------|---------|
| zod | 4.3.6 | dependency | Content schema validation + JSON schema generation |
| tsx | 4.21.0 | devDependency | Zero-config TS runner for prebuild scripts (Plan 05) |

## Helpers Exported from shared.ts

| Export | Kind | Purpose |
|--------|------|---------|
| `SMART_QUOTES` | const regex | Matches U+201C/D/2018/9 curly quotes only |
| `proseString(label)` | function | Non-empty string that rejects smart quotes with labelled error |
| `bilingualString(label)` | function | z.strictObject({es, en}) of proseString — the only way to express bilingual fields |
| `canonicalString` | const | z.string().min(1) — for academic text, no smart-quote check |
| `slugString` | const | kebab-case regex for person URL slugs |
| `photoPath` | const | Rejects leading slash (Pitfall #4) |
| `optionalPhoto` | const | photoPath.optional() — undefined when absent for clean photo-existence checks |
| `arxivId` | const | YYMM.NNNNN(vN)? bare ID format |
| `doiId` | const | 10.XXXX/... bare DOI (case-insensitive) |
| `orcidId` | const | 0000-0000-0000-000X hyphenated format |
| `Locale` | type | "es" \| "en" |
| `localize(field, locale)` | function | Pick locale-specific string from bilingual field |

## Files Created/Modified

- `src/content/schemas/shared.ts` — All 10 Zod helpers + Locale type + localize()
- `src/config/site.ts` — Typed siteConfig: groupName, tagline, affiliations (3), contactEmail, socialLinks
- `.vscode/settings.json` — 5 fileMatch → url mappings for json.schemas
- `content/.gitkeep` — Seeds content/ directory for Plans 02–04
- `src/content/accessors/.gitkeep` — Seeds accessor directory for Plans 02–04
- `scripts/.gitkeep` — Seeds scripts/ for Plan 05 prebuild
- `package.json` — Added zod@^4.3.6 (dep) and tsx@^4.21.0 (devDep)
- `.gitignore` — Changed `.vscode/` to `.vscode/* + !.vscode/settings.json`

## Decisions Made

1. **`import * as z from "zod"` not `"zod/v4"`** — Zod v4 ships as default export; the `/v4` path is for v3-alongside-v4 compatibility and causes confusion.
2. **`z.strictObject()` for bilingualString** — NOT `.strict()` chain, which is deprecated in Zod v4 API.
3. **`photoPath` rejects leading slash** — `path.join(PUBLIC_DIR, "/people/Foo.png")` resolves to `/people/Foo.png` (filesystem root) rather than `PUBLIC_DIR/people/Foo.png`. Refine catches this at build time.
4. **`siteConfig` uses TypeScript `satisfies` not Zod** — Developer-maintained file checked into source; compile-time checking sufficient; no runtime parsing overhead.
5. **`groupName` is single canonical Spanish string** — Argentine institutional identity; I18N-03 scope says site-level identity is not bilingual.
6. **`.vscode/settings.json` committed with .gitignore exception** — JSON schema wiring is shared team config, not user-specific. Changed `.vscode/` to `.vscode/* !.vscode/settings.json` in .gitignore.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `.vscode/settings.json` was gitignored**

- **Found during:** Task 3 git commit
- **Issue:** `.gitignore` had `.vscode/` which prevented committing `settings.json`. The plan explicitly lists `.vscode/settings.json` in `files_modified` and `artifacts`.
- **Fix:** Changed `.vscode/` to `.vscode/*` with `!.vscode/settings.json` exception, allowing the workspace settings to be committed while keeping user-specific `.vscode/` files (e.g. `extensions.json`, `launch.json`) gitignored.
- **Files modified:** `.gitignore`
- **Verification:** `git add .vscode/settings.json` succeeded; file committed in Task 3 commit.
- **Committed in:** `dff8e02` (part of Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required fix — plan expected the file committed. No scope creep.

## Issues Encountered

None — pnpm install, typecheck, lint, and probe all passed cleanly on first attempt.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Plans 02-02, 02-03, 02-04 can now:
- Import any helper from `@/content/schemas/shared` without version friction
- Place schema files in `src/content/schemas/` (directory exists)
- Place accessor files in `src/content/accessors/` (directory exists)
- Place content JSON files in `content/` (directory exists)

Plan 02-05 can use `pnpm tsx scripts/generate-schemas.ts` with no extra config.

No blockers — all scaffolding complete.

---
*Phase: 02-content-layer*
*Completed: 2026-04-18*
