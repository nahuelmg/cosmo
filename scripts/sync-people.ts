/**
 * sync-people.ts
 *
 * CLI: pnpm sync-people [--dry-run] [--verbose]
 *
 * Hybrid sync for the People tab. The roster (who is in the group, which
 * section they belong to, and their Spanish research / teaching roles) comes
 * from a published Google Sheet. Everything the sheet cannot express — ORCID /
 * InspireHEP ids, photos, e-mails, bios, research interests, curated bilingual
 * affiliations — lives in `content/people-extra.json`, keyed by slug, and is
 * merged in here. The result is written to `content/people.json` (generated —
 * do not hand-edit).
 *
 * Sheet layout (one tab, section headers as rows):
 *   Investigadores                       → category "pi"
 *     Nombre | Cargo en investigación | Cargo docente
 *   Postdocs / docs / lics               → category from "Cargo en investigación"
 *     Nombre | Cargo en investigación | Cargo docente
 *   Miembros Anteriores:                 → category "past"   ("Nombre (… 2026)")
 *   Colaboradores externos y visitantes: → category "visitors"  ("Nombre (Afiliación)")
 *
 * Rules (mirrors the other sync scripts):
 *  - Relative imports only, no top-level await, guard main() with require.main
 *  - Validate BEFORE writing; on any failure keep the existing file and exit 1
 */

import { parseArgs } from "node:util";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "./csv";
import { normalizeName } from "../src/content/schemas/shared";
import { PeopleSchema, type Person } from "../src/content/schemas/people.schema";
import {
  PeopleExtraSchema,
  type PersonExtra,
} from "../src/content/schemas/people-extra.schema";

// ---------------------------------------------------------------------------
// A. CLI + constants
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "dry-run": { type: "boolean", default: false },
    verbose: { type: "boolean", default: false },
  },
  strict: true,
});
const isVerbose = Boolean(flags.verbose);

const SHEET_ID = "1SMJ3gXrW-KJi-bFUXkCHZRimL4mpuqcil77iRQq0EoQ";
const DEFAULT_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const CSV_URL = process.env.PEOPLE_SHEET_CSV_URL || DEFAULT_CSV_URL;

const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT = "cosmo-sync/1.0 (academic group site; people sheet sync)";
const EXTRA_PATH = resolve(__dirname, "../content/people-extra.json");
const OUTPUT_PATH = resolve(__dirname, "../content/people.json");

// ---------------------------------------------------------------------------
// B. Lookup tables
// ---------------------------------------------------------------------------

type Section = "pi" | "researchStaff" | "past" | "collaborators";

const SECTION_HEADERS: Record<string, Section> = {
  investigadores: "pi",
  "postdocs / docs / lics": "researchStaff",
  "miembros anteriores": "past",
  "colaboradores externos y visitantes": "collaborators",
};

const ROLE_EN: Record<string, string> = {
  "investigador principal": "Principal Researcher",
  "investigadora principal": "Principal Researcher",
  "investigador independiente": "Independent Researcher",
  "investigadora independiente": "Independent Researcher",
  investigador: "Researcher",
  investigadora: "Researcher",
  "investigador asistente": "Assistant Researcher",
  "investigadora asistente": "Assistant Researcher",
  posdoc: "Postdoctoral Researcher",
  postdoc: "Postdoctoral Researcher",
  "investigador postdoctoral": "Postdoctoral Researcher",
  doctorando: "PhD Student",
  doctoranda: "PhD Student",
  licenciando: "Undergraduate Student",
  licencianda: "Undergraduate Student",
  "investigador visitante": "Visiting Researcher",
  "investigadora visitante": "Visiting Researcher",
};

const TEACHING: Record<string, { es: string; en: string }> = {
  "profesor emerito": { es: "Profesor Emérito", en: "Professor Emeritus" },
  "profesora emerita": { es: "Profesora Emérita", en: "Professor Emerita" },
  "profesor adjunto": { es: "Profesor Adjunto", en: "Adjunct Professor" },
  "profesora adjunta": { es: "Profesora Adjunta", en: "Adjunct Professor" },
  "jefe de trabajos practicos": {
    es: "Jefe de Trabajos Prácticos",
    en: "Head of Practical Works",
  },
  "jefa de trabajos practicos": {
    es: "Jefa de Trabajos Prácticos",
    en: "Head of Practical Works",
  },
  "ay 1era": { es: "Ayudante de primera", en: "First-rank Teaching Assistant" },
  "ay 1ra": { es: "Ayudante de primera", en: "First-rank Teaching Assistant" },
  "ayudante de primera": {
    es: "Ayudante de primera",
    en: "First-rank Teaching Assistant",
  },
  "ay 2da": { es: "Ayudante de segunda", en: "Second-rank Teaching Assistant" },
  "ayudante de segunda": {
    es: "Ayudante de segunda",
    en: "Second-rank Teaching Assistant",
  },
};

// slugify(sheet name) → { canonical slug, corrected display name }
const ALIASES: Record<string, { slug: string; name?: string }> = {
  "diana-lopez-nacir": { slug: "diana-lopez-nacir", name: "Diana López Nacir" },
  "tomas-chase": { slug: "tomas-ferreira-chase", name: "Tomas Ferreira Chase" },
  "javi-pineau": { slug: "javier-pineau", name: "Javier Pineau" },
  "giorigio-torrieri": { slug: "giorgio-torrieri", name: "Giorgio Torrieri" },
  "martin-richarte": { slug: "martin-richarte", name: "Martín Richarte" },
};

// ---------------------------------------------------------------------------
// C. Helpers
// ---------------------------------------------------------------------------

const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

export function slugify(name: string): string {
  return fold(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitParen(cell: string): { name: string; paren?: string } {
  const m = cell.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  if (m) return { name: m[1].trim(), paren: m[2].trim() };
  return { name: cell.trim() };
}

export function staffCategory(researchRole: string): Person["category"] {
  const f = fold(researchRole);
  if (/pos.?doc/.test(f)) return "postdoc";
  if (/doctorand/.test(f)) return "phd";
  if (/licenciand/.test(f)) return "undergrad";
  return "phd";
}

interface RawPerson {
  slug: string;
  name: string;
  category: Person["category"];
  roleEs?: string;
  teachingEs?: string;
  parenAffiliation?: string;
  pastYear?: string;
}

// ---------------------------------------------------------------------------
// D. Sheet rows → raw people
// ---------------------------------------------------------------------------

export function rowsToRawPeople(
  table: string[][],
  warnings: string[],
): RawPerson[] {
  const people: RawPerson[] = [];
  let section: Section | null = null;

  for (const cells of table) {
    const a = (cells[0] ?? "").trim();
    const b = (cells[1] ?? "").trim();
    const c = (cells[2] ?? "").trim();

    if (!a && !b && !c) continue;

    const header = SECTION_HEADERS[fold(a).replace(/:$/, "")];
    if (header) {
      section = header;
      continue;
    }
    if (!section) continue;
    if (fold(a) === "nombre") continue; // column sub-header

    if (!a) continue;

    const { name: parsedName, paren } =
      section === "past" || section === "collaborators"
        ? splitParen(a)
        : { name: a, paren: undefined };

    const slugKey = slugify(parsedName);
    const alias = ALIASES[slugKey];
    const slug = alias?.slug ?? slugKey;
    const name = alias?.name ?? parsedName;

    let category: Person["category"];
    if (section === "pi") category = "pi";
    else if (section === "past") category = "past";
    else if (section === "collaborators") category = "visitors";
    else {
      category = staffCategory(b);
      if (b && category === "phd" && !/doctorand/.test(fold(b))) {
        warnings.push(`unknown research role "${b}" for ${slug} — defaulted to PhD`);
      }
    }

    people.push({
      slug,
      name,
      category,
      roleEs: section === "pi" || section === "researchStaff" ? b || undefined : undefined,
      teachingEs: section === "pi" || section === "researchStaff" ? c || undefined : undefined,
      parenAffiliation: section === "collaborators" ? paren : undefined,
      pastYear: section === "past" ? paren?.match(/\b(\d{4})\b/)?.[1] : undefined,
    });
  }

  return people;
}

// ---------------------------------------------------------------------------
// E. Raw person + enrichment → Person
// ---------------------------------------------------------------------------

export function assemble(
  raw: RawPerson,
  extra: PersonExtra | undefined,
  warnings: string[],
): Person {
  const e = extra ?? {};

  let role: { es: string; en: string };
  if (raw.category === "past") {
    const suffix = raw.pastYear ? ` (${raw.pastYear})` : "";
    role = {
      es: `Estudiante de licenciatura${suffix}`,
      en: `Undergraduate student${suffix}`,
    };
  } else if (raw.roleEs) {
    const es = raw.roleEs;
    const en = ROLE_EN[fold(es)] ?? e.role?.en ?? es;
    if (!ROLE_EN[fold(es)] && !e.role) {
      warnings.push(`unknown research role "${es}" for ${raw.slug} — used Spanish as English`);
    }
    role = { es, en };
  } else if (e.role) {
    role = e.role;
  } else {
    role = { es: "Investigador Visitante", en: "Visiting Researcher" };
  }

  let teaching_role: { es: string; en: string } | undefined;
  if (raw.teachingEs) {
    const mapped = TEACHING[fold(raw.teachingEs)];
    if (mapped) {
      teaching_role = mapped;
    } else {
      teaching_role = { es: raw.teachingEs, en: e.teaching_role?.en ?? raw.teachingEs };
      if (!e.teaching_role) {
        warnings.push(`unknown teaching role "${raw.teachingEs}" for ${raw.slug} — used Spanish as English`);
      }
    }
  } else if (e.teaching_role) {
    teaching_role = e.teaching_role;
  }

  const affiliation =
    e.affiliation ??
    (raw.parenAffiliation
      ? { es: raw.parenAffiliation, en: raw.parenAffiliation }
      : undefined);

  const stubBio = {
    es: `${raw.name}. Biografía a completar.`,
    en: `${raw.name}. Biography to be completed.`,
  };
  const stubInterests = [
    {
      es: "Líneas de investigación por completar",
      en: "Research interests to be completed",
    },
  ];

  return {
    slug: raw.slug,
    name: raw.name,
    role,
    category: raw.category,
    ...(e.photo ? { photo: e.photo } : {}),
    short_bio: e.short_bio ?? stubBio,
    full_bio: e.full_bio ?? stubBio,
    research_interests: e.research_interests ?? stubInterests,
    ...(e.inspirehep_id ? { inspirehep_id: e.inspirehep_id } : {}),
    ...(e.orcid_id ? { orcid_id: e.orcid_id } : {}),
    display_name_normalized: normalizeName(raw.name),
    contact: e.contact ?? {},
    social_links: e.social_links ?? [],
    ...(e.years ? { years: e.years } : {}),
    ...(e.thesis_topic ? { thesis_topic: e.thesis_topic } : {}),
    ...(e.current_position ? { current_position: e.current_position } : {}),
    ...(teaching_role ? { teaching_role } : {}),
    ...(affiliation ? { affiliation } : {}),
  } as Person;
}

// ---------------------------------------------------------------------------
// F. Fetch
// ---------------------------------------------------------------------------

async function fetchCsv(url: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const delay = 2000 * attempt;
      process.stderr.write(`  retry ${attempt}/2 in ${delay}ms\n`);
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/csv,*/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} ${res.statusText}`);
        continue;
      }
      return await res.text();
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `could not fetch the people sheet after 3 attempts: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`,
  );
}

// ---------------------------------------------------------------------------
// G. Main
// ---------------------------------------------------------------------------

function loadExtra(): Record<string, PersonExtra> {
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(EXTRA_PATH, "utf-8"));
  } catch (err) {
    throw new Error(
      `could not read content/people-extra.json: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const parsed = PeopleExtraSchema.safeParse(json);
  if (!parsed.success) {
    process.stderr.write("content/people-extra.json is invalid:\n");
    for (const issue of parsed.error.issues) {
      process.stderr.write(`  [${issue.path.join(".")}] ${issue.message}\n`);
    }
    throw new Error("people-extra.json failed validation");
  }
  return parsed.data;
}

async function main() {
  const warnings: string[] = [];
  const extra = loadExtra();

  if (isVerbose) process.stderr.write(`Fetching ${CSV_URL}\n`);
  const csv = await fetchCsv(CSV_URL);
  const rawPeople = rowsToRawPeople(parseCsv(csv), warnings);

  if (rawPeople.length === 0) {
    throw new Error("no people parsed from the sheet — aborting without writing");
  }

  const rosterSlugs = new Set(rawPeople.map((p) => p.slug));
  for (const slug of Object.keys(extra)) {
    if (!rosterSlugs.has(slug)) {
      warnings.push(`people-extra.json has "${slug}" but the sheet does not — enrichment unused`);
    }
  }

  const people = rawPeople.map((raw) => assemble(raw, extra[raw.slug], warnings));

  const parsed = PeopleSchema.safeParse(people);
  if (!parsed.success) {
    process.stderr.write("content/people.json would be invalid:\n");
    for (const issue of parsed.error.issues) {
      process.stderr.write(`  [${issue.path.join(".")}] ${issue.message}\n`);
    }
    throw new Error("schema validation failed — existing file left untouched");
  }

  for (const w of warnings) process.stderr.write(`Warning: ${w}\n`);

  const byCat = parsed.data.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const summary = `${parsed.data.length} people (${Object.entries(byCat)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ")})`;

  if (flags["dry-run"]) {
    process.stdout.write(`[dry-run] ${summary}\n`);
    return;
  }

  const json = JSON.stringify(parsed.data, null, 2) + "\n";
  let previous: string | null = null;
  try {
    previous = readFileSync(OUTPUT_PATH, "utf-8");
  } catch {
    /* first run */
  }
  if (previous === json) {
    process.stdout.write(`No changes — ${summary}\n`);
    return;
  }
  writeFileSync(OUTPUT_PATH, json, "utf-8");
  process.stdout.write(`Wrote content/people.json — ${summary}\n`);
}

// Guard: only run main() when executed directly (not when imported by Vitest).
if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(
      `\nsync-people failed: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  });
}

export { CSV_URL, DEFAULT_CSV_URL };
