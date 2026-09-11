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

interface BilingualString {
  es: string;
  en: string;
}

type SocialPlatform =
  | "twitter"
  | "instagram"
  | "youtube"
  | "github"
  | "linkedin"
  | "bluesky";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label: string; // e.g. "@CosmoGroupUBA"
}

interface Affiliation {
  name: { es: string; en: string };
  url?: string;
  /** schema.org @type for the JSON-LD parentOrganization entry. */
  schemaType?: string;
  /** Wikidata (or similar) URI for the JSON-LD `sameAs` field. */
  sameAs?: string;
}

export const siteConfig = {
  /**
   * Canonical group name — stays in Spanish as the institutional identity.
   * Argentine group, Spanish-default site. CONTEXT.md "Canonical-only fields".
   * If bilingual rendering is needed at a call site, use tagline.es / tagline.en.
   */
  groupName: "Buenos Aires Cosmología",

  /**
   * Canonical site URL used for metadata, sitemap, JSON-LD, canonical / hreflang
   * link tags, and OG / Twitter URL fields. Single source of truth — change this
   * (or the NEXT_PUBLIC_SITE_URL env var) and every downstream SEO surface updates.
   * Fallback points at the Vercel preview domain until a group-owned domain lands.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmo.vercel.app",

  tagline: {
    es: "Explorando el universo a gran escala desde Buenos Aires",
    en: "Exploring the large-scale universe from Buenos Aires",
  },

  affiliations: [
    {
      name: {
        es: "Departamento de Física - FCEN - UBA",
        en: "Department of Physics - FCEN - UBA",
      },
      url: "https://www.df.uba.ar",
      schemaType: "EducationalOrganization",
    },
    {
      // The institute the group belongs to, not the funding agency itself, so
      // this entry links to IFIBA's record and carries no CONICET sameAs.
      name: {
        es: "IFIBA - CONICET",
        en: "IFIBA - CONICET",
      },
      url: "https://bicyt.conicet.gov.ar/fichas/u/ifiba",
      schemaType: "ResearchOrganization",
    },
    {
      name: {
        es: "Facultad de Ciencias Exactas y Naturales",
        en: "School of Exact and Natural Sciences",
      },
      url: "https://exactas.uba.ar",
      schemaType: "EducationalOrganization",
    },
    {
      name: {
        es: "Universidad de Buenos Aires",
        en: "University of Buenos Aires",
      },
      url: "https://www.uba.ar",
      schemaType: "CollegeOrUniversity",
      sameAs: "https://www.wikidata.org/wiki/Q1572590",
    },
  ] satisfies Affiliation[],

  address: {
    es: "Departamento de Física\nFacultad de Ciencias Exactas y Naturales\nPabellón I\nCiudad Universitaria\nC1428 - Buenos Aires - Argentina",
    en: "Department of Physics\nFaculty of Exact and Natural Sciences\nPabellón I\nCiudad Universitaria\nC1428 - Buenos Aires - Argentina",
  } satisfies BilingualString,

  mapQuery: "Pabellón 1, Ciudad Universitaria, Buenos Aires, C1428 Buenos Aires, Argentina",

  /** Populate as real social accounts become known. */
  socialLinks: [] satisfies SocialLink[],
} as const;

export type SiteConfig = typeof siteConfig;
