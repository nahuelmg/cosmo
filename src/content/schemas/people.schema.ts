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
} from "./shared";

// ---------------------------------------------------------------------------
// Shared field validators
// ---------------------------------------------------------------------------

/** InspireHEP BAI identifier — e.g. "E.Calzetta.1", "S.J.Landau.1". */
export const inspirehepId = z
  .string()
  .regex(
    /^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/,
    "InspireHEP BAI format: Initial.Surname.N or MultiPart.Name.N (e.g. E.Calzetta.1, S.J.Landau.1, Tomas.F.Chase.1)",
  );

/** Contact block shared by PersonSchema and the people-extra enrichment file. */
export const ContactSchema = z.strictObject({
  email: z.email().optional(),
  orcid: orcidId.optional(),
  office: z.string().optional(),
  scholar: z.url().optional(),
});

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

  /** e.g. { es: "Investigadora", en: "Investigator" } */
  role: bilingualString("role"),

  /** Determines which section of the People page this person appears in */
  category: z.enum([
    "pi",
    "postdoc",
    "phd",
    "external",
    "visitors",
    "undergrad",
    "past",
  ]),

  /** Path relative to public/ — e.g. "people/Esteban_C.png". No leading slash. */
  photo: optionalPhoto,

  /** One- or two-sentence intro shown on the People card and at the top of the profile */
  short_bio: bilingualString("short_bio"),

  /** Full institutional bio shown on the individual profile page */
  full_bio: bilingualString("full_bio"),

  /** At least one research interest is required (PEOP-03 / PEOP-06) */
  research_interests: z.array(bilingualString("research_interest")).min(1),

  /**
   * InspireHEP BAI identifier (e.g. "E.Calzetta.1").
   * Optional — students may not have one yet.
   * @see content/SYNC.md
   */
  inspirehep_id: inspirehepId.optional(),

  /**
   * ORCID iD (16-digit identifier like 0000-0002-1234-5678).
   * Optional — students may not have one yet.
   * Used by Phase 9 sync as a secondary author-query mechanism
   * (arXiv + InspireHEP both support ORCID-keyed queries).
   * @see content/SYNC.md
   */
  orcid_id: orcidId.optional(),

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
  contact: ContactSchema,

  /** Social accounts rendered as icon links (PEOP-11) */
  social_links: z.array(SocialLinkSchema).optional().default([]),

  /**
   * Years active in the group. Optional — not currently surfaced in the UI
   * (the redesigned Past Members list shows only the role line).
   */
  years: z
    .strictObject({
      start: z.number().int().min(1980).max(2100),
      end: z.number().int().min(1980).max(2100).optional(),
    })
    .optional(),

  /** Thesis topic for undergraduate researchers. Optional. */
  thesis_topic: bilingualString("thesis_topic").optional(),

  /**
   * Where the person works now — shown on the Past Members section (PEOP-05).
   */
  current_position: bilingualString("current_position").optional(),

  /**
   * Teaching position (cargo docente) for PIs, postdocs, PhD and undergrad
   * students — rendered as a second muted line on the card. Optional: not
   * every member has a teaching appointment.
   */
  teaching_role: bilingualString("teaching_role").optional(),

  /**
   * Current institutional affiliation for external collaborators and
   * visitors — rendered in parentheses next to the name on the plain-row
   * view, and used as the `affiliation` value in the Person JSON-LD.
   * Optional: not every member has a separate affiliation.
   */
  affiliation: bilingualString("affiliation").optional(),
});

// ---------------------------------------------------------------------------
// C. PeopleSchema — array with a slug-uniqueness rule
// ---------------------------------------------------------------------------

export const PeopleSchema = z.array(PersonSchema).superRefine((people, ctx) => {
  const seen = new Set<string>();

  for (let i = 0; i < people.length; i++) {
    const p = people[i];

    // Slug uniqueness
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
  }
});

// ---------------------------------------------------------------------------
// D. Inferred types
// ---------------------------------------------------------------------------

export type Person = z.infer<typeof PersonSchema>;
export type People = z.infer<typeof PeopleSchema>;
