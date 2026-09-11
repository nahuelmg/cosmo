/**
 * Unit tests for sync-research.ts.
 * Run with: pnpm vitest run scripts/sync-research.test.ts
 */

import { describe, it, expect } from "vitest";
import { slugify, markerKind, parseDoc, mergeAreas } from "./sync-research";
import { ResearchSchema, type ResearchArea } from "../src/content/schemas/research.schema";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

describe("slugify", () => {
  it("folds accents and hyphenates", () => {
    expect(slugify("Púlsares Binarios")).toBe("pulsares-binarios");
    expect(slugify("Inteligencia Artificial y Cosmología")).toBe(
      "inteligencia-artificial-y-cosmologia",
    );
  });
});

describe("markerKind", () => {
  it("recognizes both block labels, accent- and case-insensitively", () => {
    expect(markerKind("Mini resumen:")).toBe("short");
    expect(markerKind("MINI RESUMEN")).toBe("short");
    expect(markerKind("Explicación:")).toBe("full");
    expect(markerKind("explicacion")).toBe("full");
  });
  it("returns null for ordinary text", () => {
    expect(markerKind("Ondas Gravitacionales")).toBeNull();
    expect(markerKind("Las galaxias se forman por enfriamiento del gas.")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseDoc
// ---------------------------------------------------------------------------

const DOC = `﻿Ondas Gravitacionales
Mini resumen:
Fuentes astrofísicas de ondas gravitacionales.
Explicación:
Primer párrafo sobre LIGO y Virgo.

Segundo párrafo sobre LISA.
Materia Oscura
Mini resumen:

Halos, simulaciones y restricciones.
Explicación:
La materia oscura es el 27% del universo.
`;

describe("parseDoc", () => {
  it("reads areas in document order, joining paragraphs with a blank line", () => {
    const warnings: string[] = [];
    const areas = parseDoc(DOC, warnings);

    expect(warnings).toEqual([]);
    expect(areas.map((a) => a.title)).toEqual([
      "Ondas Gravitacionales",
      "Materia Oscura",
    ]);
    expect(areas[0].short).toBe("Fuentes astrofísicas de ondas gravitacionales.");
    expect(areas[0].full).toBe(
      "Primer párrafo sobre LIGO y Virgo.\n\nSegundo párrafo sobre LISA.",
    );
    expect(areas[1].full).toBe("La materia oscura es el 27% del universo.");
  });

  it("skips an area that is missing a block, with a warning", () => {
    const warnings: string[] = [];
    const areas = parseDoc(
      `Gravedad Modificada
Mini resumen:
Teorías alternativas.
`,
      warnings,
    );
    expect(areas).toEqual([]);
    expect(warnings.some((w) => w.includes("Explicación"))).toBe(true);
  });

  it("returns nothing for text that is not the expected document", () => {
    const warnings: string[] = [];
    expect(parseDoc("<html>Sign in</html>", warnings)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// mergeAreas
// ---------------------------------------------------------------------------

const EXISTING: ResearchArea[] = [
  {
    id: "dark-matter",
    title: { es: "Materia Oscura", en: "Dark Matter" },
    short_description: { es: "Halos, simulaciones y restricciones.", en: "Halos, simulations and constraints." },
    full_description: { es: "La materia oscura es el 27% del universo.", en: "Dark matter is 27% of the universe." },
    icon: "atom",
    order: 0,
  },
  {
    id: "gravitational-waves",
    title: { es: "Ondas Gravitacionales", en: "Gravitational Waves" },
    short_description: { es: "Fuentes astrofísicas de ondas gravitacionales.", en: "Astrophysical gravitational-wave sources." },
    full_description: {
      es: "Primer párrafo sobre LIGO y Virgo.\n\nSegundo párrafo sobre LISA.",
      en: "First paragraph on LIGO and Virgo.\n\nSecond paragraph on LISA.",
    },
    icon: "waves",
    order: 1,
  },
];

describe("mergeAreas", () => {
  it("takes order and Spanish from the document, keeping id, icon and English", () => {
    const warnings: string[] = [];
    const merged = mergeAreas(parseDoc(DOC, warnings), EXISTING, warnings);

    expect(warnings).toEqual([]);
    expect(merged.map((a) => [a.id, a.order])).toEqual([
      ["gravitational-waves", 0],
      ["dark-matter", 1],
    ]);
    expect(merged[0].icon).toBe("waves");
    expect(merged[0].title.en).toBe("Gravitational Waves");
    expect(merged[0].full_description.en).toBe(
      "First paragraph on LIGO and Virgo.\n\nSecond paragraph on LISA.",
    );
    expect(ResearchSchema.safeParse(merged).success).toBe(true);
  });

  it("mirrors the Spanish into English when the document text changed", () => {
    const warnings: string[] = [];
    const doc = parseDoc(DOC, warnings).map((a) =>
      a.title === "Materia Oscura" ? { ...a, full: "Texto reescrito." } : a,
    );
    const merged = mergeAreas(doc, EXISTING, warnings);

    const dm = merged.find((a) => a.id === "dark-matter")!;
    expect(dm.full_description.es).toBe("Texto reescrito.");
    expect(dm.full_description.en).toBe("Texto reescrito.");
    // The untouched summary keeps its translation.
    expect(dm.short_description.en).toBe("Halos, simulations and constraints.");
    expect(warnings.some((w) => w.includes("English mirrors the Spanish"))).toBe(true);
  });

  it("adds an area that is only in the document and warns about it", () => {
    const warnings: string[] = [];
    const doc = [
      { title: "Púlsares Binarios", short: "Laboratorios de gravedad.", full: "Cronometraje de pulsos." },
    ];
    const merged = mergeAreas(doc, EXISTING, warnings);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("pulsares-binarios");
    expect(merged[0]).not.toHaveProperty("icon");
    expect(merged[0].title.en).toBe("Púlsares Binarios");
    expect(warnings.some((w) => w.includes("is new"))).toBe(true);
    expect(ResearchSchema.safeParse(merged).success).toBe(true);
  });

  it("drops an area that left the document and warns about it", () => {
    const warnings: string[] = [];
    const doc = [
      {
        title: "Materia Oscura",
        short: "Halos, simulaciones y restricciones.",
        full: "La materia oscura es el 27% del universo.",
      },
    ];
    const merged = mergeAreas(doc, EXISTING, warnings);

    expect(merged.map((a) => a.id)).toEqual(["dark-matter"]);
    expect(warnings.some((w) => w.includes("Ondas Gravitacionales") && w.includes("dropped"))).toBe(
      true,
    );
  });
});
