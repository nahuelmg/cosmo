/**
 * Content layer barrel — Phase 3+ one-line import surface.
 *
 * Pages import exclusively from "@/content", never from "@/content/accessors/*"
 * directly. This lets us rearrange accessor modules internally without touching
 * every page that consumes them.
 *
 * @example
 * import {
 *   getPeople, getPublications, getResearchAreas, getJournalClub, getOutreach,
 *   localize, siteConfig, type Person, type Publication,
 * } from "@/content";
 */

// ---------------------------------------------------------------------------
// Accessor re-exports (all functions from all 5 accessor modules)
// ---------------------------------------------------------------------------

export * from "./accessors/people";
export * from "./accessors/publications";
export * from "./accessors/research";
export * from "./accessors/journal-club";
export * from "./accessors/outreach";

// ---------------------------------------------------------------------------
// Type re-exports (convenience — avoids a second import from the schema modules)
// ---------------------------------------------------------------------------

export type { Person, People } from "./schemas/people.schema";
export type { Publication, Publications, PublicationsMeta } from "./schemas/publications.schema";
export type { ResearchArea, Research } from "./schemas/research.schema";
export type {
  JournalClubSession,
  JournalClub,
} from "./schemas/journal-club.schema";
export type {
  OutreachActivity,
  Outreach,
} from "./schemas/outreach.schema";

// ---------------------------------------------------------------------------
// Shared helpers — pages commonly need localize() and Locale alongside accessors
// ---------------------------------------------------------------------------

export { localize, type Locale } from "./schemas/shared";

// ---------------------------------------------------------------------------
// Site config — not strictly "content" but commonly imported alongside accessors
// on the same page (e.g. layout, hero section)
// ---------------------------------------------------------------------------

export { siteConfig, type SiteConfig } from "../config/site";
