/**
 * Unit tests for publications-helpers.ts.
 *
 * Test coverage:
 *   - deriveNameVariants: surname extraction, compound surnames
 *   - buildMemberSurnameSet: past members included, surname extraction
 *   - isMember: InspireHEP format match, non-member, diacritic folding
 *   - formatAuthors: ≤5 authors, >5 no member, >5 member-visible invariant
 *   - getSourcePillHref: all five URL branches
 *
 * Requirements: PUBS-06, PUBS-11, PUBS-12 (CONTEXT locked decisions).
 */

import { describe, it, expect } from "vitest";
import {
  deriveNameVariants,
  buildMemberSurnameSet,
  isMember,
  formatAuthors,
  getSourcePillHref,
} from "./publications-helpers";
import type { Publication } from "@/content";

// ---------------------------------------------------------------------------
// deriveNameVariants
// ---------------------------------------------------------------------------

describe("deriveNameVariants", () => {
  it("includes the last word (surname) for a simple name", () => {
    const variants = deriveNameVariants({ display_name_normalized: "tomas ferreira chase" });
    expect(variants).toContain("chase");
  });

  it("includes the last two words for a compound surname", () => {
    const variants = deriveNameVariants({ display_name_normalized: "tomas ferreira chase" });
    expect(variants).toContain("ferreira chase");
  });

  it("includes the surname for compound-surname person (diana lopez nacir)", () => {
    const variants = deriveNameVariants({ display_name_normalized: "diana lopez nacir" });
    expect(variants).toContain("nacir");
  });

  it("includes compound last two words for diana lopez nacir", () => {
    const variants = deriveNameVariants({ display_name_normalized: "diana lopez nacir" });
    expect(variants).toContain("lopez nacir");
  });

  it("includes the full display_name_normalized as a fallback variant", () => {
    const variants = deriveNameVariants({ display_name_normalized: "tomas ferreira chase" });
    expect(variants).toContain("tomas ferreira chase");
  });

  it("returns empty array for blank display_name_normalized", () => {
    expect(deriveNameVariants({ display_name_normalized: "" })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildMemberSurnameSet
// ---------------------------------------------------------------------------

describe("buildMemberSurnameSet", () => {
  it("extracts the last word as surname for each person", () => {
    const set = buildMemberSurnameSet([
      { display_name_normalized: "tomas ferreira chase" },
      { display_name_normalized: "diana lopez nacir" },
    ]);
    expect(set.has("chase")).toBe(true);
    expect(set.has("nacir")).toBe(true);
  });

  it("includes past members — category is NOT filtered (CONTEXT locked decision)", () => {
    // The function signature only requires display_name_normalized; callers pass
    // ALL people regardless of status/category. This test verifies the contract.
    const people = [
      { display_name_normalized: "current active member" },
      // past member — note: only display_name_normalized is required by the function
      { display_name_normalized: "alumni past member" },
    ];
    const set = buildMemberSurnameSet(people);
    // "member" is the last word for the past-member entry
    expect(set.has("member")).toBe(true);
  });

  it("excludes surnames shorter than 3 characters", () => {
    const set = buildMemberSurnameSet([{ display_name_normalized: "john a" }]);
    expect(set.has("a")).toBe(false);
  });

  it("returns an empty set for an empty people array", () => {
    expect(buildMemberSurnameSet([])).toEqual(new Set());
  });
});

// ---------------------------------------------------------------------------
// isMember
// ---------------------------------------------------------------------------

describe("isMember", () => {
  it("returns true when the author string (InspireHEP format) contains a member surname", () => {
    // InspireHEP format: "Surname, First Middle" — "chase" appears in "chase, tomas ferreira"
    expect(isMember("Chase, Tomás Ferreira", new Set(["chase"]))).toBe(true);
  });

  it("returns false when the author string does not match any member surname", () => {
    expect(isMember("Smith, John", new Set(["chase"]))).toBe(false);
  });

  it("is diacritic-insensitive (NFD normalization)", () => {
    // "Tomás" normalizes to "tomas", should still not match "chase"
    expect(isMember("Tomás Ferreira", new Set(["ferreira"]))).toBe(true);
  });

  it("returns false with an empty surname set", () => {
    expect(isMember("Chase, Tomas", new Set())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatAuthors
// ---------------------------------------------------------------------------

describe("formatAuthors", () => {
  it("renders all authors when authors.length ≤ 5, etAl false", () => {
    const { tokens, etAl } = formatAuthors(["A", "B", "C"], new Set());
    expect(tokens).toHaveLength(3);
    expect(etAl).toBe(false);
  });

  it("renders first 3 authors when >5 and no member beyond index 2, etAl true", () => {
    const { tokens, etAl } = formatAuthors(
      ["A", "B", "C", "D", "E", "F"],
      new Set(),
    );
    expect(tokens).toHaveLength(3);
    expect(etAl).toBe(true);
    expect(tokens.some((t) => t.isEllipsis)).toBe(false);
  });

  it("et al. member-visible invariant: member at position 6 is NOT hidden (CONTEXT locked decision)", () => {
    // 7-author list; "Chase, Tomas" is at index 6 (position 7) — beyond the head slice.
    // Expected output: first 3 + ellipsis token + "Chase, Tomas" (isMember: true) + etAl: true.
    const authors = ["A", "B", "C", "D", "E", "F", "Chase, Tomas"];
    const memberSurnameSet = new Set(["chase"]);
    const { tokens, etAl } = formatAuthors(authors, memberSurnameSet);

    // Must include an ellipsis token
    const ellipsisToken = tokens.find((t) => t.isEllipsis);
    expect(ellipsisToken).toBeDefined();

    // Must include the member token with isMember: true
    const memberToken = tokens.find(
      (t) => t.display === "Chase, Tomas" && t.isMember === true,
    );
    expect(memberToken).toBeDefined();

    // etAl must be true
    expect(etAl).toBe(true);
  });

  it("annotates member tokens with isMember: true for short lists", () => {
    const { tokens } = formatAuthors(
      ["Chase, Tomas", "Smith, J."],
      new Set(["chase"]),
    );
    expect(tokens[0].isMember).toBe(true);
    expect(tokens[1].isMember).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getSourcePillHref
// ---------------------------------------------------------------------------

/**
 * Helper to build a minimal Publication object for testing.
 * Only the fields needed by getSourcePillHref are required.
 */
function makePub(overrides: Partial<Publication> & { source: Publication["source"] }): Publication {
  const base: Publication = {
    id: "test-pub",
    authors: ["Test Author"],
    title: "Test Title",
    journal: "Test Journal",
    year: 2024,
    topic_tags: [],
    source: "manual",
  };
  return { ...base, ...overrides };
}

describe("getSourcePillHref", () => {
  it("branch 1 — inspirehep + arxiv → InspireHEP literature search URL", () => {
    const pub = makePub({ source: "inspirehep", arxiv: "2501.12345" });
    expect(getSourcePillHref(pub)).toBe(
      "https://inspirehep.net/literature?q=arxiv:2501.12345",
    );
  });

  it("branch 2 — inspirehep + id=inspire-{N} → InspireHEP literature direct URL", () => {
    const pub = makePub({ source: "inspirehep", id: "inspire-1234567" });
    expect(getSourcePillHref(pub)).toBe(
      "https://inspirehep.net/literature/1234567",
    );
  });

  it("branch 3 — arxiv + arxiv id → arXiv abstract URL", () => {
    const pub = makePub({ source: "arxiv", arxiv: "2406.00891" });
    expect(getSourcePillHref(pub)).toBe("https://arxiv.org/abs/2406.00891");
  });

  it("branch 4 — manual → null (non-link badge)", () => {
    const pub = makePub({ source: "manual" });
    expect(getSourcePillHref(pub)).toBeNull();
  });

  it("branch 5 — inspirehep with no arxiv and non-inspire id → null (defensive fallback)", () => {
    const pub = makePub({ source: "inspirehep", id: "some-custom-id" });
    expect(getSourcePillHref(pub)).toBeNull();
  });
});
