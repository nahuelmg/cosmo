---
phase: 11-display-layer
verified: 2026-04-19T16:18:00Z
status: passed
score: 7/7 must-haves verified
re_verification: null
---

# Phase 11: Display Layer Verification Report

**Phase Goal:** `/publications` renders the auto-populated archive with source badges, source filter, preprint indicators, staleness date, and author highlighting; `/people/[slug]` renders each member's last-10-years publication list with the same badges and indicators; all new UI strings are bilingual and translation-complete.

**Verified:** 2026-04-19T16:18:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/publications` renders archive grouped by year with source badges + preprint/published chips per entry | VERIFIED | `src/app/[locale]/publications/page.tsx:58-83` renders JSON-LD + header + `PublicationsClientShell` which iterates `PublicationsYearGroup` → `PublicationEntry`; two-chip cluster at `src/components/publications/PublicationEntry.tsx:48-84` |
| 2 | Source filter (four segmented pills, single-select, in-browser) narrows/restores visible entries | VERIFIED | `src/components/publications/SourceFilter.tsx:28-51` implements four pills with `aria-pressed`; single-select guard at L38 (`if (active && opt.key !== 'all') return;`); filter state held in `PublicationsClientShell.tsx:29` via `useState`; filtering via `useMemo` at L39-47 |
| 3 | Staleness "Actualizado el {date}" reads from `_meta.synced_at` with locale-aware formatting | VERIFIED | `page.tsx:53-56` constructs `Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', …).format(new Date(meta.synced_at))`; rendered at L69-71 via `t('updatedAt', { date })`; ICU placeholder present in both `messages/es.json:74` and `messages/en.json:74` |
| 4 | Bilingual two-source footnote renders below the list | VERIFIED | `page.tsx:78-80` renders `t('footnote')`; ES string at `messages/es.json:75`, EN string at `messages/en.json:75` |
| 5 | Group member author names rendered bold (no color/underline); et al. member-visible invariant preserved | VERIFIED | `PublicationEntry.tsx:32-34` wraps `token.isMember` tokens in `<strong className="font-bold">`; et al. expansion logic at `publications-helpers.ts:120-144`; invariant test at `publications-helpers.test.ts:141-160` passes |
| 6 | `/people/[slug]` renders last-10-years publications section for PI/postdoc/phd, hidden when empty; shared `PublicationEntry` reused | VERIFIED | `page.tsx:78-81` calls `getPublicationsByAuthor(deriveNameVariants(rawPerson), { lastNYears: 10 })`; `PersonDetail.tsx:136-152` conditionally renders section only when `memberPubs.length > 0`; heading is bare `{publicationsHeading}` with NO count (SOFTENED per CONTEXT) |
| 7 | All new UI strings bilingual and translation-complete — zero key drift | VERIFIED | `pnpm check-translations` exits 0 with "No missing keys found! / No invalid translations found!"; all 7 new keys (`published`, `filter.{all,inspirehep,arxiv,manual}`, `updatedAt`, `footnote`) present in both locale files |

**Score:** 7/7 truths verified.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/publications-helpers.ts` | Exports deriveNameVariants, buildMemberSurnameSet, isMember, formatAuthors, getSourcePillHref | VERIFIED | 174 lines, all 5 exports present (L40, L64, L86, L120, L160); pure functions, no React/I/O |
| `src/lib/publications-helpers.test.ts` | Vitest unit tests including et al. member-visible invariant | VERIFIED | 223 lines, 23 test cases across 5 describe blocks; invariant test at L141-160; all 23 passing |
| `src/content/accessors/publications.ts` | Exports `getPublicationsMeta()` | VERIFIED | L124-126 defines `getPublicationsMeta(): PublicationsMeta`; `_meta` destructured at L28 (no longer discarded) |
| `src/content/index.ts` | Re-exports `PublicationsMeta` type | VERIFIED | L30: `export type { Publication, Publications, PublicationsMeta } from "./schemas/publications.schema"` |
| `src/components/publications/PublicationEntry.tsx` | Two-chip cluster, InspireHEP blue, arXiv red/orange, Manual neutral; source pill link vs span; bold member authors | VERIFIED | 113 lines; prop shape = full `Publication` + `memberSurnameSet: Set<string>` + extended labels; source pill tone OKLCH literals at L56-58; `<a>` for href, `<span>` for null href (L66-77); preprint chip neutral never-link at L81-83 |
| `src/components/publications/SourceFilter.tsx` | Client component, four segmented pills, single-select semantics | VERIFIED | 53 lines; `'use client'` at L1; four options at L15-20; single-select guard at L38 |
| `src/components/publications/PublicationsClientShell.tsx` | Client wrapper holding filter state; receives memberSurnameList: string[] | VERIFIED | 63 lines; `'use client'` at L1; `memberSurnameList: string[]` prop at L15; Set rebuilt via `useMemo` at L34-37 (RSC serialization fix documented in 11-02-SUMMARY) |
| `src/components/publications/PublicationsYearGroup.tsx` | Forwards full Publication + memberSurnameSet to PublicationEntry | VERIFIED | 39 lines; prop shape updated at L4-14; forwards props at L29-33 |
| `src/app/[locale]/publications/page.tsx` | Calls getPublicationsMeta + getPeople + buildMemberSurnameSet; renders staleness, filter shell, footnote | VERIFIED | 84 lines; all required calls at L35-56; JSON-LD preserved L60-65; client shell at L73-77 |
| `src/app/[locale]/people/[slug]/page.tsx` | Calls getPublicationsByAuthor with lastNYears:10 via deriveNameVariants; generateStaticParams unchanged | VERIFIED | 111 lines; generateStaticParams at L22-33 filters pi/postdoc/phd only; `getPublicationsByAuthor(deriveNameVariants(rawPerson), { lastNYears: 10 })` at L78-81 |
| `src/components/people/PersonDetail.tsx` | selectedPubs render path removed; bare heading with no count; section hidden when empty | VERIFIED | 229 lines; legacy interface/prop removed (grep `selectedPubs\|publications_selected\|getPublicationById` returns zero hits); new section at L136-152 wrapped in `{memberPubs.length > 0 && …}`; heading `{publicationsHeading}` only, no count |
| `messages/es.json` | 7 new keys under `publications` | VERIFIED | L62-76: `published`, `filter.{all,inspirehep,arxiv,manual}`, `updatedAt` (with `{date}`), `footnote` all present |
| `messages/en.json` | 7 new keys under `publications` (mirror) | VERIFIED | L62-76: identical key set; values translated |

All 13 artifacts pass existence + substantive + wired checks.

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `PublicationsClientShell` | `SourceFilter` | direct import + prop wiring | WIRED | L5 import, L51 render with `value/onChange` |
| `PublicationsClientShell` | `PublicationsYearGroup` | direct import + filtered iteration | WIRED | L6 import, L52-60 map over `filteredGroups` |
| `page.tsx /publications` | `getPublicationsMeta` | accessor barrel | WIRED | L4 named import from `@/content`; called at L36 |
| `page.tsx /publications` | `buildMemberSurnameSet(getPeople())` | helper call | WIRED | L5 import from `@/lib/publications-helpers`; called at L37-38 |
| `page.tsx /publications` | `t('updatedAt', { date })` | ICU placeholder | WIRED | L70; placeholder `{date}` present in both locale files |
| `page.tsx /publications` | `t('footnote')` | bilingual translation | WIRED | L79; both locale strings present |
| `PublicationEntry` | `formatAuthors` | helper call | WIRED | L2 import, L20 destructured; tokens iterated at L27-38 |
| `PublicationEntry` | `getSourcePillHref` | helper call | WIRED | L2 import, L51; branches at L66-77 render `<a>` or `<span>` accordingly |
| `page.tsx /people/[slug]` | `getPublicationsByAuthor({ lastNYears: 10 })` | accessor call | WIRED | L11 import, L78-81 call with derived variants + year window |
| `page.tsx /people/[slug]` | `deriveNameVariants(rawPerson)` | helper call | WIRED | L14 import, L79 use |
| `PersonDetail` | `PublicationEntry` | reused render | WIRED | L5 import, L143-148 iteration with same prop shape as /publications |
| `PersonDetail` | Empty-state hide | conditional render | WIRED | L136 `{memberPubs.length > 0 && <section>…</section>}` — no placeholder, no heading when empty |

All 12 critical links wired correctly.

---

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| PUBS-05 | SATISFIED | Year-grouped newest-first rendering via `getAllYears()` + `getPublicationsByYear()` in `page.tsx:35,42-45`; data source is synced `content/publications.json` (accessor parses via PublicationsFileSchema) |
| PUBS-06 | SATISFIED | Source pill rendered in `PublicationEntry.tsx:50-78` with brand-tinted OKLCH tones; clickable for InspireHEP/arXiv, non-link `<span>` for Manual |
| PUBS-07 | SATISFIED | `SourceFilter.tsx` + `PublicationsClientShell.tsx` filter in-browser via `useState`/`useMemo`; no URL state (PUBS-04 correctly deferred) |
| PUBS-08 | SATISFIED | Preprint/published chip in `PublicationEntry.tsx:81-83` derives from `publication.journal === "Preprint"` semantic signal |
| PUBS-09 | SATISFIED | "Actualizado el {date}" reads from `getPublicationsMeta().synced_at` with locale-aware `Intl.DateTimeFormat` at `page.tsx:53-56,70` |
| PUBS-10 | SATISFIED | Bilingual footnote at `page.tsx:78-80`; ES + EN strings explain dual-source and possible duplicates |
| PUBS-11 | SATISFIED | Author list formatting in `formatAuthors`: ≤5 full list; >5 first-three + et al.; test coverage at `publications-helpers.test.ts:125-169` |
| PUBS-12 | SATISFIED | Member bold-highlighting via `isMember` + `memberSurnameSet` built from unfiltered `getPeople()`; `<strong className="font-bold">` wrapper in `PublicationEntry.tsx:33` |
| PEOP-13 | SATISFIED | `getPublicationsByAuthor(deriveNameVariants(rawPerson), { lastNYears: 10 })` at `page.tsx:78-81` |
| PEOP-14 | **SOFTENED** | Count subtitle explicitly dropped per `11-CONTEXT.md` locked decision. Heading is `{publicationsHeading}` alone (no count, no subtitle, no "últimos 10 años" framing). Grep for count strings returns zero hits. **This is NOT a gap — it is the documented, accepted softening of the original REQ.** |
| PEOP-15 | SATISFIED | `PersonDetail.tsx:142-149` imports + reuses `PublicationEntry` verbatim with same prop shape |
| PEOP-16 | SATISFIED | Preprint/published indicator via shared `PublicationEntry` reuse |
| PEOP-17 | SATISFIED | `generateStaticParams` at `page.tsx:22-33` still filters to `pi/postdoc/phd` only; `notFound()` guards at L73 on `undergrad`/`past`; build output shows 26 paths (13 clickable × 2 locales) |
| PEOP-18 | SATISFIED | `publications_selected` render path fully stripped — grep returns zero hits across both files; `getPublicationById` import removed; `SelectedPub` interface deleted |
| I18N-08 | SATISFIED | All new keys present in both locale files (messages/{es,en}.json L62-76) |
| I18N-09 | SATISFIED | `pnpm check-translations` exits 0 with "No missing keys found!" |

**All 16 requirements covered.** PEOP-14 is correctly softened per the locked CONTEXT decision.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | None found |

No TODO/FIXME/placeholder markers, no empty handlers, no stub returns, no console.log-only paths in Phase 11 files.

---

### Automated Gate Results

| Gate | Result | Output |
|------|--------|--------|
| `pnpm tsc --noEmit` | exit 0 | clean |
| `pnpm test` | exit 0 | 65/65 tests passing across 3 test files |
| `pnpm test src/lib/publications-helpers.test.ts` | exit 0 | 23/23 tests passing including et al. member-visible invariant |
| `pnpm check-translations` | exit 0 | "No missing keys found! / No invalid translations found!" |
| `pnpm build` | exit 0 | 45/45 static routes prerendered; `/[locale]/publications` × 2 + `/[locale]/people/[slug]` × 26 (13 slugs × 2 locales, pi/postdoc/phd only — no undergrad or past) |

---

### Human Verification Required

None. All observable truths were verifiable programmatically via code inspection + automated gates. Visual confirmation of pill tones, filter stickiness behavior, and author-highlighting on specific live entries was performed in 11-02/11-03 manual spot-checks per the SUMMARY files; no further human gate is required for Phase 11 goal achievement.

---

## Overall Status: PASSED

Phase 11 achieves its goal. Both `/publications` and `/people/[slug]` render the auto-populated archive with source badges, source filter, preprint indicators, staleness date, bilingual footnote, and author highlighting. The old `publications_selected` render path is fully removed. All new UI strings are bilingual and translation-complete.

**Notes on softening (do not treat as gaps):**
- **PEOP-14 / ROADMAP SC5 count subtitle**: explicitly dropped per `11-CONTEXT.md` decision. The profile heading is `Publicaciones`/`Publications` alone. Absence of count is intentional design.
- **PUBS-04 URL state**: explicitly deferred to post-v1.1, out of scope for this phase. In-memory filter only.
- **DATA-09/10 empty profiles**: 13 of 14 current members lack `inspirehep_id`/`orcid_id`, so most profile pages render no publications section (hidden entirely per CONTEXT). This is the intended rollout state, not a gap.

The three REQUIREMENTS.md tracker rows for PUBS-05..12, PEOP-13/15/16/17/18, and I18N-08/09 should be flipped from "Pending" to "Complete"; PEOP-14 should be annotated "Softened per /gsd:discuss-phase 11-CONTEXT.md — heading alone; count explicitly dropped."

---

*Verified: 2026-04-19T16:18:00Z*
*Verifier: Claude (gsd-verifier)*
