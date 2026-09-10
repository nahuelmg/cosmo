/**
 * Unit tests for sync-people.ts.
 * Run with: pnpm vitest run scripts/sync-people.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  slugify,
  splitParen,
  staffCategory,
  straightenQuotes,
  splitInterests,
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
    expect(staffCategory("Estudiante de doctorado")).toBe("phd");
    expect(staffCategory("Licenciando")).toBe("undergrad");
    expect(staffCategory("Estudiante de licenciatura")).toBe("undergrad");
    expect(staffCategory("mystery")).toBe("phd"); // default
  });
});

describe("straightenQuotes", () => {
  it("replaces curly quotes with straight ones", () => {
    expect(straightenQuotes("“hola” y ‘chau’")).toBe("\"hola\" y 'chau'");
  });
});

describe("splitInterests", () => {
  it("splits on newlines and semicolons, trimming blanks", () => {
    expect(splitInterests("Cosmología cuántica\nAgujeros negros; Inflación\n")).toEqual([
      "Cosmología cuántica",
      "Agujeros negros",
      "Inflación",
    ]);
  });
  it("returns an empty array for an empty cell", () => {
    expect(splitInterests("")).toEqual([]);
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
// rowsToRawPeople — enrichment columns (EMAIL / Oficina / bio / interests)
// ---------------------------------------------------------------------------

const SHEET_7COL: string[][] = [
  ["Investigadores", "", "", "", "", "", ""],
  [
    "Nombre",
    "Cargo en investigación",
    "Cargo docente",
    "EMAIL",
    "Oficina",
    "Mini Biografía",
    "Líneas de investigación",
  ],
  [
    "Ana Torres",
    "Investigadora Principal",
    "",
    "ana@df.uba.ar",
    "Oficina 12",
    "Trabaja en cosmología.",
    "Inflación\nMateria oscura",
  ],
  ["Postdocs / docs / lics", "", "", "", "", "", ""],
  // The Postdocs sub-header only re-names the first three columns …
  ["Nombre", "Cargo en investigación", "Cargo docente", "", "", "", ""],
  // … but the accumulated map still resolves EMAIL / Oficina by position.
  ["Beto Díaz", "Posdoc", "", "beto@df.uba.ar", "Oficina 9", "", ""],
  ["Colaboradores externos y visitantes:", "", "", "", "", "", ""],
  ["Carla Ruiz", "", "", "ignored@x.com", "", "", ""],
];

describe("rowsToRawPeople — enrichment columns", () => {
  it("reads EMAIL, Oficina, Mini Biografía and Líneas de investigación for staff", () => {
    const raw = rowsToRawPeople(SHEET_7COL, []);
    const ana = raw.find((r) => r.slug === "ana-torres")!;
    expect(ana.email).toBe("ana@df.uba.ar");
    expect(ana.office).toBe("Oficina 12");
    expect(ana.bioEs).toBe("Trabaja en cosmología.");
    expect(ana.interestsEs).toEqual(["Inflación", "Materia oscura"]);
  });

  it("keeps the column map across blocks whose sub-header omits later columns", () => {
    const raw = rowsToRawPeople(SHEET_7COL, []);
    const beto = raw.find((r) => r.slug === "beto-diaz")!;
    expect(beto.email).toBe("beto@df.uba.ar");
    expect(beto.office).toBe("Oficina 9");
  });

  it("ignores enrichment columns for collaborators / past members", () => {
    const raw = rowsToRawPeople(SHEET_7COL, []);
    const carla = raw.find((r) => r.slug === "carla-ruiz")!;
    expect(carla.email).toBeUndefined();
  });

  it("warns and drops an invalid EMAIL", () => {
    const warnings: string[] = [];
    rowsToRawPeople(
      [
        ["Investigadores", "", "", ""],
        ["Nombre", "Cargo en investigación", "Cargo docente", "EMAIL"],
        ["Zoe Vega", "Investigadora Principal", "", "not-an-email"],
      ],
      warnings,
    );
    expect(warnings.some((w) => w.includes("not a valid address"))).toBe(true);
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

  it("uses the sheet bio / interests / email / office when there is no enrichment", () => {
    const warnings: string[] = [];
    const person = assemble(
      {
        slug: "ana-torres",
        name: "Ana Torres",
        category: "pi",
        roleEs: "Investigadora Principal",
        email: "ana@df.uba.ar",
        office: "Oficina 12",
        bioEs: "Trabaja en cosmología.",
        interestsEs: ["Inflación", "Materia oscura"],
      },
      undefined,
      warnings,
    );
    expect(person.short_bio).toEqual({
      es: "Trabaja en cosmología.",
      en: "Trabaja en cosmología.",
    });
    expect(person.full_bio).toEqual(person.short_bio);
    expect(person.research_interests).toEqual([
      { es: "Inflación", en: "Inflación" },
      { es: "Materia oscura", en: "Materia oscura" },
    ]);
    expect(person.contact).toEqual({
      email: "ana@df.uba.ar",
      office: "Oficina 12",
    });
    expect(warnings).toEqual([]);
    expect(PeopleSchema.safeParse([person]).success).toBe(true);
  });

  it("keeps the curated bilingual bio / interests and warns that the sheet value is ignored", () => {
    const warnings: string[] = [];
    const curated = {
      short_bio: { es: "Bio ES curada", en: "Curated EN bio" },
      research_interests: [{ es: "Tema", en: "Topic" }],
      contact: { email: "curated@df.uba.ar", orcid: "0000-0002-1825-0097" as const },
    };
    const person = assemble(
      {
        slug: "ana-torres",
        name: "Ana Torres",
        category: "pi",
        roleEs: "Investigadora Principal",
        email: "sheet@df.uba.ar",
        bioEs: "Bio del sheet",
        interestsEs: ["Otra"],
      },
      curated,
      warnings,
    );
    expect(person.short_bio).toEqual(curated.short_bio);
    expect(person.research_interests).toEqual(curated.research_interests);
    // EMAIL from the sheet still overrides the curated contact.
    expect(person.contact.email).toBe("sheet@df.uba.ar");
    expect(person.contact.orcid).toBe("0000-0002-1825-0097");
    expect(warnings).toHaveLength(2);
  });
});
