/**
 * Pure helper functions for the Phase 11 publications display layer.
 *
 * All functions are side-effect-free (no React, no I/O). They are consumed by:
 *   - src/components/publications/PublicationEntry.tsx
 *   - src/app/[locale]/publications/page.tsx (via 11-02)
 *   - src/app/[locale]/people/[slug]/page.tsx (via 11-03)
 *
 * Author matching strategy: surname-based (RESEARCH Section 5). Full
 * `display_name_normalized` does NOT substring-match InspireHEP author format
 * `"Surname, First"`, so we extract the trailing word(s) of the normalized
 * display name for reliable cross-source matching.
 *
 * Requirements: PUBS-06, PUBS-08, PUBS-11, PUBS-12.
 */

import type { Person } from "@/content";
import type { Publication } from "@/content";
import { normalizeName } from "@/content/schemas/shared";

// ---------------------------------------------------------------------------
// Name variant derivation
// ---------------------------------------------------------------------------

/**
 * Derive name variants for a Person suitable for `getPublicationsByAuthor`.
 *
 * Strategy: surname-based (RESEARCH Section 5). Full `display_name_normalized`
 * does NOT substring-match InspireHEP author format `"Surname, First"`, so we
 * extract the trailing word(s) of the normalized display name.
 *
 * Returns 1–3 variants, all ≥ 4 chars post-normalization:
 *   - last word alone (single surname — primary signal)
 *   - last two words joined (compound surnames — "lopez nacir")
 *   - full display_name_normalized (manual-entry rescue)
 *
 * Short variants are returned as-is; the accessor's internal 4-char filter
 * silently drops them. Callers should not pre-filter.
 */
export function deriveNameVariants(
  person: Pick<Person, "display_name_normalized">,
): string[] {
  const norm = person.display_name_normalized;
  const words = norm.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const last = words[words.length - 1];
  const lastTwo = words.slice(-2).join(" ");
  const variants = new Set<string>([last, lastTwo, norm]);
  return [...variants];
}

// ---------------------------------------------------------------------------
// Member ↔ publication author index (publications page filter)
// ---------------------------------------------------------------------------

export interface MemberAuthorIndex {
  /** Members who authored at least one publication, sorted by name (es collation). */
  options: { slug: string; name: string }[];
  /** publication id → slugs of member-authors. Only ids with ≥ 1 match are present. */
  bySlug: Record<string, string[]>;
}

/**
 * Cross-reference the member list against every publication's author strings so
 * the /publications page can offer a "filter by group member" dropdown.
 *
 * Matching reuses the same surname-variant strategy as `getPublicationsByAuthor`
 * (`deriveNameVariants` → `normalizeName` → substring test, variants < 4 chars
 * dropped), so a member's dropdown selection returns exactly the papers their
 * profile page lists.
 */
export function buildMemberAuthorIndex(
  people: Pick<Person, "slug" | "name" | "display_name_normalized">[],
  publications: Pick<Publication, "id" | "authors">[],
): MemberAuthorIndex {
  const members = people.map((p) => ({
    slug: p.slug,
    name: p.name,
    variants: deriveNameVariants(p)
      .map((v) => normalizeName(v))
      .filter((v) => v.length >= 4),
  }));

  const bySlug: Record<string, string[]> = {};
  const authored = new Set<string>();

  for (const pub of publications) {
    const normAuthors = pub.authors.map((a) => normalizeName(a));
    const hits: string[] = [];
    for (const m of members) {
      if (m.variants.some((v) => normAuthors.some((a) => a.includes(v)))) {
        hits.push(m.slug);
        authored.add(m.slug);
      }
    }
    if (hits.length > 0) bySlug[pub.id] = hits;
  }

  const options = members
    .filter((m) => authored.has(m.slug))
    .map((m) => ({ slug: m.slug, name: m.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return { options, bySlug };
}

// ---------------------------------------------------------------------------
// Member surname set construction
// ---------------------------------------------------------------------------

/**
 * Build the surname Set used for author highlighting across publications.
 * Consumes ALL people regardless of `category` / status — past AND current.
 * Rationale: group historical continuity (CONTEXT locked decision).
 *
 * Only includes surnames with ≥ 3 characters to avoid false positives from
 * single-letter initials or very short tokens.
 */
export function buildMemberSurnameSet(
  people: Pick<Person, "display_name_normalized">[],
): Set<string> {
  const set = new Set<string>();
  for (const p of people) {
    const words = p.display_name_normalized.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const last = words[words.length - 1];
    if (last.length >= 3) set.add(last);
  }
  return set;
}

// ---------------------------------------------------------------------------
// Member author detection
// ---------------------------------------------------------------------------

/**
 * True when any surname in `memberSurnameSet` appears as a substring of the
 * NFD-normalized author string. Handles both "Chase, Tomás Ferreira"
 * (InspireHEP) and "Chase" (arXiv CSV token).
 */
export function isMember(
  authorStr: string,
  memberSurnameSet: Set<string>,
): boolean {
  const norm = normalizeName(authorStr);
  for (const surname of memberSurnameSet) {
    if (norm.includes(surname)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Author list formatting
// ---------------------------------------------------------------------------

export interface AuthorToken {
  display: string;
  isMember: boolean;
  isEllipsis?: boolean;
}

/**
 * Format the author list for display with:
 *   - ≤ 5 authors: render all, annotated with isMember
 *   - > 5 authors:
 *       * max member index ≤ 2 → first 3 + "et al."
 *       * any member index > 2 → first 3 + ellipsis + group members only + "et al."
 *
 * Invariant: a member is never hidden under `et al.` (CONTEXT locked decision).
 * Non-member authors between the head slice and a member are collapsed into the
 * ellipsis — critical for white-paper / collaboration entries with hundreds of
 * authors, where rendering everything up to the last member is unreadable.
 *
 * Requirements: PUBS-11, PUBS-12.
 */
// InspireHEP records compound surnames incorrectly for some members
// (e.g. "Chase, Tomás Ferreira" treats "Chase" as surname). Rewrite to the
// correct "Surname, Given" form at display time; matching still works because
// `isMember` uses substring checks on normalized text.
const AUTHOR_DISPLAY_OVERRIDES: Record<string, string> = {
  "Chase, Tomás Ferreira": "Ferreira Chase, Tomás",
};

function canonicalizeAuthor(raw: string): string {
  return AUTHOR_DISPLAY_OVERRIDES[raw] ?? raw;
}

export function formatAuthors(
  authors: string[],
  memberSurnameSet: Set<string>,
): { tokens: AuthorToken[]; etAl: boolean } {
  const annotated: AuthorToken[] = authors.map((a) => ({
    display: canonicalizeAuthor(a),
    isMember: isMember(a, memberSurnameSet),
  }));

  if (authors.length <= 5) return { tokens: annotated, etAl: false };

  const memberIndices = annotated
    .map((t, i) => (t.isMember ? i : -1))
    .filter((i) => i >= 0);
  const lastMemberIdx = memberIndices.length ? Math.max(...memberIndices) : -1;

  if (lastMemberIdx <= 2) {
    return { tokens: annotated.slice(0, 3), etAl: true };
  }

  const head = annotated.slice(0, 3);
  const deepMembers = memberIndices.filter((i) => i > 2).map((i) => annotated[i]);
  const ellipsis: AuthorToken = { display: "…", isMember: false, isEllipsis: true };
  return { tokens: [...head, ellipsis, ...deepMembers], etAl: true };
}

// ---------------------------------------------------------------------------
// Source pill URL resolution
// ---------------------------------------------------------------------------

/**
 * External URL for the source pill.
 *   - inspirehep + arxiv → https://inspirehep.net/literature?q=arxiv:{arxiv}
 *   - inspirehep + id startsWith "inspire-" → https://inspirehep.net/literature/{N}
 *   - arxiv + arxiv → https://arxiv.org/abs/{arxiv}
 *   - manual → null (render as non-link badge)
 *   - any other → null (defensive)
 *
 * Requirements: PUBS-06.
 */
export function getSourcePillHref(pub: Publication): string | null {
  if (pub.source === "inspirehep") {
    if (pub.arxiv) return `https://inspirehep.net/literature?q=arxiv:${pub.arxiv}`;
    if (pub.id.startsWith("inspire-")) {
      const n = pub.id.slice("inspire-".length);
      if (/^\d+$/.test(n)) return `https://inspirehep.net/literature/${n}`;
    }
    return null;
  }
  if (pub.source === "arxiv" && pub.arxiv) {
    return `https://arxiv.org/abs/${pub.arxiv}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Member ORCID map construction
// ---------------------------------------------------------------------------

/**
 * Build a Map<surname, orcid> for members whose `contact.orcid` is set.
 * Uses the same surname extraction rule as buildMemberSurnameSet (last word
 * of display_name_normalized, ≥ 3 chars). Skips members without contact.orcid.
 */
export function buildMemberOrcidMap(
  people: Pick<Person, "display_name_normalized" | "contact">[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of people) {
    const orcid = p.contact.orcid;
    if (!orcid) continue;
    const words = p.display_name_normalized.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const last = words[words.length - 1];
    if (last.length < 3) continue;
    map.set(last, orcid);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Author ORCID URL resolution
// ---------------------------------------------------------------------------

/**
 * Return the ORCID profile URL for the first author string whose normalized
 * form contains a surname key in the member ORCID map. Null when no author
 * matches. First match wins.
 */
export function getAuthorOrcidUrl(
  authors: string[],
  memberOrcidMap: Map<string, string>,
): string | null {
  for (const authorStr of authors) {
    const norm = normalizeName(authorStr);
    for (const [surname, orcid] of memberOrcidMap) {
      if (norm.includes(surname)) {
        return `https://orcid.org/${orcid}`;
      }
    }
  }
  return null;
}
