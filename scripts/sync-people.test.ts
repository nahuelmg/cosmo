/**
 * Unit tests for sync-people.ts.
 * Run with: pnpm vitest run scripts/sync-people.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  slugify,
  splitParen,
  staffCategory,
  rowsToRawPeople,
  assemble,
} from "./sync-people";
import { PeopleSchema } from "../src/content/schemas/people.schema";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

describe("slugify", () => {
  it("folds accents, lowercases, hyphenates", () => {
    expect(slugify("Nahuel Mirón Granese")).toBe("nahuel-miron-granese");
    expect(slugify("Diana Lopéz Nacir")).toBe("diana-lopez-nacir");
  });
});

describe("splitParen", () => {
  it("splits a trailing parenthetical", () => {
    expect(splitParen("Juan Manuel Armaleo (IAFE UBA-CONICET, Argentina)")).toEqual({
      name: "Juan Manuel Armaleo",
      paren: "IAFE UBA-CONICET, Argentina",
    });
  });
  it("returns the whole string when there is no parenthetical", () => {
    expect(splitParen("Matias Zaldarriaga")).toEqual({ name: "Matias Zaldarriaga" });
  });
});

describe("staffCategory", () => {
  it("maps the research-role wording to a category", () => {
    expect(staffCategory("Posdoc")).toBe("postdoc");
    expect(staffCategory("Doctorando")).toBe("phd");
    expect(staffCategory("Licenciando")).toBe("undergrad");
    expect(staffCategory("mystery")).toBe("phd"); // default
  });
});

// ---------------------------------------------------------------------------
// rowsToRawPeople — section-aware parsing
// ---------------------------------------------------------------------------

const SHEET: string[][] = [
  ["Investigadores", "", ""],
  ["", "", ""],
  ["Nombre", "Cargo en investigación", "Cargo docente"],
  ["Esteban Calzetta", "Investigador Principal", "Profesor Emérito"],
  ["Susana Landau", "Investigadora Independiente", ""],
  ["", "", ""],
  ["Postdocs / docs / lics", "", ""],
  ["Nombre", "Cargo en investigación", "Cargo docente"],
  ["Javier Badía", "Posdoc", "Jefe de Trabajos Prácticos"],
  ["Tomas Chase", "Doctorando", "Ay 1era"],
  ["Martin Castelli", "Licenciando", ""],
  ["", "", ""],
  ["Miembros Anteriores:", "", ""],
  ["Javi Pineau (estudiante de licenciatura 2026)", "", ""],
  ["", "", ""],
  ["Colaboradores externos y visitantes:", "", ""],
  ["Matias Zaldarriaga", "", ""],
  ["Juan Manuel Armaleo (IAFE UBA-CONICET, Argentina)", "", ""],
];

describe("rowsToRawPeople", () => {
  it("assigns categories from the section headers", () => {
    const warnings: string[] = [];
    const raw = rowsToRawPeople(SHEET, warnings);
    expect(warnings).toEqual([]);
    expect(raw.map((r) => [r.slug, r.category])).toEqual([
      ["esteban-calzetta", "pi"],
      ["susana-landau", "pi"],
      ["javier-badia", "postdoc"],
      ["tomas-ferreira-chase", "phd"], // alias applied
      ["martin-castelli", "undergrad"],
      ["javier-pineau", "past"], // alias applied
      ["matias-zaldarriaga", "visitors"],
      ["juan-manuel-armaleo", "visitors"],
    ]);
  });

  it("carries the sheet roles, past year and collaborator affiliation", () => {
    const raw = rowsToRawPeople(SHEET, []);
    const badia = raw.find((r) => r.slug === "javier-badia")!;
    expect(badia.roleEs).toBe("Posdoc");
    expect(badia.teachingEs).toBe("Jefe de Trabajos Prácticos");

    const pineau = raw.find((r) => r.slug === "javier-pineau")!;
    expect(pineau.pastYear).toBe("2026");

    const armaleo = raw.find((r) => r.slug === "juan-manuel-armaleo")!;
    expect(armaleo.parenAffiliation).toBe("IAFE UBA-CONICET, Argentina");
  });

  it("applies the display-name alias corrections", () => {
    const raw = rowsToRawPeople(SHEET, []);
    expect(raw.find((r) => r.slug === "tomas-ferreira-chase")!.name).toBe(
      "Tomas Ferreira Chase",
    );
    expect(raw.find((r) => r.slug === "javier-pineau")!.name).toBe("Javier Pineau");
  });
});

// ---------------------------------------------------------------------------
// assemble — merge with enrichment + translate
// ---------------------------------------------------------------------------

describe("assemble", () => {
  it("translates the sheet role to English and merges enrichment", () => {
    const warnings: string[] = [];
    const person = assemble(
      {
        slug: "javier-badia",
        name: "Javier Badía",
        category: "postdoc",
        roleEs: "Posdoc",
        teachingEs: "Ay 1era",
      },
      { inspirehep_id: "J.Badia.1", orcid_id: "0000-0002-9095-9594" },
      warnings,
    );
    expect(person.role).toEqual({ es: "Posdoc", en: "Postdoctoral Researcher" });
    expect(person.teaching_role).toEqual({
      es: "Ayudante de primera",
      en: "First-rank Teaching Assistant",
    });
    expect(person.inspirehep_id).toBe("J.Badia.1");
    expect(person.display_name_normalized).toBe("javier badia");
    expect(warnings).toEqual([]);
    expect(PeopleSchema.safeParse([person]).success).toBe(true);
  });

  it("derives the past-member role from the parsed year", () => {
    const person = assemble(
      { slug: "javier-pineau", name: "Javier Pineau", category: "past", pastYear: "2026" },
      undefined,
      [],
    );
    expect(person.role).toEqual({
      es: "Estudiante de licenciatura (2026)",
      en: "Undergraduate student (2026)",
    });
    expect(person.short_bio.es).toContain("Biografía a completar");
    expect(PeopleSchema.safeParse([person]).success).toBe(true);
  });

  it("falls back to the enrichment role for collaborators (no sheet role column)", () => {
    const person = assemble(
      { slug: "alejandra-kandus", name: "Alejandra Kandus", category: "visitors" },
      {
        role: { es: "Investigadora Visitante", en: "Visiting Researcher" },
        affiliation: { es: "UESC, Brasil", en: "UESC, Brazil" },
      },
      [],
    );
    expect(person.role.es).toBe("Investigadora Visitante");
    expect(person.affiliation).toEqual({ es: "UESC, Brasil", en: "UESC, Brazil" });
  });

  it("uses the collaborator parenthetical as affiliation when enrichment has none", () => {
    const person = assemble(
      {
        slug: "juan-manuel-armaleo",
        name: "Juan Manuel Armaleo",
        category: "visitors",
        parenAffiliation: "IAFE UBA-CONICET, Argentina",
      },
      undefined,
      [],
    );
    expect(person.affiliation).toEqual({
      es: "IAFE UBA-CONICET, Argentina",
      en: "IAFE UBA-CONICET, Argentina",
    });
  });

  it("warns on an unknown research role and uses Spanish for English", () => {
    const warnings: string[] = [];
    const person = assemble(
      { slug: "x", name: "X Y", category: "phd", roleEs: "Becario raro" },
      undefined,
      warnings,
    );
    expect(person.role).toEqual({ es: "Becario raro", en: "Becario raro" });
    expect(warnings).toHaveLength(1);
  });
});
