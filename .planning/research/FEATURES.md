# Feature Research — v1.1 Publication Sync (InspireHEP + arXiv)

**Domain:** Academic cosmology group website — publication auto-sync layer
**Researched:** 2026-04-18
**Confidence:** HIGH for API behavior (verified against live API); MEDIUM for UX conventions
(observed on peer sites; LOW for "last-N-years" cutoff — no authoritative norm found,
recommendation below is reasoned inference from domain practice)

**Scope note:** This file covers *only* the v1.1 feature set (publication sync, display
conventions, source tagging, per-profile filtering). It supersedes the "Future Consideration
(v2+) — arXiv / ADS / ORCID auto-import" section of the v1.0 FEATURES.md.
The v1.0 table-stakes features (people directory, research areas, bilingual toggle, etc.)
remain in the prior file.

---

## 1. Matching Strategy: How to Filter InspireHEP Returns

### Problem statement

A senior PI in HEP cosmology (e.g. Esteban Calzetta) may have 80–200 papers in InspireHEP.
Not all of them belong on a group site that represents *current group activity*. The sync
script must decide which papers to include.

### What the API supports (HIGH confidence — verified against live InspireHEP API)

**Primary author identifier — BAI (INSPIRE author identifier):**
Query syntax: `a E.Calzetta.1` (BAI format)
Endpoint: `https://inspirehep.net/api/literature?q=a+E.Calzetta.1&sort=mostrecent&size=25`
This is the most precise query; avoids all name-collision false positives.
BAI is stable and unique per person in InspireHEP.

**Date range filter:**
Syntax: `de > 2020` (earliest-date field, "de") or `date 2020->2026`
Can be combined: `a E.Calzetta.1 and de > 2020`
Endpoint: `https://inspirehep.net/api/literature?q=a+E.Calzetta.1+and+de+>+2020&sort=mostrecent`

**Affiliation filter:**
Syntax: `aff "Buenos Aires"` or `aff "CONICET"`
Less reliable than BAI — InspireHEP affiliations are not always normalized; some papers lack
affiliation metadata entirely. Use as a secondary refinement, not a primary filter.

**Document-type filter:**
`tc p` = peer-reviewed journal paper
`tc c` = conference proceeding
No documented filter for "preprint only" beyond the absence of `publication_info`.

**Rate limits:** 15 requests per 5-second window; 429 on breach.
Pagination: `size` (max 25 by default, can be increased), `page`.

### What the arXiv API supports (MEDIUM confidence — official docs, some gaps)

ArXiv does not have stable author IDs equivalent to BAI. Author search by name string only.
`http://export.arxiv.org/find/grp_physics/1/au:+Calzetta_E/0/1/0/all/0/1`
Returns Atom XML; requires `fast-xml-parser` or similar to parse.
Fields available: title, authors (plain text list), submitted date, updated date, categories,
abstract, journal_ref (if published), doi (if published).
No citation count. No affiliation data.
Rate limit: 3 requests per second burst; 1 request per second sustained; enforced by
`crawl-delay` in robots.txt and HTTP 429.

### Recommended matching strategy for v1.1

**Primary source: InspireHEP (query by BAI)**
- Store each current member's BAI in `content/people.json` (e.g. `"inspirehep_id": "E.Calzetta.1"`)
- Query InspireHEP per member: `a {bai} and de > {cutoff_year}`
- Cutoff: `de > {current_year - 5}` for /people/[slug] display; `de > {current_year - 10}`
  for full /publications archive (or no date filter, collect all — see Section 2)
- No affiliation filter in the primary query; too unreliable. Affiliation mismatch = false
  negatives (papers from earlier career at different institution, or papers with missing aff).
- Date filter is the right primary scoping mechanism for a "recent output" feature.

**Secondary source: arXiv (query by name)**
- Store `arxiv_author_id` in people.json (format: "Calzetta_E" as used in arXiv search URLs)
- Query arXiv `find` endpoint or Atom search API per member
- arXiv returns preprints that may not yet be indexed in InspireHEP (typical lag: 24h–1 week)
- arXiv also returns preprints that ARE already in InspireHEP; no automatic dedup in v1.1
  (per locked decision: keep both as separate source-tagged entries)

**Manual exclusion list:**
- Add an optional `exclude_arxiv_ids` array per person in people.json
- Allows PI to exclude papers from before the group's founding, or papers that belong to
  a different group/collaboration but happen to match by author name
- This is the pragmatic solution that every real HEP group site uses; no automated heuristic
  is reliable enough to handle edge cases (early-career papers, large collaboration papers
  where the PI was tangential, conference proceedings the group doesn't want foregrounded)
- LOW effort to implement; HIGH value for accuracy

**Inclusion of conference proceedings:**
- InspireHEP `tc c` papers typically appear alongside `tc p` papers in BAI queries
- Decision required: include proceedings or not?
- Peer site observation: MPA, CCA, UCL Cosmoparticle all include only journal papers + arXiv
  preprints on group pub pages; conference proceedings are secondary
- Recommendation: include `tc p` (peer-reviewed) + unpublished preprints (no `tc` filter yet
  means they appear); *exclude* `tc c` (conference proceedings) unless explicitly requested
- Implementation: filter out records where `publication_info[].material == "proceedings"` or
  where `texkey` contains conference abbreviation patterns (fragile); cleaner to keep `tc p +
  preprints` by checking `publication_info[].journal_title` is a known journal (HIGH effort)
  OR simply include everything and let manual exclusion handle edge cases (LOW effort, v1.1)

---

## 2. Per-Profile Display: Last-N-Years Filter

### What peer sites actually do (MEDIUM confidence — observed, not documented)

| Site | Per-profile pub strategy | Source |
|------|--------------------------|--------|
| KIPAC (Stanford) | Single central "arXiv discovery" link — no per-profile pub list | Verified via site |
| CCAPP (OSU) | No per-profile publication listing; people directory only | Verified via site |
| UCL Cosmoparticle | Group-level flat reverse-chron list; no per-profile cutoff | Verified via site |
| UCL Astrophysics | Group-level list, "et al." after ~4 authors, linked to ADS | Verified via site |
| IRIS-HEP | Group-level, by-date + by-area filters, citation counts shown | Verified via site |
| IAS, MPA, Perimeter | Individual profiles link to InspireHEP or ADS author pages externally | Inferred |

**Key finding:** Most peer cosmology group sites do NOT host a curated per-profile publication
list. Instead, they link to the researcher's external InspireHEP, ADS, or Google Scholar page.
The v1.1 decision to build a per-profile last-N-years display is a *differentiator*, not a
table stake. This is good — it creates something more useful than the peer average.

### Last-N-years recommendation

**Recommendation: 5 years (current_year - 5 inclusive).**

Rationale:
- A postdoc joining in 2021 would have all their career output visible (typical postdoc term
  is 2–3 years; most entered during 2020–2024 for a 2026 site).
- A PhD student joined in 2022 would show all papers from their candidature.
- A PI's 5-year window captures their recent research directions without overwhelming the
  profile page with career-spanning output.
- 5 years matches the typical grant cycle evaluation window (CONICET PICT is 3–5 year grants;
  ANPCyT evaluates "last 5 years of output" explicitly in grant assessments).
- At 5 years, a productive PI might show 15–30 papers; a postdoc 5–12; a PhD 2–6.
  These are manageable list lengths.
- 3 years is too short: a PhD student who published their first paper in year 1 of a 4-year
  program would see it vanish before they graduate.
- 10 years is too long for a profile page; appropriate for a CV, not a website profile.
- "All papers" is appropriate on /publications (full archive), not on /people/[slug].

**Implementation:** Default cutoff = `current_year - 5`. Make it a config constant, not
hardcoded, so it can be adjusted in one place.

**Show count:** Yes — display total papers in window as "(N publicaciones)" subtitle below
the section heading. It's a quick credibility signal for prospective applicants and funders.
Observed on IRIS-HEP (shows "[N citations]" per paper); convention supports showing counts.

**Sort order:** Reverse-chronological (newest first) within the N-year window.
HEP convention universally uses reverse-chrono (InspireHEP, ADS, arXiv all default to
"mostrecent"). Co-author alphabetical order preserved within each paper's author list (HEP
convention: authors are alphabetical by surname within a paper; preserve that order from API).

---

## 3. Group-Aggregate Page (/publications)

### Co-author deduplication question

When two group members co-author a paper, the group /publications page should show it ONCE.

**Observation:** No surveyed peer site shows a paper twice because two members co-authored it.
UCL Cosmoparticle, UCL Astrophysics, IRIS-HEP — all deduplicate by paper identity.

**How to deduplicate in v1.1:**
- InspireHEP records each have a `control_number` (stable integer ID). Use this as the
  dedup key for InspireHEP-sourced entries.
- arXiv entries have a stable arXiv ID (`arxiv_eprints[].value`). Use this as dedup key.
- Since v1.1 keeps InspireHEP and arXiv as *separate source-tagged entries* (locked decision),
  the dedup operates only within each source: collect all InspireHEP papers for all members,
  deduplicate by `control_number`, keep one entry per paper.
- The same paper appearing in both InspireHEP AND arXiv will show twice (two different
  source-tagged entries). This is the v1.1 locked behavior.

**Group member highlighting:**
When displaying a deduplicated paper, highlight (bold or colored) all author names that
match current group members. This replaces the "which member does this paper belong to"
attribution problem — the paper appears once, the group member authorship is indicated by
visual treatment of their name in the author list.

Implementation: at render time, for each paper, check each author's `full_name` against
a set of group member names. Bold or apply a CSS class to matching names.
Edge cases: name normalization (diacritics, initials vs full names). Store a
`display_name_normalized` on each person for fuzzy matching.

**Author list format on /publications:**
Show all authors if <= 5 authors. If > 5 authors, show first 3 + "et al." with a
"show all" toggle (or tooltip). This matches the UCL Cosmoparticle convention (uses "incl."
for large collaborations) and APS journal style (list all up to 10, then et al.).
For HEP cosmology, many papers have 5–15 authors, so a 5-author threshold with et al. is
appropriate. Large collaboration papers (ATLAS, Planck, LSST) may have hundreds of authors —
these should definitely use "et al." with first author or first N authors shown.

---

## 4. Metadata Fields for HEP Cosmology

### Fields confirmed available in InspireHEP API (HIGH confidence — live API verified)

| Field | API path | Notes |
|-------|----------|-------|
| Title | `titles[0].title` | Prefer `source: "arXiv"` over `source: "APS"` if both present; LaTeX not rendered |
| Authors | `authors[].full_name` | Format: "Surname, First" — full list |
| InspireHEP record ID | `control_number` | Stable integer; use as dedup key |
| arXiv ID | `arxiv_eprints[0].value` | Format: "YYMM.NNNNN"; absent for journal-only papers |
| arXiv categories | `arxiv_eprints[0].categories` | e.g. ["astro-ph.CO", "gr-qc"] |
| DOI | `dois[0].value` | Absent for preprints; format: "10.xxxx/..." |
| Journal title | `publication_info[0].journal_title` | Abbreviated (e.g. "Phys.Rev.D"); absent for preprints |
| Journal volume | `publication_info[0].journal_volume` | String |
| Journal issue | `publication_info[0].journal_issue` | String |
| Article ID / page | `publication_info[0].artid` | String; replaces page range in modern journals |
| Publication year | `publication_info[0].year` | Integer |
| Preprint date | `preprint_date` | ISO date string "YYYY-MM-DD"; always present if arXiv-indexed |
| Citation count | `citation_count` | Integer; updated by InspireHEP nightly |

### Fields available from arXiv API (MEDIUM confidence — API docs)

| Field | arXiv Atom element | Notes |
|-------|-------------------|-------|
| Title | `<title>` | Plain text; may differ from InspireHEP title |
| Authors | `<author><name>` | Full name; may be "Surname, First" or "First Surname" |
| arXiv ID | `<id>` URL tail | e.g. "2601.09812" |
| Primary category | `<arxiv:primary_category>` | e.g. "astro-ph.CO" |
| Submitted date | `<published>` | ISO 8601 datetime |
| Updated date | `<updated>` | ISO 8601 datetime |
| Abstract | `<summary>` | Full text |
| DOI | `<arxiv:doi>` | Present if publisher submitted it |
| Journal ref | `<arxiv:journal_ref>` | Free text; not structured |
| Comment | `<arxiv:comment>` | May say "accepted to Phys.Rev.D" or page count |

### Which fields to store in publications.json for v1.1

The existing v1.0 `publications.json` schema is:
`id, authors[], title, journal, year, arxiv, doi, topic_tags[], abstract`

v1.1 must extend this schema minimally to support source-tagging and sync metadata:

| New field | Type | Purpose |
|-----------|------|---------|
| `source` | `"inspirehep" \| "arxiv" \| "manual"` | Source tag for display badge |
| `inspirehep_id` | `number \| null` | InspireHEP `control_number`; dedup key |
| `preprint_date` | `string \| null` | ISO date; for sorting preprints without a year |
| `status` | `"preprint" \| "published"` | Distinguish preprint vs peer-reviewed |
| `citation_count` | `number \| null` | From InspireHEP; null for arXiv-only entries |
| `synced_at` | `string` | ISO datetime; when this entry was last updated by sync script |

**What NOT to store in publications.json:**
- Raw affiliation data (too large, irrelevant for display)
- arXiv categories (stored in topic_tags[] instead, mapped at sync time)
- Journal volume/issue/artid (fold into existing `journal` field as formatted string)
- Author ORCID / InspireHEP IDs (too heavy for a JSON content layer)

### Citation count: include or exclude?

**Recommendation: store in JSON but do NOT display on the site by default.**

Rationale:
- Citation counts go stale immediately after each weekly sync; displaying a number that is
  "last week's count" without the staleness date is misleading.
- h-index and citation-count badges feel self-promotional on an institutional site (see
  Anti-Features below).
- Storing the field preserves future optionality (v2+ could surface "highly cited" as a
  filter, or display counts with explicit "as of [date]" attribution).
- If displayed, show "as of [synced_at]" explicitly. Never display without date context.

---

## 5. Source-Tagging UX (Two-Source Display)

### Locked decision context

v1.1 keeps InspireHEP and arXiv as separate entries (no dedup across sources). This means
the same paper may appear twice on /publications: once as an arXiv preprint entry, once as
an InspireHEP published-version entry.

### UX convention for this pattern

No peer cosmology group site does this exact pattern (they either pick one source or dedup).
IRIS-HEP comes closest: it shows arXiv ID + InspireHEP record link + DOI all on one entry,
but that's because they use InspireHEP as the single source of truth and annotate it with
arXiv/DOI crosslinks — not two separate entries.

**Recommended approach: source badge on each entry**

Each publication card/row gets a small pill badge:
- "arXiv" badge (links to arxiv.org/abs/[id]) — orange/red, arXiv's brand color
- "InspireHEP" badge (links to inspirehep.net/literature/[id]) — no distinctive brand color;
  use a neutral/secondary style
- "Manual" badge (for v1.0 hand-curated entries) — muted, indicates no sync provenance

Badge placement: right-aligned in the pub row, next to the DOI/arXiv links.
Size: small (text-xs), not the dominant visual element.

**Filter toggle:**
On /publications, offer a source filter: "All / InspireHEP / arXiv / Manual"
This lets sophisticated users (peers, the PI themselves) see which papers came from which
source. It also allows the same paper showing twice to be understood (one per source).

**User-visible explanation:**
Add a small footnote below the /publications heading: "Publications are fetched weekly from
InspireHEP and arXiv and may include duplicate entries for the same paper from different
sources." This manages expectations for the inevitable duplicates.

**On /people/[slug]:**
Show source badge per entry. No filter toggle needed on the profile page (shorter list).

---

## 6. Display Format

### HEP-cosmology citation style norm (MEDIUM confidence — verified via APS journal
    style guides and peer site observation)

HEP uses a journal-abbreviated citation format, not APA or Vancouver. The de facto standard
on group websites is a hybrid of the bibliographic style used in Physical Review journals:

**Format for a published paper:**
`Authors. "Title." Journal Abbr. Volume, ArticleID (Year). arXiv:NNNNN [category]. DOI.`

**Format for a preprint:**
`Authors. "Title." Preprint (Year). arXiv:NNNNN [category].`

**Examples matching peer sites (UCL Cosmoparticle, IRIS-HEP observation):**

Published:
> Rodríguez, M., Gómez, L., et al. "The Λ-CDM Tension in Recent H₀ Measurements: A Bayesian
> Reanalysis." *Phys. Rev. D* 113, 023501 (2026). arXiv:2601.09812 [astro-ph.CO].
> DOI: 10.1103/PhysRevD.113.023501

Preprint:
> Gómez, L., et al. "Neural Emulators for Dark Matter Halo Mass Functions at z > 2."
> Preprint (2026). arXiv:2603.15744 [astro-ph.CO].

**Author list treatment:**
- APS style (HIGH confidence — from APS author guide): list all authors up to 10; if > 10,
  list first 10 followed by "et al."
- For a group website (not a formal citation): show all authors if ≤ 5; show first 3 + "et al."
  if > 5. This is the IRIS-HEP pattern and UCL Cosmoparticle pattern.
- HEP author order is alphabetical by surname within a paper (this is the field convention).
  Preserve the order as returned by InspireHEP (already alphabetical in most cases).

**Journal abbreviation:**
Use InspireHEP's abbreviated journal title (`publication_info[0].journal_title`) directly —
it is already in standard HEP abbreviation form ("Phys.Rev.D", "JCAP", "Astrophys.J.").
For display, add a space after the period: "Phys. Rev. D" — cosmetic only.

**Year field:**
Use `publication_info[0].year` for published papers; use `preprint_date` year for preprints.
Never show only "year" without distinguishing published vs preprint status.

**Title rendering:**
InspireHEP titles may contain LaTeX (`$\Lambda$-CDM`). Either: strip LaTeX and render plain
text, OR use a lightweight LaTeX-to-Unicode converter for common math. For v1.1,
recommend: use InspireHEP's `titles` array and prefer the source that has Unicode or HTML
math. In practice, most cosmology titles use Unicode subscripts/superscripts directly in
the InspireHEP record; LaTeX is the exception. Flag for testing against real PI data.

---

## Feature Landscape

### Table Stakes (Must Have for Publication Sync to Feel Complete)

| Feature | Why Expected | Complexity | v1.0 Dependency |
|---------|--------------|------------|-----------------|
| **Source badge per entry** ("arXiv" / "InspireHEP" / "Manual") | Two-source-no-dedup means users must understand provenance; badge is the minimum disambiguation | LOW | Requires `source` field in publications.json schema (new) |
| **Preprint vs published status indicator** | Academic audiences need to know if a paper is peer-reviewed or a preprint; conflating them is a credibility error | LOW | Requires `status` field in publications.json schema (new) |
| **arXiv link per entry** | Every HEP academic expects to click through to the arXiv PDF; it's the primary reading path in this field | LOW | `arxiv` field already in v1.0 schema; must be surfaced as a link |
| **DOI link per entry** | Published papers need DOI for formal citation; funders and grant reviewers click DOIs to verify | LOW | `doi` field already in v1.0 schema; already rendered as link |
| **Reverse-chronological sort on /publications** | Universal convention in HEP; any other order reads as broken | LOW | v1.0 already sorts by year; must sort by `preprint_date` when `year` ties |
| **Year grouping on /publications** | v1.0 already does this; must be preserved for synced entries | LOW | v1.0 Publications page layout; no change needed |
| **Last-5-years filter on /people/[slug]** | Without cutoff, a PI with 80 papers dominates their profile page; 5 years keeps it relevant | LOW | `preprint_date` or `year` field; filter at render time |
| **Author count shown on profile** | "(N publicaciones en los últimos 5 años)" — credibility signal for applicants and funders | LOW | Computed from filtered list at render time |
| **Sync script with per-member BAI query** | Core mechanism; per-member InspireHEP BAI query + date range | MEDIUM | people.json must have `inspirehep_id` (BAI) field (new) |
| **Weekly GitHub Actions cron job** | Automation is the point of v1.1; without it, sync never runs | LOW | GitHub Actions workflow file; Vercel webhook or commit-triggers-rebuild |
| **Manual exclusion list per person** | Without it, early-career papers / large-collaboration papers contaminate the group pub page | LOW | `exclude_arxiv_ids` array in people.json (new) |
| **Staleness-safe design** | Synced data is stale between runs; UI must not imply real-time freshness | LOW | Add "Actualizado el [date]" to /publications header |
| **Source filter on /publications** ("All / InspireHEP / arXiv / Manual") | Necessary to make sense of duplicates from two sources | LOW | Filter UI component; `source` field in publications.json |

### Differentiators (Elevate Beyond Peer Site Average)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Group member author highlighting** (bold names of current members in author lists) | Immediately answers "was this a group paper or just one member's collaboration?" | MEDIUM | Requires name normalization; store `display_name_normalized` in people.json |
| **"as of [date]" staleness indicator** on citation counts (if shown) | Honest, professional; avoids misleading users with week-old counts | LOW | Show `synced_at` date alongside any count display |
| **Topic tag auto-assignment from arXiv categories** | arXiv categories (astro-ph.CO, gr-qc, hep-th) map naturally to existing topic_tags (CMB, dark matter, early universe, gravitational waves) | MEDIUM | Requires a category → tag mapping table in sync config |
| **"Last updated [date]" on /publications** | Shows the site is alive; funders and applicants look for signs of activity | LOW | Display `max(synced_at)` across all synced entries |
| **Per-person arXiv author page link** on /people/[slug] | Prospective students often navigate to arXiv to see full author record; shortcut saves 3 clicks | LOW | Store `arxiv_author_id` in people.json; render as "View on arXiv" link |
| **Bilingual source labels** (Spanish: "Prepublicación" for preprint; "Publicado en" for journal) | v1.1 must maintain bilingual parity; the sync layer introduces new UI strings | LOW | Requires i18n strings in next-intl message files |
| **Footnote explaining two-source design** | Prevents user confusion about duplicate entries; transparent about automated provenance | LOW | One static bilingual string on /publications |

### Anti-Features (Deliberately NOT to Build in v1.1)

| Feature | Why Requested | Why Avoid | Alternative |
|---------|---------------|-----------|-------------|
| **Citation count display as a headline metric** | "Show h-index / citation count per paper" | Stale data + self-promotional tone = credibility damage if counts are wrong or look like vanity metrics. APS journals say counts belong in CVs, not web bios. Peer academic sites (MPA, IAS) do NOT display citation counts on group pages. | Store `citation_count` in JSON silently; surface only as "as of [date]" if shown at all. Better: link to InspireHEP author page where live counts are canonical. |
| **h-index badge on PI profiles** | "Quantifies the PI's impact" | h-index from a cached JSON is always stale. Inflated h-index looks boastful; underweighted h-index looks weak. Academic peers know h-index is context-dependent. Real impact shows in the publications themselves. | Link to Google Scholar or InspireHEP author page which shows live h-index with canonical data. |
| **Automatic deduplication across InspireHEP + arXiv** | "Avoid showing same paper twice" | Dedup requires comparing possibly mismatched DOI / arXiv ID across sources; edge cases include papers where DOI is absent, or arXiv ID in InspireHEP doesn't match the arXiv API result. v1.1 scope is weekly GitHub Action, not a sophisticated ETL. Dedup is v2+. | Source badge + filter toggle makes duplicates understandable. Manual exclusion list handles egregious cases. |
| **Real-time publication count via API** | "Show live paper count" | API rate limits (15 req/5s) make real-time queries from browser infeasible for a group with 5+ members. Plus Next.js static export means no server-side real-time calls. | Weekly sync writes counts to JSON; display from that. |
| **Per-paper abstract on /publications** | "Show abstracts inline" | Abstracts add significant length; /publications would become 50+ screenfuls. Academic users go to arXiv for abstracts. | Show title + authors + links only. Abstract already in publications.json for SEO (structured data), not display. |
| **InspireHEP embed iframes** | "Just embed InspireHEP's own author page" | Third-party iframes break CSP, load slowly, are unthemed, and show irrelevant UI (InspireHEP's own nav, suggestions, etc.). | Query the API, render your own UI. |
| **arXiv "new submissions" feed** | "Show today's relevant arXiv papers" | This is a different feature (literature monitoring), not publication attribution. Out of scope for a group website. | InspireHEP's own new-submissions feed for researchers; not a group website feature. |
| **Author-level affiliation filtering in query** | "Only pull papers where the author was affiliated with UBA" | InspireHEP affiliation data is spotty; many preprints lack affiliation entirely. This would silently drop valid papers. | Date filter + BAI is reliable; manual exclusion list handles edge cases. |
| **Full conference proceedings import** | "Include all our conference talks" | Conference proceedings clutter the publication list and dilute the signal of peer-reviewed output; they are typed `tc c` in InspireHEP and are not the primary output academic audiences evaluate. | Include only if explicitly flagged; add a `show_proceedings` config boolean, default false. |

---

## Feature Dependencies

```
people.json schema (v1.1 additions)
  ├── inspirehep_id (BAI string)   ──required by──> sync script (InspireHEP query)
  ├── arxiv_author_id              ──required by──> sync script (arXiv query)
  ├── exclude_arxiv_ids[]          ──required by──> sync script (exclusion filter)
  └── display_name_normalized      ──required by──> author highlighting at render time

publications.json schema (v1.1 additions)
  ├── source                       ──required by──> source badge + source filter UI
  ├── status                       ──required by──> preprint/published indicator
  ├── inspirehep_id                ──required by──> dedup within InspireHEP source
  ├── preprint_date                ──required by──> last-5-years filter on /people/[slug]
  ├── citation_count               ──required by──> optional count display (future)
  └── synced_at                    ──required by──> "last updated" display on /publications

sync script (scripts/sync-publications.ts)
  ├── requires──> people.json (inspirehep_id, arxiv_author_id per member)
  ├── requires──> InspireHEP API (rate limit: 15 req/5s)
  ├── requires──> arXiv API (rate limit: 1 req/s sustained)
  └── writes──> content/publications.json

GitHub Actions cron workflow
  ├── requires──> sync script
  ├── requires──> GITHUB_TOKEN (for git commit of updated publications.json)
  └── triggers──> Vercel rebuild (via commit push or webhook)

/publications page (display layer)
  ├── source filter UI             ──requires──> source field in publications.json
  ├── "last updated" display       ──requires──> synced_at field in publications.json
  ├── source badge                 ──requires──> source field
  └── year grouping                ──requires──> year + preprint_date fields

/people/[slug] profile (display layer)
  ├── last-5-years section         ──requires──> preprint_date field
  ├── author count display         ──computed from──> filtered list length
  └── source badge per entry       ──requires──> source field
```

### Dependency Notes

- **Schema must be locked and Zod validators updated before sync script is written.**
  The sync script's output must conform to the updated schema; writing it against an
  unstable schema causes rework.
- **people.json needs `inspirehep_id` before the sync script can query InspireHEP.**
  This field must be populated for every current member (PI, postdoc, PhD). If even one
  member lacks a BAI, their papers are missed entirely.
- **`preprint_date` is the correct sort key for preprints,** not `year`. A paper posted
  in December 2025 and published in January 2026 has `year: 2026` but `preprint_date:
  2025-12-XX`. Sort by `preprint_date` where available, fall back to `year`.
- **Bilingual i18n strings** must be added for all new UI labels (source badges, status
  indicators, "last updated", filter labels) before the Publications page is updated.

---

## MVP Definition for v1.1

### Must Ship (v1.1 core)

- [ ] **Schema extension** — add `source`, `status`, `inspirehep_id`, `preprint_date`,
  `citation_count`, `synced_at` to `publications.schema.json` + Zod validators
- [ ] **people.json extension** — add `inspirehep_id`, `arxiv_author_id`,
  `exclude_arxiv_ids`, `display_name_normalized` fields
- [ ] **Sync script** — `scripts/sync-publications.ts`:
  - Query InspireHEP per member by BAI + date filter (last 10 years for archive)
  - Query arXiv per member by author name
  - Apply exclusion lists
  - Transform to publications.json shape
  - Write output (merge with existing manual entries, mark source)
- [ ] **GitHub Actions workflow** — weekly cron (`0 6 * * 1`), commit updated JSON,
  push to trigger Vercel rebuild
- [ ] **Source badge** on publication entries (display layer, /publications + /people/[slug])
- [ ] **Preprint vs published indicator** on each entry
- [ ] **Source filter toggle** on /publications ("Todos / InspireHEP / arXiv / Manual")
- [ ] **Last-5-years section** on /people/[slug] (filter by `preprint_date` or `year >= current_year - 5`)
- [ ] **Author count** displayed as subtitle on profile publication section
- [ ] **"Actualizado el [date]" / "Updated [date]"** on /publications (bilingual)
- [ ] **Footnote** on /publications explaining two-source design (bilingual)
- [ ] **i18n strings** for all new labels (both ES and EN)

### Add If Time Allows (v1.1 nice-to-have)

- [ ] **Author highlighting** (bold group member names in author lists) — MEDIUM complexity;
  defer if name normalization proves tricky in the sprint
- [ ] **arXiv category → topic_tag mapping** — auto-assign tags from arXiv primary category
  at sync time; requires a category-to-tag config map
- [ ] **Per-person "View on arXiv" link** on /people/[slug]

### Explicitly Deferred (v2+)

- [ ] Cross-source deduplication (InspireHEP vs arXiv for same paper)
- [ ] Citation count display (too stale/self-promotional without live data)
- [ ] h-index badges
- [ ] ADS / ORCID as additional sources

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| InspireHEP API fields (what's available) | HIGH | Live API calls against real author (Calzetta) |
| InspireHEP query syntax (BAI, date) | HIGH | Official INSPIRE search tips docs + live verification |
| arXiv API fields | MEDIUM | Official arXiv API user manual (404'd, reconstructed from redirect + prior knowledge) |
| Rate limits (both APIs) | MEDIUM | Documented + widely reported in community |
| Last-5-years recommendation | MEDIUM | Reasoned from domain practice; no authoritative norm found |
| Citation count anti-feature recommendation | MEDIUM | Observed on peer sites (not shown); APS style guide |
| Co-author dedup convention (once per paper) | MEDIUM | Observed on UCL Cosmoparticle, IRIS-HEP; no explicit documentation |
| Author-name-highlighting convention | LOW | Not found on any peer site; inferred as useful differentiator |
| Conference proceedings exclusion | MEDIUM | Peer site observation + InspireHEP type codes |
| Source-badge UX pattern | LOW | No peer site does this exact two-source pattern; design is novel |

---

## Sources

**InspireHEP:**
- [InspireHEP REST API docs (GitHub)](https://github.com/inspirehep/rest-api-doc)
- [INSPIRE search tips (official help)](https://help.inspirehep.net/knowledge-base/inspire-paper-search/)
- [INSPIRE-HEP Wikipedia](https://en.wikipedia.org/wiki/INSPIRE-HEP)
- [InSPy-HEP Python interface (GitHub)](https://github.com/mhostert/inspy-hep)
- Live API: `https://inspirehep.net/api/literature?q=a+E.Calzetta.1&sort=mostrecent&size=3`
  (verified 2026-04-18; confirmed field structure, citation_count, preprint_date format)

**arXiv:**
- [arXiv API user manual](https://info.arxiv.org/help/api/user-manual)
- [arXiv identifier format](https://info.arxiv.org/help/arxiv_identifier.html)
- Live author search: `https://arxiv.org/search/?searchtype=author&query=Calzetta+E`
  (verified 2026-04-18; 108 results, no disambiguation system observed)

**Peer cosmology group sites surveyed:**
- [UCL Cosmoparticle Initiative — Publications](https://www.ucl.ac.uk/cosmoparticle/research/publications) — reverse-chron, no per-profile cutoff, "incl." for large collab
- [UCL Astrophysics — Group Publications](https://www.ucl.ac.uk/mathematical-physical-sciences/physics-astronomy/research/research-groups/astrophysics-group-department-physics-and-astronomy/research/latest-group-publications) — "et al." after ~4 authors, ADS links, no source badge
- [IRIS-HEP — Publications](https://iris-hep.org/publications/all.html) — by-date + by-area filters, citation counts shown, InspireHEP + arXiv + DOI links per entry
- [KIPAC Stanford — People](https://kipac.stanford.edu/people) — no per-profile pub list; single central arXiv discovery link
- [CCAPP OSU — People](https://ccapp.osu.edu/people) — no per-profile pub listing

**APS journal style (author list format):**
- [APS References style guide](https://journals.aps.org/authors/references-physical-review-physical-review-letters) — list all authors up to 10, then et al.

---
*Feature research for: v1.1 publication sync (InspireHEP + arXiv), academic cosmology group site*
*Researched: 2026-04-18*
