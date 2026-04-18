---
phase: 04-core-pages
plan: 03
subsystem: ui
tags: [next-intl, next-image, generateStaticParams, server-components, people, i18n, routing, EmailLink]

# Dependency graph
requires:
  - phase: 02-content-layer
    provides: getLocalizedPeople, getLocalizedPerson, getPeople, getPublicationById accessors; Person/People types; people.json content
  - phase: 03-layout-shell
    provides: EmailLink two-file obfuscation pattern; layout owns single <main>; Link from @/i18n/navigation pattern
  - phase: 04-01
    provides: people.* i18n namespace keys in both locales; lucide-react installed
provides:
  - People list page /es/personas + /en/people with 5 H2-grouped sections
  - PersonCard component (clickable, photo/initials, i18n-aware Link)
  - PersonRow component (text-only li, no anchor, YYYY–YYYY past-member format)
  - PeopleSection component (H2 + 3-up/2-up/1-up card grid)
  - PeoplePlainSection component (H2 + ul rows, max-w-4xl for visual divergence)
  - PersonDetail component (~200 LOC, two-column header, bio paragraphs, interests, pubs, obfuscated email)
  - Person detail page /[locale]/people/[slug] with generateStaticParams (26 static routes: 13 clickable × 2 locales)
affects:
  - 05-seo (people routes need og:image, person schema JSON-LD)
  - 06-polish (PersonCard hover animation, PersonDetail reading flow)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - LocalizedPerson inline type alias in component files (avoids importing inferred return type across module boundaries)
    - Double notFound guard in detail page (unknown slug + undergrad/past slug both → 404)
    - publications_selected filter with .filter(p => p !== undefined) type predicate (silently drops stale IDs)
    - En-dash year range using Unicode escapes (\u2013, \u2014) to avoid smart-quote encoding issues

key-files:
  created:
    - src/components/people/PersonCard.tsx
    - src/components/people/PersonRow.tsx
    - src/components/people/PeopleSection.tsx
    - src/components/people/PeoplePlainSection.tsx
    - src/components/people/PersonDetail.tsx
    - src/app/[locale]/people/page.tsx
    - src/app/[locale]/people/[slug]/page.tsx
  modified: []

key-decisions:
  - "LocalizedPerson typed inline in each component — getLocalizedPeople returns an inferred anonymous type; importing it would require exposing internals or using ReturnType<> generics that add cognitive overhead"
  - "PersonDetail splits hasContactInfo condition and social_links condition — outer section renders if either is true; dl renders only if hasContactInfo; prevents dl-with-no-dt edge case"
  - "All 13 publications_selected IDs are stale placeholder IDs (pub-2024-* format) not matching actual publications.json IDs (2024-* format); selectedPubs always empty; no publications section renders on any person detail page — silently correct per plan spec"

patterns-established:
  - "Card vs row visual divergence: clickable = PersonCard (photo + accent underline hover + Link); non-clickable = PersonRow (<li> only, no anchor) — strongest possible divergence signal"
  - "Photo guard in both card and detail: if photo present, render <Image src={`/${photo}`}> with leading slash; else render initials div"

# Metrics
duration: ~25min
completed: 2026-04-18
---

# Phase 4 Plan 03: People Pages Summary

**Bilingual people list (5 H2-grouped sections: cards for pi/postdoc/phd, text rows for undergrad/past) and person detail pages (26 static routes via generateStaticParams) with obfuscated email, optional-field guards, and defensive 404s for non-clickable slugs**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-18T~T~Z
- **Completed:** 2026-04-18
- **Tasks:** 3 / 3
- **Files modified:** 7 created, 0 modified

## Accomplishments

- Delivered the highest-risk plan in Phase 4 (20 people, 5 categories, bilingual bios, optional fields) without blocking issues
- Strong visual divergence between card (pi/postdoc/phd) and row (undergrad/past) with zero code duplication — separate components with separate max-width containers
- 26 static routes pre-generated (13 clickable people × 2 locales); undergrad/past slugs return 404 at both generateStaticParams and runtime
- EmailLink obfuscation confirmed: no `mailto:` literal in prerendered HTML for either locale

## Static Params Generated

- **Clickable people:** 13 (5 PI + 2 postdoc + 6 PhD)
- **Locales:** 2 (es, en)
- **Total static routes:** 26
- **Excluded from generateStaticParams:** 3 undergrad + 4 past = 7 people

## Publications Selected Cross-Reference

All 12 `publications_selected` IDs in people.json reference stale placeholder IDs (format: `pub-2024-*`) that do not exist in publications.json (format: `2024-*`). The `.filter(p => p !== undefined)` type predicate silently drops them all. No publications section renders on any detail page. This is expected behavior — IDs need to be updated in people.json when publications.json is updated with real data.

**People with stale publication references:** esteban-calzetta, susana-landau, maria-guadalupe-gonzalez-rios, diana-lopez-nacir, gonzalo-sanchez-contreras, matias-luna, juanma-arias (all PI and postdoc entries).

## Task Commits

1. **Task 1: Build PersonCard, PersonRow, PeopleSection, PeoplePlainSection** — `dfd295c` (feat)
2. **Task 2: Build People list page** — `3629ba5` (feat)
3. **Task 3: Build PersonDetail component + [slug] page** — `0eac7e6` (feat)

**Plan metadata:** _(this summary commit)_

## Files Created

- `src/components/people/PersonCard.tsx` — Clickable square-photo card with i18n Link, initials fallback, accent underline on hover
- `src/components/people/PersonRow.tsx` — Text-only `<li>` for undergrad/past; no anchor; YYYY–YYYY year range with Unicode en-dash
- `src/components/people/PeopleSection.tsx` — H2 + 3-up/2-up/1-up grid consuming PersonCard; max-w-6xl
- `src/components/people/PeoplePlainSection.tsx` — H2 + `<ul>` consuming PersonRow; max-w-4xl (narrower for visual divergence)
- `src/components/people/PersonDetail.tsx` — Full two-column detail layout; photo/initials, bio paragraphs, research interests, optional publications, obfuscated EmailLink, optional office/ORCID/Scholar, social links
- `src/app/[locale]/people/page.tsx` — RSC list page; filters by category; renders PeopleSection or PeoplePlainSection per category
- `src/app/[locale]/people/[slug]/page.tsx` — RSC detail page; generateStaticParams (pi+postdoc+phd × both locales); double notFound guard

## Decisions Made

- **LocalizedPerson typed inline in each component:** The return type of `getLocalizedPeople()` is an inferred anonymous type. Inline interface is more readable than `ReturnType<typeof getLocalizedPeople>[number]` and avoids creating a new export in the content layer just for this.
- **PersonDetail hasContactInfo variable:** Computed before JSX to check if the contact section should render. The plan's inline IIFE for the email field was preserved as-is; the section guard was extracted to a named boolean for readability.
- **stale publications_selected IDs:** Documented in output section as required by the plan. No code change needed — filter handles it correctly.

## Deviations from Plan

None — plan executed exactly as written. All component specs, DOM structure, and guardrails were followed precisely.

## Issues Encountered

**Dev server 404 on first launch:** Initial dev server launch returned 404 for `/es/personas`. Root cause was a stale server process from a previous session; after killing the old process and restarting, the pages rendered correctly. Not a code issue.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All PEOP-01..12 requirements met
- I18N-02 (bilingual people surfaces) and I18N-04 (slug-path locale toggle) both observable in dev
- People list and detail pages ready for Phase 5 SEO (og:image per person, Person schema JSON-LD)
- **Action needed before public launch:** Update `publications_selected` IDs in `content/people.json` to match actual IDs in `content/publications.json` (current IDs use stale `pub-YYYY-*` format; actual IDs use `YYYY-*` format)

---
*Phase: 04-core-pages*
*Completed: 2026-04-18*
