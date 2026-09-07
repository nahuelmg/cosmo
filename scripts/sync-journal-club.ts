/**
 * sync-journal-club.ts
 *
 * CLI: pnpm sync-journal-club [--dry-run] [--verbose]
 *
 * Fetches the journal club session list from a published Google Sheet (CSV
 * export) and writes content/journal-club.json. The sheet is the single source
 * of truth — the JSON file is generated and must not be hand-edited.
 *
 * Sheet columns (header row, order-independent, accent/case-insensitive):
 *   Fecha | Speaker | Posición | Afiliación | Título | Resumen | Link | Notas
 *
 * Derived (not in the sheet):
 *   id            = `${date}-${speaker-slug}` (with a numeric suffix on collision)
 *   status        = "upcoming" when date >= today (UTC), else "past"
 *   academic_year = "YYYY-YYYY" season, only attached to past sessions
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
  JournalClubSchema,
  type JournalClubSession,
} from "../src/content/schemas/journal-club.schema";

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

const SHEET_ID = "1DOgFAP-e_aqOvQzkT5js0dVySqL6EHEyLApjMniQX3M";
const DEFAULT_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const CSV_URL = process.env.JOURNAL_CLUB_SHEET_CSV_URL || DEFAULT_CSV_URL;

const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "cosmo-sync/1.0 (academic group site; journal-club sheet sync)";
const OUTPUT_PATH = resolve(__dirname, "../content/journal-club.json");

// Argentine journal-club season: the second semester (from August) of year Y
// runs through the first semester of Y+1, e.g. a session in Sep 2024 or Apr 2025
// both belong to the "2024-2025" season.
const SEASON_START_MONTH = 8;

// Header label (accent/case-folded) → session field.
const HEADER_MAP: Record<string, keyof RawRow> = {
  fecha: "date",
  speaker: "speaker",
  posicion: "speaker_position",
  afiliacion: "affiliation",
  titulo: "title",
  resumen: "abstract",
  link: "paper_link",
  notas: "notes",
};

interface RawRow {
  date?: string;
  speaker?: string;
  speaker_position?: string;
  affiliation?: string;
  title?: string;
  abstract?: string;
  paper_link?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// B. CSV parsing (RFC 4180: quoted fields, "" escapes, embedded commas/newlines)
// ---------------------------------------------------------------------------

export function parseCsv(input: string): string[][] {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  // trailing field / row when the file has no final newline
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// C. Field helpers
// ---------------------------------------------------------------------------

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();

export function slugify(name: string): string {
  return fold(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function deriveStatus(date: string, today: string): "upcoming" | "past" {
  return date >= today ? "upcoming" : "past";
}

export function deriveAcademicYear(date: string): string {
  const [y, m] = date.split("-").map(Number);
  return m >= SEASON_START_MONTH ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

// ---------------------------------------------------------------------------
// D. Sheet rows → sessions
// ---------------------------------------------------------------------------

export function rowsToSessions(
  table: string[][],
  today: string,
  warnings: string[],
): JournalClubSession[] {
  if (table.length === 0) return [];

  const [headerRow, ...dataRows] = table;
  const columns = headerRow.map((h) => HEADER_MAP[fold(h)]);
  if (!columns.includes("date") || !columns.includes("speaker") || !columns.includes("title")) {
    throw new Error(
      `sheet header is missing a required column (need Fecha, Speaker, Título). Got: ${headerRow.join(", ")}`,
    );
  }

  const sessions: JournalClubSession[] = [];
  const usedIds = new Map<string, number>();
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  for (const cells of dataRows) {
    const raw: RawRow = {};
    columns.forEach((field, idx) => {
      if (!field) return;
      const value = (cells[idx] ?? "").trim();
      if (value) raw[field] = value;
    });

    // Fully blank spreadsheet line — skip silently.
    if (!raw.date && !raw.speaker && !raw.title) continue;

    if (!raw.date || !DATE_RE.test(raw.date)) {
      warnings.push(`skipped row: missing or malformed Fecha (${raw.speaker ?? raw.title ?? "?"})`);
      continue;
    }
    if (!raw.speaker || !raw.title) {
      warnings.push(`skipped ${raw.date}: missing Speaker or Título`);
      continue;
    }

    let paperLink = raw.paper_link;
    if (paperLink && !/^https?:\/\//i.test(paperLink)) {
      warnings.push(`${raw.date}: Link is not a URL, dropped ("${paperLink}")`);
      paperLink = undefined;
    }

    const status = deriveStatus(raw.date, today);

    let id = `${raw.date}-${slugify(raw.speaker)}`;
    const seen = usedIds.get(id) ?? 0;
    usedIds.set(id, seen + 1);
    if (seen > 0) id = `${id}-${seen + 1}`;

    const session: JournalClubSession = {
      id,
      date: raw.date,
      status,
      speaker: raw.speaker,
      title: raw.title,
      ...(raw.speaker_position ? { speaker_position: raw.speaker_position } : {}),
      ...(raw.affiliation ? { affiliation: raw.affiliation } : {}),
      ...(raw.abstract ? { abstract: raw.abstract } : {}),
      ...(paperLink ? { paper_link: paperLink } : {}),
      ...(raw.notes ? { notes: raw.notes } : {}),
      ...(status === "past" ? { academic_year: deriveAcademicYear(raw.date) } : {}),
    };
    sessions.push(session);
  }

  // Newest first — accessors re-sort, but a readable file helps review.
  sessions.sort((a, b) => b.date.localeCompare(a.date));
  return sessions;
}

// ---------------------------------------------------------------------------
// E. Fetch
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
    `could not fetch the journal-club sheet after 3 attempts: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`,
  );
}

// ---------------------------------------------------------------------------
// F. Main
// ---------------------------------------------------------------------------

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const warnings: string[] = [];

  if (isVerbose) process.stderr.write(`Fetching ${CSV_URL}\n`);
  const csv = await fetchCsv(CSV_URL);

  const table = parseCsv(csv);
  const sessions = rowsToSessions(table, today, warnings);

  if (sessions.length === 0) {
    throw new Error("no valid sessions parsed from the sheet — aborting without writing");
  }

  // Validate BEFORE writing — a bad sheet must not corrupt the site.
  const parsed = JournalClubSchema.safeParse(sessions);
  if (!parsed.success) {
    process.stderr.write("journal-club.json would be invalid:\n");
    for (const issue of parsed.error.issues) {
      process.stderr.write(`  [${issue.path.join(".")}] ${issue.message}\n`);
    }
    throw new Error("schema validation failed — existing file left untouched");
  }

  const upcoming = sessions.filter((s) => s.status === "upcoming").length;
  const past = sessions.length - upcoming;
  const summary = `${sessions.length} sessions (${upcoming} upcoming, ${past} past)`;

  for (const w of warnings) process.stderr.write(`Warning: ${w}\n`);

  if (flags["dry-run"]) {
    process.stdout.write(`[dry-run] ${summary}\n`);
    return;
  }

  const json = JSON.stringify(parsed.data, null, 2) + "\n";
  const previous = safeRead(OUTPUT_PATH);
  if (previous === json) {
    process.stdout.write(`No changes — ${summary}\n`);
    return;
  }
  writeFileSync(OUTPUT_PATH, json, "utf-8");
  process.stdout.write(`Wrote content/journal-club.json — ${summary}\n`);
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
      `\nsync-journal-club failed: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  });
}

export { CSV_URL, DEFAULT_CSV_URL };
