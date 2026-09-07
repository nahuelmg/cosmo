/**
 * people-extra schema — DATA-01b
 *
 * `content/people-extra.json` is the hybrid enrichment file for the People tab.
 * The roster (who is in the group, their section/category and their Spanish
 * research/teaching roles) comes from a Google Sheet; everything the sheet
 * cannot express is kept here, keyed by person slug, and merged in by
 * `scripts/sync-people.ts` when it regenerates `content/people.json`.
 *
 * Every field is optional. A slug with no useful enrichment is simply absent.
 */

import * as z from "zod";
import {
  bilingualString,
  orcidId,
  optionalPhoto,
} from "./shared";
import {
  SocialLinkSchema,
  ContactSchema,
  inspirehepId,
} from "./people.schema";

export const PersonExtraSchema = z.strictObject({
  /** Role fallback — used only when the sheet section has no role column (collaborators). */
  role: bilingualString("role").optional(),
  /** Teaching-role fallback — used only when the sheet has no "Cargo docente" value. */
  teaching_role: bilingualString("teaching_role").optional(),
  /** Institutional affiliation for external collaborators / visitors (bilingual, curated). */
  affiliation: bilingualString("affiliation").optional(),

  inspirehep_id: inspirehepId.optional(),
  orcid_id: orcidId.optional(),
  photo: optionalPhoto,
  contact: ContactSchema.optional(),
  social_links: z.array(SocialLinkSchema).optional(),

  short_bio: bilingualString("short_bio").optional(),
  full_bio: bilingualString("full_bio").optional(),
  research_interests: z.array(bilingualString("research_interest")).min(1).optional(),

  years: z
    .strictObject({
      start: z.number().int().min(1980).max(2100),
      end: z.number().int().min(1980).max(2100).optional(),
    })
    .optional(),
  thesis_topic: bilingualString("thesis_topic").optional(),
  current_position: bilingualString("current_position").optional(),
});

/** Map of person slug → enrichment. */
export const PeopleExtraSchema = z.record(z.string(), PersonExtraSchema);

export type PersonExtra = z.infer<typeof PersonExtraSchema>;
export type PeopleExtra = z.infer<typeof PeopleExtraSchema>;
