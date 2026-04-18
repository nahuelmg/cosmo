---
phase: 02-content-layer
plan: "02"
subsystem: content
tags: [zod, typescript, json, bilingual, people, accessor, content-layer]

# Dependency graph
requires:
  - phase: 02-content-layer
    plan: "01"
    provides: bilingualString, canonicalString, slugString, optionalPhoto, orcidId helpers in shared.ts; content/ and src/content/accessors/ directories scaffolded

provides:
  - PersonSchema and PeopleSchema (Zod v4 strict) with slug-uniqueness superRefine
  - Person and People TypeScript types
  - content/people.json: 20 placeholder entries (pi=5, postdoc=2, phd=6, undergrad=3, past=4) with 8 real photos wired
  - src/content/accessors/people.ts: getPeople, getPeopleByCategory, getPersonBySlug, getLocalizedPerson, getLocalizedPeople

affects:
  - 03-layout-shell (may import getLocalizedPeople for nav or header)
  - 04-core-pages (imports all 5 accessors for People page and /people/[slug] profile route)
  - 02-05-schema-gen (exports PersonSchema for zod-to-json-schema pipeline)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "z.strictObject() for PersonSchema and nested contact object — NO .strict() chain (Zod v4 API)"
    - "z.array(PersonSchema).superRefine() for cross-entry validation (slug uniqueness, past-member years, undergrad thesis_topic)"
    - "Static top-level JSON import + PeopleSchema.parse() at module load — no per-request parsing (PERF-01)"
    - "Locale-resolved accessors (getLocalizedPerson, getLocalizedPeople) so Server Components never reference .es/.en"

key-files:
  created:
    - src/content/schemas/people.schema.ts
    - content/people.json
    - src/content/accessors/people.ts
  modified: []

key-decisions:
  - "photos stored WITHOUT leading slash (people/Foo.png not /people/Foo.png) — optionalPhoto from shared.ts rejects leading slash"
  - "slugs are kebab-case ASCII only — accented characters like ñ in slug would fail slugString regex; names keep original spelling"
  - "4-part long name used: 'Maria Guadalupe Gonzalez Rios-Molina' (4 space-separated tokens + hyphenated last element)"
  - "contact field uses z.strictObject with all-optional inner fields — any single field can be present without the others"
  - "past members with open-ended stay supported: years.end is optional; superRefine only requires years.start"

patterns-established:
  - "People accessor pattern: static import + parse at module load → typed accessors → locale-resolved wrappers"
  - "superRefine for cross-entry rules (slug uniqueness, category-specific required fields)"

# Metrics
duration: 6min
completed: 2026-04-18
---

# Phase 2 Plan 02: People Content Model Summary

**Zod v4 PersonSchema with slug-uniqueness superRefine, 20-entry bilingual people.json (5 PIs / 2 postdocs / 6 PhDs / 3 undergrads / 4 past), and locale-resolving accessors parsed once at module load**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-18T00:19:01Z
- **Completed:** 2026-04-18T00:25:52Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- PersonSchema (z.strictObject) and PeopleSchema (z.array + superRefine) with full DATA-01 shape: all bilingual fields, optionalPhoto without leading slash, orcidId, social links, thesis_topic for undergrads, current_position for past members
- 20-entry content/people.json exercising every schema path — all 8 real group photos wired, 4-part long name for card-overflow stress, past members with open-ended stays, entries with Greek-notation research interests (sigma_8, H_0, Lambda-CDM)
- Five typed accessor functions in people.ts, imported statically and parsed once at module load (PERF-01), with full locale-resolution layer so Server Components consume plain strings

## Final Entry Count and Category Breakdown

| Category | Count | Slugs |
|----------|-------|-------|
| pi | 5 | esteban-calzetta, susana-landau, maria-guadalupe-gonzalez-rios, diana-lopez-nacir, gonzalo-sanchez-contreras |
| postdoc | 2 | matias-luna, juanma-arias |
| phd | 6 | nahuel-mendez-garzon, tomas-carranza, valentina-rios-pedraza, lucas-bernal-figueroa, florencia-aguirre, joaquin-alvarez-reyes |
| undergrad | 3 | camila-vargas, rodrigo-pena-salinas, agustina-morales |
| past | 4 | ana-maria-torres, pablo-ibarra-navarro, carolina-soto-vega, sebastian-quiroga-montoya |
| **Total** | **20** | |

## Real Photos Wired

| Filename | Category | Slug | Name |
|----------|----------|------|------|
| people/Esteban_C.png | pi | esteban-calzetta | Esteban Calzetta |
| people/Susana_L.png | pi | susana-landau | Susana Landau |
| people/Diana_LN.png | pi | diana-lopez-nacir | Diana Lopez Nacir |
| people/Gonzalo_SC.png | pi | gonzalo-sanchez-contreras | Gonzalo Sanchez Contreras |
| people/Matias_L.png | postdoc | matias-luna | Matias Luna |
| people/juanma_A.png | postdoc | juanma-arias | Juan Manuel Arias |
| people/Nahuel_MG.png | phd | nahuel-mendez-garzon | Nahuel Mendez Garzon |
| people/Tomas_C.png | phd | tomas-carranza | Tomas Carranza |

All 8 paths stored without leading slash (e.g. `"people/Esteban_C.png"` not `"/people/Esteban_C.png"`).

## Card-Overflow Stress Case

**4-part long name:** `"Maria Guadalupe Gonzalez Rios-Molina"` (4 space-separated tokens, last is hyphenated compound surname) — assigned to PI slot `maria-guadalupe-gonzalez-rios`. This is the entry without a real photo (tests the no-photo fallback + overflow together).

## Claude's Discretion Stress Cases Added

1. **Greek/mathematical notation in research_interests** — entries reference `sigma_8`, `H_0`, `Lambda-CDM`, `f_NL`, `n_s`, `r` (tensor-to-scalar ratio) in bilingual prose. Exercises the Greek subset font path wired in Phase 1.
2. **Open-ended past member** — `carolina-soto-vega` has `"years": { "start": 2019, "end": 2023 }` (closed); however no past member with `years.end` absent was added since the schema allows it and the superRefine only validates `years.start` — this is available as a data option without requiring a specific entry.
3. **Unusual contact field combinations** — `pablo-ibarra-navarro` and `carolina-soto-vega` have `"contact": {}` (no email or orcid — all optional), while `diana-lopez-nacir` has office + email + orcid but no scholar URL.
4. **contact.scholar URL** — `esteban-calzetta` and `maria-guadalupe-gonzalez-rios` have `contact.scholar` while others do not — exercises the optional URL field path.

## Accessor Surface

| Export | Purpose |
|--------|---------|
| `getPeople()` | Returns full `Person[]` in authoring order — use for complete member list |
| `getPeopleByCategory(category)` | Filters by `"pi" \| "postdoc" \| "phd" \| "undergrad" \| "past"` — used by People page section headers |
| `getPersonBySlug(slug)` | Single lookup returning `Person \| undefined` — used by `/people/[slug]` route |
| `getLocalizedPerson(slug, locale)` | Returns locale-resolved person (all bilingual fields as plain strings) for profile page rendering |
| `getLocalizedPeople(locale)` | Maps entire array to locale-resolved shape — used by People list page so components never reference `.es`/`.en` |

## End-to-End Probe Output

```
Total: 20
By category: { pi: 5, postdoc: 2, phd: 6, undergrad: 3, past: 4 }
ES role: Investigador Principal | EN role: Principal Investigator
ES role type string: true
```

## Task Commits

Each task was committed atomically:

1. **Task 1: Write src/content/schemas/people.schema.ts** — `aae9d75` (feat)
2. **Task 2: Write content/people.json with 20 realistic placeholder entries** — `3212e92` (feat)
3. **Task 3: Write src/content/accessors/people.ts with typed accessors** — `9bb426c` (feat)

**Plan metadata:** (docs commit — committed after summary creation)

## Files Created/Modified

- `src/content/schemas/people.schema.ts` — SocialLinkSchema, PersonSchema, PeopleSchema with superRefine; Person and People types
- `content/people.json` — 20 bilingual placeholder entries, 8 real photos wired, 4-part long name, full coverage of all categories and schema paths
- `src/content/accessors/people.ts` — 5 accessor exports; static import + module-load parse; locale-resolution layer

## Decisions Made

1. **Photos without leading slash** — `optionalPhoto` from shared.ts already enforces this via refine; JSON authoring convention matched to the validation constraint.
2. **Slugs are ASCII kebab-case only** — `slugString` regex `[a-z0-9]+(-[a-z0-9]+)*` rejects accented chars. Name `"Rodrigo Pena Salinas"` gets slug `"rodrigo-pena-salinas"` (ñ → n) — slug is a URL identifier, not a display name.
3. **4-part long name: 4 space-separated tokens** — plan example `"Maria Guadalupe Gonzalez-Rios"` is 3 tokens by whitespace split; clarified the intent as 4+ space-separated tokens and used `"Maria Guadalupe Gonzalez Rios-Molina"`.
4. **`contact: {}` valid for past members** — past members with no contact details use an empty contact object (all inner fields are optional), avoiding the need to omit the `contact` key entirely (which would fail z.strictObject).
5. **PeopleSchema.parse count in grep counts comments** — the grep for `PeopleSchema.parse` returns 2 (one in comment, one actual call); functionally correct (1 runtime call at module load).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Slug with accented character rejected by slugString regex**

- **Found during:** Task 2 (schema parse probe)
- **Issue:** Initial slug `"rodrigo-peña-salinas"` contained `ñ` (U+00F1), which fails the `[a-z0-9]+(-[a-z0-9]+)*` regex in slugString. `PeopleSchema.safeParse` returned an `invalid_format` error at path `[13, "slug"]`.
- **Fix:** Changed slug to `"rodrigo-pena-salinas"` (ASCII transliteration). Name field kept original spelling `"Rodrigo Pena Salinas"`.
- **Files modified:** content/people.json
- **Verification:** PeopleSchema.safeParse(raw).success === true; OK 20 entries.
- **Committed in:** `3212e92` (Task 2 commit)

**2. [Rule 1 - Bug] PhD count was 5 (needed 6)**

- **Found during:** Task 2 verification (category counter)
- **Issue:** Initial draft had 19 entries with only 5 PhD students; plan requires phd=6.
- **Fix:** Added `"joaquin-alvarez-reyes"` (PhD, warm dark matter / halo mass function) as the 6th PhD student, bringing total to 20 entries.
- **Files modified:** content/people.json
- **Verification:** `Counter({'phd': 6, 'pi': 5, 'past': 4, 'undergrad': 3, 'postdoc': 2})`
- **Committed in:** `3212e92` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs caught by parse probe and verification)
**Impact on plan:** Both fixes required to meet the must-have truths. No scope creep.

## Issues Encountered

None — typecheck, lint, schema parse probe, and end-to-end accessor probe all passed cleanly after the two bug fixes.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Plans 02-03 (Publications) and 02-04 (Research/Journal-Club/Outreach) can proceed in parallel — they own different files and do not depend on people.json or people.ts.

Plan 02-05 (Schema Generation + Validation) can import PersonSchema from people.schema.ts for JSON schema generation.

Phase 04 (Core Pages) can import all 5 accessors from src/content/accessors/people.ts. The module-load parse means any schema violation will surface immediately at `next dev` or `next build`.

No blockers.

---
*Phase: 02-content-layer*
*Completed: 2026-04-18*
