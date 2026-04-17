# Feature Research — Cosmology Research Group Website

**Domain:** Academic research group website (cosmology, UBA / FCEN / CONICET)
**Researched:** 2026-04-17
**Confidence:** HIGH (peer institutional sites + LATAM peer IAFE + multilingual UX sources)
**Research mode:** Ecosystem (with explicit validation of user-specified v1 page structure)

## Scope & Validation of v1 Page List

User-specified v1: Home, People (PIs/Postdocs/PhDs/Undergrads/Past), Research (areas), Publications (year-grouped + filter), Outreach, Contact.

**Validation verdict: The list is correct for v1 credibility.** All six pages map directly to sections every peer institutional site has. No top-level page is missing that would, on its own, break credibility. However, there are content types that peer cosmology groups put *inside* existing pages (seminars/events, news, job openings, joining info) that v1 should consciously decide to include-or-defer rather than silently drop. See "Near-Miss Table Stakes" below.

Out-of-scope constraints are respected throughout (no auth, no CMS backend, no arXiv/ADS importer, no dark mode, no site search beyond publications filter, no animations beyond hero fade).

## Feature Landscape

### Table Stakes (Users Expect These — Credibility Fails Without)

These are features every peer institutional cosmology site has. Missing any of them = visitor lands, bounces, and the group reads as "not a real group" or "dormant."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Group identity in hero** (name, tagline, institutional affiliation: UBA / FCEN / CONICET) | First thing peers/journalists scan for; establishes legitimacy in ~3 seconds | LOW | Peer pattern (MPA, IAFE): institution + short mission statement. Place UBA/FCEN/CONICET logos near hero, not just in footer. |
| **People directory with sectioned roster** (PIs → Postdocs → PhDs → Undergrads → Past Members) | Prospective applicants scan "who works here, who are the PIs" within 30s of landing; peers look for specific collaborators | LOW | Exactly matches user's v1 spec. Order matters: PIs first; "Past Members" at bottom signals continuity and training pipeline (funders read this). |
| **Individual PI/Postdoc/PhD profile pages** (photo, role, research interests, bio, contact, selected publications, links to ORCID/arXiv/Google Scholar) | Prospective PhDs evaluate PIs from their individual pages; peers cite/link individual researchers | LOW-MED | User v1 has `/people/[slug]`. Must include external IDs (ORCID, arXiv, Google Scholar, ADS) — every peer site does. LATAM-specific: CONICET profile link is expected. |
| **Research areas page with distinct area descriptions** (Dark Matter, Gravitational Waves, Early Universe, AI) | Primary answer to "what does this group do?" — funders and prospective students decide interest here | LOW-MED | User v1 has grid of 4 areas. Each area should have a description paragraph (not just a name+icon) so content is non-trivial. Peer sites (MPA, CCA, CTC) all have per-area narrative. |
| **Publications list** (year-grouped, reverse-chronological, with authors/title/journal/year + arXiv/DOI link) | Academic credibility is largely measured by publications; this is the page reviewers and hiring committees open | LOW | User v1 matches peer norm. arXiv + DOI links are non-negotiable (not "optional external") — every peer cosmology site has them. |
| **Publications filter** (by year at minimum; author + topic tags are strong additions) | Publications lists over ~50 entries become unusable without filtering | LOW | User v1 includes filter by year/author/topic. This is correct. Year grouping alone is not enough once list exceeds ~30 items. |
| **Outreach section** (talks, school visits, articles, media appearances) | Funders (CONICET, grant agencies) explicitly ask for public engagement evidence; LATAM funders especially weight "divulgación" | LOW | Matches user v1. IAFE (peer Buenos Aires institute) uses "Eventos → público general" and explicitly calls this out in mission. |
| **Contact** (postal address, office location, email, embedded map, social links) | Journalists and visitors need to find/reach the group; prospective students email before applying | LOW | User v1 is complete. Google Map embed is standard. Include an email for "general inquiries" separate from individual PI emails — shields PIs from spam/cold outreach. |
| **Bilingual ES/EN toggle, persistent in top nav, URL-based routing** | Primary audience Spanish; international peers read English; LATAM academic sites nearly always bilingual | MED | User v1 mandates this. Best practice: use language name in its own language ("Español" / "English"), avoid flags (no flag for "English"), put toggle top-right. Auto-detect is optional but always provide manual override. Route structure: `/es/...` and `/en/...`. |
| **WCAG AA compliance** (contrast, keyboard nav, alt text, semantic HTML) | Universities and academic audiences expect it; often a funder/procurement requirement | MED | User constraints include this. Specifically: every photo needs alt text, nav must be keyboard-traversable, contrast ratios on body text ≥ 4.5:1. |
| **Schema.org structured data** (Organization + Person + ScholarlyArticle) | Findability in Google Scholar, generic search, and academic search engines | LOW-MED | User v1 includes Organization + Person. Add ScholarlyArticle on publication items — cheap, helps discoverability. |
| **Open Graph + Twitter card metadata** | Link previews in Slack/Twitter/email matter when peers share the site | LOW | User v1 covers this. |
| **Sitemap.xml + robots.txt** | Indexing baseline; academic audiences notice when a site doesn't show up in Google | LOW | User v1 covers this. |
| **Institutional partner logo strip** (UBA, FCEN, CONICET, external partners) | Signals legitimacy and funding sources at a glance; LATAM norm | LOW | User v1 has this on homepage. In LATAM academic context, absence of CONICET logo reads as "not CONICET-funded" which is a credibility signal. |
| **Responsive design (mobile → desktop)** | Journalists, applicants, general public use phones; university IT often reviews on tablets | LOW | Non-negotiable; next.js + tailwind gives this by default. |

### Near-Miss Table Stakes (Present on Most Peer Sites, v1 Decision Required)

These appear on most peer institutional cosmology sites. User v1 does NOT include them. Not including them doesn't fail credibility *if* the site is clearly "small group v1," but defer explicitly rather than accidentally.

| Feature | Peer Prevalence | v1 Recommendation | Notes |
|---------|-----------------|-------------------|-------|
| **News / recent highlights** (3-6 items on home, optional separate page) | MPA, CCA, IAFE, CTC, Perimeter all have it | **Keep as home-page "highlights" only (3 cards)** — user v1 already does this | Full news section = content treadmill. Home-page highlight cards are enough for v1. Don't build a separate News page. |
| **Seminar / events listing** (weekly cosmology seminar is universal in cosmology) | Weekly cosmology seminars exist at Madison, Imperial, Helsinki, UC Davis, CTC Cambridge, Berkeley — every peer group has one | **Defer to v1.x** IF the group does not currently run a regular seminar. If they DO run one, this is arguably table-stakes for peer credibility — flag for user confirmation. | Cosmology is seminar-heavy culturally. "Does the UBA group run a weekly seminar?" is a question the user must answer. If yes, a simple events list is worth the ~1 day cost. |
| **Jobs / Open Positions / Joining Info** ("How to apply," "Prospective PhD students," "Open postdoc positions") | MPA ("Career"), CCA ("Careers"), Perimeter ("Training"), IAS-SNS (application portal + deadline), Princeton IAS: all prominent | **Add a single static "Join Us" or "Oportunidades" section** on the People page footer, or as a subsection of Contact. MED complexity only if dynamic (listings); LOW if static "contact PI X" text. | Prospective PhD/postdoc audience is one of four explicit audiences. Without *any* joining info, that audience gets nothing. Minimum: a paragraph saying "Interested applicants contact [PI] at [email] with CV." |
| **Software / tools / code repositories** | CCA has entire "Software" section; CTC lists COSMOS supercomputer; most cosmology groups link GitHub | **Defer to v1.x** — only include if group has released public tools | Not universal outside compute-heavy groups. UBA cosmology may or may not have this. Optional. |
| **Press / media coverage** ("As featured in...") | MPA, IAFE have this | **Fold into Outreach page** as a subsection if relevant items exist | Don't build dedicated page; a list on Outreach suffices. |
| **Thesis listings / former students placement** ("Our PhDs went on to...") | IAS-SNS lists previous scholars; MPA annual reports | **Covered by "Past Members" section on People page** — user v1 already handles this | Good. Peer norm met. |

### Differentiators (Competitive Advantage for Attracting PhD/Postdoc Applicants)

Features that elevate the site above "we exist" toward "you should want to join." Not required; each one adds PhD/postdoc applicant conversion, funder impression, or journalist friendliness.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Typography-driven restrained aesthetic matching nature.com / Max Planck** | Signals "serious research, not a startup"; applicants notice when a group's site looks generic-startup | LOW (design system work, not code) | User constraints already mandate this. Execution is the differentiator — most academic sites *fail* this. |
| **Selected publications on PI profile pages** (curated 5-10, not full list) | Prospective PhDs can't parse 200-entry pub lists; a curated "start here" set is high-signal | LOW | User v1 includes `publications_selected` on person shape. Good. Worth rendering prominently. |
| **"Research interests" prose on PI pages** (3-5 sentences, not just keywords) | Applicants read this to decide fit; differentiates from groups that just list topics | LOW | Content-driven; structure already supported in user schema (`research_interests`). Write 3-5 real sentences per PI, not bullet lists. |
| **Thematic homepage research cards linking to areas** | Lets a visitor reach "what this group works on" in one click | LOW | User v1 has "highlights (3 cards)" on home; if these point to research areas, this is covered. |
| **Past Members with current affiliations** ("Now at [Institute]") | Prospective students look at alumni placements as the single strongest indicator of group quality | LOW | User v1 has Past Members. Add "current affiliation" field to person shape — tiny effort, huge signal. |
| **Per-area research page narrative** (what questions, what methods, recent papers) | Lets applicants decide "which area" before contacting PIs | LOW-MED | Matches user v1 structure (research areas grid → presumably area detail pages or sections). Keep each area's text substantive, not just a title + icon. |
| **Selected publications highlighting on home** (3 recent highlight publications linked from home) | Recent output visible without navigating to Publications page | LOW | Could be folded into "highlights (3 cards)" on home. |
| **Bilingual content parity** (every page has equivalent Spanish + English; no "English is thinner") | International peers form judgments about a LATAM group based on English content; Spanish-speaking applicants deserve full content | LOW-MED | User constraint mandates bilingual; the *parity* discipline is the differentiator. Half-translated pages are a common LATAM academic site failure mode. |
| **Favicon + consistent OG image for link previews** | Shows up in Slack/Twitter shares with group branding | LOW | Cheap polish; often skipped. |
| **Printable / PDF-friendly publication list** (or clean print CSS) | PIs share pub lists with grant reviewers by printing | LOW | One print stylesheet; low effort, PI-love. |
| **Funding / acknowledgements page or footer strip** (CONICET grant numbers, UBA support) | Funders Google themselves; seeing the group acknowledge grants correctly matters for future funding | LOW | Can be a simple footer block. |

### Anti-Features (Commonly Suggested, Avoid in This Domain)

Features that sound reasonable but degrade an academic institutional site. Sources: peer institutional sites conspicuously *don't* have these; user has already excluded most — listing for clarity + to prevent scope creep during build.

| Feature | Why Requested | Why Problematic in Academic Context | Alternative |
|---------|---------------|-------------------------------------|-------------|
| **Auto-rotating hero carousel with multiple slides** | "Show more on the hero" | Users ignore carousels (NN/G, Baymard: 46% of carousel sites have usability issues; most interaction happens only on slide 1). Auto-rotate competes with user scan-scroll. Academic audiences read to evaluate — rotation is hostile to that. User v1 already constrains to "fade 6-8s" which is borderline. | **Single static hero image** with restrained fade-in on load only. If cycling needed, use a manual next/prev with a pause-on-hover. Keep cycle time ≥ 8s. Prefer single hero. |
| **Dark mode** | "Modern sites have it" | Academic/institutional aesthetic is light-mode-first (nature.com, MPA, IAS, CCA all light-only). Doubles design-system cost with no audience demand. | Light only. User v1 already excludes. |
| **Flashy animations / parallax / scroll-triggered reveals** | "Looks modern" | Reads as marketing-startup, not research institution. PIs + funders perceive as "style over substance." | Typography + whitespace. User constraint already excludes. |
| **Gradient backgrounds / AI-generic hero art** | "Looks polished" | Reads as generic SaaS. Peer institutions use neutral/white backgrounds with occasional scientific imagery. | Restrained palette, real photography where available (placeholders acceptable for v1). |
| **Full CMS (Contentful, Sanity, Strapi, WordPress)** | "Members want to edit content" | Adds ops burden, ongoing cost, security surface. Academic group content changes infrequently (monthly at most). | JSON files edited via PR. User v1 already chose this. Document a "how to add a person / publication" onboarding doc in the repo. |
| **Member login / authenticated area** | "Private resources for the group" | Public institutional site is not the right place for internal docs. Creates auth surface for a static site. | Group uses Drive / shared notebook / GitLab wiki privately. User v1 already excludes. |
| **Generic site-wide search** | "Big sites have search" | Static site with <50 pages doesn't benefit from search; indexing overhead and "no results" UX hurt trust. | Publications filter (already in v1); clear top nav; everything reachable in 2 clicks. User v1 already excludes. |
| **Live arXiv/ADS publication auto-import in v1** | "Keep pubs current automatically" | arXiv/ADS/ORCID integrations are scope black holes (auth, rate limits, deduplication, author-matching). Placeholder JSON is enough to validate layout. | Defer to v2 (already in user's decisions). v1: manual JSON. |
| **Commenting / discussion / forum** | "Engage the community" | Institutional site is not a community platform. Moderation burden. Academic discussion happens in seminars, arXiv, Slack, email. | No comments. User v1 already excludes. |
| **Newsletter signup form** | "Capture leads" | Academic groups don't do email marketing. Creates CAN-SPAM / GDPR obligations. | Social links in footer. Interested parties email directly. |
| **Real-time Twitter/X feed embed on homepage** | "Show recent activity" | Third-party iframe = slow load, privacy tracker, unpredictable content (X's ToS changes, embed breakages). | Static social icons in footer. |
| **Chatbot / AI assistant / "Ask the group"** | "Looks cutting-edge, matches AI research area" | Institutional site visitors want factual info, not a chatbot. Hallucination risk = real reputational damage. | Clear contact email. Good FAQ if needed (not in v1). |
| **Cookie banner beyond strict necessity** | "GDPR compliance" | Static site with no analytics = no cookies needed. Banners are friction. | Self-hosted fonts (already in v1). Skip analytics or use a cookieless one (Plausible, Vercel Analytics) — no banner needed. |
| **Mega-menu / mega-dropdown nav** | "More navigation" | Six top-level items (user's v1) is fine. Mega-menu adds complexity for no gain. | Flat nav. User v1 already has this. |
| **Student-life / "lab culture" photo gallery** | "Humanize the group" | High curation burden; photos go stale; privacy concerns (consent of group members changing). | Square photos on People pages are enough. Optional: one group photo on "About" / home. |
| **Mobile app** | "Everything needs an app" | Web is sufficient for all audiences; app store maintenance is ongoing. | Responsive web. User v1 already excludes. |
| **Donation / funding request CTA** | "Institutional fundraising" | UBA/CONICET groups don't take individual donations; creates regulatory questions. | Acknowledge grants; no CTA. |

## Feature Dependencies

```
Content JSON schema (people.json, publications.json, research.json, outreach.json)
  ├──required by──> People page (list + /people/[slug])
  │                    └──required by──> Individual profile pages
  ├──required by──> Publications page (year-grouped + filter)
  │                    └──required by──> Publications filter by author/topic
  │                                           └──requires tags in publication shape
  ├──required by──> Research page (area grid + narrative)
  └──required by──> Outreach page (grid of activities)

next-intl bilingual setup
  ├──required by──> Every page (ES + EN parity)
  ├──required by──> Navigation (ES/EN labels)
  └──required by──> URL routing (/es/..., /en/...)

Design system (tokens: colors, typography, spacing)
  ├──required by──> Homepage hero (typography-driven, restrained)
  ├──required by──> Person profile page layout
  ├──required by──> Publications typography (serif for titles?)
  └──required by──> Research area cards

Schema.org + OG metadata
  ├──enhances──> Publications page (ScholarlyArticle discoverability)
  ├──enhances──> People pages (Person schema)
  └──enhances──> Home / Contact (Organization schema)

Partner logo strip (UBA, FCEN, CONICET)
  └──credibility-required on──> Homepage hero area + Footer
```

### Dependency Notes

- **Content schema must be locked before page implementation.** Building a Person component before `people.json` shape is stable → rework. Lock schema first, then build.
- **i18n routing affects file structure from day 1.** Retrofitting next-intl onto a single-locale app is painful. Start with `/[locale]/` routing.
- **Publication filter depends on topic tags existing in publication JSON.** Adding topics later = touching every existing entry. Decide tag taxonomy early (Dark Matter, GW, Early Universe, AI — aligns with Research areas).
- **"Past Members" with current affiliations** requires a field (`current_affiliation`) that's easy to add up front but annoying to add after roster is populated.
- **Seminar listing (if added)** depends on an `events.json` schema similar to publications. Not in user v1; flag for user decision.

## MVP Definition

### Launch With (v1) — Ruthlessly Minimum

All six user-specified pages + the supporting infrastructure. In priority order:

- [ ] **Design system generation (ui-ux-pro-max)** — design tokens before any UI; typography/color restraint is a differentiator that must be set foundationally
- [ ] **Bilingual i18n scaffolding (next-intl, ES default, EN toggle, `/[locale]/` routing)** — must be in place from first page or retrofit is painful
- [ ] **Content JSON schemas locked** (`people.json`, `publications.json`, `research.json`, `outreach.json`) + typed accessors
- [ ] **Home page** — single hero (or restrained fade between 2-3 images, NOT auto-rotating carousel), tagline, mission, 3 highlight cards linking to research areas, partner logo strip (UBA/FCEN/CONICET)
- [ ] **People page** — sectioned roster (PIs → Postdocs → PhDs → Undergrads → Past) with photos
- [ ] **Individual profile pages** (`/people/[slug]`) for PIs/Postdocs/PhDs with bio, research interests, selected publications, contact, external IDs (ORCID, arXiv, Google Scholar, CONICET)
- [ ] **Research page** — grid of 4 areas (Dark Matter, GW, Early Universe, AI) with narrative paragraph each
- [ ] **Publications page** — year-grouped list with filter by year + author + topic; arXiv + DOI links per entry
- [ ] **Outreach page** — grid of activities (talks, workshops, school visits, articles)
- [ ] **Contact page** — address, email, embedded Google Map, social links
- [ ] **"How to join" paragraph** — lightweight addition on People or Contact page saying "Prospective PhDs/postdocs contact [PI] at [email] with CV" (addresses prospective applicant audience with ~15 min work)
- [ ] **SEO baseline** — Schema.org (Organization + Person + ScholarlyArticle on pubs), OG/Twitter cards, sitemap.xml, robots.txt, favicon, self-hosted fonts
- [ ] **WCAG AA audit pass** — contrast check, keyboard nav test, alt text on all images
- [ ] **Responsive (mobile → desktop)** — Tailwind defaults enforced; tested at 375/768/1440

### Add After Validation (v1.x)

Ship v1, see what real content makes obvious:

- [ ] **Seminar / events listing** — if group confirms regular seminar exists (flag to user; cosmology groups nearly universally run weekly seminars, so this is likely needed)
- [ ] **News / highlights archive page** — if the home-page 3-card slot isn't enough for actual content flow (can defer until >6 items of news exist)
- [ ] **"Past Members" enriched with current affiliation** — requires content update, not code
- [ ] **Printable publications CSS** — one stylesheet, for PI grant-report workflows
- [ ] **Funding / acknowledgements footer block** — once actual grant list is known
- [ ] **Per-page English parity audit** — after initial Spanish content is populated, walk the site in EN and fix gaps

### Future Consideration (v2+) — Explicitly Deferred per PROJECT.md

- [ ] **arXiv / ADS / ORCID auto-import** — user decision; scope black hole, placeholder JSON is adequate for v1
- [ ] **CMS backend** — user decision; JSON editing via PR is the intentional choice
- [ ] **Member login / internal area** — user decision; out of scope for public institutional site
- [ ] **Site-wide search beyond publications filter** — user decision; <50 pages doesn't need it
- [ ] **Software / tools section** — only if group releases public code
- [ ] **Group photo gallery / "lab life"** — only on user request; maintenance burden

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Content JSON schemas locked early | HIGH | LOW | P1 |
| Bilingual i18n scaffolding from day 1 | HIGH | MED | P1 |
| Design system (typography-driven, restrained) | HIGH | MED | P1 |
| Home page (single hero, restrained) | HIGH | LOW | P1 |
| People page sectioned roster | HIGH | LOW | P1 |
| Individual profile pages with external IDs | HIGH | LOW | P1 |
| Research areas page with narrative | HIGH | LOW | P1 |
| Publications year-grouped + filter | HIGH | MED | P1 |
| Outreach page | HIGH | LOW | P1 |
| Contact + Google Map | HIGH | LOW | P1 |
| "How to join" paragraph | HIGH | LOW | P1 |
| Schema.org + OG + sitemap | MED | LOW | P1 |
| WCAG AA compliance | HIGH | MED | P1 |
| Responsive design | HIGH | LOW | P1 |
| Partner logo strip | MED | LOW | P1 |
| Seminar / events listing | MED-HIGH (if group has seminar) | MED | P2 (confirm with user) |
| Past members with current affiliations | MED | LOW | P2 (content-driven) |
| Print CSS for publications | LOW | LOW | P3 |
| News archive page (beyond 3 home cards) | LOW | MED | P3 |
| Funding acknowledgements block | MED | LOW | P2 |

**Priority key:**
- P1: Must have for launch
- P2: Should have; add when possible (or post-launch)
- P3: Nice to have; future consideration

## Competitor / Peer Feature Analysis

Comparison across peer institutional cosmology group sites. Used to validate table stakes and identify anti-features.

| Feature | MPA Garching | IAS Natural Sciences | Flatiron CCA | Perimeter | DAMTP / CTC Cambridge | IAFE (Buenos Aires) | **Our v1** |
|---------|--------------|---------------------|--------------|-----------|------------------------|---------------------|------------|
| People/members directory | Yes (structured by role) | Yes (faculty + visitors + past) | Yes (by group) | Yes | Yes | Yes (Autoridades + RRHH) | Yes (sectioned) |
| Individual profile pages | Yes | Yes | Yes | Yes | Yes | Partial | Yes (PI/Postdoc/PhD) |
| Research areas | 5 areas + independent groups | 3 areas | 8 groups | Areas + centres | Multiple groups (GR, HEP, astro, CTC) | 7 areas | 4 areas (DM, GW, EU, AI) |
| Publications | Yes (linked to ADS) | Implicit via faculty pages | Yes + ADS links | Yes | Yes | Evidence of pubs (PROSE award) | Yes (year + filter) |
| News / highlights | Yes (dedicated) | Implicit | Yes | Yes ("News & Ideas") | Yes | Yes (Noticias) | Home highlights only (3 cards) |
| Seminars / events | Yes (events) | Yes (astro events) | Yes (colloquium + workshops) | Yes (events) | Yes (weekly seminars) | Yes (Eventos, dual audience) | **DEFERRED (flag to user)** |
| Jobs / careers | Yes (Career) | Application portal + deadlines | Yes (Careers) | Yes (Training) | Yes | Yes (implicit RRHH) | **"How to join" paragraph** |
| Outreach / public | Yes (Public Outreach) | Limited | Limited | Yes (Outreach) | Via CTC | Yes (div. cultura divulgación) | Yes |
| Bilingual | EN primary (institute is German but site is EN) | EN | EN | EN | EN | **ES + EN toggle (flag link)** | **ES + EN toggle** |
| Light mode only | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| No flashy animations | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Restrained typography-driven design | Yes | Yes | Yes | Mostly | Yes | Partial | Yes |
| Software / tools section | No dedicated | No | Yes (prominent) | No | No (but COSMOS mentioned) | No | No (out of scope) |
| CMS | Yes (internal) | Yes (internal) | Yes (internal) | Yes | Yes | Yes | **JSON files (intentional)** |

**Key takeaways from peer comparison:**
1. **User v1 matches or exceeds peer table stakes** on core content (people, research, publications, outreach, contact).
2. **Every cosmology peer has a seminar/events listing.** This is the single feature most at risk of being missed. Flag for user confirmation.
3. **Every peer has some "join us" signal.** User v1 has none explicitly; the "How to join" paragraph recommendation addresses this at minimal cost.
4. **IAFE is the closest peer** (Buenos Aires, Spanish/English bilingual, CONICET-affiliated). IAFE's structure: Institucional + Áreas de investigación + Eventos + Noticias + Contacto. User v1 aligns well; biggest gap is Eventos.
5. **Nobody in the peer set has dark mode, carousels with >3 slides, flashy animations, or mega-menus.** User constraints already exclude all of these — correctly.

## Relevance Notes for Spanish-Speaking / LATAM Audience

- **"Divulgación" is a funder keyword.** CONICET and UBA value public-engagement evidence explicitly in grant evaluations. The Outreach page maps to this — label it "Divulgación" in ES (not "Alcance" or literal translation of "Outreach").
- **CONICET researcher identifier** is expected on profile pages alongside ORCID. Every LATAM academic adds this.
- **Group-name branding is often institutional + geographic**, e.g., "Grupo de Cosmología UBA" or "Grupo de Cosmología, IAFE-UBA-CONICET." The placeholder approach (single config file) is the right call.
- **Bilingual parity matters more than elsewhere**: international peers read English to evaluate; the Spanish-speaking audience is NOT secondary even though site defaults to Spanish. Half-translated pages are a LATAM academic site failure mode.
- **Avoid literal calques in ES**: "Research" → "Investigación" (correct); "People" → "Miembros" or "Equipo" (NOT "Gente"); "Publications" → "Publicaciones" (straightforward); "Outreach" → "Divulgación"; "Home" → "Inicio".
- **University affiliation logos matter more in LATAM** than at institutions like MPA or Perimeter where a single brand dominates. UBA + FCEN + CONICET logos on homepage are a stronger credibility signal than at a typical US/UK institute.
- **Date formats and author name conventions**: use ISO dates (`2026-04-17`) in data, localize display (`17 de abril de 2026` in ES, `April 17, 2026` in EN). Author name order follows journal citation style, not culture.

## Open Questions (Flag to User)

1. **Does the UBA cosmology group run a regular seminar?** If yes, a seminar listing is near-table-stakes for peer credibility. Cost: ~1 day of work + events.json schema. If no, safely deferred.
2. **Is there a group Twitter/X / YouTube / Instagram account?** Social icons in footer are cheap; confirm which to include.
3. **Are there specific CONICET grant numbers to acknowledge?** If yes, a footer acknowledgements block is easy; if TBD, leave placeholder.
4. **Should "Past Members" include current affiliation?** Requires data field; if user wants it, add to schema up front.
5. **Does the group release any public software / datasets?** If yes, a Software section is worth 0.5 day; if not, skip.
6. **Is the group name final or still a placeholder?** User noted "Grupo de Cosmología UBA" is placeholder — config-file abstraction already handles this.

## Sources

Peer institutional sites reviewed (HIGH confidence for feature presence):
- [MPA Garching (Max Planck Institute for Astrophysics)](https://www.mpa-garching.mpg.de/) — top nav: About MPA, News, Research, Career, Public Outreach
- [IAS School of Natural Sciences (Princeton)](https://www.ias.edu/sns) — faculty + visiting scholars + events + application portal with deadline
- [Flatiron Institute Center for Computational Astrophysics](https://www.simonsfoundation.org/flatiron/center-for-computational-astrophysics/) — 8 groups, projects, news & pubs, events, software, people, careers, about
- [Perimeter Institute](https://perimeterinstitute.ca/) — About, Research (areas, researchers, centres, seminars), Training, Outreach, Events, News & Ideas
- [DAMTP Cambridge / CTC](https://www.ctc.cam.ac.uk/) — Centre for Theoretical Cosmology; weekly seminars with IoA, Cavendish, DAMTP
- [IAFE (Instituto de Astronomía y Física del Espacio, UBA-CONICET)](http://www.iafe.uba.ar/) — closest LATAM peer; ES/EN toggle, Institucional + Áreas + Eventos + Noticias + Contacto
- [Cambridge CTC Seminars](https://www.ctc.cam.ac.uk/activities/seminars.php) — cosmology seminar culture evidence
- [Imperial Cosmology Seminars](https://www.imperial.ac.uk/theoretical-physics/seminars/cosmology-seminars/), [UW-Madison](https://cosmology.physics.wisc.edu/seminars/), [UC Davis](https://physics.ucdavis.edu/research/research-areas/cosmology/cosmology-meetings-and-seminars) — weekly cosmology seminars are universal

Multilingual / bilingual UX guidance (MEDIUM-HIGH confidence):
- [Digital.gov — multilingual website best practices](https://digital.gov/resources/top-10-best-practices-for-multilingual-websites)
- [Weglot — website language selector best practices](https://www.weglot.com/blog/website-language-selector) — language names in own language, avoid flags, top-corner placement

Carousel / animation anti-patterns (HIGH confidence, multiple sources):
- [NN/G — designing effective carousels](https://www.nngroup.com/articles/designing-effective-carousels/) — users ignore carousels
- [Baymard — 10 UX requirements for homepage carousels](https://baymard.com/blog/homepage-carousel) — 46% of carousel sites have usability issues
- [CXL — don't use automatic image sliders](https://cxl.com/blog/dont-use-automatic-image-sliders-or-carousels/) — static hero performs better

Academic lab website best-practice guides (MEDIUM confidence, blog-level):
- [theacademicdesigner.com — research lab websites](https://theacademicdesigner.com/2024/research-lab-websites/)
- [jedyang.com — academic research group website](https://jedyang.com/post/how-to-build-academic-research-group-website-in-2021/)

Background / context (MEDIUM confidence):
- [CONICET (Argentina research council)](https://www.conicet.gov.ar/?lan=en) — bilingual pattern; institutional framing relevant to LATAM context

---
*Feature research for: academic research group website (cosmology, UBA / FCEN / CONICET context)*
*Researched: 2026-04-17*
