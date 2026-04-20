# Cosmology Group Website (UBA / FCEN)

## What This Is

A bilingual (Spanish primary, English toggle) institutional website for the Cosmology Group at the Facultad de Ciencias Exactas y Naturales, Universidad de Buenos Aires. v1.0 shipped 45 static routes covering the group's members, research areas, publications, journal club, outreach, and contact information with Schema.org JSON-LD, bilingual metadata, and WCAG-AA accessibility.

## Core Value

A credible, professional academic presence that makes it easy for visitors to find who's in the group, what they work on, and what they've published — with group members able to update content (people, publications, journal club, outreach) without touching code.

## Current State: v1.2 Shipped — next milestone TBD

**Latest shipped:** v1.2 Aesthetic Polish (2026-04-20) — 26/26 requirements across Typography, Spacing, Media, Buttons, Micro-interactions, and Documentation categories. 18 focus-ring sites unified on `ring-accent-ring` with explicit `ring-offset-2`; PersonCard + PersonDetail photos right-sized (240 px / 180 px with `aspect-[4/5]`); HeroCarousel + Nav + SourceFilter interactive elements hit the 44×44 WCAG 2.5.5 AAA bar; `pnpm axe` 0 violations across 8 Spanish pages; CI drift gate (`lint-rings.yml`) installed; MASTER.md + OVERRIDES.md fully updated. 45 static routes preserved, 11/11 cross-phase wiring + 5/5 E2E flows verified.

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

**Aesthetic Polish** — all shipped v1.2
- ✓ `--text-5xl` (40 px) token added + `--text-4xl` bumped 32 → 36 px; 7 inner-page H1s migrated to `text-3xl md:text-4xl font-semibold` (TYPO-01..03) — v1.2
- ✓ Body-text and nav consolidated to `text-sm`; `tracking-tight` removed from inner H1s (TYPO-04) — v1.2
- ✓ MASTER.md Type Scale versioned with v1.0 supersession note + Line-Height Convention subsection (TYPO-05) — v1.2
- ✓ Page-container widths codified: `max-w-5xl` prose / `max-w-6xl` grids; zero `max-w-4xl` (SPACE-01) — v1.2
- ✓ Vertical rhythm codified: `py-16` page / `py-12` sub-section; card padding two-tiered (dense `p-4` / spacious `p-6`; SessionRow `py-5`) (SPACE-02/03) — v1.2
- ✓ MASTER.md `## Layout` section documents container widths + rhythm + card tiers with SPACE-01/02/03 cross-refs (SPACE-04) — v1.2
- ✓ PersonCard caps at 240 px wide, `aspect-[4/5]` portrait, PeopleSection `xl:grid-cols-4`, tuned `sizes` hint (MEDIA-01, MEDIA-05) — v1.2
- ✓ PersonDetail hero reduced 240 → 180 px, `aspect-[4/5]`, mobile cap, narrow-constant `sizes`, LCP triple preserved (MEDIA-02, MEDIA-05) — v1.2
- ✓ HeroCarousel 5×6 audit all PASS; homepage 1-image inventory confirmed; OutreachCard image wrapper dormant (MEDIA-03/04) — v1.2
- ✓ Every interactive element ≥ 44 × 44 px; inline-text links exempted per WCAG 2.5.5 AAA (BTN-01) — v1.2
- ✓ 18 `focus-visible:ring-*` sites unified on `ring-accent-ring` with explicit `ring-offset-2` (BTN-02) — v1.2
- ✓ HeroCarousel pause/play `w-11 h-11` + dots `p-[17px]` padding-inside (BTN-03) — v1.2
- ✓ SourceFilter pills `px-3.5 py-1.5` + hoisted base const (BTN-04) — v1.2
- ✓ NavLink `py-1.5`, LocaleToggle `py-1.5`, MobileNav trigger/close 44×44 (BTN-05) — v1.2
- ✓ MASTER.md `## Component Specs` 6 Tailwind recipes (raw-CSS blocks replaced wholesale) (BTN-06) — v1.2
- ✓ NavLink `transition-colors duration-150`; SourceFilter crossfade; PersonCard `motion-safe:group-hover:scale-[1.02]` (MICRO-01/02/03) — v1.2
- ✓ `pnpm axe` 0 violations on 8 Spanish pages (MICRO-04) — v1.2
- ✓ Focus rings contrast-safe on light (`ring-offset-surface`) + image (`ring-offset-black/40`) backgrounds (MICRO-05) — v1.2
- ✓ OVERRIDES.md v1.2 table (15 rows) appended; v1.0 list preserved (DOC-01/02) — v1.2
- ✓ `.github/workflows/lint-rings.yml` CI drift gate blocks stray focus-ring variants on push/PR — v1.2

### Active

<!-- Current scope. No active milestone yet — run /gsd:new-milestone to scope v1.3. -->

(None — v1.2 shipped; planning next milestone)

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

**Shipped state (post-v1.2)**
- Tech stack: Next.js 16 App Router + TypeScript strict + Tailwind v4 (CSS-first `@theme`) + next-intl 4.9 + Zod v4 + Radix Dialog + lucide-react + fast-xml-parser 5.7 (arXiv Atom)
- Design system: warm-academic OKLCH tokens + Source Serif 4 + Source Sans 3 with Greek subset; v1.2 versioned Type Scale (`--text-4xl` 36 px / `--text-5xl` 40 px) with v1.0 supersession note; two-tier card padding rule (dense `p-4` / spacious `p-6`); 18 focus-ring sites unified on `ring-accent-ring` + `ring-offset-2`; `lint-rings.yml` CI drift gate enforces going forward
- Content: 5 JSON files + 5 Zod schemas + 5 JSON Schema files + 24-symbol `@/content` barrel; `content/publications.json` auto-populated (321 entries, `_meta { synced_at, sources, counts, warnings }`)
- Sync: `scripts/sync-publications.ts` + `.github/workflows/sync-publications.yml` (weekly cron + workflow_dispatch + `jq` payload diff-guard); `content/SYNC.md` maintainer + operational guide
- 45 fully-static routes, 306 commits total (158 v1.0 + 89 v1.1 + 59 v1.2), 4-day total span (2026-04-17 → 2026-04-20)
- Audited: 0 axe-core violations across 8 Spanish pages (re-verified v1.2); v1.0 73/75 requirements + v1.1 45/48 complete + 2 softened + 2 partial + **v1.2 26/26 complete**; 11/11 cross-phase wiring + 5/5 E2E flows verified in v1.2 audit
- Deferred to production re-measurement: PERF-02 / PERF-04 / PERF-05 (Vercel prod LCP + CLS)

**Known issues / tech debt carried forward to v1.3**
- Post-v1.2-seal doc drift: commit `1cf9cf8 feat(header): enlarge nav tabs to text-lg and widen chrome to max-w-6xl` — MASTER.md Component Specs "Nav Link" and OVERRIDES.md v1.2 row 11 still describe `text-sm + py-1.5`; needs a v1.3 amendment
- Desktop NavLink deliberately has no `focus-visible:ring-*` of its own — inherits browser UA focus ring; flagged as observation in 15-VERIFICATION. Revisit if judged insufficient on live site
- NAV-04 mobile drawer 375 px runtime check against live deploy (structural verification complete)
- HeroCarousel pause / reduced-motion / MapEmbed IntersectionObserver runtime verification (deferred from 04-02 human-verify)
- `MobileNav.tsx:87` `focus:outline-none` (box-shadow ring provides visible focus; lint flag only)
- PUBS-03 / PUBS-04 deferred beyond v1 scope during Phase 4 planning; revisit when maintainers ask for filters
- DATA-09/10: 4 remaining sync-scoped members need IDs (juan-manuel-armaleo, gonzalo-santa-cruz, guadalupe-ahumada-acuna, juan-pablo-elia) — content task
- Legacy Zod field `publications_selected` still marked `@deprecated` — v1.3 cleanup candidate
- Orphaned accessor exports (`getPublicationById`, `getPublicationsByTopic`, `getAllTopics`) — legacy v1.0 APIs retained to avoid breaking change; v1.3 cleanup candidate
- Dead `people.selectedPublications` i18n key in both locales — v1.3 cleanup candidate
- REQUIREMENTS.md PR-flow description (implementation pushes direct-to-main per Phase 10 decision) — update in v1.3

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
| Intra-source arXiv-ID dedup only (no cross-source) | Source-tagged separate entries is v1.1's explicit design; InspireHEP/arXiv dupes are a feature, not a bug | ⚠️ Revisit — v1.3 if maintainer reports duplication as annoying |
| v1.2 `--text-5xl: 2.5rem` caps hero H1 at 40 px (not Tailwind default 48 px); inner H1s use `text-3xl md:text-4xl` | Hero-only 40 px sizing; token makes the decision explicit and prevents falling through to Tailwind default | ✓ Good — HeroCarousel H1 preserved; 7 inner page H1s consistent |
| SPACE-03 two-tier card padding rule (dense p-4 / spacious p-6), flat across breakpoints | No CSS abstractions, no responsive variants; one-line intent per card | ✓ Good — SessionRow py-5 documented as dense-row equivalent |
| PersonCard self-caps at `max-w-[240px] w-full mx-auto` (not grid-cell constraint) | Lets grid cell be wider at xl (258 px) while card centers; encyclopedic whitespace feel | ✓ Good — composes cleanly with PeopleSection xl:grid-cols-4 |
| Aspect-ratio via wrapper `aspect-[4/5]` (not fixed w/h on `<Image>`) on LCP photos | Preserves Phase 6 `fill`+parent-aspect pattern so `link rel=preload imagesrcset` hint stays stable | ✓ Good — LCP triple on PersonDetail hero intact |
| `sizes="(min-width: 768px) 180px, 180px"` narrow-constant on mobile-capped hero | Flat hint accurate everywhere when cap equals desktop width; tightens preload srcset pool to 256w / 384w | ✓ Good — observed srcset matches |
| HeroCarousel dot tap area via `p-[17px]` arbitrary value | 17+10+17=44 px exactly; `p-3` gives only 34 px; only 2 uses → below tokenize threshold | ✓ Good — WCAG 2.5.5 AAA met without CSS abstraction |
| 18 focus-ring sites unified on `ring-accent-ring` + explicit `ring-offset-2`; `.github/workflows/lint-rings.yml` PCRE drift gate | Prevents reintroduction of stray variants (e.g. `ring-surface/70`); CI blocks on push/PR | ✓ Good — dry-run against current src/ returns 0 matches |
| Inline-text links exempted from BTN-01 44×44 rule (WCAG 2.5.5 AAA exception) | Inline links in prose shouldn't inflate to 44 px tap targets — breaks line-height rhythm | ✓ Good — documented in OVERRIDES.md v1.2 table + MASTER.md Universal Rules |
| SkipLink uses `focus:` not `focus-visible:` — deliberately NOT rewritten in sweep | Sr-only chip is keyboard-only by definition; CI gate's `focus-visible:` anchor excludes it naturally | ✓ Good — Phase 3 pattern preserved |
| MASTER.md `## Component Specs` rewritten as Tailwind recipes (raw `.btn-primary` CSS blocks replaced wholesale) | Codebase has zero CSS class analogues — utility-only Tailwind; raw blocks were load-bearing on nothing | ✓ Good — 6 components documented with inline recipes |
| OVERRIDES.md v1.2 overrides APPENDED as table (v1.0 numbered list preserved verbatim) | Historical readability of v1.0 list + structured format for v1.3+ overrides | ✓ Good — pattern established for future milestones |
| Desktop NavLink deliberately has no `focus-visible:ring-*` — inherits browser UA default | BTN-02 governs color where ring exists, not presence everywhere; browser default is a valid choice | — Pending — re-evaluate on live site |

---
*Last updated: 2026-04-20 — v1.2 shipped (Aesthetic Polish: typography, spacing, media, interactive, docs)*
