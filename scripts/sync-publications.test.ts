/**
 * Unit tests for 09-02 extraction helpers.
 * Run with: pnpm vitest run scripts/sync-publications.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  stripBibTeX,
  inspireHitToPublication,
  arxivEntryToPublication,
  dedupByArxivId,
  mergePublications,
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

    const result = mergePublications([], entries, []);
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
    const result = mergePublications([manual], [inspire], []);
    // manual-1 is 2025, inspire-1 is 2022 — manual comes first
    expect(result[0].id).toBe("manual-1");
    expect(result[0].source).toBe("manual");
  });
});
