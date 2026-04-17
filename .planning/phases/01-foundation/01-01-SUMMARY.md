---
phase: 01-foundation
plan: 01
subsystem: foundation/scaffold
tags: [nextjs, react, typescript, tailwind, eslint, pnpm, turbopack]

# Dependency graph
requires: []
provides:
  - Next.js 16.2.4 App Router project at repo root with TypeScript strict mode
  - Tailwind v4 via @tailwindcss/postcss (CSS-first, no tailwind.config.js)
  - pnpm workspace with dev/build/start/lint/typecheck scripts
  - Minimal src/app/{layout,page,globals.css} placeholders (replaced by 01-04)
  - .gitignore covering all Next.js build artefacts and env files
  - Project README with stack, layout, and development commands
affects: [01-03, 01-04]

# Tech tracking
tech-stack:
  added: [next@16, react@19, typescript@5, tailwindcss@4, "@tailwindcss/postcss@4", eslint-config-next]
  patterns:
    - "CSS-first Tailwind v4: @theme directive in globals.css, no tailwind.config.js"
    - "pnpm workspace: pnpm-workspace.yaml at root"
    - "ESLint flat config: eslint.config.mjs with eslint-config-next/core-web-vitals"
    - "TypeScript excludes: ui-ux-pro-max/, skills/, references/, .planning/ excluded from tsconfig"

key-files:
  created:
    - package.json
    - pnpm-lock.yaml
    - pnpm-workspace.yaml
    - tsconfig.json
    - next.config.ts
    - postcss.config.mjs
    - eslint.config.mjs
    - next-env.d.ts
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/globals.css
    - .gitignore
    - README.md
  modified: []

key-decisions:
  - "Scaffolded in temp dir (cosmo-scaffold) and rsync'd to repo root due to create-next-app refusing non-empty directories"
  - "Node.js 20 required: installed via nvm (system had 18.19.1, Next.js 16 requires >=20.9.0)"
  - "lint script changed from 'next lint' to 'eslint src': next lint command removed in Next.js 16"
  - "tsconfig exclude list extended to cover ui-ux-pro-max/, skills/, references/, .planning/ (blocking typecheck)"

patterns-established:
  - "Always-exclude non-project TS dirs: add repo-level tool dirs to tsconfig exclude"
  - "next lint removed in Next.js 16: use standalone eslint with src target"

# Metrics
duration: 5min
completed: 2026-04-17
---

# Phase 1 Plan 01: Next.js 16 Scaffold Summary

**Next.js 16.2.4 + TypeScript strict + Tailwind v4 scaffolded at repo root via pnpm, with Node 20 installed via nvm and three Next.js 16 API changes handled (proxy.ts convention, removed next lint, CSS-first Tailwind)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-17T20:34:23Z
- **Completed:** 2026-04-17T20:39:54Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Next.js 16.2.4 project scaffolded at repo root with App Router, TypeScript strict, Tailwind v4
- All four verification commands pass: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm build`
- Dev server confirmed serving HTTP 200 on localhost:3000
- Pre-existing repo files (`.planning/`, `skills/`, `references/`, `CLAUDE.md`, `GUIDE.md`, `ui-ux-pro-max/`) fully preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 project** - `ab6bd0e` (feat)
2. **Task 2: Add project scripts, .gitignore, README** - `3cdd152` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `package.json` - name=cosmo, next@^16.2.4, dev=--turbopack, typecheck=tsc --noEmit, lint=eslint src
- `pnpm-lock.yaml` - dependency lockfile
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `tsconfig.json` - strict=true, paths=@/*, excludes ui-ux-pro-max/skills/references/.planning/
- `next.config.ts` - minimal NextConfig export (no i18n plugin yet, added in 01-03)
- `postcss.config.mjs` - @tailwindcss/postcss plugin only (no autoprefixer)
- `eslint.config.mjs` - flat config with eslint-config-next/core-web-vitals + typescript
- `next-env.d.ts` - Next.js TypeScript reference
- `src/app/layout.tsx` - minimal RootLayout, lang=es placeholder (replaced by 01-04)
- `src/app/page.tsx` - trivial h1 placeholder (replaced by 01-04)
- `src/app/globals.css` - `@import "tailwindcss"` only (OKLCH tokens added in 01-04)
- `.gitignore` - node_modules, .next, build, dist, env files, editor caches, OS files
- `README.md` - project description, stack, layout, development commands

## Decisions Made

- **Scaffolded in temp dir:** `create-next-app@16` refuses non-empty directories. Used `cosmo-scaffold/` temp dir then manually copied files to repo root, preserving all pre-existing files.
- **Node.js 20 via nvm:** System had Node 18.19.1; Next.js 16 requires >=20.9.0. Installed nvm + Node 20.20.2. All subsequent pnpm commands run under Node 20.
- **`lint` script uses `eslint src` not `next lint`:** `next lint` was removed as a Next.js CLI command in Next.js 16. The scaffold generates standalone `eslint` invocation.
- **tsconfig exclude extended:** The default `**/*.ts` include glob picked up `ui-ux-pro-max/cli/src/` TypeScript files (chalk/ora/commander imports with no node_modules). Added `ui-ux-pro-max`, `skills`, `references`, `.planning` to exclude list.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded in temp dir due to non-empty directory rejection**
- **Found during:** Task 1 (Scaffold Next.js 16 project)
- **Issue:** `create-next-app@16 .` refused to run because directory had `.planning/`, `skills/`, `references/`, etc.
- **Fix:** Created `cosmo-scaffold/` temp dir at `/home/tomas/Projects/`, ran scaffold there, then `cp -r` files to repo root excluding files that must be preserved (README.md, CLAUDE.md)
- **Files modified:** All scaffold files
- **Verification:** pnpm install + typecheck + lint + build all pass
- **Committed in:** ab6bd0e (Task 1 commit)

**2. [Rule 3 - Blocking] Installed Node.js 20 via nvm**
- **Found during:** Task 1 verification (pnpm lint)
- **Issue:** Node 18.19.1 on system; Next.js 16 requires >=20.9.0. `next lint` (and build) fail with Node version error.
- **Fix:** Installed nvm v0.39.7, then `nvm install 20` (got Node 20.20.2). All subsequent commands run with Node 20 sourced.
- **Files modified:** None (system-level change)
- **Verification:** `node --version` → v20.20.2; all commands pass
- **Committed in:** N/A (environment fix, no file changes)

**3. [Rule 3 - Blocking] Changed `lint` script from `next lint` to `eslint src`**
- **Found during:** Task 1 verification (pnpm lint)
- **Issue:** `next lint` command was removed from the Next.js 16 CLI. Running it produced "Invalid project directory: no such directory: /cosmo/lint".
- **Fix:** Changed package.json `lint` script to `eslint src` (matching the scaffold's intent per the generated eslint.config.mjs)
- **Files modified:** package.json
- **Verification:** `pnpm lint` exits 0
- **Committed in:** 3cdd152 (Task 2 commit)

**4. [Rule 3 - Blocking] Extended tsconfig.json exclude list**
- **Found during:** Task 1 verification (pnpm typecheck)
- **Issue:** Default `**/*.ts` include glob picked up `ui-ux-pro-max/cli/src/` TypeScript files that import chalk/ora/commander (not in node_modules). TypeScript reported 11 errors.
- **Fix:** Added `"ui-ux-pro-max"`, `"skills"`, `"references"`, `".planning"` to the `exclude` array in tsconfig.json.
- **Files modified:** tsconfig.json
- **Verification:** `pnpm typecheck` exits 0 with no output
- **Committed in:** ab6bd0e (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (0 bugs, 0 missing critical, 4 blocking)
**Impact on plan:** All auto-fixes were required to unblock execution. No scope creep. Next.js 16 has three breaking changes vs what plan assumed (non-empty dir refusal is pnpm/node constraint, not Next.js).

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Project boots, compiles, lints, and builds successfully under Node 20
- Ready for Plan 01-02 (ui-ux-pro-max design system generation)
- Ready for Plan 01-03 (next-intl i18n routing) — src/app/ placeholders intentionally minimal
- Ready for Plan 01-04 ([locale]/ layout shell + fonts + OKLCH tokens)
- **Note:** pnpm and Node 20 require sourcing nvm: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"` in each shell session. Consider adding to `.bashrc`/`.zshrc` if not already present.

---
*Phase: 01-foundation*
*Completed: 2026-04-17*
