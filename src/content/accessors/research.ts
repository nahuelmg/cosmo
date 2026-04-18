/**
 * Accessor for research areas content.
 * Parses and validates content/research.json at module load.
 * All consumers receive typed, validated data.
 */

import rawResearch from "../../../content/research.json";
import { ResearchSchema, type ResearchArea } from "../schemas/research.schema";
import { localize, type Locale } from "../schemas/shared";

// Parse at module load — throws immediately if JSON is malformed or invalid
const areas: ResearchArea[] = ResearchSchema.parse(rawResearch);

/**
 * Returns all research areas sorted by their display order (ascending).
 */
export function getResearchAreas(): ResearchArea[] {
  return [...areas].sort((a, b) => a.order - b.order);
}

/**
 * Returns a single research area by its canonical id, or undefined if not found.
 */
export function getResearchAreaById(id: string): ResearchArea | undefined {
  return areas.find((a) => a.id === id);
}

/**
 * Returns research areas sorted by order with bilingual fields resolved to the
 * requested locale. Consumers receive plain strings — no .es / .en access needed.
 */
export function getLocalizedResearchAreas(locale: Locale) {
  return getResearchAreas().map((a) => ({
    ...a,
    title: localize(a.title, locale),
    short_description: localize(a.short_description, locale),
    full_description: localize(a.full_description, locale),
  }));
}
