/**
 * Accessor for outreach activities content.
 * Parses and validates content/outreach.json at module load.
 * All consumers receive typed, validated data.
 */

import rawOutreach from "../../../content/outreach.json";
import {
  OutreachSchema,
  type OutreachActivity,
} from "../schemas/outreach.schema";
import { localize, type Locale } from "../schemas/shared";

// Parse at module load — throws immediately if JSON is malformed or invalid
const activities: OutreachActivity[] = OutreachSchema.parse(rawOutreach);

/**
 * Returns all outreach activities sorted by date descending (newest first).
 */
export function getOutreach(): OutreachActivity[] {
  return [...activities].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Returns outreach activities of a specific type, sorted newest first.
 */
export function getOutreachByType(
  type: OutreachActivity["type"],
): OutreachActivity[] {
  return getOutreach().filter((a) => a.type === type);
}

/**
 * Returns all outreach activities sorted newest first with bilingual fields
 * (title and description) resolved to the requested locale.
 */
export function getLocalizedOutreach(locale: Locale) {
  return getOutreach().map((a) => ({
    ...a,
    title: localize(a.title, locale),
    description: localize(a.description, locale),
  }));
}
