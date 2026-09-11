/**
 * Unit tests for sync-journal-club.ts.
 * Run with: pnpm vitest run scripts/sync-journal-club.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  slugify,
  deriveStatus,
  deriveAcademicYear,
  normalizeDate,
  normalizeTime,
  normalizeLocation,
  resolveHeader,
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

describe("normalizeDate", () => {
  it("passes ISO YYYY-MM-DD through unchanged", () => {
    expect(normalizeDate("2026-09-14")).toBe("2026-09-14");
  });
  it("converts the en-US M/D/YYYY form Google Forms writes", () => {
    expect(normalizeDate("9/14/2026")).toBe("2026-09-14");
    expect(normalizeDate("12/1/2026")).toBe("2026-12-01");
  });
  it("rejects malformed or out-of-range dates", () => {
    expect(normalizeDate("not-a-date")).toBeNull();
    expect(normalizeDate("14/9/2026")).toBeNull(); // month 14
    expect(normalizeDate("2026/09/14")).toBeNull();
  });
});

describe("normalizeTime", () => {
  it("zero-pads H:MM to HH:MM", () => {
    expect(normalizeTime("9:00")).toBe("09:00");
    expect(normalizeTime("14:30")).toBe("14:30");
  });
  it("drops a seconds part", () => {
    expect(normalizeTime("14:30:00")).toBe("14:30");
  });
  it("converts a 12-hour time to 24-hour", () => {
    expect(normalizeTime("3:00:00 PM")).toBe("15:00");
    expect(normalizeTime("2:30 pm")).toBe("14:30");
    expect(normalizeTime("9:05 AM")).toBe("09:05");
    expect(normalizeTime("3 PM")).toBe("15:00");
  });
  it("handles the Spanish a. m. / p. m. spelling", () => {
    expect(normalizeTime("3:00 p. m.")).toBe("15:00");
    expect(normalizeTime("11:15 a.m.")).toBe("11:15");
  });
  it("maps the 12 o'clock edges", () => {
    expect(normalizeTime("12:00 AM")).toBe("00:00");
    expect(normalizeTime("12:30 PM")).toBe("12:30");
  });
  it("rejects non-times and out-of-range values", () => {
    expect(normalizeTime("24:00")).toBeNull();
    expect(normalizeTime("14h30")).toBeNull();
    expect(normalizeTime("13:00 PM")).toBeNull();
    expect(normalizeTime("half past two")).toBeNull();
  });
});

describe("normalizeLocation", () => {
  it("prefixes a bare room name", () => {
    expect(normalizeLocation("Federman")).toBe("Aula Federman");
    expect(normalizeLocation("  1620  ")).toBe("Aula 1620");
  });
  it("leaves an already-qualified room alone", () => {
    expect(normalizeLocation("Aula Federman")).toBe("Aula Federman");
    expect(normalizeLocation("aula 8")).toBe("aula 8");
    expect(normalizeLocation("Aulas 3 y 4")).toBe("Aulas 3 y 4");
  });
});

describe("resolveHeader", () => {
  it("maps the exact form headers", () => {
    expect(resolveHeader("Date of the journal")).toBe("date");
    expect(resolveHeader("Place/room")).toBe("location");
  });
  it("ignores a parenthetical hint and trailing punctuation", () => {
    expect(resolveHeader("Links (format https://...)")).toBe("paper_link");
    expect(resolveHeader("Abstract:")).toBe("abstract");
  });
  it("falls back to a prefix match for a reworded question", () => {
    expect(resolveHeader("Title of the journal club talk")).toBe("title");
    expect(resolveHeader("Hour")).toBe("start_time");
  });
  it("leaves the Timestamp and unknown columns unmapped", () => {
    expect(resolveHeader("Timestamp")).toBeUndefined();
    expect(resolveHeader("Email address")).toBeUndefined();
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

// English Google Form response sheet (current source).
const FORM_HEADER = [
  "Timestamp",
  "Complete name",
  "Academic position",
  "Affiliation",
  "Date of the journal",
  "Hour",
  "Place/room",
  "Title of the journal",
  "Abstract",
  "Links",
];

describe("rowsToSessions — English Google Form sheet", () => {
  const today = "2026-09-10";

  it("maps the form columns, normalizes the date, and keeps hour + place", () => {
    const warnings: string[] = [];
    const sessions = rowsToSessions(
      [
        FORM_HEADER,
        [
          "9/10/2026 12:41:06",
          "Nahuel Mirón",
          "Investigador",
          "UBA",
          "9/14/2026",
          "14:30",
          "Aula Federman",
          "Light and gravitational waves",
          "We show how GW and light behave alike.",
          "",
        ],
      ],
      today,
      warnings,
    );

    expect(warnings).toEqual([]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      id: "2026-09-14-nahuel-miron",
      date: "2026-09-14",
      status: "upcoming",
      speaker: "Nahuel Mirón",
      speaker_position: "Investigador",
      affiliation: "UBA",
      start_time: "14:30",
      location: "Aula Federman",
      title: "Light and gravitational waves",
      abstract: "We show how GW and light behave alike.",
    });
    expect(sessions[0]).not.toHaveProperty("paper_link");
    expect(JournalClubSchema.safeParse(sessions).success).toBe(true);
  });

  it("reads the live sheet shape: 12-hour time, bare room, hinted Links header", () => {
    const warnings: string[] = [];
    const sessions = rowsToSessions(
      [
        [...FORM_HEADER.slice(0, -1), "Links (format https://...)"],
        [
          "9/11/2026 14:05:55",
          "Tomas Chase",
          "PhD",
          "IFIBA",
          "9/14/2026",
          "3:00:00 PM",
          "Federman",
          "El evento de 248 keV en LZ",
          "Sobre el evento de alta energia de LZ.",
          "https://arxiv.org/abs/2609.02823",
        ],
      ],
      today,
      warnings,
    );

    expect(warnings).toEqual([]);
    expect(sessions[0]).toMatchObject({
      start_time: "15:00",
      location: "Aula Federman",
      paper_link: "https://arxiv.org/abs/2609.02823",
    });
    expect(JournalClubSchema.safeParse(sessions).success).toBe(true);
  });

  it("ignores the Timestamp column and drops a malformed Hour with a warning", () => {
    const warnings: string[] = [];
    const sessions = rowsToSessions(
      [
        FORM_HEADER,
        [
          "9/10/2026 12:41:06",
          "Jane Doe",
          "",
          "",
          "2026-03-01",
          "half past two",
          "",
          "A paper",
          "",
          "",
        ],
      ],
      today,
      warnings,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).not.toHaveProperty("start_time");
    expect(sessions[0].date).toBe("2026-03-01");
    expect(warnings.some((w) => w.includes("Hour"))).toBe(true);
  });
});

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
