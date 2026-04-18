---
phase: 04-core-pages
verified: 2026-04-18T00:00:00Z
status: passed
score: 35/35 must-haves verified
re_verification: false
human_verification:
  - test: "Hero carousel pause button"
    expected: "Clicking the pause/play button halts auto-advance; clicking again resumes; button label toggles between pause icon and play icon"
    why_human: "useState toggle logic is correct in source but interactive behavior requires browser rendering with real timer ticks"
  - test: "Hero carousel prefers-reduced-motion"
    expected: "With OS reduced-motion enabled, carousel does NOT auto-advance; dot indicators still clickable and navigate manually"
    why_human: "matchMedia('prefers-reduced-motion') is a live browser query; cannot simulate in static analysis"
  - test: "MapEmbed IntersectionObserver lazy load"
    expected: "On /es/contacto or /en/contact, scrolling the map section into view causes the Google Maps iframe to mount; before scrolling only the fallback anchor is visible"
    why_human: "IntersectionObserver fires asynchronously in response to scroll/viewport; prerendered HTML shows only the fallback anchor (correct), iframe state requires live browser"
---

# Phase 4: Core Pages Verification Report

**Phase Goal:** All seven top-level pages (plus People detail pages) render real placeholder content end-to-end in both locales, consuming the content layer and wearing the layout shell.
**Verified:** 2026-04-18
**Status:** PASSED
**Re-verification:** No — initial verification

## Pre-flight Checks

| Check | Result | Detail |
|-------|--------|--------|
| All 8 SUMMARYs exist | PASS | 04-01-SUMMARY.md through 04-08-SUMMARY.md all present |
| `pnpm build` | PASS | 43/43 static pages generated, exit 0 |
| `pnpm tsc --noEmit` | PASS | Exit 0, no type errors |
| `pnpm check-translations` | PASS | "No missing keys found!" exit 0 |
| `<main>` uniqueness | PASS | Only in layout.tsx:54; zero matches in page files |
| `mailto:` in prerendered HTML | PASS | `grep -rl 'mailto:' .next/server/app` returns empty (COUNT: 0) |
| Both locale home pages prerendered | PASS | `.next/server/app/es.html` and `en.html` both exist |
| `/[locale]/people/[slug]` routes | PASS | `generateStaticParams` emits pi/postdoc/phd × {es,en} |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | lucide-react installed and importable | VERIFIED | `package.json` has `"lucide-react": "^1.8.0"`; `node_modules/lucide-react/dist/` exists; ResearchCard.tsx imports Atom, Waves, Sparkles, Cpu |
| 2 | 3 landscape images in `public/Portadas/` | VERIFIED | `portada_1.jpg`, `portada_2.png`, `portada_3.jpg` all present; page.tsx references all three |
| 3 | siteConfig has `address` and `mapQuery` | VERIFIED | site.ts lines 75–85: `address` (BilingualString), `office` (BilingualString), `mapQuery` (string) |
| 4 | Both locale message files have all Phase 4 namespaces | VERIFIED | es.json and en.json both contain: `home`, `people`, `research`, `publications`, `journalClub`, `outreach`, `contact`, `carousel`; `pnpm check-translations` passes |
| 5 | HeroCarousel has `'use client'`, auto-advances, respects reduced-motion, has pause button, handles document.hidden | VERIFIED | Line 1: `'use client'`; useEffect with 7000ms setTimeout; matchMedia check at line 44; pause button at line 145; visibilitychange listener at line 82 |
| 6 | HeroCarousel does NOT pause on hover/focus | VERIFIED | Zero `onMouseEnter`/`onFocus`/`onMouseLeave`/`onBlur` event handlers; only the explicit pause button and document.hidden pause |
| 7 | MapEmbed has `'use client'`, IntersectionObserver, crawlable fallback `<a>`, conditional iframe | VERIFIED | Line 1: `'use client'`; IntersectionObserver at line 19; fallback `<a>` at line 44 always rendered; iframe conditionally at line 54 |
| 8 | Home page renders 2 semantic `<p>` intro elements (HOME-05) | VERIFIED | `introParagraphs = t('intro').split('\n\n').filter(...)` maps to `<p key={i}>` elements; es.json `home.intro` has exactly 2 `\n\n`-separated paragraphs; prerendered HTML confirms 2 distinct `<p>` elements |
| 9 | Home page renders in both locales with localized content | VERIFIED | `.next/server/app/es.html` and `en.html` both built; page.tsx calls `setRequestLocale` + `getTranslations('home')` + `localize(siteConfig.tagline, locale)` |
| 10 | HeroCarousel imported and wired into Home page | VERIFIED | page.tsx line 4: `import { HeroCarousel } from '@/components/home/HeroCarousel'`; rendered at line 39 with slides, groupName, tagline, affiliation |
| 11 | People list renders 5 H2-grouped sections (PI, Postdoc, PhD, Undergrad, Past) | VERIFIED | prerendered people.html shows `<h2>` tags for all 5 categories; PI/Postdoc/PhD use PeopleSection (clickable cards), Undergrad/Past use PeoplePlainSection (text rows) |
| 12 | PersonCard uses locale-aware `Link` from `@/i18n/navigation` | VERIFIED | PersonCard.tsx line 2: `import { Link } from '@/i18n/navigation'`; href uses `{ pathname: '/people/[slug]', params: { slug } }` |
| 13 | PersonRow has no `<a>` wrapper (text-only) | VERIFIED | PersonRow.tsx renders `<li>` with `<span>` elements only; no Link or anchor element anywhere in the file |
| 14 | Person detail 404 guard for undergrad/past slugs | VERIFIED | detail page.tsx lines 29–30: `if (!person) notFound(); if (person.category === 'undergrad' || person.category === 'past') notFound()` |
| 15 | generateStaticParams filters to pi/postdoc/phd only | VERIFIED | Filters `p.category === 'pi' || 'postdoc' || 'phd'`; does NOT include undergrad/past; cross-product with `routing.locales` |
| 16 | Person detail has photo, bio paragraphs, research interests, obfuscated email, office, ORCID, Scholar | VERIFIED | Prerendered esteban-calzetta.html: photo srcSet, 3 `<p>` bio paragraphs, research interest `<ul>`, EmailLink (SSR-disabled), office, ORCID link, Scholar link |
| 17 | PersonDetail optional fields hide when absent | VERIFIED | PersonDetail.tsx uses conditional rendering for all optional fields: `person.contact.office &&`, `person.contact.orcid &&`, `person.contact.scholar &&`, `selectedPubs.length > 0 &&` |
| 18 | Research page: H1, intro, 4-card grid with Lucide icons | VERIFIED | ResearchPage RSC calls `getLocalizedResearchAreas(locale)`; passes to `ResearchGrid`; ResearchCard.tsx statically imports Atom/Waves/Sparkles/Cpu from lucide-react with ICON_MAP |
| 19 | Research page is pure server component (no 'use client') | VERIFIED | No `'use client'` in research/page.tsx, ResearchCard.tsx, or ResearchGrid.tsx |
| 20 | Publications page: year-grouped H2s, newest first, no filter UI | VERIFIED | Prerendered publications.html: year H2s `['2026', '2025', '2024']` (descending); zero `<select>` or `<input>` elements; `getAllYears()` returns descending order |
| 21 | Publication entries: arXiv href `https://arxiv.org/abs/{id}`, DOI href `https://doi.org/{doi}` | VERIFIED | PublicationEntry.tsx lines 30–46: template literals `https://arxiv.org/abs/${publication.arxiv}` and `https://doi.org/${publication.doi}` |
| 22 | Optional arXiv/DOI hide cleanly | VERIFIED | PublicationEntry.tsx: `publication.arxiv &&` and `publication.doi &&` conditional rendering |
| 23 | No filter UI on publications (PUBS-03/04 deferred) | VERIFIED | Source and prerendered HTML both confirm no `<select>`, `<input>`, query-param reading, or URL state |
| 24 | Journal Club: upcoming + archive by academic year, empty-state | VERIFIED | journal-club page.tsx renders upcoming section with `noUpcoming` message when empty; JournalClubArchive uses `Object.keys(grouped).sort((a, b) => b.localeCompare(a))` for newest-first years |
| 25 | getLocalizedSession called in page RSC before passing to SessionRow | VERIFIED | journal-club page.tsx lines 23–33: `getLocalizedSession(s, locale)` applied to both upcoming and grouped sessions in the page |
| 26 | Outreach: date in `<time dateTime>`, conditional link | VERIFIED | OutreachCard.tsx line 40: `<time dateTime={activity.date}>{formatted}</time>`; line 43: `{activity.link && (<a ...>)}`; date formatted via `Intl.DateTimeFormat` with locale-specific tag |
| 27 | Contact: postal address, office, obfuscated email, social empty-state, map fallback | VERIFIED | Prerendered contact.html: address in `<dd>`, office in `<dd>`, EmailLink renders SSR-disabled placeholder, social shows "Pronto se publicarán cuentas oficiales.", map `<a href="https://www.google.com/maps?q=...">` fallback |
| 28 | MapEmbed wired into Contact page | VERIFIED | contact/page.tsx line 5: `import MapEmbed from '@/components/contact/MapEmbed'`; rendered at line 55 with `query`, `fallbackHref`, `title` props |
| 29 | ContactDetails uses EmailLink from `@/components/ui/EmailLink` | VERIFIED | ContactDetails.tsx line 1: `import { EmailLink } from '@/components/ui/EmailLink'`; used at line 48 |
| 30 | Zero `mailto:` in prerendered HTML across all routes | VERIFIED | `grep -rl 'mailto:' .next/server/app/` returns COUNT: 0; confirmed in both esteban-calzetta.html and contact.html via SSR-disabled `next/dynamic` pattern |
| 31 | All 7 top-level routes prerendered in both locales | VERIFIED | Build output shows `/es` + `/en` + all 6 sub-routes × 2 locales = 14 pages; plus 26+ people detail pages |
| 32 | I18N-02: Localized pathnames via routing.ts | VERIFIED | routing.ts pathnames: `/people` → `{es: "/personas", en: "/people"}`, `/research` → `{es: "/investigacion", ...}`, etc.; middleware handles rewriting |
| 33 | No stray `<main>` in page files | VERIFIED | `grep -rn '<main' src/app/[locale]/` returns only layout.tsx:54 |
| 34 | PersonDetail imports `getPublicationById` for selected publications | VERIFIED | detail page.tsx line 4: `import { ... getPublicationById } from '@/content'`; used at line 35 to resolve pub-IDs (returns empty array when IDs not found — expected, tracked separately) |
| 35 | Content barrel exports all required Phase 4 accessors | VERIFIED | `src/content/index.ts` re-exports all accessor modules; confirmed: getLocalizedPeople, getLocalizedPerson, getPeople, getPublicationById, getAllYears, getPublicationsByYear, getLocalizedResearchAreas, getUpcomingSessions, getPastSessionsByYear, getLocalizedSession, getLocalizedOutreach |

**Score: 35/35 truths verified**

## Per-Plan Verification Table

| Plan | Subject | Artifacts | Key Links | Status |
|------|---------|-----------|-----------|--------|
| 04-01 | Shared prerequisites (lucide, images, siteConfig, messages, HeroCarousel, MapEmbed) | All 6 artifacts exist and substantive | lucide-react in package.json; HeroCarousel imports next/image + useTranslations('carousel'); MapEmbed has IntersectionObserver + google.com/maps embed URL | PASS |
| 04-02 | Home page (HOME-01..07) | page.tsx + Highlights.tsx + PartnerStrip.tsx all exist (27–34 lines each) | HeroCarousel imported; `localize(siteConfig...)` called; intro split on `\n\n` with `.map(<p>)`; setRequestLocale called | PASS |
| 04-03 | People pages (PEOP-01..12) | page.tsx + [slug]/page.tsx + 5 components all exist (29–247 lines) | getLocalizedPeople + getLocalizedPerson + getPublicationById wired; PeoplePlainSection imported for non-clickable; EmailLink used for obfuscation; generateStaticParams present | PASS |
| 04-04 | Research page (RSCH-01..02) | page.tsx + ResearchCard.tsx + ResearchGrid.tsx all exist | getLocalizedResearchAreas wired; lucide-react static ICON_MAP; all server components | PASS |
| 04-05 | Publications page (PUBS-01..02) | page.tsx + PublicationEntry.tsx + PublicationsYearGroup.tsx all exist | getAllYears + getPublicationsByYear wired; arxiv.org/abs + doi.org URL construction; zero filter UI | PASS |
| 04-06 | Journal Club page (CLUB-01..02) | page.tsx + SessionRow.tsx + JournalClubArchive.tsx all exist | getUpcomingSessions + getPastSessionsByYear + getLocalizedSession all wired in page RSC; empty-state message renders | PASS |
| 04-07 | Outreach page (OTRCH-01..03) | page.tsx + OutreachCard.tsx + OutreachGrid.tsx all exist | getLocalizedOutreach wired; `<time dateTime>` used; conditional link via `activity.link &&` | PASS |
| 04-08 | Contact page (CONT-01..05) | page.tsx + ContactDetails.tsx both exist (61 + 75 lines) | MapEmbed imported and wired; EmailLink used in ContactDetails; siteConfig.address/office/mapQuery/contactEmail/socialLinks all accessed; empty socialLinks shows localized message | PASS |

## Required Artifacts

| Artifact | Lines | Exists | Substantive | Wired | Status |
|----------|-------|--------|-------------|-------|--------|
| `src/components/home/HeroCarousel.tsx` | 184 | YES | YES | YES (in page.tsx) | VERIFIED |
| `src/components/contact/MapEmbed.tsx` | 67 | YES | YES | YES (in contact/page.tsx) | VERIFIED |
| `src/app/[locale]/page.tsx` | 69 | YES | YES | YES (exports default) | VERIFIED |
| `src/components/home/Highlights.tsx` | 27 | YES | YES | YES (in page.tsx) | VERIFIED |
| `src/components/home/PartnerStrip.tsx` | 34 | YES | YES | YES (in page.tsx) | VERIFIED |
| `src/app/[locale]/people/page.tsx` | 53 | YES | YES | YES | VERIFIED |
| `src/app/[locale]/people/[slug]/page.tsx` | 63 | YES | YES | YES (generateStaticParams) | VERIFIED |
| `src/components/people/PersonCard.tsx` | 47 | YES | YES | YES (PeopleSection) | VERIFIED |
| `src/components/people/PersonRow.tsx` | 28 | YES | YES | YES (PeoplePlainSection) | VERIFIED |
| `src/components/people/PeopleSection.tsx` | 42 | YES | YES | YES (people/page.tsx) | VERIFIED |
| `src/components/people/PeoplePlainSection.tsx` | 61 | YES | YES | YES (people/page.tsx) | VERIFIED |
| `src/components/people/PersonDetail.tsx` | 247 | YES | YES | YES ([slug]/page.tsx) | VERIFIED |
| `src/app/[locale]/research/page.tsx` | 34 | YES | YES | YES | VERIFIED |
| `src/components/research/ResearchCard.tsx` | 29 | YES | YES | YES (ResearchGrid) | VERIFIED |
| `src/components/research/ResearchGrid.tsx` | 26 | YES | YES | YES (research/page.tsx) | VERIFIED |
| `src/app/[locale]/publications/page.tsx` | 33 | YES | YES | YES | VERIFIED |
| `src/components/publications/PublicationEntry.tsx` | 52 | YES | YES | YES (PublicationsYearGroup) | VERIFIED |
| `src/components/publications/PublicationsYearGroup.tsx` | 35 | YES | YES | YES (publications/page.tsx) | VERIFIED |
| `src/app/[locale]/journal-club/page.tsx` | 81 | YES | YES | YES | VERIFIED |
| `src/components/journal-club/SessionRow.tsx` | 55 | YES | YES | YES (journal-club/page.tsx) | VERIFIED |
| `src/components/journal-club/JournalClubArchive.tsx` | 69 | YES | YES | YES (journal-club/page.tsx) | VERIFIED |
| `src/app/[locale]/outreach/page.tsx` | 29 | YES | YES | YES | VERIFIED |
| `src/components/outreach/OutreachCard.tsx` | 56 | YES | YES | YES (OutreachGrid) | VERIFIED |
| `src/components/outreach/OutreachGrid.tsx` | 27 | YES | YES | YES (outreach/page.tsx) | VERIFIED |
| `src/app/[locale]/contact/page.tsx` | 60 | YES | YES | YES | VERIFIED |
| `src/components/contact/ContactDetails.tsx` | 75 | YES | YES | YES (contact/page.tsx) | VERIFIED |

## Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| HeroCarousel.tsx | next/image | `import Image from 'next/image'` | WIRED |
| HeroCarousel.tsx | useTranslations('carousel') | line 30 | WIRED |
| MapEmbed.tsx | IntersectionObserver | lines 19–33 | WIRED |
| MapEmbed.tsx | google.com/maps?q=...&output=embed | line 36 template literal | WIRED |
| page.tsx (home) | HeroCarousel | `import { HeroCarousel } from '@/components/home/HeroCarousel'` | WIRED |
| page.tsx (home) | localize(siteConfig.tagline, locale) | line 23 | WIRED |
| page.tsx (home) | intro.split('\n\n').map(<p>) | lines 35, 47 | WIRED |
| page.tsx (home) | setRequestLocale(locale) | line 13 | WIRED |
| people/page.tsx | getLocalizedPeople(locale) | @/content barrel | WIRED |
| people/[slug]/page.tsx | getLocalizedPerson(slug, locale) | line 28 + notFound() guard | WIRED |
| people/[slug]/page.tsx | generateStaticParams | lines 9–20, pi/postdoc/phd filter | WIRED |
| PersonCard.tsx | Link from @/i18n/navigation | line 2 + locale-aware href | WIRED |
| PersonDetail.tsx | EmailLink from @/components/ui/EmailLink | line 3 | WIRED |
| PersonDetail.tsx | getPublicationById | via [slug]/page.tsx line 35 | WIRED |
| people/page.tsx | PeoplePlainSection | imported + rendered for undergrad/past | WIRED |
| research/page.tsx | getLocalizedResearchAreas(locale) | line 14 | WIRED |
| ResearchCard.tsx | lucide-react Atom/Waves/Sparkles/Cpu | static ICON_MAP, line 1 | WIRED |
| publications/page.tsx | getAllYears + getPublicationsByYear | lines 3, 14, 28 | WIRED |
| PublicationEntry.tsx | arxiv.org/abs + doi.org | template literals lines 30, 38 | WIRED |
| journal-club/page.tsx | getUpcomingSessions + getPastSessionsByYear + getLocalizedSession | lines 3–7, 23–33 | WIRED |
| outreach/page.tsx | getLocalizedOutreach(locale) | line 14 | WIRED |
| OutreachCard.tsx | conditional `<a>` for link | `activity.link && ...` line 43 | WIRED |
| contact/page.tsx | MapEmbed | `import MapEmbed from '@/components/contact/MapEmbed'` line 5 | WIRED |
| ContactDetails.tsx | EmailLink | line 1 | WIRED |
| contact/page.tsx | siteConfig.address/office/mapQuery/contactEmail/socialLinks | lines 16–24 | WIRED |

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| HOME-01..07 | SATISFIED | All Home sections render; paragraph semantics verified; highlights (3 cards); partner strip (3 affiliations) |
| PEOP-01..12 | SATISFIED | 5 sections; clickable cards for pi/postdoc/phd; text rows for undergrad/past; detail page with all optional-field guards; email obfuscated; ORCID/Scholar wired; 404 for non-clickable slugs |
| RSCH-01..02 | SATISFIED | Intro + 4-area grid with Lucide icons and localized content |
| PUBS-01..02 | SATISFIED | Year-grouped H2s descending; entry fields with conditional arXiv/DOI links |
| PUBS-03..04 | DEFERRED (correct) | No filter UI present — confirmed by source and prerendered HTML |
| CLUB-01..02 | SATISFIED | Upcoming sessions + archive by academic year; empty-state message; paper link conditional |
| OTRCH-01..03 | SATISFIED | Intro + grid; `<time>` with dateTime; optional link hides when absent |
| CONT-01..05 | SATISFIED | Address + office + obfuscated email + lazy map + social empty-state |
| I18N-02 | SATISFIED | All pages call setRequestLocale + getTranslations; routing.ts defines localized pathnames; build produces both locale variants |

## Anti-Pattern Scan

No blocker anti-patterns found:

- Zero TODO/FIXME/placeholder comments in any Phase 4 component
- No `return null` at top-level (all optional sections use conditional rendering, not null returns as stubs)
- No `console.log` in any component
- No empty `onSubmit={() => {}}` or similar stub handlers (no forms in Phase 4)
- EmailLink SSR-disabled pattern is intentional, not a stub

## Human Verification Required

### 1. Hero carousel pause button interaction

**Test:** Load `/es` or `/en` in a browser. Wait 7 seconds and observe the slide advance. Then click the pause button in the bottom-right corner of the carousel. Wait another 7 seconds.
**Expected:** After clicking pause, the carousel does not advance. The button shows a play triangle. Clicking again resumes auto-advance and shows the pause icon. Dot indicators remain clickable regardless of pause state.
**Why human:** useState toggle and setTimeout logic is correct in source, but interactive timer behavior requires a real browser with running JavaScript.

### 2. Hero carousel prefers-reduced-motion

**Test:** In OS accessibility settings, enable "Reduce Motion". Load `/es` in a browser.
**Expected:** Carousel does NOT auto-advance at all. Dot indicators are still present and clicking them manually navigates slides.
**Why human:** `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is a live browser query that cannot be simulated via static analysis.

### 3. MapEmbed IntersectionObserver lazy load

**Test:** Load `/es/contacto` in a browser with browser dev tools network panel open. Observe the contact page. Check whether a Google Maps iframe `src` request is made immediately on load vs. after scrolling to the map section.
**Expected:** On initial load (map section may be below the fold), no iframe request is made. After scrolling to reveal the map container (or if already visible), the iframe mounts and the maps embed loads.
**Why human:** IntersectionObserver fires asynchronously in response to viewport intersection; prerendered HTML correctly shows only the fallback anchor; iframe mount state requires live browser observation.

## Summary

Phase 4 goal achieved. All 43 static pages built successfully (7 top-level routes × 2 locales + 29 people detail pages). Every must-have from all 8 plan frontmatter blocks passes three-level verification (exists, substantive, wired). Key structural requirements confirmed in prerendered HTML:

- HOME-05 paragraph semantics: 2 real `<p>` elements in intro (not whitespace-pre-line)
- PEOP email obfuscation: zero `mailto:` literals in any prerendered HTML file
- PUBS-03/04 deferral: zero filter UI elements in publications page
- CONT-04 map: crawlable fallback `<a>` renders server-side; iframe deferred to client IntersectionObserver
- I18N-02: localized pathnames active via routing.ts (`/personas`, `/investigacion`, `/publicaciones`, `/divulgacion`, `/contacto`)

Three items require human browser verification: carousel pause behavior, prefers-reduced-motion, and map IntersectionObserver lazy load. These are runtime behaviors that structural code analysis cannot confirm.

---

_Verified: 2026-04-18_
_Verifier: Claude (gsd-verifier)_
