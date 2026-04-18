/**
 * Single-source site configuration — DATA-06.
 *
 * Why TypeScript types + `satisfies` instead of Zod:
 * This file is developer-maintained and checked into source. Full compile-time
 * checking via `satisfies` is sufficient — no runtime parsing overhead needed.
 * Renaming `groupName` here surfaces type errors at every downstream importer.
 *
 * RESEARCH.md "Why not Zod for site.ts"
 */

type SocialPlatform =
  | "twitter"
  | "instagram"
  | "youtube"
  | "github"
  | "linkedin"
  | "bluesky";

interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label: string; // e.g. "@CosmoGroupUBA"
}

interface Affiliation {
  name: { es: string; en: string };
  url?: string;
}

export const siteConfig = {
  /**
   * Canonical group name — stays in Spanish as the institutional identity.
   * Argentine group, Spanish-default site. CONTEXT.md "Canonical-only fields".
   * If bilingual rendering is needed at a call site, use tagline.es / tagline.en.
   */
  groupName: "Grupo de Cosmología",

  tagline: {
    es: "Explorando el universo a gran escala desde Buenos Aires",
    en: "Exploring the large-scale universe from Buenos Aires",
  },

  affiliations: [
    {
      name: {
        es: "Universidad de Buenos Aires",
        en: "University of Buenos Aires",
      },
      url: "https://www.uba.ar",
    },
    {
      name: {
        es: "Facultad de Ciencias Exactas y Naturales",
        en: "School of Exact and Natural Sciences",
      },
      url: "https://exactas.uba.ar",
    },
    {
      name: {
        es: "CONICET",
        en: "CONICET",
      },
      url: "https://www.conicet.gov.ar",
    },
  ] satisfies Affiliation[],

  contactEmail: "cosmologia@df.uba.ar",

  /** Populate as real social accounts become known. */
  socialLinks: [] satisfies SocialLink[],
} as const;

export type SiteConfig = typeof siteConfig;
