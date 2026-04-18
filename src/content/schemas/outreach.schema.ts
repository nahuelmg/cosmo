/**
 * Schema for outreach activities (DATA-05, OTRCH-02/03).
 *
 * Covers the full range of science-outreach activity types: talks, workshops,
 * school visits, articles, interviews, and videos. The `link` field is optional
 * so Phase 4 can render link-absent cards cleanly (OTRCH-03).
 */

import * as z from "zod";
import { bilingualString, optionalPhoto } from "./shared";

const OutreachActivitySchema = z.strictObject({
  id: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be ISO YYYY-MM-DD"),
  type: z.enum(["talk", "workshop", "school-visit", "article", "interview", "video"]), // OTRCH-02 activity kinds
  title: bilingualString("title"),
  description: bilingualString("description"),
  image: optionalPhoto, // optional landscape image for card background / thumb
  link: z.url().optional(), // optional link to video/slides/article — OTRCH-03 "hide when absent"
});

export const OutreachSchema = z
  .array(OutreachActivitySchema)
  .superRefine((acts, ctx) => {
    const seen = new Set<string>();
    acts.forEach((a, i) => {
      if (seen.has(a.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate outreach id "${a.id}"`,
          path: [i, "id"],
          input: a.id,
        });
      }
      seen.add(a.id);
    });
  });

export { OutreachActivitySchema };
export type OutreachActivity = z.infer<typeof OutreachActivitySchema>;
export type Outreach = z.infer<typeof OutreachSchema>;
