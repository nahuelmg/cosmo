---
phase: 02-content-layer
verified: 2026-04-17T00:00:00Z
status: passed
score: 9/9 must-haves verified
---

# Phase 2: Content Layer Verification Report

**Phase Goal:** All content types have Zod schemas and placeholder JSON files that pages can consume through typed accessors; the build fails loudly on malformed content.
**Verified:** 2026-04-17
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | pnpm typecheck passes with Zod v4 and tsx available | VERIFIED | `pnpm typecheck` exits 0, no errors |
| 2 | bilingualString/proseString from shared.ts rejects smart quotes | VERIFIED | safeParse with U+201C returns `false`; error: "short_bio.es: smart quotes detected — use straight quotes" |
| 3 | siteConfig.groupName in site.ts propagates to importers via TypeScript | VERIFIED | siteConfig exported with `as const`, barrel re-exported through src/content/index.ts |
| 4 | .vscode/settings.json wires all 5 json.schemas entries | VERIFIED | All 5 `fileMatch` entries present, pointing to `./content/*.schema.json` |
| 5 | people.json parses: 19-21 entries, 5 PI / 2 postdoc / 6 PhD / 3-4 undergrad / 3-4 past | VERIFIED | 20 entries: pi=5, postdoc=2, phd=6, undergrad=3, past=4; 20 unique slugs |
| 6 | Exactly 8 photo references pointing at real files under public/people/ | VERIFIED | 8 photo fields; all 8 files exist in public/people/ (Esteban_C.png, Susana_L.png, Diana_LN.png, Gonzalo_SC.png, Matias_L.png, juanma_A.png, Nahuel_MG.png, Tomas_C.png) |
| 7 | publications.json: 10-15 entries, arXiv/DOI coverage (both/only-arxiv/only-doi/neither) | VERIFIED | 13 entries (2024-2026); both=8, only-arxiv=2, only-doi=2, neither=1 |
| 8 | research.json has exactly 4 canonical IDs; journal-club has upcoming+past with academic_year; outreach has >=2 types and link-present+absent | VERIFIED | research=4 IDs; jc=2 upcoming+3 past (all 3 with academic_year); outreach=4 types (talk/school-visit/article/interview), 3 with link, 1 without |
| 9 | pnpm build runs prebuild validate-content, exits 1 on malformed content, exits 0 clean | VERIFIED | Smart quote injection → exit 1 with "short_bio.es: smart quotes detected"; missing photo → exit 1 with "Photo not found"; clean data → exit 0; `pnpm build` succeeds end-to-end |

**Score:** 9/9 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/content/schemas/shared.ts` | bilingualString, proseString, canonicalString, optionalPhoto, slugString, arxivId, doiId, localize | VERIFIED | 171 lines; all helpers exported; SMART_QUOTES regex defined |
| `src/config/site.ts` | groupName, tagline (bilingual), affiliations, contactEmail, socialLinks | VERIFIED | 74 lines; groupName="Grupo de Cosmología", tagline es+en, 3 affiliations with URLs, contactEmail present |
| `.vscode/settings.json` | json.schemas for all 5 content files | VERIFIED | 9 lines; all 5 fileMatch entries present |
| `src/content/schemas/people.schema.ts` | PersonSchema, PeopleSchema, slug/category/photo/bilingual fields | VERIFIED | 166 lines; strictObject; superRefine for slug-uniqueness, past-needs-years, undergrad-needs-thesis_topic |
| `src/content/schemas/publications.schema.ts` | PublicationSchema, bare arXiv/DOI regex validators | VERIFIED | 119 lines; arxivId/doiId imported from shared |
| `src/content/schemas/research.schema.ts` | ResearchAreaSchema, bilingual title/descriptions | VERIFIED | 39 lines; all bilingual fields; order field |
| `src/content/schemas/journal-club.schema.ts` | JournalClubSessionSchema, upcoming/past status, academic_year | VERIFIED | 76 lines; status enum; academic_year optional on past sessions |
| `src/content/schemas/outreach.schema.ts` | OutreachActivitySchema, type enum, optional link | VERIFIED | 43 lines; type enum (talk/article/interview/school-visit/podcast/workshop/media); link optional |
| `src/content/accessors/people.ts` | getPeople, getPeopleByCategory, getPersonBySlug, getLocalizedPerson, getLocalizedPeople | VERIFIED | 121 lines; all 5 functions; bilingual resolution via localize() |
| `src/content/accessors/publications.ts` | getPublications, getPublicationById, filter functions | VERIFIED | 78 lines; parse at module load |
| `src/content/accessors/research.ts` | getResearchAreas, getLocalizedResearchAreas, getResearchAreaById | VERIFIED | 39 lines; all 3 functions |
| `src/content/accessors/journal-club.ts` | getJournalClub, getUpcomingSessions, getPastSessionsByYear | VERIFIED | 64 lines; grouped-by-year for past sessions |
| `src/content/accessors/outreach.ts` | getOutreach, typed accessors | VERIFIED | 43 lines |
| `src/content/index.ts` | Barrel re-exports all accessor functions + types + localize + siteConfig | VERIFIED | 52 lines; exports all 5 accessor modules, all 5 schema type pairs, localize/Locale, siteConfig/SiteConfig |
| `content/people.json` | 19-21 persons; stress-tests: long name, all category values, past with years | VERIFIED | 20 entries; "Maria Guadalupe Gonzalez Rios-Molina" (long name); all 5 categories; all 4 past members have years.start |
| `content/publications.json` | 10-15 entries, 2024-2026, all arXiv/DOI coverage paths | VERIFIED | 13 entries, years 2024-2026 |
| `content/research.json` | 4 entries with canonical IDs | VERIFIED | 4 entries: dark-matter, gravitational-waves, early-universe, artificial-intelligence |
| `content/journal-club.json` | >=1 upcoming, >=2 past with academic_year | VERIFIED | 2 upcoming, 3 past (all with academic_year field) |
| `content/outreach.json` | >=2 types, >=1 link-present, >=1 link-absent | VERIFIED | 4 types, 3 with link, 1 without |
| `content/people.schema.json` | draft-07, generated from Zod | VERIFIED | $schema = http://json-schema.org/draft-07/schema#; regenerated by `pnpm generate-schemas` |
| `content/publications.schema.json` | draft-07 | VERIFIED | $schema = http://json-schema.org/draft-07/schema# |
| `content/research.schema.json` | draft-07 | VERIFIED | $schema = http://json-schema.org/draft-07/schema# |
| `content/journal-club.schema.json` | draft-07 | VERIFIED | $schema = http://json-schema.org/draft-07/schema# |
| `content/outreach.schema.json` | draft-07 | VERIFIED | $schema = http://json-schema.org/draft-07/schema# |
| `scripts/validate-content.mjs` | Prebuild script: parse all 5 schemas, photo-existence check, file-grouped error output | VERIFIED | Exits 1 with smart-quote injection; exits 1 with missing photo; exits 0 on clean data |
| `scripts/generate-schemas.mjs` | Generates all 5 *.schema.json from Zod v4 z.toJSONSchema({target:'draft-07'}) | VERIFIED | Runs cleanly; prints "wrote *.schema.json" for all 5 |
| `package.json` scripts | prebuild, validate-content, generate-schemas | VERIFIED | prebuild=validate-content.mjs; validate-content=validate-content.mjs; generate-schemas=generate-schemas.mjs |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/content/accessors/people.ts` | `content/people.json` | `import rawPeople` + `PeopleSchema.parse()` | WIRED | Parse at module load; throws on invalid |
| `src/content/accessors/publications.ts` | `content/publications.json` | `import rawPublications` + `PublicationsSchema.parse()` | WIRED | Parse at module load |
| `src/content/accessors/research.ts` | `content/research.json` | `import rawResearch` + `ResearchSchema.parse()` | WIRED | Parse at module load |
| `src/content/accessors/journal-club.ts` | `content/journal-club.json` | `import rawSessions` + `JournalClubSchema.parse()` | WIRED | Parse at module load |
| `src/content/accessors/outreach.ts` | `content/outreach.json` | `import rawOutreach` + `OutreachSchema.parse()` | WIRED | Parse at module load |
| `src/content/index.ts` | all 5 accessor modules | `export * from "./accessors/*"` | WIRED | All 5 re-exported; siteConfig and localize also re-exported |
| `package.json` prebuild | `scripts/validate-content.mjs` | `node --import tsx scripts/validate-content.mjs` | WIRED | Runs before every `next build` |
| `getLocalizedPerson(slug, locale)` | bilingual fields | `localize(field, locale)` | WIRED | Confirmed: ES returns "Investigador Principal", EN returns "Principal Investigator" |
| `.vscode/settings.json` | `content/*.schema.json` | `json.schemas[].fileMatch` | WIRED | All 5 schema paths correctly mapped |
| `content/*.schema.json` | Zod schemas | `pnpm generate-schemas` | WIRED | `generate-schemas.mjs` imports from `src/content/schemas/*.ts` and writes to `content/` |

---

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|---------|
| DATA-01 (people schema + JSON) | SATISFIED | people.schema.ts (166 lines) + people.json (20 entries) parse cleanly; PeopleSchema has superRefine rules |
| DATA-02 (publications schema + JSON) | SATISFIED | publications.schema.ts (119 lines) + 13 publications; arXiv/DOI regex validated; all coverage paths present |
| DATA-03 (research schema + JSON) | SATISFIED | research.schema.ts + 4 canonical IDs with bilingual descriptions |
| DATA-04 (journal-club schema + JSON) | SATISFIED | journal-club.schema.ts + 2 upcoming + 3 past sessions; past sessions carry academic_year |
| DATA-05 (outreach schema + JSON) | SATISFIED | outreach.schema.ts + 4 activities; 4 distinct types; mix of link-present and link-absent |
| DATA-06 (site config) | SATISFIED | src/config/site.ts exports siteConfig with groupName, bilingual tagline, affiliations, contactEmail; barrel re-exported from src/content/index.ts |
| DATA-07 (build fails on malformed content) | SATISFIED | Smart quote injection → exit 1 with file+path+message; missing photo → exit 1 with path; pnpm build runs prebuild automatically |
| DATA-08 (*.schema.json generated from Zod) | SATISFIED | All 5 content/*.schema.json have $schema=draft-07; `pnpm generate-schemas` regenerates from Zod; .vscode/settings.json wires all 5 |
| I18N-03 (per-entity bilingual fields via typed accessors) | SATISFIED | getLocalizedPerson("esteban-calzetta","es").role = "Investigador Principal"; getLocalizedPerson("esteban-calzetta","en").role = "Principal Investigator"; localize() exported from barrel |

---

## Phase Success Criteria

| Criterion | Status | Evidence |
|-----------|--------|---------|
| 1. content/{people,publications,research,journal-club,outreach}.json exist with realistic placeholder data | PASS | All 5 files present; people=20 entries, pubs=13, research=4, jc=5, outreach=4; rich Spanish/English prose throughout |
| 2. Smart-quote or missing photo reference fails `pnpm build` with clear line-pointed error | PASS | Smart quote: "people.json → [0].short_bio.es → short_bio.es: smart quotes detected — use straight quotes" exit 1; Missing photo: "people.json → [0].photo → Photo not found: public/people/NonExistent_Photo.png" exit 1 |
| 3. src/config/site.ts owns group name, tagline, affiliations, contact email, social links | PASS | All 5 fields present; siteConfig re-exported from content barrel for single-import access |
| 4. Each content/*.json has a neighbouring *.schema.json with draft-07 reference | PASS | All 5 schema.json files have $schema=draft-07; .vscode/settings.json wires them; `pnpm generate-schemas` regenerates from Zod source |
| 5. Per-entity bilingual fields render in active locale via typed accessors | PASS | getLocalizedPerson() confirmed returning locale-resolved strings (es≠en); getLocalizedResearchAreas() also provides locale resolution |

---

## Anti-Patterns Found

None detected. No TODO/FIXME comments, no placeholder content markers, no empty implementations, no stub returns across all schema and accessor files.

---

## Human Verification Required

### 1. VS Code IntelliSense validation
**Test:** Open `content/people.json` in VS Code and add an invalid field (e.g. `"bogus_field": true`). Observe whether a red squiggle appears.
**Expected:** Red squiggle on `bogus_field` with an error message from the JSON language server.
**Why human:** Cannot verify VS Code editor behavior programmatically; requires live IDE session.

---

## Summary

Phase 2 goal is fully achieved. All 5 content type schemas are substantive Zod v4 implementations with slug uniqueness, smart-quote detection, photo-existence checks, and bilingual field enforcement. All 5 JSON data files parse cleanly and stress-test their schemas (long names, all category values, full arXiv/DOI coverage matrix). The prebuild pipeline (`validate-content.mjs`) exits non-zero on injected violations and is wired as `package.json` `prebuild`. The `generate-schemas.mjs` script regenerates draft-07 JSON Schema files from Zod source and all 5 are correctly mapped in `.vscode/settings.json`. Typed accessors and the barrel `src/content/index.ts` provide a complete one-line import surface with locale resolution. `pnpm typecheck`, `pnpm lint`, and `pnpm build` all pass with 0 errors.

---

_Verified: 2026-04-17_
_Verifier: Claude (gsd-verifier)_
