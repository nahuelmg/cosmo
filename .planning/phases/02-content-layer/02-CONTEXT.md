# Phase 2: Content Layer - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Zod-validated JSON content files for the five content types (people, publications, research, journal-club, outreach), a single typed `src/config/site.ts`, typed accessors that pages will consume, and a build-time validation pipeline that fails loudly on malformed content. Placeholder data is realistic and fully populated; real group photos (already committed to `public/`) are wired into people entries.

Out of scope for this phase: page rendering (Phase 4), navigation/layout chrome (Phase 3), arXiv/ADS importers (v2), link-rot checks (v2).

</domain>

<decisions>
## Implementation Decisions

### Bilingual field shape

- **Nested object** per translatable field: `short_bio: { es: "...", en: "..." }`. Not `_es`/`_en` suffixes, not split locale files.
- **Scope of translation**: everything user-visible is bilingual — bios, research-area titles *and* descriptions, outreach titles and descriptions, person titles/roles (e.g. "Estudiante de Doctorado" / "PhD Student"), affiliations as displayed.
- **Canonical-only fields**: person names, publication titles, publication author lists, journal names, DOI/arXiv identifiers. Academic convention — these stay in the paper's original language.
- **Missing-locale policy**: **fail build**. Zod requires both `es` and `en` non-empty on every bilingual field. A Spanish-only entry will not compile. (This is stricter than the UI-message policy from Phase 1, which was dev-warn/prod-silent — for entity content we want total coverage before a page can ship.)
- **Accessor shape**: typed accessors return locale-resolved strings based on the active request locale, so callers don't have to pick `.es` vs `.en` at the site. Planner decides exact signatures.

### Placeholder content

- **Realism**: realistic-looking, plausible cosmology content. Real-feeling names, plausible paper titles, bios that read like an institutional site. Site should look credible during dev review. All placeholder content must be clearly replaced before launch.
- **Coverage**: **full spec** — 5 PIs, 2 postdocs, 6 PhDs, 3–4 undergrads, 3–4 past members; ~10–15 publications across 3 years; 4 research areas; 3–4 journal-club sessions (mix of upcoming and past); 3–4 outreach entries. Every schema path exercised.
- **Photo wiring**: real group photos in `public/` are used by placeholder person entries. Available files:
  - `public/people/Esteban_C.png`
  - `public/people/Matias_L.png`
  - `public/people/Nahuel_MG.png`
  - `public/people/Gonzalo_SC.png`
  - `public/people/Diana_LN.png`
  - `public/people/Tomas_C.png`
  - `public/people/juanma_A.png`
  - `public/people/Susana_L.png`
- People without a real photo: `photo` field stays empty/absent (optional in schema), page will render a clean blank/initial state when Phase 4 arrives.
- **Hero slider covers**: `public/Portadas/portada_1.jpg` and `public/Portadas/portada_2.png` are real. HOME-01 calls for 3–5 hero images — Phase 4 may need one more cover or the placeholder JSON can start with 2 and flag the gap.
- **Stress case to include**: at least one person with a **long multi-part name** (forces card overflow exposure). Other stress cases (Greek/math notation, aspect-ratio mix, missing-optional rows) are Claude's discretion — include where natural but not mandatory.

### File layout

- **One file per content type** — matches DATA-01..05 verbatim:
  - `content/people.json`
  - `content/publications.json`
  - `content/research.json`
  - `content/journal-club.json`
  - `content/outreach.json`
- **Site config**: `src/config/site.ts` exports a single typed object (group name, tagline, affiliations, contact email, social links). Per DATA-06 — changing group name here updates every rendering site.
- **Slug source**: **explicit `slug` field** on every person entry. Schema validates kebab-case + uniqueness. Stable across name changes; maintainer controls URLs.
- **Publication IDs**: **explicit `id` field** on every publication. Used for React keys, URL anchors, future permalinks. Schema validates uniqueness. Not derived from DOI/arXiv (some pubs won't have either).
- **Journal Schema (`*.schema.json`)**: generated from each Zod schema and placed next to its JSON file so VS Code picks it up via `$schema` reference (DATA-08). Generation runs as a build step / script.

### Build-failure strictness

Strict across the board — this is an institutional site with infrequent academic edits. Loud failures beat silent holes.

- **Schema violations**: fail build.
- **Missing photo reference** (path points to a file not in `public/`): fail build, per DATA-07.
- **Smart quotes (“ ” ‘ ’) in prose fields**: fail build with line pointer. Maintainers copy from Word/Docs — smart quotes must be caught.
- **Unknown fields** in JSON: fail build (Zod `.strict()`). Catches typos like `affilation`.
- **Missing locale on a bilingual field**: fail build (see Bilingual Fields above).
- **Error message format**: file path → JSON path → expected/received. Multi-issue errors group by file. Example layout:
  ```
  ✖ Content validation failed

    content/people.json
    └─ [2].contact.orcid
       Expected string (ORCID format)
       Received: null

    content/publications.json
    └─ [7].title
       Smart quote detected: "Dark Matter"
       Use straight quotes or &ldquo;
  ```

### Claude's Discretion

- **Entry ordering within files** — array-with-explicit-order vs object-keyed-by-slug vs array-with-accessor-sort. User left this open. Choose based on (a) maintainer ergonomics (easy to reorder by moving JSON blocks) and (b) whether display order needs to be authored or inferred (e.g. role-then-alpha for people, date-desc for publications).
- **Typed accessor signatures** (`getPeople()`, `getPersonBySlug()`, `getPublicationsByYear()`, etc.).
- **Zod schema composition** — shared sub-schemas for bilingual field, social-links block, photo-ref.
- **JSON-Schema generator choice** (`zod-to-json-schema`, `@zod-prisma/*`, etc.).
- **Smart-quote detection mechanism** (Zod `.refine()` per field vs a pre-parse lint pass).
- **Photo-existence check mechanism** (filesystem check in a `refine()` vs a post-parse validation step).
- **Stress cases beyond long names** — include Greek notation, aspect-ratio mix, missing-optional fields where they fit naturally, but not as a mandate.

</decisions>

<specifics>
## Specific Ideas

- **Real photos already provided** — user uploaded 8 group member portraits to `public/people/` and 2 hero covers to `public/Portadas/`. Placeholder entries should map to these real files where identities plausibly match.
- **Tone of placeholder prose** — site should read like a credible institutional cosmology group during dev. Not obviously-fake names; not lorem ipsum.
- **Academic convention first** — publications carry paper-native language (titles, authors, journals stay as published); translation layer only applies to the group's own content.
- **Strict-first philosophy** — this is an institutional site with rare edits by non-developers. Every quiet failure mode is a risk of shipping broken content, so each ambiguous case defaults to "fail build loudly."

</specifics>

<deferred>
## Deferred Ideas

None raised during discussion — scope stayed inside the content-layer boundary.

(Implied deferrals that were mentioned in Requirements/Roadmap as out-of-scope for this phase and remain so: arXiv/ADS importers → v2, link-rot check → v2, maintainer-facing content/README → v2, Events expansion → v2.)

</deferred>

---

*Phase: 02-content-layer*
*Context gathered: 2026-04-17*
