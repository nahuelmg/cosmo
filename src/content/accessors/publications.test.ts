import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getPublicationsByAuthor } from "./publications";
// Barrel compile-check — MUST resolve via the `@` alias configured in vitest.config.ts.
// If this import fails, ACC-04 is broken.
import { getPublicationsByAuthor as fromBarrel } from "@/content";

describe("getPublicationsByAuthor", () => {
  // Sanity: barrel re-export is the same function reference (ACC-04)
  it("is re-exported from @/content barrel (ACC-04)", () => {
    expect(fromBarrel).toBe(getPublicationsByAuthor);
  });

  // --- Variant length guard (locked: 4-char minimum, post-normalization) ---
  describe("4-char variant guard", () => {
    it("returns [] when nameVariants is empty", () => {
      expect(getPublicationsByAuthor([])).toEqual([]);
    });

    it("returns [] when all variants are <4 chars after normalization", () => {
      expect(getPublicationsByAuthor(["F.", "Él", "abc"])).toEqual([]);
    });

    it("silently drops short variants but processes the long ones", () => {
      // "F." (2 chars) dropped; "Gómez" (5 chars → normalized "gomez") retained.
      // Gómez appears in multiple v1.0 entries — expect a non-empty result.
      const results = getPublicationsByAuthor(["F.", "Gómez"]);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  // --- Any-author match (locked: match on ANY element of authors[]) ---
  describe("any-author match", () => {
    it("matches when the variant is NOT the first author", () => {
      // Post 12-02 live-sync data: "Landau" appears as a later-position
      // author in dozens of real entries (co-author on Leizerovich / Scóccola
      // / others-led papers). Replaces the v1.0 placeholder "Di Sarcina"
      // anchor which was purged with the fictional manual entries.
      const results = getPublicationsByAuthor(["Landau"]);
      expect(results.length).toBeGreaterThan(0);
      // Assert at least one result has Landau in a non-first author position.
      const laterPositionHits = results.filter((pub) => {
        if (pub.authors.length < 2) return false;
        const first = pub.authors[0].toLowerCase();
        const hasLandau = pub.authors.some((a) =>
          a.toLowerCase().includes("landau"),
        );
        return hasLandau && !first.includes("landau");
      });
      expect(laterPositionHits.length).toBeGreaterThan(0);
      // Every result has Landau somewhere in authors[] (the invariant under test).
      for (const pub of results) {
        const hit = pub.authors.some((a) =>
          a.toLowerCase().includes("landau"),
        );
        expect(hit).toBe(true);
      }
    });
  });

  // --- NFD-strip diacritic fold (locked: CORRECTION from CONTEXT — NFD not NFC) ---
  describe("diacritic-folded substring match", () => {
    it("matches ASCII variant against diacritic-bearing author name", () => {
      // v1.0 data has "Rodríguez, M." (with í) — verify ASCII variant "rodriguez" matches.
      const results = getPublicationsByAuthor(["rodriguez"]);
      expect(results.length).toBeGreaterThan(0);
    });

    it("matches case-insensitively", () => {
      const lower = getPublicationsByAuthor(["gomez"]);
      const mixed = getPublicationsByAuthor(["Gómez"]);
      const upper = getPublicationsByAuthor(["GÓMEZ"]);
      expect(lower.length).toBeGreaterThan(0);
      expect(mixed.length).toBe(lower.length);
      expect(upper.length).toBe(lower.length);
    });
  });

  // --- Year window (locked: >= currentYear - lastNYears inclusive; 0 is valid) ---
  describe("lastNYears year window", () => {
    const currentYear = new Date().getFullYear();

    it("applies no filter when options is omitted", () => {
      const all = getPublicationsByAuthor(["rodriguez"]);
      // Without year filter, count matches the full-archive match count.
      // Compare to explicit no-filter call to confirm equivalence.
      const explicitEmpty = getPublicationsByAuthor(["rodriguez"], {});
      expect(all.length).toBe(explicitEmpty.length);
    });

    it("applies no filter when options is {} (no lastNYears key)", () => {
      const results = getPublicationsByAuthor(["rodriguez"], {});
      expect(results.length).toBeGreaterThan(0);
      // Should include pre-2025 papers if any match — no cutoff applied.
    });

    it("filters to last N years inclusive (lastNYears: 10 → year >= currentYear - 10)", () => {
      const results = getPublicationsByAuthor(["rodriguez"], { lastNYears: 10 });
      for (const pub of results) {
        expect(pub.year).toBeGreaterThanOrEqual(currentYear - 10);
      }
    });

    it("lastNYears: 0 returns only current-year papers (0 is distinguishable from unset)", () => {
      const results = getPublicationsByAuthor(["rodriguez"], { lastNYears: 0 });
      for (const pub of results) {
        expect(pub.year).toBe(currentYear);
      }
    });

    it("lastNYears: 0 is NOT treated as unset (would include older papers)", () => {
      const zero = getPublicationsByAuthor(["rodriguez"], { lastNYears: 0 });
      const noOption = getPublicationsByAuthor(["rodriguez"]);
      // If `0` were coerced to "unset", both calls would produce identical
      // results. The >= check on `noOption` must be stricter-or-equal.
      expect(noOption.length).toBeGreaterThanOrEqual(zero.length);
      // And at least one older paper exists in the v1.0 dataset such that
      // these counts differ. (v1.0 has entries from 2022–2026.)
      expect(noOption.length).toBeGreaterThan(zero.length);
    });
  });

  // --- No matches case ---
  describe("no matches", () => {
    it("returns [] silently when no author matches", () => {
      // A long variant that isn't in any v1.0 author string.
      expect(
        getPublicationsByAuthor(["zzzzzzzzzzzzzzzzzzzz"]),
      ).toEqual([]);
    });
  });

  // --- Pre-sorted output (locked: year desc → arxiv desc → no-arxiv last) ---
  describe("pre-sorted output", () => {
    it("sorts results by year descending", () => {
      const results = getPublicationsByAuthor(["rodriguez"]);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].year).toBeGreaterThanOrEqual(results[i + 1].year);
      }
    });

    it("sorts by arXiv ID descending within the same year", () => {
      const results = getPublicationsByAuthor(["gomez"]);
      for (let i = 0; i < results.length - 1; i++) {
        const a = results[i];
        const b = results[i + 1];
        if (a.year === b.year && a.arxiv && b.arxiv) {
          expect(a.arxiv.localeCompare(b.arxiv)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("places entries without arxiv last within their year bucket", () => {
      const results = getPublicationsByAuthor(["martinez"]);
      // Partition by year, check: within each year, all arxiv-having entries precede arxiv-lacking entries.
      const byYear = new Map<number, typeof results>();
      for (const pub of results) {
        const list = byYear.get(pub.year) ?? [];
        list.push(pub);
        byYear.set(pub.year, list);
      }
      for (const [, list] of byYear) {
        let seenNoArxiv = false;
        for (const pub of list) {
          if (!pub.arxiv) seenNoArxiv = true;
          else expect(seenNoArxiv).toBe(false);
        }
      }
    });
  });

  // --- Non-mutation (locked: shared module state must not mutate) ---
  describe("non-mutation of module state", () => {
    it("repeated calls produce identical results (no cumulative mutation)", () => {
      const first = getPublicationsByAuthor(["rodriguez"]);
      const second = getPublicationsByAuthor(["rodriguez"]);
      expect(second).toEqual(first);
    });

    it("does not reorder other accessor outputs", async () => {
      // Call the author accessor, then the plain getPublications accessor —
      // the plain accessor's year-desc ordering must still hold.
      // (Sanity check that the module-level `publications` array is not sorted in place.)
      const { getPublications } = await import("./publications");
      getPublicationsByAuthor(["gomez"]);
      const all = getPublications();
      for (let i = 0; i < all.length - 1; i++) {
        expect(all[i].year).toBeGreaterThanOrEqual(all[i + 1].year);
      }
    });
  });

  // --- source field (post-12-02: all entries from live sync have source set) ---
  describe("source field populated for all entries", () => {
    it("every matched publication has a valid source value", () => {
      // Post 12-02 purge + live sync, content/publications.json contains only
      // real InspireHEP + arXiv entries (no source-less or "manual" placeholders
      // — the 13 v1.0 fictional manual entries were purged).
      // Schema-level: PublicationSchema.source is a non-optional enum
      // ("manual" | "inspirehep" | "arxiv") with .default("manual") retained for
      // forward-compatibility with manually-curated future entries.
      const results = getPublicationsByAuthor(["landau"]);
      expect(results.length).toBeGreaterThan(0);
      const validSources = new Set(["manual", "inspirehep", "arxiv"]);
      for (const pub of results) {
        expect(validSources.has(pub.source)).toBe(true);
      }
    });
  });

  // --- ACC-05 structural check (locked: zero people.ts imports) ---
  describe("ACC-05 no circular dependency", () => {
    it("accessor source has zero imports from people.ts", () => {
      const src = fs.readFileSync(
        path.join(__dirname, "publications.ts"),
        "utf8",
      );
      // Match any form: "../people", "./people", from people directly, etc.
      expect(src).not.toMatch(/from\s+["'][^"']*people/);
    });
  });
});
