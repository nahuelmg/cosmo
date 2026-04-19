---
phase: 11-display-layer
plan: 03
subsystem: ui
tags: [publications, people-profile, next-intl, tailwind, typescript, accessibility]

# Dependency graph
requires:
  - phase: 11-01
    provides: deriveNameVariants, buildMemberSurnameSet, PublicationEntry v2 (two-chip + author highlighting)
  - phase: 08-01
    provides: getPublicationsByAuthor accessor (surname-variant matching, lastNYears window)
provides:
  - Per-member publications section on /people/[slug] — last-10-years, auto-populated from InspireHEP/arXiv data
  - Removal of legacy publications_selected render path (selectedPubs prop and SelectedPub interface gone)
  - PersonDetail.tsx upgraded: memberPubs + memberSurnameSet + pubLabels + publicationsHeading props
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - hide-when-empty: entire Publications section absent from DOM when memberPubs.length === 0 (no placeholder, no heading)
    - shared-entry-reuse: PublicationEntry used verbatim across /publications and /people/[slug]
    - accessor-call-pattern: getPublicationsByAuthor(deriveNameVariants(rawPerson), { lastNYears: 10 })

key-files:
  created: []
  modified:
    - src/app/[locale]/people/[slug]/page.tsx
    - src/components/people/PersonDetail.tsx

key-decisions:
  - "publications_selected render path stripped entirely — getPublicationById import removed from page.tsx"
  - "PEOP-14 count subtitle intentionally absent — heading is publications.title alone (no count, no 'últimos 10 años' framing); SC5 softened per 11-CONTEXT.md locked decision"
  - "Empty-state hide: memberPubs.length === 0 → no section in DOM; intentional during DATA-09/10 rollout where ~13/14 current members lack IDs"
  - "people.selectedPublications i18n key preserved in messages/*.json — v1.2 cleanup alongside Zod field removal (RESEARCH Pitfall 5)"
  - "PEOP-17 generateStaticParams category filter unchanged — pi/postdoc/phd only, no past member profile pages"
  - "buildMemberSurnameSet called with getPeople() unfiltered — past + current members highlighted (CONTEXT locked)"

patterns-established:
  - "RSC → client boundary: Set<string> not JSON-serializable; for /publications, PublicationsClientShell receives string[] and rebuilds Set via useMemo. On /people/[slug] (server-only render), Set<string> is passed directly as a prop — no serialization boundary."

# Metrics
duration: 8min
completed: 2026-04-19
---

# Phase 11 Plan 03: Profile Publications Section Summary

**Legacy `publications_selected` render path replaced with `getPublicationsByAuthor(deriveNameVariants(rawPerson), { lastNYears: 10 })` — per-member Publications section hidden when empty, shared `PublicationEntry` reused verbatim with two-chip badges and author highlighting.**

## Performance

- **Duration:** ~8 minutes
- **Started:** 2026-04-19T19:09:14Z
- **Completed:** 2026-04-19T19:17Z
- **Tasks:** 3 of 3
- **Files modified:** 2

## Accomplishments

- Rewired `/people/[slug]/page.tsx` — `getPublicationById` import and `selectedPubs` construction block (12 lines) removed; replaced with `getPublicationsByAuthor` + `deriveNameVariants` + `buildMemberSurnameSet` calls
- Updated `PersonDetail.tsx` — `SelectedPub` interface (~9 lines), `selectedPublications` from `Labels`, `publications_selected` from `LocalizedPerson`, and the entire legacy `selectedPubs.length > 0` render block (~42 lines) removed; new `{memberPubs.length > 0 && <section>}` block added
- All phase gates green: `pnpm tsc --noEmit` exit 0, `pnpm build` 45 routes exit 0, `pnpm check-translations` "No missing keys found!", `pnpm test` 65/65 passed

## Dead Code Removed

| Location | Lines removed | Description |
|----------|--------------|-------------|
| `page.tsx` | ~12 | `selectedPubs` construction block + `getPublicationById` import |
| `PersonDetail.tsx` | ~9 | `SelectedPub` interface |
| `PersonDetail.tsx` | ~3 | `selectedPublications: string;` from `Labels` + `publications_selected: string[];` from `LocalizedPerson` |
| `PersonDetail.tsx` | ~42 | Legacy `selectedPubs.length > 0` render block (ul, li, inline arxiv/doi links) |
| **Total** | **~66 lines** | Legacy publications_selected render path gone |

## Member Profile Coverage (DATA-09/10 State)

- **`tomas-ferreira-chase`** — InspireHEP ID populated. `getPublicationsByAuthor(["chase", "ferreira chase", "tomas ferreira chase"], { lastNYears: 10 })` returns 4 InspireHEP entries. Publications section VISIBLE on `/es/people/tomas-ferreira-chase` and `/en/people/tomas-ferreira-chase`.
- **All other members (~13/14)** — no `inspirehep_id` / `orcid_id`. `getPublicationsByAuthor` returns `[]`. Publications section ABSENT from DOM entirely (no heading, no placeholder). Intentional DATA-09/10 rollout state.

## PEOP-14 Softening — Traceability Note

Per `11-CONTEXT.md` locked decision: the profile publications section heading is **`publications.title` alone** (`"Publicaciones"` / `"Publications"`). No count, no subtitle, no "últimos 10 años" / "last 10 years" framing. This explicitly softens ROADMAP SC5 and REQ PEOP-14. Grep confirmation: `grep -rn "últimos 10 años\|last 10 years" src/components/people/PersonDetail.tsx src/app/\[locale\]/people/\[slug\]/page.tsx` → zero hits.

**Verifier should NOT treat the absence of the count as a gap.** The traceability table for PEOP-14 should read: "Softened per /gsd:discuss-phase 11-CONTEXT.md — heading alone; count explicitly dropped."

## PEOP-17 Preservation Confirmation

`generateStaticParams` in `page.tsx` still filters to `p.category === 'pi' || p.category === 'postdoc' || p.category === 'phd'`. Past members have no profile pages. Verified by grep and confirmed in the build output — no undergrad or past slugs appear in the route list.

## `people.selectedPublications` i18n Key Preservation

The `people.selectedPublications` key was NOT deleted from `messages/es.json` or `messages/en.json`. It is now dead code (no component reads it). Scheduled for removal in v1.2 alongside Zod schema `publications_selected` field removal (RESEARCH Pitfall 5; key enforcement is one-directional).

## `pnpm build` Output Summary

```
✓ Compiled successfully in 3.3s
✓ TypeScript: 0 errors
✓ Generating static pages (45/45) in 691ms

Routes generated:
  /[locale]/people/[slug] — 26 paths total (13 slugs × 2 locales: es + en)
    pi/postdoc/phd only — no undergrad or past member URLs
  /[locale]/publications — 2 paths (es + en)
  All other routes: unchanged from v1.0
```

## `pnpm check-translations` Output

```
No missing keys found!
No invalid translations found!
Done in 0.01s.
```

Zero key drift across Phase 11 — all 7 new keys from 11-01 present in both locales, no stray keys introduced in 11-03.

## Requirements Traceability

| Requirement | Status | Notes |
|-------------|--------|-------|
| PEOP-13 | Complete | `getPublicationsByAuthor(deriveNameVariants(rawPerson), { lastNYears: 10 })` call site live |
| PEOP-14 | **Softened** | Heading alone; count explicitly dropped per 11-CONTEXT.md |
| PEOP-15 | Complete | `PublicationEntry` reused verbatim on profile pages |
| PEOP-16 | Complete | Member bold-highlighting via `memberSurnameSet` in `PublicationEntry` |
| PEOP-17 | Complete | `generateStaticParams` filter unchanged; verified |
| PEOP-18 | Complete | `publications_selected` render path stripped from both page.tsx and PersonDetail.tsx |
| PUBS-05–PUBS-12 | Complete (via 11-01 + 11-02) | Shared entry, filter, staleness, footnote, badges |
| I18N-08/09 | Complete (via 11-01) | All new keys in both locales; zero drift |

## Task Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 1596b68 | feat(11-03): rewire profile page to call getPublicationsByAuthor (last-10-years) |
| 2 | 5103225 | feat(11-03): replace selectedPubs section with synced last-10-years list (no count subtitle) |
| 3 | 780e469 | chore(11-03): verify pnpm build + check-translations + test green after Phase 11 wave 2 |

## Deviations from Plan

None — plan executed exactly as written. A parallel 11-02 build process was briefly running when Task 3 attempted `pnpm build`, causing a one-retry wait of ~10 seconds. Not a code deviation; resolved automatically.

## Issues Encountered

None. TypeScript type check had a false-positive on first run (stale compilation state) — cleared on second run with exit 0.

## Next Phase Readiness

Phase 11 Wave 2 complete. Both 11-02 (`/publications` page with filter, staleness, footnote) and 11-03 (per-member profile publications section) are shipped and build-green.

**Phase 11 is fully complete.** All three plans (11-01, 11-02, 11-03) have SUMMARY.md files and green builds. v1.1 Display Layer milestone is done pending DATA-09/10 data follow-up (13 members need `inspirehep_id` / `orcid_id` — not a code blocker).

---
*Phase: 11-display-layer*
*Completed: 2026-04-19*
