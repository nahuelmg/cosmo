# Project Milestones: Cosmology Group Website (UBA / FCEN)

## v1.2 Aesthetic Polish (Shipped: 2026-04-20)

**Delivered:** Thorough aesthetic polish across all 45 routes — typography rhythm, interactive-element sizing, spacing cadence, member-photo proportions, and micro-interactions — preserving the warm-academic direction from v1.0 with zero visual redesign.

**Phases completed:** 13–15 (13 plans total)

**Key accomplishments:**

- **Design-system tokens versioned** — added `--text-5xl` (40 px) and bumped `--text-4xl` 32 → 36 px in `globals.css` `@theme`; 7 inner-page H1s migrated to `text-3xl md:text-4xl font-semibold` (no `tracking-tight`, `@layer base -0.01em` governs); nav consolidated to `text-sm`; MASTER.md Type Scale gained v1.0 supersession note + Line-Height Convention subsection.
- **Layout rhythm codified** — page wrappers standardised on `max-w-5xl` (prose) / `max-w-6xl` (grids) with zero `max-w-4xl` in codebase; vertical rhythm `py-16` page / `py-12` sub-section; card padding rule two-tiered (dense `p-4` PersonCard / spacious `p-6` ResearchCard + OutreachCard); SessionRow `py-5` dense-row equivalent; ResearchCard's outlier `p-8` reduced to `p-6`.
- **Member photos no longer dominate** — PersonCard self-caps at `max-w-[240px] w-full mx-auto` with `aspect-[4/5]` portrait + PeopleSection `xl:grid-cols-4`; PersonDetail hero resized 240 → 180 px (`aspect-[4/5]` + `md:grid-cols-[180px_1fr]` + mobile cap); `next/image` `sizes` attributes tightened (`"(min-width: 640px) 240px, 100vw"` cards, `"(min-width: 768px) 180px, 180px"` hero) so Next serves the correct srcset without oversized downloads; LCP preload triple preserved on PersonDetail hero.
- **Interactive elements hit the 44×44 bar** — HeroCarousel pause/play `w-11 h-11` + dot `p-[17px]` padding-inside (17+10+17=44 px exactly); MobileNav trigger/close 44×44; NavLink `py-1.5` + `transition-colors duration-150`; LocaleToggle `py-1.5`; SourceFilter pill `px-3.5 py-1.5` (≥ 36 px per BTN-04 spec) + hoisted base const preventing active/inactive drift. Inline-text links exempted per WCAG 2.5.5 AAA.
- **Focus rings unified** — 18 `focus-visible:ring-*` sites all on `ring-accent-ring` with explicit `ring-offset-2`; `ring-offset-surface` on light backgrounds, `ring-offset-black/40` on HeroCarousel image background; PersonCard photo gains `motion-safe:group-hover:scale-[1.02]` zoom (respects `prefers-reduced-motion`); SkipLink's `focus:` pattern deliberately preserved.
- **CI guard + docs landed** — `pnpm axe` script (`@axe-core/cli@4` against 8 Spanish pages, 0 violations confirmed); `.github/workflows/lint-rings.yml` drift gate with PCRE lookahead blocks any future stray ring variants on push/PR; MASTER.md `## Component Specs` rewritten as 6 inline Tailwind recipes (raw `.btn-primary` blocks replaced wholesale — zero codebase analogues); OVERRIDES.md v1.2 table appended (15 rows) while v1.0 list preserved verbatim; manual visual sweep APPROVED at 375/1024/1440 px.

**Stats:**

- 13 plans across 3 phases (13:4, 14:3, 15:6)
- 45 static routes preserved (SSG guarantee held through all polish)
- 77 files changed, +7,879 / −507 LOC since v1.1
- 59 commits from v1.1 tag to ship
- Timeline: 2026-04-19 → 2026-04-20 (~1 day)
- **26/26 v1.2 requirements complete** (TYPO-01..05, SPACE-01..04, MEDIA-01..05, BTN-01..06, MICRO-01..05, DOC-01..02)
- Cross-phase integration: 11/11 wiring checks passed; 5/5 E2E flows; `pnpm build` + `tsc --noEmit` clean

**Git range:** `feat(13-01): bump --text-4xl to 2.25rem + add --text-5xl` → `docs(15): complete interactive-polish-documentation phase`

**Deferred to v1.3:**

- Post-milestone doc drift — commit `1cf9cf8` (after Phase 15 seal) reverted desktop NavLink to `text-lg` and widened SiteHeader to `max-w-6xl`; MASTER.md and OVERRIDES.md need a v1.3 amendment recording the override.
- Desktop NavLink explicit focus ring (currently inherits UA default — acceptable under BTN-02 scope; revisit if judged insufficient on live site).
- All v1.1 code-cleanup deferrals carried forward (orphaned accessors, dead i18n key, `publications_selected` field, REQUIREMENTS PR-flow description).
- DATA-09/10 content task (4 remaining sync-scoped member IDs).
- v1.0 production re-measurement (PERF-04/05 Vercel LCP + CLS, NAV-04 live-deploy check, hero title contrast on starfield).

**Technical debt:** Documentation drift from 2 post-milestone intentional commits (recorded above). No execution debt — every polish change followed the plan.

**What's next:** v1.3 — open (candidates: carried-forward v1.1 code cleanup, v1.0 production re-measurement campaign, or new capability milestone TBD).

---

## v1.1 arXiv + InspireHEP Publication Sync (Shipped: 2026-04-19)

**Delivered:** Auto-populated `/publications` archive + per-member last-10-years publication section, refreshed weekly via GitHub Actions from InspireHEP (BAI) + arXiv (ORCID), source-tagged and preserving v1.0's fully-static SSG guarantee.

**Phases completed:** 7–12 (13 plans total)

**Key accomplishments:**

- **Schema extension + content plumbing** — `PublicationSchema` gained `source: z.enum(["manual", "inspirehep", "arxiv"]).default("manual")` + pre-2007 arXiv-ID regex; `PersonSchema` gained `inspirehep_id?` (BAI, multi-segment-name regex) + `orcid_id?` (reconceived from `arxiv_id` after real-data check) + required `display_name_normalized`; `publications_selected` marked `@deprecated`; all 5 JSON Schemas regenerated; maintainer lookup guide at `content/SYNC.md`.
- **Accessor layer + test discipline** — `getPublicationsByAuthor(nameVariants, { lastNYears })` lives in `src/content/accessors/publications.ts` with NFD-normalized case-insensitive author match and calendar-year window; zero imports from `people.ts` (circular-dep-proof); 20/20 Vitest tests covering 4-char guard, diacritic fold, `lastNYears: 0`, pre-sort, non-mutation.
- **Sync script with real upstream hardening** — `pnpm sync-publications` fetches InspireHEP literature (BAI-scoped, pagination over `hits.total`) + arXiv Atom (ORCID-linked) with concurrency ≤5 + 2s batch pause + exp-backoff on 429 + `AbortSignal.timeout(10_000)`; deterministic sort (year desc → arXiv desc) + intra-source arXiv-ID dedup; `PublicationsFileSchema` write-gate with `_meta { synced_at, sources, counts, warnings }`; last-good JSON preserved on any upstream failure; SYNC-15 summary log.
- **Weekly CI automation that doesn't spam Vercel** — `.github/workflows/sync-publications.yml` runs `cron: 0 6 * * 1` + `workflow_dispatch`, installs with `--frozen-lockfile` + Node 20 + `pnpm/action-setup@v4`; `jq -cS '.publications'` payload-aware diff-guard ignores `_meta.synced_at` byte drift → zero spurious commits on identical data; `[skip ci]` commit prefix prevents retrigger; step summary reports per-run delta or "No changes".
- **Display layer, bilingual and softened by user feedback** — `/publications` flips to synced source with `SourceFilter` pill toggle, `Intl.DateTimeFormat` staleness line, bilingual two-source footnote, and author-list truncation that preserves member visibility past position 3; `/people/[slug]` renders each PI/postdoc/PhD's last-10-years section via `getPublicationsByAuthor(deriveNameVariants(person), { lastNYears: 10 })` — old `publications_selected` render path removed; all new UI strings pass `pnpm check-translations` with zero drift; count subtitle (PEOP-14) and member-author bold (PUBS-12) softened per 11-CONTEXT / user feedback.
- **Polish phase that closed audit tech debt** — DOC-01 + DOC-02 shipped via extended `content/SYNC.md` (paste-ready example + Operational Troubleshooting); DATA-09/10 lifted 1 → 9 current members; 13 v1.0 template publications purged via live sync run producing 321 real entries (317 InspireHEP + 4 arXiv); `matias-leizerovich` rename end-to-end (authoritative InspireHEP BAI drops the "t"); `cecilia-scannapieco` display_name_normalized typo fix (unblocked surname-match linking to her 47 real papers); pre-existing MobileNav `set-state-in-effect` v1.0 lint carryover resolved via React-19-compliant click-handler topology.

**Stats:**

- 13 plans across 6 phases (7:2, 8:1, 9:3, 10:1, 11:3, 12:3)
- 45 static routes preserved (SSG guarantee held)
- 86 files changed, +24,302 / -1,206 LOC since v1.0
- 89 commits from v1.0 tag to ship
- Timeline: 2026-04-18 → 2026-04-19 (2 days)
- 45/48 v1.1 requirements complete + 2 softened (PEOP-14, PUBS-12) + 2 partial (DATA-09/10 at 9/13; 4 slugs deferred to v1.2)
- Cross-phase integration: 10/10 wiring checks passed (re-verified post-Phase-12)

**Git range:** `feat(07-01): extend PublicationSchema + PersonSchema for v1.1 sync` → `docs(12): complete polish-docs phase`

**Deferred to v1.2:** Remaining 4 member IDs (content task), `publications_selected` Zod field removal, orphaned accessor exports (`getPublicationById`, `getPublicationsByTopic`, `getAllTopics`), dead `people.selectedPublications` i18n key, REQUIREMENTS PR-flow description update, OPS-DEFER-01 (Action failure notifications), SYNC-DEFER-02/03 (NASA ADS, cross-source DOI dedup).

**Technical debt:** None unplanned — all deferrals are explicit scope calls, not workaround debt.

**What's next:** v1.2 — Cleanup (legacy cleanup + remaining 4 member IDs), or new capability milestone TBD.

---

## v1.0 MVP (Shipped: 2026-04-18)

**Delivered:** Bilingual (es default / en toggle) institutional website for the Cosmology Group at UBA-FCEN — 45 fully static routes, Schema.org-structured, WCAG-AA accessible, ready to deploy to Vercel.

**Phases completed:** 1-6 (31 plans total)

**Key accomplishments:**

- **Foundation + design system** — Next.js 16 App Router + TypeScript strict + Tailwind v4 with CSS-first `@theme` OKLCH tokens, Source Serif 4 + Source Sans 3 with Greek subset self-hosted via `next/font` (no FOUT/FOIT), warm-academic palette locked in `design-system/cosmology-group-uba/MASTER.md` + OVERRIDES.md.
- **Typed content layer with build-time validation** — Zod v4 strict schemas for 5 content types (people, publications, research, journal-club, outreach) with bilingual field helpers, prebuild validator that fails on smart quotes / missing photos / malformed data, JSON Schema files for VS Code IntelliSense, `@/content` barrel exporting 23 typed accessors.
- **Accessible layout shell with i18n-aware navigation** — next-intl 4.9 routing with path translation (`/es/personas` ↔ `/en/people`), locale toggle that preserves current path + query, Radix Dialog mobile drawer, skip-link + `<main id="main-content">` landmark in locale layout only, `EmailLink` two-file obfuscation pattern guaranteeing zero `mailto:` in prerendered HTML.
- **Eight pages rendering real placeholder content** — Home (hero carousel with `prefers-reduced-motion` + `document.hidden` pause), People list (5 sections) + 13 `/people/[slug]` detail pages via `generateStaticParams`, Research / Publications (year-grouped) / Journal Club / Outreach / Contact (lazy-loaded Google Maps via IntersectionObserver, crawlable fallback) — all SSG, all bilingual, all consuming the typed accessors.
- **SEO end-to-end** — per-page `generateMetadata` with canonical + `hreflang` (es / en / x-default), ResearchOrganization JSON-LD on every page via locale layout, Person JSON-LD on detail pages, 13 ScholarlyArticle JSON-LD blocks on Publications, `sitemap.xml` with 20 canonical URLs + `<xhtml:link>` alternates built via `getPathname` (single source of truth), `robots.ts` gated on `VERCEL_ENV === "production"`.
- **WCAG AA + performance baseline** — axe-core CLI: 0 violations across 8 Spanish pages, carousel a11y upgrade (aria-live, slide attrs, focus-within pause, keyboard-operable controls), contrast tokens revised, `pnpm build` emits 45 fully-static routes with 0 SSR fallback, NAV-03 zero-email grep guard passing.

**Stats:**

- 31 plans across 6 phases (1:4, 2:5, 3:5, 4:8, 5:5, 6:4)
- 45 static routes prerendered (all `/es/*` + `/en/*` + `/people/[slug]` × 13 × 2 locales + sitemap + robots)
- 158 commits from scaffold to ship
- Timeline: 2026-04-17 → 2026-04-18 (2 days)
- 73/75 v1 requirements satisfied; 2 scope-adjusted (PUBS-03/04 filter UI + URL-synced state deferred beyond Phase 4)

**Git range:** `feat(01-01): Next.js 16 scaffold` → `docs(06): complete polish-a11y-performance phase`

**Deferred to production re-measurement:** PERF-02 (CLS on 7 of 8 pages), PERF-04 (LCP mobile 4G on Home/People/Publications), PERF-05 (Contact LCP element). Localhost `pnpm start` is a pessimistic LCP proxy — final numbers land after Vercel deployment.

**Technical debt:** NAV-04 mobile drawer 375px live-deploy verification, HeroCarousel pause/reduced-motion/MapEmbed IntersectionObserver runtime checks, MobileNav.tsx `focus:outline-none` (visible focus ring present via box-shadow), latent `next/link` dead import in `SiteFooter.tsx:1`.

**What's next:** v1.1 — Connect PIs / postdocs / PhDs to arXiv + InspireHEP profiles so publications auto-populate on `/publications` and individual person pages (addresses v1 "Out of Scope: Real publication import" — scope revisited post-v1.0).

---
