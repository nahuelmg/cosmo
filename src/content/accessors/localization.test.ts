import { describe, expect, it } from "vitest";
import { getJournalClub, getPastSessionsByYear } from "./journal-club";
import { getLocalizedPerson } from "./people";
import { localize, localizeSource } from "../schemas/shared";
import rawSessions from "../../../content/journal-club.json";

describe("English parity for synced content", () => {
  it("preserves Spanish sessions and session identity across languages", () => {
    expect(getJournalClub("es")).toEqual(rawSessions);
    const english = getJournalClub("en");
    for (const [index, session] of english.entries()) {
      const original = rawSessions[index];
      expect(session.title).not.toBe(original.title);
      expect(session.abstract).not.toBe(original.abstract);
      for (const field of ["id", "date", "speaker", "paper_link", "academic_year"] as const) {
        expect(session[field]).toBe(original[field]);
      }
      expect(session.location).toBe("Federman Room");
    }
    expect(getJournalClub("es")).toEqual(rawSessions);
    expect(Object.values(getPastSessionsByYear("en")).flat()).toEqual(
      english.filter((session) => session.status === "past"),
    );
  });

  it("translates research interests without changing the Spanish profile", () => {
    const english = getLocalizedPerson("cecilia-scannapieco", "en")!;
    const spanish = getLocalizedPerson("cecilia-scannapieco", "es")!;
    expect(english.research_interests).toEqual([
      "Cosmological simulations of galaxy evolution",
      "Galactic disk formation",
      "Chemical evolution of galaxies",
    ]);
    expect(spanish.research_interests[0]).toBe(
      "Simulaciones cosmológicas de la evolución de galaxias",
    );
  });

  it("keeps explicit translations and falls back safely for new source text", () => {
    expect(localize({ es: "Investigador", en: "Principal investigator" }, "en"))
      .toBe("Principal investigator");
    expect(localizeSource("A new talk with no translation yet", "en"))
      .toBe("A new talk with no translation yet");
    expect(localizeSource("constructor", "en")).toBe("constructor");
  });
});
