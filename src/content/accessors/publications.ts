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

import rawFile from "../../../content/publications.json";
import { PublicationsFileSchema, type Publication } from "../schemas/publications.schema";
import { normalizeName } from "../schemas/shared";

// Parse once at module load — throws at import time if invalid.
// content/publications.json has the wrapped { _meta, publications } shape produced
// by scripts/sync-publications.ts. Any invalid data causes an import-time throw,
// surfacing content errors at build time rather than runtime.
const { publications } = PublicationsFileSchema.parse(rawFile);

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

/**
 * Returns publications where any author matches any of the given name variants.
 *
 * Matching: substring, case-insensitive, diacritic-folded via `normalizeName`
 * (NFD-decompose → strip combining marks → lowercase). The same transform
 * populates `PersonSchema.display_name_normalized`, so ASCII variants like
 * `"ahumada acuna"` cleanly match author strings like `"Ahumada Acuña, G."`.
 *
 * Variants shorter than 4 characters (post-normalization) are silently
 * filtered to avoid false positives from initials ("F.", "J."). If no
 * variants survive the filter, returns `[]`.
 *
 * `options.lastNYears` narrows results to `year >= currentYear - lastNYears`
 * inclusive. `lastNYears: 0` returns only current-year papers. Omitting the
 * option (or the whole options arg) applies no year filter. Guarded via
 * `!== undefined` so `0` is distinguishable from unset.
 *
 * Results are pre-sorted: year desc → arXiv ID desc → no-arXiv entries last
 * (stable within each bucket). Non-mutating — uses `[...publications]`.
 *
 * Requirements: ACC-01, ACC-02, ACC-03, ACC-04, ACC-05.
 *
 * @example
 * // last-10-years publications for a group member on /people/[slug]
 * getPublicationsByAuthor(
 *   [person.display_name, person.display_name_normalized],
 *   { lastNYears: 10 },
 * );
 *
 * @example
 * // full archive match for author highlighting on /publications
 * getPublicationsByAuthor([person.display_name_normalized]);
 */
export function getPublicationsByAuthor(
  nameVariants: string[],
  options?: { lastNYears?: number },
): Publication[] {
  const validVariants = nameVariants
    .map((v) => normalizeName(v))
    .filter((v) => v.length >= 4);

  if (validVariants.length === 0) return [];

  const currentYear = new Date().getFullYear();
  const yearMin =
    options?.lastNYears !== undefined
      ? currentYear - options.lastNYears
      : -Infinity;

  return [...publications]
    .filter((pub) => {
      if (pub.year < yearMin) return false;
      const normalizedAuthors = pub.authors.map((a) => normalizeName(a));
      return validVariants.some((variant) =>
        normalizedAuthors.some((author) => author.includes(variant)),
      );
    })
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (a.arxiv && b.arxiv) return b.arxiv.localeCompare(a.arxiv);
      if (a.arxiv) return -1;
      if (b.arxiv) return 1;
      return 0;
    });
}
