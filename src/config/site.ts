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
}

export const siteConfig = {
  /**
   * Canonical group name — stays in Spanish as the institutional identity.
   * Argentine group, Spanish-default site. CONTEXT.md "Canonical-only fields".
   * If bilingual rendering is needed at a call site, use tagline.es / tagline.en.
   */
  groupName: "Grupo de Cosmología",

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

  address: {
    es: "Departamento de Física, Pabellón I, Ciudad Universitaria, C1428EGA Ciudad Autónoma de Buenos Aires, Argentina",
    en: "Department of Physics, Pabellón I, Ciudad Universitaria, C1428EGA Buenos Aires, Argentina",
  } satisfies BilingualString,

  office: {
    es: "Oficina 6, Pabellón I, DF-FCEN, UBA",
    en: "Office 6, Pabellón I, DF-FCEN, UBA",
  } satisfies BilingualString,

  mapQuery: "Departamento de Física, Pabellón I, Ciudad Universitaria, Buenos Aires",

  /** Populate as real social accounts become known. */
  socialLinks: [] satisfies SocialLink[],
} as const;

export type SiteConfig = typeof siteConfig;
