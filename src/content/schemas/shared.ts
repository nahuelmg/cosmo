/**
 * Shared Zod v4 helpers for all per-type content schemas.
 *
 * Sources:
 *  - RESEARCH.md Pattern 1: "Bilingual Field Helper"
 *  - RESEARCH.md Pitfall #4: "Photo Paths — Leading Slash Convention"
 *  - RESEARCH.md "Publications Schema" (arXiv / DOI regex + smart-quote rule)
 *
 * Every per-type schema (people, publications, research, journal-club, outreach)
 * MUST import from here and MUST NOT hand-roll bilingual fields or ID validators.
 */

import * as z from "zod";
import englishTranslations from "../../../content/translations.en.json";

// ---------------------------------------------------------------------------
// Smart-quote detection
// ---------------------------------------------------------------------------

/**
 * Matches the four "curly" quotation mark codepoints that Word / Google Docs
 * emit when the user types a quote character.
 *
 * Caught codepoints:
 *   U+201C  LEFT DOUBLE QUOTATION MARK  "
 *   U+201D  RIGHT DOUBLE QUOTATION MARK "
 *   U+2018  LEFT SINGLE QUOTATION MARK  '
 *   U+2019  RIGHT SINGLE QUOTATION MARK '
 *
 * NOT caught (intentionally):
 *   U+0027  APOSTROPHE / straight single quote  '
 *   U+0022  QUOTATION MARK / straight double     "
 *   U+2032  PRIME (mathematical)                 ′
 *   U+2033  DOUBLE PRIME                         ″
 */
export const SMART_QUOTES = /[\u201C\u201D\u2018\u2019]/;

// ---------------------------------------------------------------------------
// Prose helpers
// ---------------------------------------------------------------------------

/**
 * A non-empty string that rejects smart quotes.
 * Use for any user-visible prose the maintainer types (bios, descriptions,
 * taglines). Pass a label so the Zod error message names the field.
 */
export function proseString(label: string) {
  return z
    .string()
    .min(1)
    .refine((v) => !SMART_QUOTES.test(v), {
      error: `${label}: smart quotes detected — use straight quotes`,
    });
}

/**
 * Bilingual prose field — requires both 'es' and 'en' locales.
 * Uses z.strictObject so extra keys (e.g. 'fr') are rejected at build time.
 * This is the ONLY way to express a bilingual field in a per-type schema.
 */
export function bilingualString(label: string) {
  return z.strictObject({
    es: proseString(`${label}.es`),
    en: proseString(`${label}.en`),
  });
}

// ---------------------------------------------------------------------------
// Single-language / canonical helpers
// ---------------------------------------------------------------------------

/**
 * A non-empty string with no smart-quote check.
 * For academic canonical text: paper titles, author names, journal names.
 * Academic convention — these stay in the paper's original language.
 */
export const canonicalString = z.string().min(1);

/**
 * kebab-case slug: lowercase letters, digits, hyphens.
 * Used for person slugs that become URL segments.
 */
export const slugString = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "slug must be kebab-case (lowercase, hyphen-separated)",
  );

// ---------------------------------------------------------------------------
// Photo path helpers
// ---------------------------------------------------------------------------

/**
 * A photo path relative to the public/ directory.
 * MUST NOT start with '/' — Next.js serves public/people/Foo.png as
 * /people/Foo.png, but the prebuild photo-existence check does
 * path.join(PUBLIC_DIR, v), which treats a leading '/' as the filesystem root.
 * Store as "people/Foo.png", not "/people/Foo.png".
 *
 * RESEARCH.md Pitfall #4.
 */
export const photoPath = z
  .string()
  .refine(
    (v) => !v.startsWith("/"),
    'photo path must not start with / (store as "people/Foo.png", not "/people/Foo.png")',
  );

/**
 * Optional photo path. Intentionally no .default("") — leave undefined when
 * absent so the prebuild photo-existence check can cleanly skip absent photos:
 *   if (person.photo) { checkExists(...) }
 */
export const optionalPhoto = photoPath.optional();

// ---------------------------------------------------------------------------
// Academic identifier helpers — RESEARCH.md "Publications Schema"
// ---------------------------------------------------------------------------

/**
 * Bare arXiv ID (no "arXiv:" prefix, no URL).
 * Formats:
 *  - Modern (post-2007): YYMM.NNNNN or YYMM.NNNN, optional vN version suffix.
 *    Examples: "2501.12345", "0706.0001v2"
 *  - Pre-2007: category/NNNNNNN (7-digit number), optional vN version suffix.
 *    Examples: "gr-qc/9209007", "hep-th/0207269v2"
 */
export const arxivId = z
  .string()
  .regex(
    /^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/,
    "arXiv ID: modern YYMM.NNNNN or pre-2007 category/NNNNNNN, optional vN suffix",
  );

/**
 * Bare DOI (no "https://doi.org/" prefix).
 * Format: 10.XXXX/... per Crossref regex (case-insensitive suffix).
 * Example: "10.1093/mnras/stab2490"
 */
export const doiId = z
  .string()
  .regex(
    /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i,
    "DOI format: 10.XXXX/... (bare DOI, no https://doi.org/ prefix)",
  );

/**
 * ORCID identifier in hyphenated 16-digit format.
 * The last character may be an uppercase X (check digit).
 * Example: "0000-0002-1825-0097"
 */
export const orcidId = z
  .string()
  .regex(
    /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/,
    "ORCID format: 0000-0000-0000-0000 (last digit may be X)",
  );

// ---------------------------------------------------------------------------
// Locale utilities (used by accessors in Plans 02–04)
// ---------------------------------------------------------------------------

export type Locale = "es" | "en";

// Curated translations of sheet text live separately from generated content,
// so scheduled syncs cannot overwrite them. Exact source matching prevents an
// old translation from being applied after the original text changes.
const translations = z.record(z.string(), proseString("translation.en"))
  .parse(englishTranslations);

export function localizeSource(value: string, locale: Locale): string {
  return locale === "en" && Object.hasOwn(translations, value)
    ? translations[value]
    : value;
}

/**
 * Pick the locale-specific string from a bilingual field.
 * Accessors call this so page components never have to reference .es / .en.
 */
export function localize<T extends { es: string; en: string }>(
  field: T,
  locale: Locale,
): string {
  return field.en === field.es
    ? localizeSource(field[locale], locale)
    : field[locale];
}

/**
 * ASCII-fold + lowercase a human name for author-string matching.
 * Spec: Unicode NFD decomposition → strip combining marks → lowercase.
 * Used by Phase 11 to substring-match normalized author strings
 * against PersonSchema.display_name_normalized.
 * Example: "Núñez, María" → "nunez, maria"
 */
export function normalizeName(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
