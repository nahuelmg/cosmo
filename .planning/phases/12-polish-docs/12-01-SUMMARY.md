---
phase: 12-polish-docs
plan: 01
subsystem: ui
tags: [eslint, react-19, next-link, jsdoc, mobile-nav, site-footer, zod-schema]

# Dependency graph
requires:
  - phase: 07-sync-schema
    provides: orcid_id on PersonSchema (replaced arxiv_id in 07-02) — the stale JSDoc reference came from this
  - phase: 08-accessor
    provides: React 19 / eslint-config-next upgrade that promoted react-hooks/set-state-in-effect to error
provides:
  - Lint-green code tree (pnpm lint exits 0)
  - JSDoc accuracy for deprecated publications_selected field (names v1.1 sync identifiers correctly)
  - MobileNav drawer with React 19-compliant auto-close (no useEffect[pathname])
  - SiteFooter with semantically correct anchor for external social URLs
affects: [12-02 data backfill runs in parallel — disjoint files; 12-03 maintainer docs; milestone audit re-run / /gsd:complete-milestone]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React 19 auto-close pattern: close dialog drawer via explicit click handlers (NavLink.onNavigate + onClickCapture wrapper) rather than useEffect([pathname]) — sidesteps react-hooks/set-state-in-effect rule"
    - "External URL semantics: plain <a target=_blank> not next/link (next/link prefetch + client-side nav are meaningless for off-site URLs)"

key-files:
  created: []
  modified:
    - src/content/schemas/people.schema.ts
    - src/components/layout/MobileNav.tsx
    - src/components/layout/SiteFooter.tsx

key-decisions:
  - "Plan's preferred useRef-guarded useEffect pattern was ALSO rejected by react-hooks/set-state-in-effect — rule fires on any setState inside useEffect regardless of guard. Render-time compare-and-setState fails react-hooks/refs (cannot read/write ref.current during render). Fell back to plan's explicit alternative: remove effect, close drawer in click handlers. Only programmatic-nav source inside drawer is LocaleToggle (verified by grep `router.push|router.replace`); wrapped it in onClickCapture to close before router.replace fires."
  - "onClickCapture (not onClick) on LocaleToggle wrapper — capture phase fires before LocaleToggle's own onClick, so setOpen(false) runs before startTransition schedules the replace. Bubble-phase would race the navigation commit."
  - "External URLs use plain <a>, not @/i18n/navigation (next-intl wrapper) — @/i18n/navigation prepends locale segments to internal routes; off-site URLs should not be locale-wrapped."

patterns-established:
  - "React 19 set-state-in-effect avoidance: explicit click-path close handlers over lifecycle effects"
  - "Drawer close topology documented inline: 3 paths (link tap, programmatic nav via capture, Radix onOpenChange for Escape/overlay/close-button)"

# Metrics
duration: 5m
completed: 2026-04-19
---

# Phase 12 Plan 01: v1.0 Lint Carryover & JSDoc Gap Closure Summary

**Lint-green code tree via render-time drawer-close refactor (MobileNav), plain-anchor external links (SiteFooter), and JSDoc identifier correction (publications_selected points at orcid_id instead of retired arxiv_id).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-19T20:46:09Z
- **Completed:** 2026-04-19T20:51:16Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `pnpm lint` flipped from `1 error` (pre-existing v1.0 carryover from Phase 8 React 19 upgrade) to `0 errors 0 warnings`
- `publications_selected` JSDoc now names the correct v1.1 sync identifiers (`inspirehep_id` / `orcid_id`); future maintainers reading the @deprecated block will not be misled about the current Zod shape
- MobileNav drawer still auto-closes on every navigation path (link tap via `NavLink.onNavigate`; locale swap via `onClickCapture` wrapper; Escape/overlay/close-button via Radix `onOpenChange`) — behaviour parity maintained without `useEffect([pathname])`
- SiteFooter uses `<a>` (semantically correct for external URLs with `target="_blank"`); no `next/link` import

## Task Commits

Each task was committed atomically:

1. **Task 1: Strip stale arxiv_id reference from publications_selected JSDoc** — `0a09581` (docs)
2. **Task 2: Fix MobileNav react-hooks/set-state-in-effect lint error** — `70337f8` (fix)
3. **Task 3: Replace next/link with plain anchor for external social URLs in SiteFooter** — `4bf708d` (refactor)

**Plan metadata commit to follow** — this SUMMARY.md + STATE.md update.

## Files Created/Modified

- `src/content/schemas/people.schema.ts` — Replaced `arxiv_id` token in `publications_selected` JSDoc with `orcid_id` (Zod shape unchanged — no `pnpm generate-schemas` needed since JSON Schema regeneration reads the shape, not comments).
- `src/components/layout/MobileNav.tsx` — Removed `useEffect([pathname]) → setOpen(false)`. Dropped `useEffect` + `usePathname` imports. Added `onClickCapture={() => setOpen(false)}` on the LocaleToggle wrapper `<div>`. Expanded the architecture JSDoc with the new 3-path close topology and the React 19 rationale.
- `src/components/layout/SiteFooter.tsx` — Dropped `import Link from 'next/link'`. Replaced the single `<Link>` usage (inside `socialLinks.map`, guarded by `length > 0`) with `<a>`. No className / a11y-prop changes.

## Decisions Made

See `key-decisions` in frontmatter. Summarized:

- **MobileNav close topology pivot:** the plan's preferred `useRef`-guarded `useEffect` still trips `react-hooks/set-state-in-effect`; a render-time compare-and-setState trips the sibling `react-hooks/refs` rule (refs can't be read or written during render under React 19's stricter mode). The plan's explicit alternative strategy — "remove the effect entirely, handle close in click handlers, provided no programmatic navigation exists" — was the viable path. Grep for `router.push|router.replace` across `src/` returned exactly one hit (`LocaleToggle.tsx`), and LocaleToggle is rendered inside the drawer itself. Handled with an `onClickCapture` wrapper around the toggle.
- **Capture-phase, not bubble-phase:** `onClickCapture` ensures `setOpen(false)` runs before LocaleToggle's `onClick` enqueues the `router.replace` transition. Bubble-phase would race the navigation commit and could leave the drawer visually open on top of the freshly-rendered route.
- **Plain `<a>` over `@/i18n/navigation`** for external URLs: the STATE.md carryover suggested flipping to `@/i18n/navigation`, but that's a next-intl wrapper that prepends the locale segment to internal paths — wrong for off-site URLs. Semantically correct element is `<a target="_blank" rel="noopener noreferrer">`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] MobileNav fix strategy pivot (useRef+useEffect → click-handler-only)**
- **Found during:** Task 2 (MobileNav lint fix)
- **Issue:** The plan's preferred fix (`useRef`-guarded `useEffect`) still triggered `react-hooks/set-state-in-effect` in React 19's stricter mode. The rule fires on ANY `setState` inside `useEffect`, not just unconditional ones. Attempted a render-time compare-and-setState fallback — that tripped `react-hooks/refs` ("Cannot access refs during render"). Both strategies were blocked, so neither could complete the task.
- **Fix:** Applied the plan's explicit alternative strategy (documented in the task's action block as "move close into click handlers if no programmatic navigation exists"): removed the `useEffect`, kept `NavLink.onNavigate` for link taps, added `onClickCapture` on the LocaleToggle wrapper for locale swaps (the only programmatic-nav source inside the drawer, verified by grepping `router.push|router.replace` across `src/` — single hit in LocaleToggle.tsx).
- **Files modified:** `src/components/layout/MobileNav.tsx` (also dropped `useEffect` + `usePathname` imports as they are now unused)
- **Verification:** `pnpm lint` → 0 errors; `pnpm tsc --noEmit` → clean; `pnpm test` → 65/65; `pnpm build` → 45 static routes. All drawer close paths preserved (documented inline in the component JSDoc).
- **Committed in:** `70337f8` (Task 2 commit)

**2. [Rule 3 — Blocking] Reverted `content/publications.json` touched by build**
- **Found during:** Task 3 verify block (`pnpm build`)
- **Issue:** Running `pnpm build` left `content/publications.json` in the working tree with a 6× growth (`inspirehep: 4 → 317`, `arxiv: 3 → 73`, `manual: 13 → 0`) and a fresh `synced_at` timestamp. This file is owned by Plan 12-02 (which already landed as `d3b528a`); Plan 12-01's scope is `src/**` only. Staging it would have crossed plan boundaries and conflated scope.
- **Fix:** `git checkout HEAD -- content/publications.json` before staging Task 3. No project behaviour change — the on-disk file returned to the 12-02 snapshot, which is the intended state.
- **Files modified:** none (revert, not edit)
- **Verification:** `git status --short` after revert showed only `M src/components/layout/SiteFooter.tsx`, matching the plan's scope.
- **Committed in:** N/A (explicitly excluded from any commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — Blocking)
**Impact on plan:** Task 2's fix strategy diverged from the preferred approach but stayed within the plan's documented alternatives; the behaviour contract (drawer closes on all nav paths, including programmatic locale swap) is preserved. Task 3 scope leakage was neutralized before commit. No scope creep, no downstream impact.

## Issues Encountered

- React 19 `react-hooks/set-state-in-effect` rule is stricter than the plan anticipated; chained to `react-hooks/refs` this leaves only the click-handler pattern viable for auto-close semantics. Resolved by falling back to the plan's explicit alternative (documented in Task 2's action block).
- `pnpm build` has an implicit side-effect on `content/publications.json` (likely the Next.js build invoking the sync pipeline or a prebuild hook beyond `validate-content.mjs`). Not investigated here — out of scope; managed by `git checkout HEAD -- content/publications.json` before staging. Flag for follow-up: worth checking whether `pnpm build` should guard against this drift.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- 12-02 (already landed as `d3b528a`) remains compatible; no `content/**` touched here.
- 12-03 (maintainer docs) can proceed unblocked.
- `/gsd:audit-milestone` re-run should now pass on the three UI-trivia items this plan closed. `MobileNav.tsx:87 focus:outline-none` flag and Hero-starfield contrast item from STATE.md "Open Items Carried Forward" are unrelated and NOT addressed here.

### Follow-up note (non-blocking)

- `pnpm build` caused `content/publications.json` to be rewritten during Task 3's verify block. Not reproduced or investigated here; mentioned so a future session can decide whether `pnpm build` should avoid side-effects on content files or whether the prebuild pipeline should run `sync-publications` only under an explicit flag.

---
*Phase: 12-polish-docs*
*Completed: 2026-04-19*
