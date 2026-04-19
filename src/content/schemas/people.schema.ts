/**
 * People content schema — DATA-01
 *
 * Follows RESEARCH.md Pattern 2 ("Strict Object Schemas (Zod v4 API)").
 * All bilingual, photo, slug, and identifier helpers are imported from
 * ./shared — none are redefined here.
 *
 * Schemas:
 *  - SocialLinkSchema   : platform enum + url
 *  - PersonSchema       : full person shape (z.strictObject)
 *  - PeopleSchema       : array with slug-uniqueness superRefine
 *
 * Types:
 *  - Person             : inferred from PersonSchema
 *  - People             : inferred from PeopleSchema
 */

import * as z from "zod";
import {
  bilingualString,
  canonicalString,
  slugString,
  optionalPhoto,
  orcidId,
  arxivId,
} from "./shared";

// ---------------------------------------------------------------------------
// A. SocialLinkSchema
// ---------------------------------------------------------------------------

export const SocialLinkSchema = z.strictObject({
  platform: z.enum([
    "twitter",
    "linkedin",
    "github",
    "orcid",
    "scholar",
    "website",
    "bluesky",
    "instagram",
  ]),
  url: z.url(),
});

// ---------------------------------------------------------------------------
// B. PersonSchema  (DATA-01 shape)
// ---------------------------------------------------------------------------

export const PersonSchema = z.strictObject({
  /** kebab-case URL segment — e.g. "ana-maria-torres" */
  slug: slugString,

  /** Person's name in original form (canonical, not bilingual — academic convention) */
  name: canonicalString,

  /** e.g. { es: "Investigadora Principal", en: "Principal Investigator" } */
  role: bilingualString("role"),

  /** Determines which section of the People page this person appears in */
  category: z.enum(["pi", "postdoc", "phd", "undergrad", "past"]),

  /** Path relative to public/ — e.g. "people/Esteban_C.png". No leading slash. */
  photo: optionalPhoto,

  /** One- or two-sentence intro shown on the People card and at the top of the profile */
  short_bio: bilingualString("short_bio"),

  /** Full institutional bio shown on the individual profile page */
  full_bio: bilingualString("full_bio"),

  /** At least one research interest is required (PEOP-03 / PEOP-06) */
  research_interests: z.array(bilingualString("research_interest")).min(1),

  /**
   * References to publication IDs from content/publications.json.
   * Cross-file ID validation is deferred to the Plan 05 prebuild script.
   * @deprecated v1.1 — field is inert in v1.1; scheduled for removal in v1.2. The
   *   v1.1 sync pipeline (Phase 9) replaces hand-curated selections with auto-populated
   *   results from InspireHEP + arXiv queried via `inspirehep_id` / `arxiv_id`.
   */
  publications_selected: z.array(z.string()).optional().default([]),

  /**
   * InspireHEP BAI identifier (e.g. "E.Calzetta.1").
   * Optional — students may not have one yet.
   * @see content/SYNC.md
   */
  inspirehep_id: z
    .string()
    .regex(
      /^[A-Z]\.[A-Za-z-]+\.\d+$/,
      "InspireHEP BAI format: Initial.Surname.N (e.g. E.Calzetta.1)",
    )
    .optional(),

  /**
   * Claimed arXiv author ID (modern or pre-2007 format).
   * Optional — students may not have one yet.
   * Populate once you have your first paper on arXiv and have claimed authorship.
   * @see content/SYNC.md
   */
  arxiv_id: arxivId.optional(),

  /**
   * ASCII-folded lowercase display name for author-string matching.
   * Used by Phase 11 sync to substring-match normalized author strings.
   * Format: "firstname lastname" (all lowercase, ASCII only, no diacritics).
   * Example: "esteban calzetta", "diana lopez nacir"
   * @see content/SYNC.md
   */
  display_name_normalized: z.string().min(1),

  /**
   * Contact details shown on the individual profile page (PEOP-11).
   * Not every person has all fields — all are optional.
   */
  contact: z.strictObject({
    email: z.email().optional(),
    orcid: orcidId.optional(),
    office: z.string().optional(),
    scholar: z.url().optional(),
  }),

  /** Social accounts rendered as icon links (PEOP-11) */
  social_links: z.array(SocialLinkSchema).optional().default([]),

  /**
   * Years active in the group.
   * REQUIRED for category "past" — enforced in PeopleSchema superRefine.
   */
  years: z
    .strictObject({
      start: z.number().int().min(1980).max(2100),
      end: z.number().int().min(1980).max(2100).optional(),
    })
    .optional(),

  /**
   * Thesis topic for undergraduate researchers (PEOP-04).
   * REQUIRED for category "undergrad" — enforced in PeopleSchema superRefine.
   */
  thesis_topic: bilingualString("thesis_topic").optional(),

  /**
   * Where the person works now — shown on the Past Members section (PEOP-05).
   */
  current_position: bilingualString("current_position").optional(),
});

// ---------------------------------------------------------------------------
// C. PeopleSchema — array with three superRefine rules
// ---------------------------------------------------------------------------

export const PeopleSchema = z.array(PersonSchema).superRefine((people, ctx) => {
  const seen = new Set<string>();

  for (let i = 0; i < people.length; i++) {
    const p = people[i];

    // Rule 1: Slug uniqueness
    if (seen.has(p.slug)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate slug "${p.slug}"`,
        path: [i, "slug"],
        input: p.slug,
      });
    } else {
      seen.add(p.slug);
    }

    // Rule 2: Past members must have years.start
    if (p.category === "past" && !p.years?.start) {
      ctx.addIssue({
        code: "custom",
        message: "past members must specify years.start",
        path: [i, "years"],
        input: p.years,
      });
    }

    // Rule 3: Undergrads must have thesis_topic
    if (p.category === "undergrad" && !p.thesis_topic) {
      ctx.addIssue({
        code: "custom",
        message: "undergrads must specify thesis_topic (both es and en)",
        path: [i, "thesis_topic"],
        input: p.thesis_topic,
      });
    }
  }
});

// ---------------------------------------------------------------------------
// D. Inferred types
// ---------------------------------------------------------------------------

export type Person = z.infer<typeof PersonSchema>;
export type People = z.infer<typeof PeopleSchema>;
