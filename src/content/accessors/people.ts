/**
 * People content accessors — PERF-01, DATA-07
 *
 * Follows RESEARCH.md Pattern 3 ("Static Import + Parse at Module Load") and
 * Pattern 4 ("Locale-Resolved Accessors").
 *
 * The static top-level import of people.json means Next.js resolves the module
 * at build time (resolveJsonModule: true, set in tsconfig.json by Plan 01-01).
 * This avoids per-request evaluation in Server Components and satisfies PERF-01.
 *
 * PeopleSchema.parse() runs once at module load. If any entry violates the
 * schema the import throws — caught by the Plan 05 prebuild script, but also
 * surfaced immediately during `next build` / `next dev`. This is the second
 * line of defence described in DATA-07.
 */

import rawPeople from "../../../content/people.json";
import { PeopleSchema, type Person } from "../schemas/people.schema";
import { localize, type Locale } from "../schemas/shared";

// ---------------------------------------------------------------------------
// Parse once at module load
// ---------------------------------------------------------------------------

// If invalid, Next.js build throws here with the full Zod error.
const people: Person[] = PeopleSchema.parse(rawPeople);

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/**
 * Returns the full parsed People array in authoring order.
 * Use this for the complete member list or when you need to iterate all entries.
 */
export function getPeople(): Person[] {
  return people;
}

/**
 * Returns all people in the given category.
 * Phase 4's People page uses this to build the PI / Postdoc / PhD / Undergrad
 * / Past sections in order.
 *
 * @example
 * const pis = getPeopleByCategory("pi");
 */
export function getPeopleByCategory(category: Person["category"]): Person[] {
  return people.filter((p) => p.category === category);
}

/**
 * Returns the person with the given slug, or undefined if not found.
 * Used by `/people/[slug]` dynamic routes for individual profile pages (PEOP-06).
 *
 * @example
 * const person = getPersonBySlug("esteban-calzetta");
 */
export function getPersonBySlug(slug: string): Person | undefined {
  return people.find((p) => p.slug === slug);
}

/**
 * Returns a single person with all bilingual fields resolved to plain strings
 * for the given locale. Returns undefined if the slug is not found.
 *
 * The returned object has the same shape as Person except that:
 * - role, short_bio, full_bio → string (not { es, en })
 * - research_interests → string[] (not { es, en }[])
 * - thesis_topic, current_position → string | undefined
 *
 * Page components never have to reference .es / .en directly.
 *
 * @example
 * const localES = getLocalizedPerson("esteban-calzetta", "es");
 * // localES.role === "Investigador Principal"
 */
export function getLocalizedPerson(slug: string, locale: Locale) {
  const p = getPersonBySlug(slug);
  if (!p) return undefined;
  return {
    ...p,
    role: localize(p.role, locale),
    short_bio: localize(p.short_bio, locale),
    full_bio: localize(p.full_bio, locale),
    research_interests: p.research_interests.map((ri) => localize(ri, locale)),
    thesis_topic: p.thesis_topic ? localize(p.thesis_topic, locale) : undefined,
    current_position: p.current_position
      ? localize(p.current_position, locale)
      : undefined,
    teaching_role: p.teaching_role ? localize(p.teaching_role, locale) : undefined,
    affiliation: p.affiliation ? localize(p.affiliation, locale) : undefined,
  };
}

/**
 * Returns all people with bilingual fields resolved for the given locale.
 * The People list page consumes this so it never has to localize in the component.
 *
 * @example
 * const allES = getLocalizedPeople("es");
 * allES.forEach(p => console.log(p.role)); // "Investigador Principal", ...
 */
export function getLocalizedPeople(locale: Locale) {
  return people.map((p) => ({
    ...p,
    role: localize(p.role, locale),
    short_bio: localize(p.short_bio, locale),
    full_bio: localize(p.full_bio, locale),
    research_interests: p.research_interests.map((ri) => localize(ri, locale)),
    thesis_topic: p.thesis_topic ? localize(p.thesis_topic, locale) : undefined,
    current_position: p.current_position
      ? localize(p.current_position, locale)
      : undefined,
    teaching_role: p.teaching_role ? localize(p.teaching_role, locale) : undefined,
    affiliation: p.affiliation ? localize(p.affiliation, locale) : undefined,
  }));
}

// ---------------------------------------------------------------------------
// Usage from a Server Component:
//   const locale = await getLocale();  // from "next-intl/server"
//   const person = getLocalizedPerson(slug, locale as Locale);
//   const allPeople = getLocalizedPeople(locale as Locale);
// ---------------------------------------------------------------------------
