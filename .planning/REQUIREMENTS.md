# Requirements: Cosmology Group Website (UBA / FCEN)

**Defined:** 2026-04-17
**Core Value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Project scaffolded with Next.js 16 App Router + TypeScript strict + Tailwind v4 — dev server runs, types compile with zero errors
- [ ] **FOUND-02**: Design system generated via `ui-ux-pro-max` and persisted to `design-system/MASTER.md`
- [ ] **FOUND-03**: OKLCH design tokens defined as CSS custom properties and mapped to the Tailwind v4 theme
- [ ] **FOUND-04**: Self-hosted fonts via `next/font` with Latin + Latin-Extended subsets (no FOUT/FOIT)

### Navigation & Layout

- [ ] **NAV-01**: Top navigation shows 7 links (Home, People, Research, Publications, Journal Club, Outreach, Contact) with an active-state indicator for the current page
- [ ] **NAV-02**: Language toggle in the navbar switches between Spanish (default) and English and preserves the current route
- [ ] **NAV-03**: Footer shows group name, affiliations (UBA, FCEN, CONICET), general contact email, and social links
- [ ] **NAV-04**: Layout is responsive — mobile viewport does not overflow horizontally; the top navigation collapses to a mobile menu under the breakpoint
- [ ] **NAV-05**: A "skip to content" link is visible on keyboard focus

### Home

- [ ] **HOME-01**: Hero section displays a rotating cover-photo carousel with 3–5 landscape placeholder images (1920×800, labeled "Hero Image 1", "Hero Image 2", …)
- [ ] **HOME-02**: Hero carousel auto-advances with fade transitions every 6–8 seconds
- [ ] **HOME-03**: Hero carousel respects `prefers-reduced-motion` (no auto-rotation when set) and pauses on hover/focus; a visible pause button is available
- [ ] **HOME-04**: Hero overlay displays the group name, short tagline, and affiliation with WCAG-AA contrast against every carousel image
- [ ] **HOME-05**: Intro section below the hero shows 2–3 paragraphs about the group's mission and research focus
- [ ] **HOME-06**: Highlights section shows 3 cards of recent publications, news, or featured research
- [ ] **HOME-07**: Logo strip displays institutional affiliations (UBA, FCEN, CONICET, and any partner institutions)

### People

- [ ] **PEOP-01**: People page shows a Principal Investigators section as a grid of 5 square cards (photo, name, title/role, 2–3 line research-interest summary)
- [ ] **PEOP-02**: People page shows a Postdocs section (2 cards) using the same card format
- [ ] **PEOP-03**: People page shows a PhD Students section (6 cards) using the same card format
- [ ] **PEOP-04**: People page shows an Undergraduates section with simpler cards (photo, name, thesis topic) — not clickable
- [ ] **PEOP-05**: People page shows Past Members as a simple list (name, role, years, current position) — no photos, optionally grouped by role
- [ ] **PEOP-06**: PI, Postdoc, and PhD cards are fully clickable and link to individual pages at `/people/[slug]`
- [ ] **PEOP-07**: Individual person page shows a large photo, full name, title, and affiliation
- [ ] **PEOP-08**: Individual person page shows a 2–4 paragraph biography
- [ ] **PEOP-09**: Individual person page shows research interests as a bullet list
- [ ] **PEOP-10**: Individual person page shows a selected-publications list
- [ ] **PEOP-11**: Individual person page shows contact info: email (obfuscated), office, ORCID, Google Scholar
- [ ] **PEOP-12**: Individual person page shows optional links (personal website, CV, social) when provided; sections hide cleanly when empty

### Research

- [ ] **RSCH-01**: Research page shows an intro paragraph about the group's research scope
- [ ] **RSCH-02**: Research page shows a grid of research areas — Dark Matter, Gravitational Waves, Early Universe, Artificial Intelligence — each with an icon or image, title, and short description

### Publications

- [ ] **PUBS-01**: Publications page lists entries grouped by year, most recent first
- [ ] **PUBS-02**: Each publication entry shows authors, title, journal, year, arXiv link, and DOI link
- [ ] **PUBS-03**: Publications page provides filter controls for year, author, and topic
- [ ] **PUBS-04**: Filter state is reflected in URL query params so a filtered view is shareable and the browser back button works

### Journal Club

- [ ] **CLUB-01**: Journal Club page shows upcoming sessions with date, speaker, affiliation, title, and paper link
- [ ] **CLUB-02**: Journal Club page shows a past-sessions archive grouped by academic year

### Outreach

- [ ] **OTRCH-01**: Outreach page shows an intro paragraph about the group's science-communication commitment
- [ ] **OTRCH-02**: Outreach page shows a grid of activities (talks, workshops, school visits, popular articles) with image, title, date, and brief description
- [ ] **OTRCH-03**: Outreach entries optionally link to videos, slides, or articles; links hide cleanly when not provided

### Contact

- [ ] **CONT-01**: Contact page shows the group's postal address at FCEN
- [ ] **CONT-02**: Contact page shows the office location within Pabellón I/II
- [ ] **CONT-03**: Contact page shows a general contact email, obfuscated against basic scrapers
- [ ] **CONT-04**: Contact page shows an embedded Google Map of the location, lazy-loaded below the fold with no LCP impact
- [ ] **CONT-05**: Contact page shows social-media links (Twitter/X, YouTube, and any provided in config)

### Content Architecture

- [ ] **DATA-01**: People content lives in `content/people.json` with a Zod-validated schema (slug, name, role, category, photo, short_bio, full_bio, research_interests, publications_selected, contact, social_links)
- [ ] **DATA-02**: Publications content lives in `content/publications.json` with a Zod-validated schema (id, authors, title, journal, year, arxiv, doi, topic_tags)
- [ ] **DATA-03**: Research areas live in `content/research.json` with a Zod-validated schema (id, title, short_description, full_description, icon)
- [ ] **DATA-04**: Journal Club sessions live in `content/journal-club.json` with a Zod-validated schema (id, date, speaker, affiliation, title, paper_link, status)
- [ ] **DATA-05**: Outreach activities live in `content/outreach.json` with a Zod-validated schema (id, date, title, description, image, type, link)
- [ ] **DATA-06**: Group-wide config (site name, tagline, affiliations, contact email, social links) lives in a single `src/config/site.ts` file — one-line change renames the site everywhere
- [ ] **DATA-07**: Build fails with a clear error message when any `content/*.json` violates its schema or references a non-existent photo file
- [ ] **DATA-08**: JSON Schema files are generated from Zod schemas and placed next to content files so editors (VS Code) get IntelliSense + inline validation

### Bilingual

- [ ] **I18N-01**: All UI chrome (navigation, buttons, labels, form placeholders) is translated to Spanish (default) and English via `next-intl`
- [ ] **I18N-02**: All page-level copy (Home intro, Research descriptions, Outreach intro, etc.) is available in both languages
- [ ] **I18N-03**: Per-entity content (person bios, research area descriptions, outreach descriptions) supports bilingual fields in the content files
- [ ] **I18N-04**: Language toggle preserves the current route and deep links (`/en/people/[slug]` ↔ `/es/people/[slug]`)
- [ ] **I18N-05**: `<html lang>` attribute matches the active locale on every page
- [ ] **I18N-06**: Missing translation keys log a warning in development; in production the key falls back to a safe default and does not crash the page
- [ ] **I18N-07**: CI fails if a key exists in one locale's messages but not the other (no silent untranslated UI)

### SEO & Metadata

- [ ] **SEO-01**: Every page generates Open Graph and Twitter-card metadata (title, description, image)
- [ ] **SEO-02**: Every page declares a canonical URL and `hreflang` alternates for both locales plus `x-default`
- [ ] **SEO-03**: Organization Schema.org JSON-LD is present in the root layout with group name, affiliations, and URL
- [ ] **SEO-04**: Person Schema.org JSON-LD is present on each `/people/[slug]` page
- [ ] **SEO-05**: `sitemap.xml` includes all static routes with both-locale alternates and `x-default`
- [ ] **SEO-06**: `robots.txt` is present at the root

### Accessibility

- [ ] **A11Y-01**: All pages pass axe-core automated checks with zero critical violations
- [ ] **A11Y-02**: Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI components) — including hero overlay text across every carousel image
- [ ] **A11Y-03**: All interactive elements are keyboard-operable with visible focus indicators
- [ ] **A11Y-04**: Hero carousel controls (pause, prev/next) are keyboard-operable and announce state changes to screen readers
- [ ] **A11Y-05**: All images have meaningful alt text (or empty alt for decorative)

### Performance

- [ ] **PERF-01**: All pages are statically generated (SSG) at build time — no per-request work for content pages
- [ ] **PERF-02**: Images are served through `next/image` with explicit width/height to eliminate CLS
- [ ] **PERF-03**: Google Maps embed is lazy-loaded via `loading="lazy"` plus IntersectionObserver facade — no impact on Contact page LCP
- [ ] **PERF-04**: LCP < 2.5s on throttled 4G for Home, People, and Publications pages (Lighthouse mobile)
- [ ] **PERF-05**: Cumulative Layout Shift is 0 on all pages (fixed-height containers, font-display: swap with size-adjust)

## v2 Requirements

Deferred to future release. Tracked but not in the current roadmap.

### Publication Import

- **IMPR-01**: Import publications from arXiv API into `content/publications.json`
- **IMPR-02**: Import publications from NASA ADS API
- **IMPR-03**: Link each person to their ORCID record for automatic publication association

### Content Operations

- **OPS-01**: Weekly link-rot check (`lychee` GitHub Action) that flags broken external links (publications, ORCID, Scholar, personal sites)
- **OPS-02**: Maintainer-facing documentation (`README` in `content/`) explaining how to edit each JSON file safely

### Events Expansion

- **EVNT-01**: Dedicated Events page beyond Journal Club (hosted workshops, conference series, public lectures)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Authentication / member login | Public institutional site; content is edited via file commits |
| CMS backend | JSON content files + Zod are simpler for infrequent academic edits |
| Static-export hosting | Research showed dual-build CI overhead isn't justified; Vercel-only (revisit only if hosting requirement changes) |
| Dark mode | Academic/institutional aesthetic is light-mode-first; polish cost without audience demand |
| Animations beyond hero fade | Explicit design constraint — minimal, typography-driven academic aesthetic |
| General site search | Publications filter is the only search surface in v1 |
| Commenting / discussion | Not the role of an institutional group site |
| Dedicated "Join the group" section | Prospective students are directed to Contact; no separate block needed in v1 |
| Mobile app | Responsive web covers all audiences |
| Contact form | `mailto:` (obfuscated) is enough; a form adds rate-limit, consent, spam mitigation for marginal benefit |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated by roadmapper) | — | Pending |

**Coverage:**
- v1 requirements: 75 total
- Mapped to phases: 0 (roadmap not yet created)
- Unmapped: 75 ⚠️

---
*Requirements defined: 2026-04-17*
*Last updated: 2026-04-17 after initial definition*
