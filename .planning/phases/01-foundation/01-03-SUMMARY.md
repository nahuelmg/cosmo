---
phase: 01-foundation
plan: 03
subsystem: foundation/i18n
tags: [next-intl, i18n, routing, typescript, i18n-check]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: Next.js 16 scaffold with TypeScript strict and src/ directory structure
provides:
  - next-intl 4.9.1 installed with createNextIntlPlugin wired into next.config.ts
  - src/i18n/routing.ts with defineRouting, locales [es,en], defaultLocale es, pathnames map
  - src/i18n/navigation.ts exporting Link/redirect/usePathname/useRouter/getPathname
  - src/i18n/request.ts with dev-warn/prod-silent error policy (I18N-06)
  - src/proxy.ts (Next.js 16 convention) hosting next-intl createMiddleware
  - src/global.d.ts augmenting next-intl AppConfig with Messages and Locale types
  - messages/es.json + messages/en.json with 14 identical chrome keys
  - pnpm check-translations CI guard for key parity (I18N-07)
  - / → /es redirect confirmed via proxy (307)
affects: [01-04]

# Tech tracking
tech-stack:
  added: [next-intl@4.9.1, "@lingual/i18n-check@0.9.3"]
  patterns:
    - "next-intl defineRouting with pathnames map for segment-translated URLs"
    - "Next.js 16 proxy.ts convention (not middleware.ts)"
    - "dev-warn/prod-silent i18n error policy via onError + getMessageFallback"
    - "AppConfig augmentation in src/global.d.ts for typed useTranslations"

key-files:
  created:
    - src/i18n/routing.ts
    - src/i18n/navigation.ts
    - src/i18n/request.ts
    - src/proxy.ts
    - src/global.d.ts
    - messages/es.json
    - messages/en.json
  modified:
    - next.config.ts
    - package.json

key-decisions:
  - "pathnames map: journal-club stays English in both locales (international domain lexicon)"
  - "localeDetection: false — Argentine-first, no Accept-Language sniffing, predictable canonical"
  - "dev-warn/prod-silent error policy for missing keys (I18N-06)"
  - "/ → /es redirect via proxy; no bare locale-less pages"

patterns-established:
  - "i18n routing via defineRouting: use this pattern for all route definitions"
  - "Navigation helpers from createNavigation: never string-replace locale prefix in toggle"
  - "check-translations in CI: pnpm check-translations gates on key parity"

# Metrics
duration: 4min
completed: 2026-04-17
---

# Phase 1 Plan 03: next-intl i18n Routing Summary

**next-intl 4.9.1 wired into Next.js 16 with segment-translated pathnames map, proxy.ts middleware (not middleware.ts), dev-warn/prod-silent error policy, typed AppConfig, and check-translations CI guard for key parity**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-17T21:08:39Z
- **Completed:** 2026-04-17T21:13:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- next-intl 4.9.1 + @lingual/i18n-check 0.9.3 installed; next.config.ts wrapped with createNextIntlPlugin
- Segment-translated routing wired: `/es/personas` ↔ `/en/people`, all 8 pathnames mapped
- proxy.ts (Next.js 16 convention) confirmed working: `curl /` → 307 redirect to `/es`
- check-translations exits 0 on key parity, non-zero when key deleted from one locale (verified both paths)
- pnpm typecheck and pnpm build both pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Install next-intl + @lingual/i18n-check and wire next.config.ts** - `faf0bfd` (feat)
2. **Task 2: Write routing, navigation, request config, and typed AppConfig augmentation** - `6e82e7d` (feat)
3. **Task 3: Write proxy.ts, seed messages/es.json + messages/en.json, verify check-translations** - `2015560` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/i18n/routing.ts` - defineRouting with locales [es,en], defaultLocale es, localePrefix always, localeDetection false, 8-pathname map
- `src/i18n/navigation.ts` - createNavigation exports: Link, redirect, usePathname, useRouter, getPathname
- `src/i18n/request.ts` - getRequestConfig with dynamic message import and dev-warn/prod-silent onError handler
- `src/proxy.ts` - next-intl createMiddleware under Next.js 16 proxy convention; matcher excludes api/trpc/_next/_vercel/static files
- `src/global.d.ts` - declare module 'next-intl' augmenting AppConfig with Messages (typeof es.json) and Locale ('es' | 'en')
- `messages/es.json` - 14 chrome keys: meta.{siteName,institution}, nav.{home,people,research,publications,journalClub,outreach,contact}, locale.{switchTo,current}, footer.{affiliationUba,affiliationFcen,affiliationConicet,copyright}
- `messages/en.json` - identical key set, English values
- `next.config.ts` - wrapped with createNextIntlPlugin('./src/i18n/request.ts')
- `package.json` - added next-intl dependency, @lingual/i18n-check devDep, check-translations script

## Decisions Made

- **pathnames map — journal-club stays English in both locales:** The term "journal club" is the international domain lexicon; Spanish-speaking researchers recognise it. No translation needed. This is reflected in both `es` and `en` path entries being `/journal-club`.
- **localeDetection: false:** Per CONTEXT.md, `/` always redirects to `/es` — Argentine-first, no Accept-Language sniffing, canonical-friendly. Predictable behaviour for SEO.
- **dev-warn / prod-silent error policy (I18N-06):** Missing translation keys log a `console.warn` in development with the key path and `[missing]` suffix; in production, the key path is returned silently. No crashes, no user-visible errors.
- **@lingual/i18n-check --source es --locales messages --format next-intl:** Flag names confirmed via `pnpm exec i18n-check --help` — exact match to RESEARCH.md recommendation. No deviation needed.

## Deviations from Plan

None — plan executed exactly as written. The `--format next-intl` flag was confirmed supported in the installed version (0.9.3) before writing the script. The `/en` curl test returning 404 instead of 200 is expected behaviour: `localePrefix: 'always'` routes all traffic through the proxy, and without a `[locale]` directory (created in Plan 01-04), `/en` has no handler. The plan itself notes this: "Note: the 200 on `/en` at this point renders the plain Plan 01-01 placeholder page... Plan 01-04 will move routing under `src/app/[locale]/`." The redirect (`/` → `/es` 307) is the primary success criterion and is confirmed working.

## Issues Encountered

None. All three tasks completed cleanly. The `/en` returning 404 (vs expected 200) is a known limitation documented in the plan — it resolves in Plan 01-04 when `src/app/[locale]/` is created.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- i18n infrastructure complete: routing, navigation, request config, proxy, typed messages, CI guard all in place
- `src/i18n/routing.ts` and `src/i18n/navigation.ts` are ready for Plan 01-04 to consume when wiring `src/app/[locale]/layout.tsx`
- `pnpm check-translations` is ready for CI integration
- **Blocker for Plan 01-04:** None — this plan delivers exactly what 01-04 needs

---
*Phase: 01-foundation*
*Completed: 2026-04-17*
