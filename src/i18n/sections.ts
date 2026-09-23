import { routing } from "./routing";

export type Locale = (typeof routing.locales)[number];
export const sectionKeys = [
  "people", "research", "publications", "journal-club", "resources", "outreach", "contact",
] as const;
export type Section = (typeof sectionKeys)[number];

export function localizedSection(section: Section, locale: Locale): string {
  const pathname = routing.pathnames[`/${section}`];
  return (typeof pathname === "string" ? pathname : pathname[locale]).slice(1);
}

export function resolveSection(section: string, locale: Locale): Section | undefined {
  return sectionKeys.find((key) => localizedSection(key, locale) === section);
}
