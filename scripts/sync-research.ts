/**
 * sync-research.ts
 *
 * CLI: pnpm sync-research [--dry-run] [--verbose]
 *
 * Run by hand, unlike the publications / journal club / people syncs: the
 * research section is updated on request, not on a schedule, so there is no
 * GitHub Actions workflow for it.
 *
 * Fetches the research areas from the group's Google Doc (plain-text export)
 * and writes content/research.json. The document is the source of truth for
 * the Spanish text and for the order of the areas — the JSON file is generated
 * and must not be hand-edited for those fields.
 *
 * Document shape — each area is a title line followed by two labelled blocks:
 *
 *   Ondas Gravitacionales
 *   Mini resumen:
 *   <one short paragraph>
 *   Explicación:
 *   <one or more paragraphs>
 *
 * A line is read as a title when the next non-empty line is the "Mini resumen"
 * marker, so a title is recognized by its position rather than by how it is
 * punctuated. Marker labels are matched accent- and case-insensitively, with
 * a couple of common wordings accepted (see MARKERS).
 *
 * Kept from the existing JSON, because the document cannot express them:
 *   id     — kebab-case key, also the anchor on the research page
 *   icon   — Lucide icon name
 *   image  — optional hero image
 *   title / short_description / full_description in English
 *
 * English follows the Spanish. The stored Spanish is the previous document
 * text, so a difference means somebody edited the document: the English
 * translation is then stale, and the sync mirrors the new Spanish into both
 * languages and warns, rather than leaving the English page showing text that
 * no longer matches. Translate it back afterwards and the sync leaves it be.
 *
 * An area in the document with no counterpart in the JSON is added with an id
 * derived from its title and no icon; an area that disappears from the
 * document is dropped. Both are warned about. An empty document is an error,
 * not a valid state — the existing file is kept.
 * Blank blocks retain existing bilingual text with a warning. Incomplete new
 * areas abort the sync rather than publishing empty content.
 *
 * Rules (mirrors sync-publications.ts):
 *  - Relative imports only — no @/ alias (tsx CJS mode)
 *  - No top-level await — use async function main()
 *  - AbortSignal.timeout on every fetch
 *  - Validate BEFORE writing; on any failure keep the existing file and exit 1
 */

import { parseArgs } from "node:util";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ResearchSchema,
  type ResearchArea,
} from "../src/content/schemas/research.schema";

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

const DOC_ID = "1GdMShbn3RJ-yNmXC70-7xGm-9TL-Q__v429kqLTL2P4";
const DEFAULT_DOC_URL = `https://docs.google.com/document/d/${DOC_ID}/export?format=txt`;
const DOC_URL = process.env.RESEARCH_DOC_TXT_URL || DEFAULT_DOC_URL;

const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT = "cosmo-sync/1.0 (academic group site; research doc sync)";
const OUTPUT_PATH = resolve(__dirname, "../content/research.json");

/** Labels that open each block, folded. */
const MARKERS = {
  short: ["mini resumen", "resumen", "mini-resumen"],
  full: ["explicacion", "explicacion larga", "descripcion", "descripcion larga"],
} as const;

// ---------------------------------------------------------------------------
// B. Helpers
// ---------------------------------------------------------------------------

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();

export function slugify(title: string): string {
  return fold(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Which block a line opens, or null when the line is ordinary text. */
export function markerKind(line: string): "short" | "full" | null {
  const label = fold(line).replace(/[\s:.*]+$/g, "");
  if (MARKERS.short.includes(label as (typeof MARKERS.short)[number])) return "short";
  if (MARKERS.full.includes(label as (typeof MARKERS.full)[number])) return "full";
  return null;
}

export interface DocArea {
  title: string;
  short: string;
  full: string;
}

// ---------------------------------------------------------------------------
// C. Document → areas
// ---------------------------------------------------------------------------

/**
 * Parses the plain-text export into areas, in document order.
 *
 * Titles are found by lookahead: a line whose next non-empty line is the
 * "Mini resumen" marker. Paragraphs inside a block are joined with a blank
 * line, which is how the JSON stores them.
 */
export function parseDoc(text: string, warnings: string[]): DocArea[] {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const areas: DocArea[] = [];
  let current: { title: string; short: string[]; full: string[] } | null = null;
  let block: "short" | "full" | null = null;

  const flush = () => {
    if (!current) return;
    if (current.short.length === 0 || current.full.length === 0) {
      warnings.push(
        `"${current.title}" is missing its ${
          current.short.length === 0 ? "Mini resumen" : "Explicación"
        } — existing text will be retained if available`,
      );
    }
    areas.push({
        title: current.title,
        short: current.short.join(" "),
        full: current.full.join("\n\n"),
    });
    current = null;
    block = null;
  };

  lines.forEach((line, i) => {
    const kind = markerKind(line);
    if (kind) {
      block = kind;
      return;
    }

    const next = lines[i + 1];
    const startsArea = next !== undefined && markerKind(next) === "short";
    if (startsArea) {
      flush();
      current = { title: line, short: [], full: [] };
      return;
    }

    if (!current || !block) {
      warnings.push(`ignored stray line: "${line.slice(0, 60)}"`);
      return;
    }
    current[block].push(line);
  });
  flush();

  return areas;
}

// ---------------------------------------------------------------------------
// D. Areas → content
// ---------------------------------------------------------------------------

/**
 * Merges the document into the existing areas: the document supplies order and
 * Spanish, the existing entry supplies id, icon, image and English.
 */
export function mergeAreas(
  doc: DocArea[],
  existing: ResearchArea[],
  warnings: string[],
): ResearchArea[] {
  const byTitle = new Map(existing.map((a) => [fold(a.title.es), a]));
  const usedIds = new Set<string>();
  const matched = new Set<string>();

  const merged = doc.map((area, order) => {
    // The document renamed this area; retain its public anchor and icon.
    const prev = byTitle.get(fold(area.title)) ??
      (fold(area.title) === "pulsares"
        ? existing.find((a) => a.id === "binary-pulsars")
        : undefined);
    if (prev) matched.add(prev.id);

    if (!prev && (!area.short || !area.full)) {
      throw new Error(`"${area.title}" is new but incomplete — existing file left untouched`);
    }
    const short = area.short || prev!.short_description.es;
    const full = area.full || prev!.full_description.es;
    if (!area.short || !area.full) {
      warnings.push(`"${area.title}" has blank blocks — retained existing text for those blocks`);
    }

    let id = prev?.id;
    if (!id) {
      id = slugify(area.title);
      let n = 2;
      while (usedIds.has(id)) id = `${slugify(area.title)}-${n++}`;
      warnings.push(
        `"${area.title}" is new — added as "${id}" with no icon, and its English text mirrors the Spanish`,
      );
    }
    usedIds.add(id);

    // English follows the Spanish: a changed Spanish text means the stored
    // translation describes something else now.
    const shortEn =
      prev && prev.short_description.es === short
        ? prev.short_description.en
        : short;
    const fullEn =
      prev && prev.full_description.es === full
        ? prev.full_description.en
        : full;
    const edited =
      prev &&
      (prev.title.es !== area.title || prev.short_description.es !== short ||
        prev.full_description.es !== full);
    if (edited) {
      warnings.push(
        `"${area.title}" changed in the document — English mirrors the Spanish until it is translated`,
      );
    }

    return {
      id,
      title: { es: area.title, en: prev?.title.es === area.title ? prev.title.en : area.title },
      short_description: { es: short, en: shortEn },
      full_description: { es: full, en: fullEn },
      ...(prev?.icon ? { icon: prev.icon } : {}),
      ...(prev?.image ? { image: prev.image } : {}),
      order,
    } satisfies ResearchArea;
  });

  for (const a of existing) {
    if (!matched.has(a.id)) {
      warnings.push(`"${a.title.es}" is no longer in the document — dropped`);
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// E. Fetch
// ---------------------------------------------------------------------------

async function fetchDoc(url: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const delay = 2000 * attempt;
      process.stderr.write(`  retry ${attempt}/2 in ${delay}ms\n`);
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/plain,*/*" },
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
    `could not fetch the research document after 3 attempts: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`,
  );
}

// ---------------------------------------------------------------------------
// F. Main
// ---------------------------------------------------------------------------

function loadExisting(): ResearchArea[] {
  const parsed = ResearchSchema.safeParse(JSON.parse(readFileSync(OUTPUT_PATH, "utf-8")));
  if (!parsed.success) {
    throw new Error("content/research.json is invalid — fix it before syncing");
  }
  return [...parsed.data].sort((a, b) => a.order - b.order);
}

async function main() {
  const warnings: string[] = [];

  if (isVerbose) process.stderr.write(`Fetching ${DOC_URL}\n`);
  const text = await fetchDoc(DOC_URL);

  const docAreas = parseDoc(text, warnings);
  // An empty document is a broken export or a permissions change, never a real
  // state of the research section: keep whatever is on disk.
  if (docAreas.length === 0) {
    for (const w of warnings) process.stderr.write(`Warning: ${w}\n`);
    throw new Error(
      "the document has no research areas — check that it is shared with anyone holding the link",
    );
  }

  const areas = mergeAreas(docAreas, loadExisting(), warnings);

  // Validate BEFORE writing — a malformed document must not corrupt the site.
  const parsed = ResearchSchema.safeParse(areas);
  if (!parsed.success) {
    process.stderr.write("research.json would be invalid:\n");
    for (const issue of parsed.error.issues) {
      process.stderr.write(`  [${issue.path.join(".")}] ${issue.message}\n`);
    }
    throw new Error("schema validation failed — existing file left untouched");
  }

  const summary = `${areas.length} research areas`;
  for (const w of warnings) process.stderr.write(`Warning: ${w}\n`);

  if (flags["dry-run"]) {
    process.stdout.write(`[dry-run] ${summary}\n`);
    return;
  }

  const json = JSON.stringify(parsed.data, null, 2) + "\n";
  if (safeRead(OUTPUT_PATH) === json) {
    process.stdout.write(`No changes — ${summary}\n`);
    return;
  }
  writeFileSync(OUTPUT_PATH, json, "utf-8");
  process.stdout.write(`Wrote content/research.json — ${summary}\n`);
}

function safeRead(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

// Guard: only run main() when executed directly (not when imported by Vitest).
if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(
      `\nsync-research failed: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  });
}

export { DOC_URL, DEFAULT_DOC_URL };
