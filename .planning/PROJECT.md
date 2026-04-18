# Cosmology Group Website (UBA / FCEN)

## What This Is

A bilingual (Spanish primary, English toggle) institutional website for the Cosmology Group at the Facultad de Ciencias Exactas y Naturales, Universidad de Buenos Aires. v1.0 shipped 45 static routes covering the group's members, research areas, publications, journal club, outreach, and contact information with Schema.org JSON-LD, bilingual metadata, and WCAG-AA accessibility.

## Core Value

A credible, professional academic presence that makes it easy for visitors to find who's in the group, what they work on, and what they've published — with group members able to update content (people, publications, journal club, outreach) without touching code.

## Current Milestone: v1.1 arXiv + InspireHEP Publication Sync

**Goal:** Auto-populate publications from InspireHEP + arXiv for each current PI, postdoc, and PhD, refreshed weekly at build time — replacing v1.0's manual `content/publications.json`.

**Target features:**
- Person schema adds optional `arxiv_id` + `inspirehep_id` — maintainer pastes profile ID once
- Weekly GitHub Action runs sync script, commits refreshed `content/publications.json`, preserves fully-static SSG (PERF-01 guarantee holds)
- Sync script queries InspireHEP + arXiv in parallel, tags each entry by source, validates against extended Zod schema
- `/people/[slug]` shows the person's last-N-years publications (filtered by author match); full archive lives on `/publications`
- API failure falls back to last-good JSON (no broken builds from flaky upstreams)
- Current members only — past members keep v1.0's flat list

**Explicitly deferred:** ORCID lookup, NASA ADS, cross-source DOI dedup (entries stay source-tagged), runtime ISR, filter UI (PUBS-03/04 still deferred).

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

### Active

<!-- Current scope. Building toward these. v1.1 — arXiv + InspireHEP sync. -->

- [ ] Person schema extended with `arxiv_id` + `inspirehep_id` (both optional strings)
- [ ] Sync script queries InspireHEP + arXiv for every current-member ID, writes `content/publications.json`
- [ ] Extended Publication Zod schema with `source: "inspirehep" | "arxiv"` tag
- [ ] Weekly GitHub Action (cron) runs sync, commits JSON on success, leaves file untouched on failure
- [ ] `/publications` renders the auto-populated archive, grouped by year, newest first
- [ ] `/people/[slug]` filters publications by author match, limited to last N years
- [ ] Sync failure logs to Action summary; site deploys last-good JSON
- [ ] Documentation for maintainers: how to add `arxiv_id` / `inspirehep_id` to people.json

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

**Shipped state (post-v1.0)**
- Tech stack: Next.js 16 App Router + TypeScript strict + Tailwind v4 (CSS-first `@theme`) + next-intl 4.9 + Zod v4 + Radix Dialog + lucide-react
- Design system: warm-academic OKLCH tokens + Source Serif 4 + Source Sans 3 with Greek subset
- Content: 5 JSON files + 5 Zod schemas + 5 JSON Schema files + 23-symbol `@/content` barrel
- 45 fully-static routes, 158 commits, 2-day build span (2026-04-17 → 2026-04-18)
- Audited: 0 axe-core violations, 73/75 v1 requirements satisfied, 0 cross-phase wiring defects
- Deferred to production re-measurement: PERF-02 / PERF-04 / PERF-05 (Vercel prod LCP + CLS)

**Known issues / tech debt carried forward**
- NAV-04 mobile drawer 375px runtime check against live deploy (structural verification complete)
- HeroCarousel pause / reduced-motion / MapEmbed IntersectionObserver runtime verification (deferred from 04-02 human-verify)
- `MobileNav.tsx:87` `focus:outline-none` (box-shadow ring provides visible focus; lint flag only)
- Latent `next/link` dead import in `SiteFooter.tsx:1` (unused; flip to `@/i18n/navigation` on next edit)
- PUBS-03 / PUBS-04 deferred beyond v1 scope during Phase 4 planning; revisit when maintainers ask for filters

**Content policy**
- Placeholder names / bios / photos throughout; real content populates `content/*.json` post-launch
- arXiv / InspireHEP publication import is the v1.1 goal (flips "Out of Scope: Real publication import")
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
| Defer arXiv/ADS importer to v2 | Significant scope; placeholder data enough for v1.0 page layout | ⚠️ Revisit — v1.1 will tackle the arXiv + InspireHEP half |
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

---
*Last updated: 2026-04-18 — v1.1 milestone scope locked (arXiv + InspireHEP publication sync)*
