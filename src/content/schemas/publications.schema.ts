/**
 * Publications content schema — Zod v4.
 *
 * Publications are canonical-only (no bilingual fields). Paper titles and
 * abstracts are preserved in the paper's native language (typically English
 * for astrophysics/cosmology papers).
 *
 * Key constraints enforced here:
 *  - arXiv IDs: bare YYMM.NNNNN format (no "arXiv:" prefix, no URL)
 *  - DOIs: bare 10.XXXX/... format (no "https://doi.org/" prefix)
 *  - Publication IDs: unique across the full array (via superRefine)
 *
 * Validators are imported from shared.ts — do NOT duplicate regexes here.
 *
 * DATA-02 spec: the definitive field list for v1.
 * YAGNI: bib_key, cite_count not included — defer to v2.
 */

import * as z from "zod";
import { canonicalString, arxivId, doiId } from "./shared";

// ---------------------------------------------------------------------------
// Single publication
// ---------------------------------------------------------------------------

export const PublicationSchema = z.strictObject({
  /**
   * Stable kebab-case identifier for this publication.
   * Used as React key, URL anchor, and future permalink.
   * Do NOT derive from DOI or arXiv — some papers have neither.
   * Examples: "2025-sigma8-cmb-lensing", "2024-h0-bayesian"
   */
  id: z.string().min(1),

  /**
   * Author list in "Last, F." or "Full Name" style — pick one and be consistent.
   * First entry = first author (renders first on the page).
   * Strings only for v1 — ORCID per-author is a v2 concern.
   */
  authors: z.array(canonicalString).min(1),

  /**
   * Paper title in the paper's native language (canonical, no smart-quote check).
   * Greek letters are welcome (σ₈, H₀, Λ-CDM) — Phase 1 wired the Greek font subset.
   */
  title: canonicalString,

  /**
   * Journal or venue name. Free string (no enum — new journals would break it).
   * May include volume/issue inline. Use "Preprint" for arXiv-only submissions.
   * Examples: "Phys. Rev. D 108 (2024) 103512", "JCAP 04 (2025) 012", "Preprint"
   */
  journal: z.string().min(1),

  /**
   * Publication year (integer 1900–2100).
   */
  year: z.number().int().min(1900).max(2100),

  /**
   * Bare arXiv ID, no "arXiv:" prefix and no URL.
   * Regex (from shared.ts): /^\d{4}\.\d{4,5}(v\d+)?$/
   * Examples: "2501.12345", "2406.00891v2"
   */
  arxiv: arxivId.optional(),

  /**
   * Bare DOI, no "https://doi.org/" prefix.
   * Regex (from shared.ts): /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i
   * Examples: "10.1103/PhysRevD.108.103512", "10.1088/1475-7516/2025/04/012"
   */
  doi: doiId.optional(),

  /**
   * Loose tag set for filtering. Phase 4 PUBS-03 renders the distinct-tag list
   * as a filter dropdown — case-sensitive matching keeps the vocabulary stable.
   * Examples: "dark matter", "CMB", "gravitational waves", "N-body simulations"
   */
  topic_tags: z.array(z.string().min(1)).optional().default([]),

  /**
   * Where this publication record originated.
   * @default "manual"
   * @see content/SYNC.md
   */
  source: z.enum(["manual", "inspirehep", "arxiv"]).default("manual"),

  /**
   * Raw abstract if the maintainer cared to include it.
   * Canonical (no bilingual); no smart-quote check (maintainers legitimately
   * paste arXiv/journal abstracts with their own punctuation).
   */
  abstract: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Publications array with id uniqueness constraint
// ---------------------------------------------------------------------------

/**
 * Array of publications with superRefine ensuring no duplicate IDs.
 * Duplicate IDs would break React keys and future permalinks.
 */
export const PublicationsSchema = z
  .array(PublicationSchema)
  .superRefine((pubs, ctx) => {
    const seen = new Set<string>();
    pubs.forEach((p, i) => {
      if (seen.has(p.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate publication id "${p.id}"`,
          path: [i, "id"],
          input: p.id,
        });
      }
      seen.add(p.id);
    });
  });

// ---------------------------------------------------------------------------
// TypeScript types
// ---------------------------------------------------------------------------

export type Publication = z.infer<typeof PublicationSchema>;
export type Publications = z.infer<typeof PublicationsSchema>;

// ---------------------------------------------------------------------------
// File-level wrapper (Phase 9 sync script output)
// ---------------------------------------------------------------------------

/**
 * Meta block written by scripts/sync-publications.ts at the top of publications.json.
 * Shape per .planning/phases/09-sync-script/09-CONTEXT.md §_meta block shape.
 */
export const PublicationsMetaSchema = z.object({
  synced_at: z.string().datetime({ offset: true }), // ISO-8601 UTC, e.g. "2026-04-19T06:00:00Z"
  sources:   z.array(z.enum(["inspirehep", "arxiv"])),
  counts: z.object({
    inspirehep: z.number().int().min(0),
    arxiv:      z.number().int().min(0),
    manual:     z.number().int().min(0),
  }),
  warnings: z.array(z.string()),
});

/**
 * File-level shape of content/publications.json after the Phase 9 sync script first runs.
 * Wraps the existing PublicationsSchema (array + duplicate-id superRefine) — downstream
 * consumers of the Publication[] type and PublicationsSchema are unchanged.
 */
export const PublicationsFileSchema = z.object({
  _meta:        PublicationsMetaSchema,
  publications: PublicationsSchema,
});

export type PublicationsMeta = z.infer<typeof PublicationsMetaSchema>;
export type PublicationsFile = z.infer<typeof PublicationsFileSchema>;
