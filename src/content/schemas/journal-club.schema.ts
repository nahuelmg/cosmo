/**
 * Schema for journal club sessions (DATA-04, CLUB-01/02).
 *
 * Since v1.4 the sessions are synced from a Google Sheet by
 * `scripts/sync-journal-club.ts`; `content/journal-club.json` is generated —
 * never hand-edit it. Titles, speaker names, affiliations, abstracts and notes
 * are canonical (kept in whatever language the sheet maintainer typed).
 *
 * Derived fields (set by the sync script, not present in the sheet):
 *   - `id`            — `${date}-${speaker-slug}`
 *   - `status`        — `upcoming` when `date >= today`, else `past`
 *   - `academic_year` — `YYYY-YYYY` season, only on past sessions
 *
 * Business rules enforced in superRefine:
 *   - id uniqueness
 *   - past sessions MUST have academic_year (grouping anchor per CLUB-02)
 *   - past sessions with future dates are rejected (status-date consistency)
 */

import * as z from "zod";
import { canonicalString } from "./shared";

export const JournalClubSessionSchema = z.strictObject({
  id: z.string().min(1), // derived — stable React key + URL anchor
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be ISO YYYY-MM-DD"),
  status: z.enum(["upcoming", "past"]), // derived from date
  speaker: canonicalString, // person name, original form (e.g. "Dr. Jun Koda")
  speaker_position: canonicalString.optional(), // "Posición" column — e.g. "Profesora", "Investigador"
  affiliation: canonicalString.optional(), // institution, original form
  title: canonicalString, // paper title, paper-native
  abstract: z.string().optional(), // "Resumen" column — paper abstract, free text
  paper_link: z.url().optional(), // arXiv/DOI/journal URL
  notes: z.string().optional(), // "Notas" column — short group commentary
  academic_year: z
    .string()
    .regex(
      /^\d{4}-\d{4}$/,
      'academic_year format: YYYY-YYYY (e.g. 2024-2025)',
    )
    .optional(),
  // academic_year required for past sessions — enforced in superRefine
});

export const JournalClubSchema = z
  .array(JournalClubSessionSchema)
  .superRefine((sessions, ctx) => {
    const seen = new Set<string>();
    const today = new Date().toISOString().slice(0, 10);
    sessions.forEach((s, i) => {
      // id uniqueness
      if (seen.has(s.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate session id "${s.id}"`,
          path: [i, "id"],
          input: s.id,
        });
      }
      seen.add(s.id);
      // past sessions require academic_year (grouping anchor per CLUB-02)
      if (s.status === "past" && !s.academic_year) {
        ctx.addIssue({
          code: "custom",
          message:
            'past sessions must specify academic_year (e.g. "2024-2025")',
          path: [i, "academic_year"],
          input: s.academic_year,
        });
      }
      // status-date consistency: past session with future date is almost certainly a typo
      if (s.status === "past" && s.date > today) {
        ctx.addIssue({
          code: "custom",
          message: `past session has future date ${s.date}`,
          path: [i, "date"],
          input: s.date,
        });
      }
    });
  });

export type JournalClubSession = z.infer<typeof JournalClubSessionSchema>;
export type JournalClub = z.infer<typeof JournalClubSchema>;
