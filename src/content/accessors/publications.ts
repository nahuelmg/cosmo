/**
 * Publications accessors — typed getters over content/publications.json.
 *
 * Publications are canonical-only (no bilingual fields). Contrast with people.ts
 * which provides getLocalized* variants for bilingual fields.
 *
 * The JSON is parsed once at module load via PublicationsSchema.parse().
 * Any invalid data in publications.json causes an import-time throw, surfacing
 * content errors at build time rather than runtime.
 *
 * Phase 4 consumption:
 *   const pubs   = getPublications();          // Publications page, newest first
 *   const topics = getAllTopics();             // filter dropdown options
 *   const years  = getAllYears();              // year filter / grouping
 *   const dark   = getPublicationsByTopic("dark matter");
 *   const y2025  = getPublicationsByYear(2025);
 *   const paper  = getPublicationById("2025-sigma8-cmb-lensing-cross");
 */

import rawPublications from "../../../content/publications.json";
import { PublicationsSchema, type Publication } from "../schemas/publications.schema";

// Parse once at module load — throws at import time if invalid
const publications: Publication[] = PublicationsSchema.parse(rawPublications);

// ---------------------------------------------------------------------------
// Accessor functions
// ---------------------------------------------------------------------------

/**
 * Returns all publications sorted by year descending (newest first).
 * Sort is stable within the same year — preserves authoring order for
 * same-year papers (JS .sort() is stable since ES2019 / V8 7.0).
 */
export function getPublications(): Publication[] {
  return [...publications].sort((a, b) => b.year - a.year);
}

/**
 * Returns publications for the given year, in authoring order within that year.
 */
export function getPublicationsByYear(year: number): Publication[] {
  return publications.filter((p) => p.year === year);
}

/**
 * Returns publications that include the given tag in their topic_tags array.
 * Case-sensitive — the tag vocabulary is controlled (see getAllTopics()).
 * Phase 4 PUBS-03 filter renders distinct tags directly from getAllTopics().
 */
export function getPublicationsByTopic(tag: string): Publication[] {
  return publications.filter((p) => p.topic_tags.includes(tag));
}

/**
 * Returns a single publication by its stable `id`, or undefined if not found.
 */
export function getPublicationById(id: string): Publication | undefined {
  return publications.find((p) => p.id === id);
}

/**
 * Returns a sorted, deduplicated list of all topic_tags across all publications.
 * Alphabetical order. Phase 4 uses this to populate the topic filter dropdown.
 */
export function getAllTopics(): string[] {
  const set = new Set<string>();
  publications.forEach((p) => p.topic_tags.forEach((t) => set.add(t)));
  return [...set].sort();
}

/**
 * Returns a deduplicated list of all publication years sorted descending (newest first).
 * Phase 4 uses this to group publications and populate the year filter dropdown.
 */
export function getAllYears(): number[] {
  return [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a);
}
