# Cosmology Group Website (UBA / FCEN)

## What This Is

A bilingual (Spanish primary, English toggle) institutional website for the Cosmology Group at the Facultad de Ciencias Exactas y Naturales, Universidad de Buenos Aires. It showcases the group's members, research areas, publications, and outreach activities to academic peers, prospective students, funders, and the general public.

## Core Value

A credible, professional academic presence that makes it easy for visitors to find who's in the group, what they work on, and what they've published — with group members able to update content (people, publications) without touching code.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

**Structure & Pages**
- [ ] Bilingual site (Spanish default, English toggle in navbar)
- [ ] Home page with rotating hero carousel (fade, 6–8s), intro copy, highlights (3 cards), partner logo strip
- [ ] People page with sectioned roster: PIs (5), Postdocs (2), PhDs (6), Undergrads, Past Members
- [ ] Individual detail pages at `/people/[slug]` for PIs, Postdocs, PhDs only
- [ ] Research page with intro + grid of research areas (Dark Matter, Gravitational Waves, Early Universe, Artificial Intelligence)
- [ ] Publications page grouped by year with filter/search by year, author, topic
- [ ] Journal Club page with upcoming sessions + past sessions archive (speaker, date, title, paper link)
- [ ] Outreach page with grid of activities (talks, workshops, school visits, articles)
- [ ] Contact page with postal address, office location, email, embedded Google Map, social links
- [ ] Top-level nav: Home, People, Research, Publications, Journal Club, Outreach, Contact

**Data & Content Architecture**
- [ ] Structured content files: `content/people.json`, `content/publications.json`, `content/research.json`, `content/journal-club.json`, `content/outreach.json`
- [ ] Person shape: slug, name, role, category (PI/postdoc/phd/undergrad/past), photo, short_bio, full_bio, research_interests, publications_selected, contact, social_links
- [ ] Publication shape: id, authors, title, journal, year, arxiv, doi, topic_tags
- [ ] Group-wide config (site name, tagline, affiliations) in a single config file — easy to change placeholder group name later

**Design System & Polish**
- [ ] Typography-driven minimal academic aesthetic (reference: nature.com, Max Planck institutes)
- [ ] Restrained color palette — no gradients, no flashy animations
- [ ] Square photo placeholders (400×400) labeled "Photo of [Name]"
- [ ] Landscape hero placeholders (1920×800) labeled "Hero Image 1/2/3…"
- [ ] WCAG AA compliance
- [ ] Open Graph + Twitter card metadata
- [ ] Schema.org structured data (Organization, Person)
- [ ] Sitemap + robots.txt
- [ ] Next.js Image optimization, self-hosted fonts

**Deployment**
- [ ] Deployable to Vercel out of the box

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- **Auth / member login** — public institutional site, content edited via file commits
- **CMS backend** — JSON content files are simpler for academic maintainers; no CMS infra to host
- **Real publication import (ADS / arXiv / ORCID)** — v2 feature; placeholder data for now
- **Mobile app** — web-first, responsive web covers all audiences
- **Dark mode** — academic/institutional aesthetic is light-mode-first; dark mode adds polish cost without user demand
- **Animations beyond hero carousel fade** — "no flashy animations" is an explicit design constraint
- **Search beyond publications filter** — no general site search in v1
- **Commenting / discussion** — not the job of an institutional group site
- **Static-export hosting** — decided Vercel-only after research surfaced dual-build overhead; revisit only if hosting requirement changes
- **"Join the group" section** — prospective students contact via the general Contact page; no dedicated prospective-student block in v1

## Context

**Audience**
- Academic peers (international researchers, collaborators, reviewers)
- Prospective PhD and postdoc candidates evaluating the group
- Funders and institutional stakeholders (CONICET, UBA, grant agencies)
- Science journalists and the general public (outreach)

**Institutional affiliations likely to surface in logo strip / metadata**
- Universidad de Buenos Aires (UBA)
- Facultad de Ciencias Exactas y Naturales (FCEN)
- CONICET
- Additional partners TBD

**Content policy decisions**
- All names, bios, and photos use placeholders; user will populate `content/*.json` later
- All publications use realistic placeholder titles; arXiv/ADS importer deferred to v2
- Group name uses a placeholder ("Grupo de Cosmología UBA") stored in a single config file for one-line replacement

**Skills / prior work relied on**
- `skills/web-dev-general/SKILL.md` — methodology, stack defaults, quality gates
- `skills/design/ui-ux-pro-max/` — design system generation (run in Phase 1 Foundation)
- No existing domain skill for "academic research group" — extract one on completion

## Constraints

- **Tech stack**: Next.js 16 (App Router) + TypeScript strict + Tailwind v4 — per `web-dev-general` defaults (skill references Next.js 15 but current stable is 16.2.x as of 2026-04; version bump validated in research)
- **i18n**: next-intl with Spanish default, English toggle — affects routing structure from Phase 1
- **Content editability**: All people/publications/research/outreach content must live in structured data files (JSON/YAML), not hardcoded in components — non-technical group members must be able to edit
- **Design direction**: Minimal, typography-driven, restrained — no gradients, no AI-generic aesthetic, no flashy animations; references are nature.com / Max Planck institutes
- **Deployment**: Vercel (App Router features available; middleware OK; default Image loader OK) — static export explicitly out of scope
- **Performance**: Static generation where possible, Next.js Image for all photos, self-hosted fonts — Core Web Vitals per `web-dev-general` targets
- **Accessibility**: WCAG AA non-negotiable (academic audience expects this)
- **SEO**: Schema.org Organization + Person, OG/Twitter cards, sitemap, robots.txt — institutional credibility depends on being findable
- **Privacy**: GitHub repo private by default (per `CLAUDE.md`) until user explicitly opts to publish

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Placeholder content throughout | User will provide real names, bios, photos, publications after build; keeps build unblocked | — Pending |
| Group name in single config file | User uncertain on final branding ("Grupo de Cosmología UBA" placeholder); one-line swap later | — Pending |
| Vercel-only deployment | Research flagged dual-build overhead (CI matrix, middleware ban, custom image loader); simpler to commit and revisit only if hosting changes | ✓ Good |
| Journal Club as 7th nav page | Every peer cosmology site has a seminars/journal-club listing; near-table-stakes for credibility | — Pending |
| Keep auto-fade carousel (user preference) | Research flagged auto-rotate as anti-pattern but user chose to keep with ≥6s dwell + prefers-reduced-motion respected | — Pending |
| JSON/YAML content files over CMS | Academic maintainers edit infrequently; JSON is simpler than CMS infra | — Pending |
| Defer arXiv/ADS publication importer to v2 | Significant scope; placeholder data is enough to validate the page layout now | — Pending |
| next-intl for i18n | Standard for Next.js App Router + Spanish default requirement | — Pending |
| Extract `domains/research-group/SKILL.md` on completion | Pattern (people + publications + research areas + outreach) is reusable for other academic clients | — Pending |

---
*Last updated: 2026-04-17 after initialization*
