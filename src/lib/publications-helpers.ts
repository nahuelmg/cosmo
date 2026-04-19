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
 *       * any member index > 2 → first 3 + ellipsis token + head-through-last-member + "et al."
 *
 * Invariant: a member is never hidden under `et al.` (CONTEXT locked decision).
 * The literal "et al." is NOT in the returned token list — callers append it
 * when `etAl` is true.
 *
 * Requirements: PUBS-11, PUBS-12.
 */
export function formatAuthors(
  authors: string[],
  memberSurnameSet: Set<string>,
): { tokens: AuthorToken[]; etAl: boolean } {
  const annotated: AuthorToken[] = authors.map((a) => ({
    display: a,
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
  const tail = annotated.slice(3, lastMemberIdx + 1);
  const ellipsis: AuthorToken = { display: "…", isMember: false, isEllipsis: true };
  return { tokens: [...head, ellipsis, ...tail], etAl: true };
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
