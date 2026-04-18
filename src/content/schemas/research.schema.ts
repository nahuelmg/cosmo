/**
 * Schema for research areas (DATA-03, RSCH-02).
 * Imports shared helpers — never hand-roll bilingual fields or photo paths.
 */

import * as z from "zod";
import { bilingualString, optionalPhoto } from "./shared";

export const ResearchAreaSchema = z.strictObject({
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be kebab-case"),
  title: bilingualString("title"), // "Materia Oscura" / "Dark Matter"
  short_description: bilingualString("short_description"), // 1-2 sentences for grid card
  full_description: bilingualString("full_description"), // 1-3 paragraphs for future detail surface
  icon: z.string().optional(), // optional Lucide/Phosphor icon name
  image: optionalPhoto, // optional landscape hero for the area
  order: z.number().int().min(0), // display order on the grid (0 = first)
});

export const ResearchSchema = z
  .array(ResearchAreaSchema)
  .superRefine((areas, ctx) => {
    const seen = new Set<string>();
    areas.forEach((a, i) => {
      if (seen.has(a.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate research id "${a.id}"`,
          path: [i, "id"],
          input: a.id,
        });
      }
      seen.add(a.id);
    });
  });

export type ResearchArea = z.infer<typeof ResearchAreaSchema>;
export type Research = z.infer<typeof ResearchSchema>;
