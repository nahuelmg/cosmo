/**
 * Unit tests for 09-02 extraction helpers.
 * Run with: pnpm vitest run scripts/sync-publications.test.ts
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  stripBibTeX,
  inspireHitToPublication,
  arxivEntryToPublication,
  dedupByArxivId,
  mergePublications,
  normalizeDoi,
  dedupByDoi,
  fetchWithRetry,
} from "./sync-publications";
import type { InspireHit, ArXivEntry } from "./sync-publications";
import type { Publication } from "../src/content/schemas/publications.schema";

// ---------------------------------------------------------------------------
// stripBibTeX
// ---------------------------------------------------------------------------

describe("stripBibTeX", () => {
  it('removes outer braces: {Title} → "Title"', () => {
    expect(stripBibTeX("{Title}")).toBe("Title");
  });

  it('removes \\command{text}: \\textit{foo} bar → "foo bar"', () => {
    expect(stripBibTeX("\\textit{foo} bar")).toBe("foo bar");
  });

  it("strips nested braces: {a {b} c} → a b c", () => {
    // outer brace removal: {a {b} c} → a {b} c
    // standalone brace strip: a {b} c → a b c
    expect(stripBibTeX("{a {b} c}")).toBe("a b c");
  });

  it("leaves plain title unchanged", () => {
    expect(stripBibTeX("Dark matter constraints")).toBe("Dark matter constraints");
  });

  it("handles \\textbf{text} removal", () => {
    expect(stripBibTeX("A \\textbf{bold} title")).toBe("A bold title");
  });
});

// ---------------------------------------------------------------------------
// fetchWithRetry — 503 retry behaviour
// ---------------------------------------------------------------------------

describe("fetchWithRetry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries on 503 and returns the 200 on the second attempt", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const res = await fetchWithRetry("https://example.test/any", undefined, 2, 1);

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("returns the final 503 response when retries are exhausted", async () => {
    const maxRetries = 2;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 503 }));

    const res = await fetchWithRetry("https://example.test/any", undefined, maxRetries, 1);

    expect(res.status).toBe(503);
    expect(fetchSpy).toHaveBeenCalledTimes(maxRetries + 1);
  });
});

// ---------------------------------------------------------------------------
// arxivEntryToPublication
// ---------------------------------------------------------------------------

describe("arxivEntryToPublication", () => {
  const fixture: ArXivEntry = {
    id: "http://arxiv.org/abs/1305.1476v2",
    published: "2013-05-07T07:42:52-04:00",
    title: "ResourceSync: Leveraging Sitemaps for Resource Synchronization",
    summary: "Many applications need up-to-date copies of web resources.",
    author: [{ name: "Bernhard Haslhofer, Simeon Warner, Carl Lagoze, Martin Klein" }],
  };

  it("strips version suffix from arXiv ID", () => {
    const pub = arxivEntryToPublication(fixture);
    expect(pub.arxiv).toBe("1305.1476");
    expect(pub.id).toBe("1305.1476");
  });

  it("extracts year from <published>", () => {
    const pub = arxivEntryToPublication(fixture);
    expect(pub.year).toBe(2013);
  });

  it("splits author CSV into 4 authors", () => {
    const pub = arxivEntryToPublication(fixture);
    expect(pub.authors.length).toBe(4);
    expect(pub.authors[0]).toBe("Bernhard Haslhofer");
    expect(pub.authors[3]).toBe("Martin Klein");
  });

  it("sets source to arxiv", () => {
    const pub = arxivEntryToPublication(fixture);
    expect(pub.source).toBe("arxiv");
  });

  it("throws for unparseable id", () => {
    const bad: ArXivEntry = { ...fixture, id: "http://arxiv.org/bad/noid" };
    expect(() => arxivEntryToPublication(bad)).toThrow("arXiv entry without parseable id");
  });
});

// ---------------------------------------------------------------------------
// inspireHitToPublication
// ---------------------------------------------------------------------------

function makeInspireHit(overrides: Partial<InspireHit["metadata"]> = {}): InspireHit {
  return {
    id: "9999",
    metadata: {
      control_number: 9999,
      titles: [{ title: "A Test Paper", source: "arXiv" }],
      authors: [{ full_name: "Chase, T.F." }],
      ...overrides,
    },
  };
}

describe("inspireHitToPublication", () => {
  it("reads year from publication_info[0].year", () => {
    const hit = makeInspireHit({
      publication_info: [{ journal_title: "Phys.Rev.D", year: 2021 }],
      preprint_date: "2019-01-01",
    });
    const pub = inspireHitToPublication(hit);
    expect(pub.year).toBe(2021);
  });

  it("falls back to preprint_date YYYY when no publication_info", () => {
    const hit = makeInspireHit({ preprint_date: "2011-03-14" });
    const pub = inspireHitToPublication(hit);
    expect(pub.year).toBe(2011);
  });

  it("falls back to current year when no publication_info and no preprint_date", () => {
    const hit = makeInspireHit({});
    const pub = inspireHitToPublication(hit);
    expect(pub.year).toBe(new Date().getFullYear());
  });

  it("uses arxiv ID as publication id when available", () => {
    const hit = makeInspireHit({
      arxiv_eprints: [{ value: "2603.11236", categories: ["hep-ph"] }],
    });
    const pub = inspireHitToPublication(hit);
    expect(pub.id).toBe("2603.11236");
    expect(pub.arxiv).toBe("2603.11236");
  });

  it("uses inspire-{control_number} as id when no arXiv eprint", () => {
    const hit = makeInspireHit({ control_number: 12345 });
    const pub = inspireHitToPublication(hit);
    expect(pub.id).toBe("inspire-12345");
    expect(pub.arxiv).toBeUndefined();
  });

  it("sets source to inspirehep", () => {
    const hit = makeInspireHit({});
    const pub = inspireHitToPublication(hit);
    expect(pub.source).toBe("inspirehep");
  });

  it("returns 'Preprint' when publication_info[0] exists but all fields are null", () => {
    const hit = makeInspireHit({ publication_info: [{}] });
    const pub = inspireHitToPublication(hit);
    expect(pub.journal).toBe("Preprint");
  });

  it("prefers non-arXiv title source", () => {
    const hit = makeInspireHit({
      titles: [
        { title: "arXiv title", source: "arXiv" },
        { title: "Journal title", source: "publisher" },
      ],
    });
    const pub = inspireHitToPublication(hit);
    expect(pub.title).toBe("Journal title");
  });
});

// ---------------------------------------------------------------------------
// dedupByArxivId
// ---------------------------------------------------------------------------

describe("dedupByArxivId", () => {
  it("deduplicates entries by arxiv ID, first-seen wins", () => {
    const entries: Publication[] = [
      { id: "1.2", authors: ["A"], title: "T", journal: "J", year: 2024, arxiv: "1.2", topic_tags: [], source: "inspirehep" },
      { id: "1.2-dup", authors: ["A"], title: "T dup", journal: "J", year: 2024, arxiv: "1.2", topic_tags: [], source: "arxiv" },
      { id: "3.4", authors: ["B"], title: "T2", journal: "J2", year: 2023, arxiv: "3.4", topic_tags: [], source: "arxiv" },
    ];
    const result = dedupByArxivId(entries);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe("1.2"); // first-seen wins
    expect(result[1].arxiv).toBe("3.4");
  });

  it("keys on id when arxiv is absent", () => {
    const entries: Publication[] = [
      { id: "inspire-100", authors: ["A"], title: "T", journal: "J", year: 2020, topic_tags: [], source: "inspirehep" },
      { id: "inspire-100", authors: ["A"], title: "T dup", journal: "J", year: 2020, topic_tags: [], source: "inspirehep" },
    ];
    const result = dedupByArxivId(entries);
    expect(result.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// mergePublications sort order
// ---------------------------------------------------------------------------

describe("mergePublications sort order", () => {
  const make = (id: string, year: number, arxiv?: string): Publication => ({
    id,
    authors: ["A"],
    title: id,
    journal: "J",
    year,
    topic_tags: [],
    source: "inspirehep",
    ...(arxiv ? { arxiv } : {}),
  });

  it("sorts year desc → arxiv ID desc → no-arxiv last within year", () => {
    const entries = [
      make("c", 2023, "9.9"),
      make("d", 2023), // no arxiv
      make("a", 2024, "9.9"),
      make("b", 2024, "1.1"),
    ];

    // Single pre-concatenated array (Option A refactor)
    const result = mergePublications(entries);
    expect(result[0].id).toBe("a"); // 2024/9.9 — highest year, highest arxiv
    expect(result[1].id).toBe("b"); // 2024/1.1
    expect(result[2].id).toBe("c"); // 2023/9.9
    expect(result[3].id).toBe("d"); // 2023/no-arxiv last
  });

  it("preserves manual entries by source tag", () => {
    const manual: Publication = {
      id: "manual-1",
      authors: ["M"],
      title: "Manual",
      journal: "J",
      year: 2025,
      topic_tags: [],
      source: "manual",
    };
    const inspire = make("inspire-1", 2022, "1.1");
    // Pre-concat in priority order: manual first, then inspire
    const result = mergePublications([manual, inspire]);
    // manual-1 is 2025, inspire-1 is 2022 — manual comes first after sort
    expect(result[0].id).toBe("manual-1");
    expect(result[0].source).toBe("manual");
  });
});

// ---------------------------------------------------------------------------
// normalizeDoi
// ---------------------------------------------------------------------------

describe("normalizeDoi", () => {
  it("lowercases DOIs", () => {
    expect(normalizeDoi("10.1103/PhysRevD.108.103512")).toBe("10.1103/physrevd.108.103512");
  });

  it("strips https://doi.org/ prefix", () => {
    expect(normalizeDoi("https://doi.org/10.1234/ABC")).toBe("10.1234/abc");
  });

  it("strips http://dx.doi.org/ prefix", () => {
    expect(normalizeDoi("http://dx.doi.org/10.1234/ABC")).toBe("10.1234/abc");
  });

  it("trims whitespace", () => {
    expect(normalizeDoi("  10.1234/abc  ")).toBe("10.1234/abc");
  });

  it("handles already-normalised DOIs", () => {
    expect(normalizeDoi("10.1016/j.nima.2020.164490")).toBe("10.1016/j.nima.2020.164490");
  });
});

// ---------------------------------------------------------------------------
// dedupByDoi
// ---------------------------------------------------------------------------

describe("dedupByDoi", () => {
  const basePub = (overrides: Partial<Publication>): Publication => ({
    id: "x",
    authors: ["A"],
    title: "T",
    journal: "J",
    year: 2024,
    topic_tags: [],
    source: "manual",
    ...overrides,
  });

  it("keeps InspireHEP over ORCID over arXiv when DOIs match (DEDUP-02)", () => {
    // Input must be in priority order: inspire → orcid → arxiv
    const inspire = basePub({ id: "i", source: "inspirehep", doi: "10.1234/test" });
    const orcid   = basePub({ id: "o", source: "orcid",      doi: "10.1234/test" });
    const arxiv   = basePub({ id: "a", source: "arxiv",      doi: "10.1234/test" });
    const [deduped, dropped] = dedupByDoi([inspire, orcid, arxiv]);
    expect(deduped.length).toBe(1);
    expect(deduped[0].source).toBe("inspirehep");
    expect(dropped).toBe(2);
  });

  it("normalises DOIs before comparison (DEDUP-03)", () => {
    const a = basePub({ id: "a", source: "inspirehep", doi: "10.1234/TEST" });
    const b = basePub({ id: "b", source: "orcid",      doi: "https://doi.org/10.1234/test" });
    const [deduped, dropped] = dedupByDoi([a, b]);
    expect(deduped.length).toBe(1);
    expect(deduped[0].id).toBe("a");
    expect(dropped).toBe(1);
  });

  it("passes entries without DOI through unchanged (DEDUP-04)", () => {
    const a = basePub({ id: "a", source: "arxiv" /* no doi */ });
    const b = basePub({ id: "b", source: "arxiv" /* no doi */ });
    const [deduped, dropped] = dedupByDoi([a, b]);
    expect(deduped.length).toBe(2);
    expect(dropped).toBe(0);
  });

  it("reports dedupedCount accurately (DEDUP-05)", () => {
    const list = [
      basePub({ id: "1", source: "inspirehep", doi: "10.1/a" }),
      basePub({ id: "2", source: "orcid",      doi: "10.1/a" }), // dup
      basePub({ id: "3", source: "inspirehep", doi: "10.1/b" }),
      basePub({ id: "4", source: "arxiv",      doi: "10.1/b" }), // dup
      basePub({ id: "5", source: "inspirehep", doi: "10.1/c" }),
    ];
    const [, dropped] = dedupByDoi(list);
    expect(dropped).toBe(2);
  });
});
