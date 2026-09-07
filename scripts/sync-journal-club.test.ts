/**
 * Unit tests for sync-journal-club.ts.
 * Run with: pnpm vitest run scripts/sync-journal-club.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  slugify,
  deriveStatus,
  deriveAcademicYear,
  rowsToSessions,
} from "./sync-journal-club";
import { JournalClubSchema } from "../src/content/schemas/journal-club.schema";

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe("slugify", () => {
  it("folds accents and drops punctuation", () => {
    expect(slugify("Dr. Fabiola Marín")).toBe("dr-fabiola-marin");
  });
  it("collapses separators", () => {
    expect(slugify("  Ana   María  ")).toBe("ana-maria");
  });
});

// ---------------------------------------------------------------------------
// derivations
// ---------------------------------------------------------------------------

describe("deriveStatus", () => {
  it("is upcoming when the date is today or later", () => {
    expect(deriveStatus("2026-09-07", "2026-09-07")).toBe("upcoming");
    expect(deriveStatus("2026-12-01", "2026-09-07")).toBe("upcoming");
  });
  it("is past when the date is before today", () => {
    expect(deriveStatus("2026-05-22", "2026-09-07")).toBe("past");
  });
});

describe("deriveAcademicYear", () => {
  it("assigns Aug–Dec to the Y/Y+1 season", () => {
    expect(deriveAcademicYear("2024-09-19")).toBe("2024-2025");
    expect(deriveAcademicYear("2023-11-23")).toBe("2023-2024");
  });
  it("assigns Jan–Jul to the Y-1/Y season", () => {
    expect(deriveAcademicYear("2025-04-10")).toBe("2024-2025");
    expect(deriveAcademicYear("2026-06-12")).toBe("2025-2026");
  });
});

// ---------------------------------------------------------------------------
// rowsToSessions
// ---------------------------------------------------------------------------

const HEADER = [
  "Fecha",
  "Speaker",
  "Posición",
  "Afiliación",
  "Título",
  "Resumen",
  "Link",
  "Notas",
];

describe("rowsToSessions", () => {
  const today = "2026-09-07";

  it("maps sheet columns to a valid session, deriving id/status/academic_year", () => {
    const warnings: string[] = [];
    const sessions = rowsToSessions(
      [
        HEADER,
        [
          "2026-05-22",
          "Dr. Fabiola Marín",
          "Profesora",
          "UNICEN",
          "Probing the large-scale structure",
          "We derive ...",
          "https://arxiv.org/abs/2501.09876",
          "Sesión conjunta con el IAFE.",
        ],
      ],
      today,
      warnings,
    );

    expect(warnings).toEqual([]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      id: "2026-05-22-dr-fabiola-marin",
      date: "2026-05-22",
      status: "past",
      speaker: "Dr. Fabiola Marín",
      speaker_position: "Profesora",
      affiliation: "UNICEN",
      title: "Probing the large-scale structure",
      abstract: "We derive ...",
      paper_link: "https://arxiv.org/abs/2501.09876",
      notes: "Sesión conjunta con el IAFE.",
      academic_year: "2025-2026",
    });
    expect(JournalClubSchema.safeParse(sessions).success).toBe(true);
  });

  it("omits empty optional cells and skips fully blank lines", () => {
    const warnings: string[] = [];
    const sessions = rowsToSessions(
      [
        HEADER,
        ["2027-03-01", "Dr. Kenji Bekki", "", "UWA", "Stellar mass function", "", "", ""],
        ["", "", "", "", "", "", "", ""],
      ],
      today,
      warnings,
    );
    expect(warnings).toEqual([]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].status).toBe("upcoming");
    expect(sessions[0]).not.toHaveProperty("abstract");
    expect(sessions[0]).not.toHaveProperty("notes");
    expect(sessions[0]).not.toHaveProperty("speaker_position");
    expect(sessions[0]).not.toHaveProperty("academic_year");
  });

  it("warns and skips rows missing a date or required text", () => {
    const warnings: string[] = [];
    const sessions = rowsToSessions(
      [
        HEADER,
        ["not-a-date", "X", "", "", "Title", "", "", ""],
        ["2026-01-01", "", "", "", "Title", "", "", ""],
      ],
      today,
      warnings,
    );
    expect(sessions).toHaveLength(0);
    expect(warnings).toHaveLength(2);
  });

  it("drops a non-URL Link with a warning but keeps the session", () => {
    const warnings: string[] = [];
    const sessions = rowsToSessions(
      [HEADER, ["2026-02-02", "X Y", "", "", "Title", "", "tbd", ""]],
      today,
      warnings,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).not.toHaveProperty("paper_link");
    expect(warnings.some((w) => w.includes("Link is not a URL"))).toBe(true);
  });

  it("disambiguates duplicate ids (same speaker + date)", () => {
    const warnings: string[] = [];
    const sessions = rowsToSessions(
      [
        HEADER,
        ["2026-05-22", "Jane Doe", "", "", "Paper A", "", "", ""],
        ["2026-05-22", "Jane Doe", "", "", "Paper B", "", "", ""],
      ],
      today,
      warnings,
    );
    const ids = sessions.map((s) => s.id).sort();
    expect(ids).toEqual(["2026-05-22-jane-doe", "2026-05-22-jane-doe-2"]);
  });

  it("throws when a required column is missing from the header", () => {
    expect(() =>
      rowsToSessions([["Fecha", "Speaker"], ["2026-05-22", "X"]], today, []),
    ).toThrow(/required column/);
  });
});
