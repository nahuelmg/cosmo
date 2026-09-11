/**
 * sync-journal-club.ts
 *
 * CLI: pnpm sync-journal-club [--dry-run] [--verbose]
 *
 * Fetches the journal club session list from a published Google Sheet (CSV
 * export) and writes content/journal-club.json. The sheet is the single source
 * of truth — the JSON file is generated and must not be hand-edited.
 *
 * Sheet columns (header row, order-independent, accent/case-insensitive). The
 * source is a Google Form response sheet with English headers; the older
 * Spanish headers are still accepted so a legacy sheet keeps working:
 *   Date of the journal | Complete name | Academic position | Affiliation |
 *   Hour | Place/room | Title of the journal | Abstract | Links
 *   (legacy: Fecha | Speaker | Posición | Afiliación | Título | Resumen | Link | Notas)
 *
 * Header matching tolerates the drift a Google Form question picks up over
 * time: a parenthetical hint ("Links (format https://...)"), trailing
 * punctuation, or a slightly shortened wording still resolve to the same field
 * (see resolveHeader).
 *
 * The Google Forms "Timestamp" column (submission time, not the talk date) is
 * ignored. Dates are accepted as YYYY-MM-DD or M/D/YYYY (the en-US format
 * Google Forms writes) and normalized to YYYY-MM-DD. Times are accepted in
 * either 12-hour ("3:00:00 PM") or 24-hour ("14:30") form and always written
 * as 24-hour HH:MM. Rooms are always written with an "Aula" prefix.
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
import { parseCsv } from "./csv";
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

const SHEET_ID = "1fBfnMGPPQ_dgz-hdYmJDyuntg1rqRT2YiJADTo92vfA";
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
// "timestamp" is intentionally unmapped: it is the Google Forms submission time,
// not the date of the talk.
const HEADER_MAP: Record<string, keyof RawRow> = {
  // English Google Form sheet (current source)
  "date of the journal": "date",
  "complete name": "speaker",
  "academic position": "speaker_position",
  affiliation: "affiliation",
  hour: "start_time",
  "place/room": "location",
  "title of the journal": "title",
  abstract: "abstract",
  links: "paper_link",
  // Spanish sheet (legacy)
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
  start_time?: string;
  location?: string;
  title?: string;
  abstract?: string;
  paper_link?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// B. Field helpers
// ---------------------------------------------------------------------------

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();

/**
 * Sheet header label → session field.
 *
 * A Google Form question drifts: it gains a parenthetical hint ("Links (format
 * https://...)"), a trailing colon, or a word or two, without changing what the
 * column means. Fold the label, drop any parenthetical aside and trailing
 * punctuation, then fall back to a prefix match in either direction so a
 * lightly reworded question still maps to the same field. An ambiguous label
 * (one matching two different fields) is left unmapped.
 */
export function resolveHeader(label: string): keyof RawRow | undefined {
  const cleaned = fold(label)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[\s:.*]+$/g, "")
    .trim();
  if (!cleaned) return undefined;

  const exact = HEADER_MAP[cleaned];
  if (exact) return exact;

  const matches = Object.keys(HEADER_MAP).filter(
    (key) => key.startsWith(cleaned) || cleaned.startsWith(key),
  );
  const fields = new Set(matches.map((key) => HEADER_MAP[key]));
  return fields.size === 1 ? HEADER_MAP[matches[0]] : undefined;
}

export function slugify(name: string): string {
  return fold(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function deriveStatus(date: string, today: string): "upcoming" | "past" {
  return date >= today ? "upcoming" : "past";
}

/**
 * Accepts an ISO `YYYY-MM-DD` date or the en-US `M/D/YYYY` form Google Forms
 * writes, and returns it as `YYYY-MM-DD`. Returns null for anything else.
 */
export function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const [, m, d, y] = us;
    const mm = m.padStart(2, "0");
    const dd = d.padStart(2, "0");
    if (Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31) {
      return `${y}-${mm}-${dd}`;
    }
  }
  return null;
}

/**
 * Normalizes a talk time to 24-hour `HH:MM`, which is what the site displays.
 *
 * A Google Forms time field is written in whatever format the responder's
 * locale uses, so the same column mixes `14:30`, `3:00:00 PM` and `3:00 p. m.`.
 * Accepts an optional seconds part (dropped) and an optional AM/PM marker in
 * its English or Spanish spelling. Returns null for anything else.
 */
export function normalizeTime(raw: string): string | null {
  const cleaned = fold(raw).replace(/[\s\u00a0]+/g, " ").trim();
  const m = cleaned.match(
    /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(a\.? ?m\.?|p\.? ?m\.?)?$/,
  );
  if (!m) return null;

  let h = Number(m[1]);
  const min = Number(m[2] ?? "0");
  if (min > 59) return null;

  const meridiem = m[3]?.[0]; // "a" or "p"
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    if (meridiem === "p" && h !== 12) h += 12;
    if (meridiem === "a" && h === 12) h = 0;
  } else if (h > 23) {
    return null;
  }

  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Rooms are written into the sheet either bare ("Federman") or already
 * qualified ("Aula Federman"). The site always shows the qualified form, so add
 * the prefix only when it is not there already.
 */
export function normalizeLocation(raw: string): string {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value || /^aulas?\b/.test(fold(value))) return value;
  return `Aula ${value}`;
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
  const columns = headerRow.map((h) => resolveHeader(h));
  if (!columns.includes("date") || !columns.includes("speaker") || !columns.includes("title")) {
    throw new Error(
      `sheet header is missing a required column (need a date, speaker, and title ` +
        `column — e.g. "Date of the journal", "Complete name", "Title of the journal"). ` +
        `Got: ${headerRow.join(", ")}`,
    );
  }

  const sessions: JournalClubSession[] = [];
  const usedIds = new Map<string, number>();

  for (const cells of dataRows) {
    const raw: RawRow = {};
    columns.forEach((field, idx) => {
      if (!field) return;
      const value = (cells[idx] ?? "").trim();
      if (value) raw[field] = value;
    });

    // Fully blank spreadsheet line — skip silently.
    if (!raw.date && !raw.speaker && !raw.title) continue;

    const date = raw.date ? normalizeDate(raw.date) : null;
    if (!date) {
      warnings.push(
        `skipped row: missing or malformed date (${raw.speaker ?? raw.title ?? "?"})`,
      );
      continue;
    }
    if (!raw.speaker || !raw.title) {
      warnings.push(`skipped ${date}: missing speaker or title`);
      continue;
    }

    let paperLink = raw.paper_link;
    if (paperLink && !/^https?:\/\//i.test(paperLink)) {
      warnings.push(`${date}: Link is not a URL, dropped ("${paperLink}")`);
      paperLink = undefined;
    }

    let startTime: string | undefined;
    if (raw.start_time) {
      const normalized = normalizeTime(raw.start_time);
      if (normalized) startTime = normalized;
      else warnings.push(`${date}: Hour "${raw.start_time}" is not a readable time, dropped`);
    }

    const status = deriveStatus(date, today);

    let id = `${date}-${slugify(raw.speaker)}`;
    const seen = usedIds.get(id) ?? 0;
    usedIds.set(id, seen + 1);
    if (seen > 0) id = `${id}-${seen + 1}`;

    const session: JournalClubSession = {
      id,
      date,
      status,
      speaker: raw.speaker,
      title: raw.title,
      ...(raw.speaker_position ? { speaker_position: raw.speaker_position } : {}),
      ...(raw.affiliation ? { affiliation: raw.affiliation } : {}),
      ...(startTime ? { start_time: startTime } : {}),
      ...(raw.location ? { location: normalizeLocation(raw.location) } : {}),
      ...(raw.abstract ? { abstract: raw.abstract } : {}),
      ...(paperLink ? { paper_link: paperLink } : {}),
      ...(raw.notes ? { notes: raw.notes } : {}),
      ...(status === "past" ? { academic_year: deriveAcademicYear(date) } : {}),
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

  // An empty sheet is a legitimate state, not a failure: the season may simply
  // not have been loaded yet. Write an empty list so the page can show its
  // "coming soon" placeholder. A malformed sheet still throws in rowsToSessions
  // (missing header columns) and leaves the existing file untouched.
  if (sessions.length === 0) {
    warnings.push("the sheet has no valid sessions — writing an empty list");
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
