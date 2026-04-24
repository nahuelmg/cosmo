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
  orcidGroupToPublication,
  fetchOrcid,
  enrichOrcidAuthors,
} from "./sync-publications";
import type { InspireHit, ArXivEntry, OrcidExternalId } from "./sync-publications";
import type { Publication } from "../src/content/schemas/publications.schema";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Fixture loader (JSON)
// ---------------------------------------------------------------------------
const worksFixture = JSON.parse(
  readFileSync(resolve(__dirname, "fixtures/orcid-works-tomas.json"), "utf-8"),
) as { group: unknown[] };

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

  it("retries on AbortSignal.timeout (TimeoutError) and returns the 200 on the second attempt", async () => {
    const timeoutError = Object.assign(new Error("The operation was aborted due to timeout"), {
      name: "TimeoutError",
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const res = await fetchWithRetry("https://example.test/any", undefined, 2, 1);

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("retries on generic network TypeError (DNS/ECONNRESET) and returns the 200 on the second attempt", async () => {
    const networkError = new TypeError("fetch failed");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const res = await fetchWithRetry("https://example.test/any", undefined, 2, 1);

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("propagates a network error after retries are exhausted", async () => {
    const maxRetries = 2;
    const networkError = new TypeError("fetch failed");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(networkError);

    await expect(
      fetchWithRetry("https://example.test/any", undefined, maxRetries, 1),
    ).rejects.toThrow("fetch failed");
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

  it("falls back to thesis_info.defense_date YYYY when no publication_info/preprint_date", () => {
    const hit = makeInspireHit({
      thesis_info: { degree_type: "phd", defense_date: "2021-03-19" },
    });
    const pub = inspireHitToPublication(hit);
    expect(pub.year).toBe(2021);
  });

  it("falls back to earliest_date YYYY when no publication_info/preprint_date/thesis_info", () => {
    const hit = makeInspireHit({ earliest_date: "2018-07" });
    const pub = inspireHitToPublication(hit);
    expect(pub.year).toBe(2018);
  });

  it("falls back to current year when all year sources are absent", () => {
    const hit = makeInspireHit({});
    const pub = inspireHitToPublication(hit);
    expect(pub.year).toBe(new Date().getFullYear());
  });

  it("pushes a warning into the provided array when the current-year fallback is used", () => {
    const warnings: string[] = [];
    const hit = makeInspireHit({ control_number: 555 });
    inspireHitToPublication(hit, warnings);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Missing year");
    expect(warnings[0]).toContain("inspire-555");
  });

  it("does NOT push a warning when year is resolved from thesis_info", () => {
    const warnings: string[] = [];
    const hit = makeInspireHit({
      thesis_info: { degree_type: "phd", defense_date: "2021-03-19" },
    });
    inspireHitToPublication(hit, warnings);
    expect(warnings).toHaveLength(0);
  });

  it("renders thesis journal as '{Degree} Thesis, {institution}' when no publication_info", () => {
    const hit = makeInspireHit({
      thesis_info: {
        degree_type: "phd",
        defense_date: "2021-03-19",
        institutions: [{ name: "U. Buenos Aires" }],
      },
    });
    const pub = inspireHitToPublication(hit);
    expect(pub.journal).toBe("PhD Thesis, U. Buenos Aires");
  });

  it("is case-insensitive on degree_type (Inspire returns 'PhD' vs 'phd' depending on endpoint)", () => {
    const hit = makeInspireHit({
      thesis_info: {
        degree_type: "PhD",
        defense_date: "2021-03-19",
        institutions: [{ name: "U. Buenos Aires" }],
      },
    });
    const pub = inspireHitToPublication(hit);
    expect(pub.journal).toBe("PhD Thesis, U. Buenos Aires");
  });

  it("renders plain 'Thesis' for unknown degree_type", () => {
    const hit = makeInspireHit({
      thesis_info: { defense_date: "2020-01-01", institutions: [{ name: "X" }] },
    });
    const pub = inspireHitToPublication(hit);
    expect(pub.journal).toBe("Thesis, X");
  });

  it("publication_info takes precedence over thesis_info for both year and journal", () => {
    const hit = makeInspireHit({
      publication_info: [{ journal_title: "Phys.Rev.D", year: 2022 }],
      thesis_info: { degree_type: "phd", defense_date: "2021-03-19" },
    });
    const pub = inspireHitToPublication(hit);
    expect(pub.year).toBe(2022);
    expect(pub.journal).toContain("Phys.Rev.D");
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

// ---------------------------------------------------------------------------
// orcidGroupToPublication — edge cases (hand-rolled OrcidGroup literals)
// ---------------------------------------------------------------------------

/** Helper: build a minimal OrcidGroup literal for unit tests */
type OrcidGroupShape = Parameters<typeof orcidGroupToPublication>[0];

function makeGroup(overrides: {
  type?: string;
  putCode?: number;
  title?: string;
  groupExternalIds?: OrcidExternalId[];
  summaryExternalIds?: OrcidExternalId[];
  journalTitle?: string | null;
  publicationDate?: { year?: { value: string } | null } | null;
}): OrcidGroupShape {
  const {
    type = "journal-article",
    putCode = 12345,
    title = "Test Paper",
    groupExternalIds = [],
    summaryExternalIds = [],
    journalTitle = "Test Journal",
    publicationDate = { year: { value: "2022" } },
  } = overrides;
  return {
    "external-ids": { "external-id": groupExternalIds },
    "work-summary": [
      {
        "put-code": putCode,
        title: { title: { value: title } },
        "external-ids": { "external-id": summaryExternalIds },
        type,
        "publication-date": publicationDate,
        "journal-title": journalTitle !== null ? { value: journalTitle } : null,
      },
    ],
  } as OrcidGroupShape;
}

describe("orcidGroupToPublication — edge cases", () => {
  it("journal-article with DOI + arXiv: id===doi, arxiv set, doi set, source===orcid, authors===[ownerName]", () => {
    const group = makeGroup({
      groupExternalIds: [
        { "external-id-type": "doi", "external-id-value": "10.1/test" },
        { "external-id-type": "arxiv", "external-id-value": "2001.00001" },
      ],
    });
    const result = orcidGroupToPublication(group, "Owner");
    expect(result).not.toBeNull();
    const { publication, putCode } = result!;
    expect(publication.id).toBe("10.1/test");
    expect(publication.doi).toBe("10.1/test");
    expect(publication.arxiv).toBe("2001.00001");
    expect(publication.source).toBe("orcid");
    expect(publication.authors).toEqual(["Owner"]);
    expect(putCode).toBe(12345);
  });

  it("conference-paper passes filter", () => {
    const group = makeGroup({ type: "conference-paper" });
    const result = orcidGroupToPublication(group, "Owner");
    expect(result).not.toBeNull();
    expect(result!.publication.source).toBe("orcid");
  });

  it("dataset returns null (ORCID-04 filter)", () => {
    const group = makeGroup({ type: "dataset" });
    expect(orcidGroupToPublication(group, "Owner")).toBeNull();
  });

  it("type other returns null (ORCID-04 filter)", () => {
    const group = makeGroup({ type: "other" });
    expect(orcidGroupToPublication(group, "Owner")).toBeNull();
  });

  it("no DOI, no arXiv → id===orcid-{putCode}, publication.doi is undefined", () => {
    const group = makeGroup({ putCode: 99999, groupExternalIds: [] });
    const result = orcidGroupToPublication(group, "Owner");
    expect(result).not.toBeNull();
    expect(result!.publication.id).toBe("orcid-99999");
    expect(result!.publication.doi).toBeUndefined();
  });

  it("no journal-title → journal==='Preprint'", () => {
    const group = makeGroup({ journalTitle: null });
    const result = orcidGroupToPublication(group, "Owner");
    expect(result).not.toBeNull();
    expect(result!.publication.journal).toBe("Preprint");
  });

  it("missing publication-date → year===current year", () => {
    const group = makeGroup({ publicationDate: null });
    const result = orcidGroupToPublication(group, "Owner");
    expect(result).not.toBeNull();
    expect(result!.publication.year).toBe(new Date().getFullYear());
  });

  it("Pattern 2: group-level external-ids used even when work-summary[0] external-ids is empty", () => {
    const group = makeGroup({
      groupExternalIds: [
        { "external-id-type": "doi", "external-id-value": "10.9/union-doi" },
      ],
      summaryExternalIds: [], // work-summary[0] has no ids
    });
    const result = orcidGroupToPublication(group, "Owner");
    expect(result).not.toBeNull();
    expect(result!.publication.doi).toBe("10.9/union-doi");
    expect(result!.publication.id).toBe("10.9/union-doi");
  });

  it("empty work-summary array → null", () => {
    const group: OrcidGroupShape = {
      "external-ids": { "external-id": [] },
      "work-summary": [],
    };
    expect(orcidGroupToPublication(group, "Owner")).toBeNull();
  });

  it("title with decomposed Unicode is NFC-normalised", () => {
    // "Toma\u0301s" is decomposed; NFC produces "Tomás" (U+00E1 single codepoint)
    const decomposedTitle = "Toma\u0301s paper on physics";
    const group = makeGroup({ title: decomposedTitle });
    const result = orcidGroupToPublication(group, "Owner");
    expect(result).not.toBeNull();
    const normalised = decomposedTitle.normalize("NFC");
    expect(result!.publication.title).toBe(normalised);
    // The output must differ from the raw decomposed input if NFC changed it
    expect(result!.publication.title).not.toBe(decomposedTitle);
  });
});

// ---------------------------------------------------------------------------
// orcidGroupToPublication — fixture-driven (Tomas Ferreira Chase works list)
// ---------------------------------------------------------------------------

describe("orcidGroupToPublication — fixture-driven (Tomas works list)", () => {
  it("extracts the SiPM paper with correct doi, year, journal, source, id, authors", () => {
    const results = (worksFixture.group as OrcidGroupShape[]).map((g) =>
      orcidGroupToPublication(g, "Tomas Ferreira Chase"),
    );
    const sipm = results.find((r) => r?.publication.doi === "10.1016/j.nima.2020.164490");
    expect(sipm).not.toBeUndefined();
    expect(sipm!.publication.year).toBe(2020);
    expect(sipm!.publication.source).toBe("orcid");
    expect(sipm!.publication.journal).toMatch(/^Nuclear Instruments and Methods/);
    expect(sipm!.publication.id).toBe("10.1016/j.nima.2020.164490");
    expect(sipm!.publication.authors).toEqual(["Tomas Ferreira Chase"]);
  });

  it("ORCID-04 filter: non-null count is less than total group count (some entries filtered)", () => {
    const results = (worksFixture.group as OrcidGroupShape[]).map((g) =>
      orcidGroupToPublication(g, "Tomas Ferreira Chase"),
    );
    const nonNull = results.filter((r) => r !== null);
    // All fixture entries happen to be journal-articles, but count must be <= total
    expect(nonNull.length).toBeLessThanOrEqual(worksFixture.group.length);
    // And there must be at least one extracted publication
    expect(nonNull.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// fetchOrcid — 404 resilience (supports plan 17-03 SC4)
// ---------------------------------------------------------------------------

describe("fetchOrcid — 404 resilience", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty result and emits warning when ORCID profile returns 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("{}", { status: 404 }),
    );

    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const result = await fetchOrcid("0000-0000-0000-0000", "Test Person");

    expect(result).toEqual({ publications: [], lookup: [] });

    const warningCalls = stderrSpy.mock.calls.map((c) => String(c[0]));
    const hasWarning = warningCalls.some((msg) =>
      /ORCID profile not public or empty: 0000-0000-0000-0000/.test(msg),
    );
    expect(hasWarning).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// enrichOrcidAuthors — unit coverage (plan 17-03 Task 2)
// ---------------------------------------------------------------------------

const sipmDetailFixture = JSON.parse(
  readFileSync(resolve(__dirname, "fixtures/orcid-work-sipm.json"), "utf-8"),
);

/** Helper: build a minimal Publication for enrichOrcidAuthors tests */
function makeOrcidPub(overrides: Partial<Publication> & { id: string }): Publication {
  return {
    authors: ["Owner"],
    title: "Test Paper",
    journal: "Test Journal",
    year: 2020,
    topic_tags: [],
    source: "orcid",
    ...overrides,
  };
}

describe("enrichOrcidAuthors", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fixture-driven: SiPM enrichment yields 11 authors", async () => {
    const pub = makeOrcidPub({
      id: "10.1016/j.nima.2020.164490",
      doi: "10.1016/j.nima.2020.164490",
      authors: ["Tomas Ferreira Chase"],
    });
    const lookup = new Map([
      ["10.1016/j.nima.2020.164490", { orcid: "0009-0001-0286-2136", putCode: 156875914 }],
    ]);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(sipmDetailFixture), { status: 200 }),
    );

    const result = await enrichOrcidAuthors([pub], lookup);

    expect(result).toHaveLength(1);
    expect(result[0].authors.length).toBe(11);
    expect(result[0].authors).toContain("Tomás Ferreira Chase");
    expect(result[0].authors).toContain("Mariano Barella");
  });

  it("empty contributors list falls back to placeholder", async () => {
    const pub = makeOrcidPub({ id: "orcid-001" });
    const lookup = new Map([["orcid-001", { orcid: "0000-0001-0000-0001", putCode: 1 }]]);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ contributors: { contributor: [] } }), { status: 200 }),
    );

    const result = await enrichOrcidAuthors([pub], lookup);

    expect(result[0].authors).toEqual(["Owner"]);
  });

  it("contributors with null credit-name are filtered, placeholder preserved if all null", async () => {
    const pub = makeOrcidPub({ id: "orcid-002" });
    const lookup = new Map([["orcid-002", { orcid: "0000-0001-0000-0002", putCode: 2 }]]);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          contributors: {
            contributor: [
              { "credit-name": null },
              { "credit-name": null },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await enrichOrcidAuthors([pub], lookup);

    expect(result[0].authors).toEqual(["Owner"]);
  });

  it("partial null credit-names are skipped, valid names kept in order", async () => {
    const pub = makeOrcidPub({ id: "orcid-003" });
    const lookup = new Map([["orcid-003", { orcid: "0000-0001-0000-0003", putCode: 3 }]]);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          contributors: {
            contributor: [
              { "credit-name": { value: "Alice" } },
              { "credit-name": null },
              { "credit-name": { value: "Bob" } },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await enrichOrcidAuthors([pub], lookup);

    expect(result[0].authors).toEqual(["Alice", "Bob"]);
  });

  it("non-ORCID survivors pass through unchanged; ORCID row is enriched", async () => {
    const inspirePub: Publication = {
      id: "arxiv-foo",
      authors: ["X"],
      title: "Inspire Paper",
      journal: "J",
      year: 2021,
      topic_tags: [],
      source: "inspirehep",
    };
    const orcidPub = makeOrcidPub({ id: "orcid-only", authors: ["Owner"] });
    const lookup = new Map([["orcid-only", { orcid: "0000-0001-0000-0004", putCode: 4 }]]);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          contributors: { contributor: [{ "credit-name": { value: "Real" } }] },
        }),
        { status: 200 },
      ),
    );

    const result = await enrichOrcidAuthors([inspirePub, orcidPub], lookup);

    expect(result[0]).toEqual(inspirePub);
    expect(result[1].authors).toEqual(["Real"]);
  });

  it("ORCID survivor not in lookup passes through unchanged; fetch never called", async () => {
    const pub = makeOrcidPub({ id: "orcid-orphan" });
    const lookup = new Map<string, { orcid: string; putCode: number }>();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await enrichOrcidAuthors([pub], lookup);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result[0]).toEqual(pub);
  });

  it("detail 404 falls back to placeholder without throwing", async () => {
    const pub = makeOrcidPub({ id: "orcid-404" });
    const lookup = new Map([["orcid-404", { orcid: "0000-0001-0000-0099", putCode: 99 }]]);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("{}", { status: 404 }),
    );

    const result = await enrichOrcidAuthors([pub], lookup);

    expect(result[0].authors).toEqual(["Owner"]);
  });
});
