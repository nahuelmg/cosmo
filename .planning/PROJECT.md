# Cosmology Group Website (UBA / FCEN)

## What This Is

A bilingual (Spanish primary, English toggle) institutional website for the Cosmology Group at the Facultad de Ciencias Exactas y Naturales, Universidad de Buenos Aires. v1.0 shipped 45 static routes covering the group's members, research areas, publications, journal club, outreach, and contact information with Schema.org JSON-LD, bilingual metadata, and WCAG-AA accessibility.

## Core Value

A credible, professional academic presence that makes it easy for visitors to find who's in the group, what they work on, and what they've published — with group members able to update content (people, publications, journal club, outreach) without touching code.

## Current State: v1.1 Shipped — v1.2 Aesthetic Polish in planning

**Latest shipped:** v1.1 arXiv + InspireHEP Publication Sync (2026-04-19) — auto-populated `/publications` + per-member last-10-years section via weekly GitHub Actions from InspireHEP (BAI) + arXiv (ORCID), with `jq` payload diff-guard preventing spurious commits and last-good preservation on upstream failure. 45 static routes preserved, 321 real publications from 9 current members, 10/10 cross-phase wiring verified.

## Current Milestone: v1.2 Aesthetic Polish

**Goal:** Thorough aesthetic polish across the whole site using ui-ux-pro-max consultations, preserving the warm-academic direction from v1.0 while tightening the details that still feel rough.

**Target areas:**
- Typography rhythm & scale — recalibrate type scale, line-height, letter-spacing across headings, body, captions, metadata
- Buttons & interactive elements — consistency pass on sizes, padding, hover/active/focus states (buttons, nav links, locale toggle, filter pills, carousel dots)
- Spacing rhythm & layout density — vertical rhythm, section spacing, card padding, page margins across all 8 page types
- Media sizing — specifically member photos on `/people` and `/people/[slug]` (currently read oversized); hero carousel and outreach/activity imagery reviewed in the same pass
- Micro-interactions & polish — transitions, focus rings, hover treatments, loading/empty states (respecting "no flashy animations" constraint)

**Design direction:** Keep the academic-journal aesthetic. No visual overhaul — polish the details, don't redesign.

## Requirements

### Validated

<!-- Shipped and confirmed built. Cumulative across milestones. -->

**Structure & Pages** — all shipped v1.0
- ✓ Bilingual site (Spanish default, English toggle in navbar) — v1.0
- ✓ Home page with rotating hero carousel + intro + 3 highlight cards + partner logo strip — v1.0
- ✓ People page with 5 sections (PIs, Postdocs, PhDs, Undergrads, Past Members) — v1.0
- ✓ Individual detail pages at `/people/[slug]` for PIs, Postdocs, PhDs — v1.0 (13 static routes × 2 locales)
- ✓ Research page with 4-area grid — v1.0
- ✓ Publications page grouped by year — v1.0 (filter UI + URL-synced state deferred)
- ✓ Journal Club page with upcoming + past-sessions archive — v1.0
- ✓ Outreach page with activity grid — v1.0
- ✓ Contact page with address, office, obfuscated email, Google Map, socials — v1.0
- ✓ Top-level nav with 7 links and active-state indicator — v1.0

**Data & Content Architecture** — v1.0
- ✓ Structured JSON content for 5 types, all Zod-validated — v1.0
- ✓ Person shape: slug, name, role, category, photo, bios, interests, publications, contact, socials — v1.0
- ✓ Publication shape: id, authors, title, journal, year, arxiv, doi, topic_tags — v1.0
- ✓ Group-wide config in `src/config/site.ts` — v1.0

**Design System & Polish** — v1.0
- ✓ Typography-driven minimal academic aesthetic (warm-academic OKLCH palette, Source Serif 4 + Source Sans 3) — v1.0
- ✓ Restrained color palette — v1.0
- ✓ Square photo + landscape hero placeholder assets — v1.0
- ✓ WCAG AA compliance (axe-core 0 violations on 8 Spanish pages) — v1.0
- ✓ Open Graph + Twitter card metadata — v1.0
- ✓ Schema.org structured data (ResearchOrganization + Person + ScholarlyArticle) — v1.0
- ✓ Sitemap.xml + robots.txt — v1.0
- ✓ Next.js Image optimization + self-hosted fonts — v1.0

**Deployment**
- ✓ Deployable to Vercel out of the box (static output confirmed) — v1.0

**Publication Sync** — all shipped v1.1
- ✓ `PersonSchema` extended with optional `inspirehep_id` (BAI) + `orcid_id` (reconceived from `arxiv_id` after real-data check) — v1.1
- ✓ Extended `PublicationSchema` with `source: "manual" | "inspirehep" | "arxiv"` tag + pre-2007 arXiv-ID regex — v1.1
- ✓ `pnpm sync-publications` queries InspireHEP + arXiv for every current-member ID, writes `content/publications.json` — v1.1 (concurrency ≤5, 2s batch pause, exp-backoff, AbortSignal timeout)
- ✓ Weekly GitHub Action (Monday 06:00 UTC) runs sync, `jq` payload diff-guard skips commit on identical data, `[skip ci]` prevents retrigger — v1.1
- ✓ `/publications` renders auto-populated archive with source filter, staleness line, bilingual two-source footnote, member-visible author truncation — v1.1
- ✓ `/people/[slug]` renders last-10-years section via `getPublicationsByAuthor(deriveNameVariants(person), { lastNYears: 10 })` — v1.1
- ✓ Sync failure preserves last-good JSON; site deploys unchanged content — v1.1
- ✓ Maintainer documentation in `content/SYNC.md` (BAI lookup + ORCID lookup + paste-ready example + Operational Troubleshooting) — v1.1

### Active

<!-- Current scope. No active milestone yet — run /gsd:new-milestone to scope v1.2. -->

(None — v1.1 shipped; planning next milestone)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning. -->

- **Auth / member login** — public institutional site, content edited via file commits
- **CMS backend** — JSON content files work well for academic maintainers; revisit only if editing cadence spikes
- **Mobile app** — web-first, responsive web covers all audiences
- **Dark mode** — academic/institutional aesthetic is light-mode-first; no user demand surfaced in v1.0
- **Animations beyond hero carousel fade** — "no flashy animations" is an explicit design constraint
- **Search beyond publications filter** — no general site search
- **Commenting / discussion** — not the job of an institutional group site
- **Static-export hosting** — Vercel decision held through v1.0; dual-build overhead not worth the cost
- **"Join the group" section** — prospective students use the general Contact page

<!--
Previously out of scope, now revisited:
- Real publication import — v1.0 deferred the whole thing to v2; v1.1 takes the arXiv + InspireHEP half.
  ORCID, NASA ADS, and cross-source DOI dedup remain deferred.
-->

**v1.1 deferrals (revisit later):**
- ORCID-first author lookup — requires every person to register ORCID; nice-to-have, not blocking
- NASA ADS API — HEP cosmology largely covered by InspireHEP; ADS adds astrophysics breadth if later needed
- Cross-source DOI dedup — v1.1 keeps both sources as separate entries; merge logic added when maintainers report the duplication as annoying
- Runtime ISR — v1.1 sticks with build-time Action; on-demand revalidation is a v2 architecture change
- PUBS-03 / PUBS-04 filter UI — still deferred from v1.0

## Context

**Audience**
- Academic peers (international researchers, collaborators, reviewers)
- Prospective PhD and postdoc candidates
- Funders and institutional stakeholders (CONICET, UBA, grant agencies)
- Science journalists and the general public (outreach)

**Institutional affiliations**
- Universidad de Buenos Aires (UBA)
- Facultad de Ciencias Exactas y Naturales (FCEN)
- CONICET

**Shipped state (post-v1.1)**
- Tech stack: Next.js 16 App Router + TypeScript strict + Tailwind v4 (CSS-first `@theme`) + next-intl 4.9 + Zod v4 + Radix Dialog + lucide-react + fast-xml-parser 5.7 (arXiv Atom)
- Design system: warm-academic OKLCH tokens + Source Serif 4 + Source Sans 3 with Greek subset
- Content: 5 JSON files + 5 Zod schemas + 5 JSON Schema files + 24-symbol `@/content` barrel; `content/publications.json` now auto-populated (321 entries, `_meta { synced_at, sources, counts, warnings }`)
- Sync: `scripts/sync-publications.ts` + `.github/workflows/sync-publications.yml` (weekly cron + workflow_dispatch + `jq` payload diff-guard); `content/SYNC.md` maintainer + operational guide
- 45 fully-static routes, 247 commits total (158 v1.0 + 89 v1.1), 3-day total span (2026-04-17 → 2026-04-19)
- Audited: 0 axe-core violations, v1.0 73/75 requirements satisfied, v1.1 45/48 complete + 2 softened + 2 partial (9/13 DATA-09/10), 10/10 cross-phase wiring verified in both milestone audits
- Deferred to production re-measurement: PERF-02 / PERF-04 / PERF-05 (Vercel prod LCP + CLS)

**Known issues / tech debt carried forward to v1.2**
- NAV-04 mobile drawer 375px runtime check against live deploy (structural verification complete)
- HeroCarousel pause / reduced-motion / MapEmbed IntersectionObserver runtime verification (deferred from 04-02 human-verify)
- `MobileNav.tsx:87` `focus:outline-none` (box-shadow ring provides visible focus; lint flag only)
- PUBS-03 / PUBS-04 deferred beyond v1 scope during Phase 4 planning; revisit when maintainers ask for filters
- DATA-09/10: 4 remaining sync-scoped members need IDs (juan-manuel-armaleo, gonzalo-santa-cruz, guadalupe-ahumada-acuna, juan-pablo-elia) — content task
- Legacy Zod field `publications_selected` still marked `@deprecated` — remove in v1.2
- Orphaned accessor exports (`getPublicationById`, `getPublicationsByTopic`, `getAllTopics`) — legacy v1.0 APIs retained to avoid breaking change; v1.2 cleanup
- Dead `people.selectedPublications` i18n key in both locales — v1.2 cleanup
- REQUIREMENTS.md PR-flow description (implementation pushes direct-to-main per Phase 10 decision) — update in v1.2

**Content policy**
- Placeholder names / bios / photos remain where real content not yet provided (13/15 current members carry photos + bios; publications now real via v1.1 sync)
- `content/publications.json` is auto-managed by the sync script — maintainers should not hand-edit (any edits get overwritten on next cron run)
- Group name stored in single config file for one-line swap

**Skills / prior work relied on**
- `skills/web-dev-general/SKILL.md`
- `skills/design/ui-ux-pro-max/`
- No existing domain skill for "academic research group" — extract on project retrospective

## Constraints

- **Tech stack**: Next.js 16 App Router + TypeScript strict + Tailwind v4 — locked in v1.0
- **i18n**: next-intl 4.9 with Spanish default + English toggle — pathnames map at `src/i18n/routing.ts` is the single URL source of truth
- **Content editability**: All people / publications / research / outreach content lives in `content/*.json`; editors validated via JSON Schema IntelliSense + Zod prebuild
- **Design direction**: Minimal, typography-driven, restrained — no gradients, no flashy animations
- **Deployment**: Vercel (App Router + middleware + default Image loader)
- **Performance**: Fully static build, Next.js Image, self-hosted fonts — Core Web Vitals measured on Vercel prod
- **Accessibility**: WCAG AA non-negotiable — axe-core 0 violations is the acceptance bar
- **SEO**: Schema.org + OG/Twitter + sitemap + robots — institutional credibility
- **Privacy**: GitHub repo private by default

## Key Decisions

<!-- Decisions that constrain future work. Outcomes updated as decisions play out. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Placeholder content throughout | Real names / bios / photos populate after build | ✓ Good — unblocked all 6 phases; real content drops in without code change |
| Group name in single config file | Uncertainty on final branding; one-line swap later | ✓ Good — `src/config/site.ts` is single source of truth |
| Vercel-only deployment | Dual-build overhead for static export (CI matrix, middleware ban, custom image loader) | ✓ Good — 45 static routes prerender cleanly; no hosting revisit needed |
| Journal Club as 7th nav page | Table-stakes for peer cosmology sites | ✓ Good — SSG works, academic-year grouping reads naturally |
| Keep auto-fade carousel | User preference over research-flagged anti-pattern; ≥6s dwell + reduced-motion respect | ✓ Good — a11y upgrade in Phase 6 closed the loop (pause button, aria-live, focus-within pause) |
| JSON/YAML content over CMS | Academic maintainers edit infrequently | ✓ Good — Zod prebuild + JSON Schema IntelliSense gives CMS-level editor feedback without CMS infra |
| Defer arXiv/ADS importer to v2 | Significant scope; placeholder data enough for v1.0 page layout | ✓ Good — v1.1 shipped arXiv + InspireHEP half; NASA ADS still deferred |
| next-intl for i18n | Standard for Next.js App Router + Spanish default | ✓ Good — path translation + locale toggle work end-to-end |
| Extract `domains/research-group/SKILL.md` on completion | Pattern (people + publications + research areas + outreach) reusable | — Pending (post-retrospective) |
| CSS-first Tailwind v4 (`@theme` in `globals.css`, no `tailwind.config.js`) | Tailwind v4 default | ✓ Good — OKLCH tokens live next to the mapping |
| No-border policy (hierarchy via typography + whitespace) | Nature long-form aesthetic | ✓ Good — held through all 45 routes |
| Single `<main>` landmark in `[locale]/layout.tsx` | Axe requirement; pages return content fragments only | ✓ Good — zero main-landmark violations |
| `EmailLink` two-file obfuscation pattern | NAV-03 guarantee: zero `mailto:` in prerendered HTML | ✓ Good — grep guard holds across all routes |
| `buildPageMetadata` helper (canonical + hreflang + OG + Twitter in one call) | Consistency across all `generateMetadata` sites | ✓ Good — 8 routes × 2 locales all emit identical shape |
| Static `metadata` export at locale layout (not `generateMetadata`) | Preserves SSG — PERF-01 | ✓ Good — 45 static routes confirmed |
| `getPathname` as URL source of truth (not hardcoded locale paths) | Pathnames map drives sitemap + nav + canonicals | ✓ Good — renaming a path in `routing.ts` updates everywhere |
| Scope-adjust PUBS-03 / PUBS-04 during Phase 4 | Filter UI not needed for v1.0 launch | — Pending — revisit when maintainers ask for filtering |
| HeroCarousel pause button wording adjusted in Phase 4 human-verify | User preferred dot-only control; hover/focus deliberately don't pause | ✓ Good — HOME-03 rewording accepted by user |
| Reconceive `arxiv_id` as `orcid_id` mid-Phase-7 (v1.1) | Real-data check found arXiv author slugs are not reliably discoverable; ORCID-indexed arXiv Atom feed replaces it cleanly | ✓ Good — ORCID-linked arXiv Atom + InspireHEP BAI combination covers all 9 currently-backfilled members |
| Payload-aware CI diff-guard (`jq -cS '.publications'` vs HEAD) over plain `git diff --quiet` | `_meta.synced_at` byte drift would make plain diff always report changes → spurious Vercel rebuilds | ✓ Good — zero spurious commits observed across repeat workflow runs |
| CI workflow pushes direct-to-main (not PR) | Group publishing cadence slow; auto-commit with Zod validation + Vercel build guard is safe enough | ✓ Good — REQUIREMENTS description still mentions PR flow; doc inconsistency flagged for v1.2 |
| Drop member-author bold highlighting (PUBS-12 softened) in Phase 12 | User feedback: bold weight read as visually confusing against serif body type | ✓ Good — member-visibility invariant (PUBS-11 author-list truncation) still honored via `buildMemberSurnameSet` |
| Drop count subtitle on `/people/[slug]` (PEOP-14 softened) in 11-CONTEXT | Heading is bare "Publicaciones" / "Publications" — list length self-communicates | ✓ Good — less chrome, cleaner reading |
| Matias Leizerovich rename to authoritative InspireHEP BAI `M.Leizerovich.1` (drops "t") | Canonical identifier from InspireHEP, not legacy slug | ✓ Good — zero dangling `leizerovitch` refs; surname-match links his 3 first-author papers |
| Intra-source arXiv-ID dedup only (no cross-source) | Source-tagged separate entries is v1.1's explicit design; InspireHEP/arXiv dupes are a feature, not a bug | ⚠️ Revisit — v1.2 if maintainer reports duplication as annoying |

---
*Last updated: 2026-04-19 — v1.1 shipped (arXiv + InspireHEP publication sync)*
