/**
 * Prebuild content validator — DATA-07
 *
 * Validates all 5 content JSON files against their Zod v4 schemas.
 * Runs as a prebuild hook via `node --import tsx/esm scripts/validate-content.mjs`.
 *
 * Error format (CONTEXT.md spec):
 *   file → JSON path → expected/received
 *   Multi-issue grouped by file.
 *
 * Photo-existence check is POST-parse (not inside Zod refine) per RESEARCH.md
 * Anti-Pattern #3 ("Zod .refine() for photo existence"):
 *   - Keeps the schema pure (no filesystem dependency)
 *   - Gives a clearly separate error category
 *   - fs.existsSync is fine in a synchronous prebuild script
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// tsx ESM loader (node --import tsx/esm) strips TypeScript types on the fly,
// so we can import .ts files directly from this .mjs script.
import { PeopleSchema } from "../src/content/schemas/people.schema.ts";
import {
  PublicationsFileSchema,
  PublicationsSchema,
} from "../src/content/schemas/publications.schema.ts";
import { ResearchSchema } from "../src/content/schemas/research.schema.ts";
import { JournalClubSchema } from "../src/content/schemas/journal-club.schema.ts";
import { OutreachSchema } from "../src/content/schemas/outreach.schema.ts";

// ---------------------------------------------------------------------------
// Path constants
// ---------------------------------------------------------------------------

const ROOT        = new URL("..", import.meta.url).pathname;
const CONTENT_DIR = join(ROOT, "content");
const PUBLIC_DIR  = join(ROOT, "public");

// ---------------------------------------------------------------------------
// JSON loader
// ---------------------------------------------------------------------------

function loadJSON(filename) {
  const full = join(CONTENT_DIR, filename);
  try {
    return JSON.parse(readFileSync(full, "utf-8"));
  } catch (e) {
    return { __loadError: `Could not parse ${filename} as JSON: ${e.message}` };
  }
}

// ---------------------------------------------------------------------------
// Error formatters — CONTEXT.md "Error message format"
// file → JSON path → expected/received, multi-issue grouped by file
// ---------------------------------------------------------------------------

/**
 * Converts a Zod issue path array to a human-readable JSON path string.
 *   []           → "(root)"
 *   [3, "photo"] → "[3].photo"
 *   [0, "role", "es"] → "[0].role.es"
 */
function formatPath(pathArr) {
  if (pathArr.length === 0) return "(root)";
  return pathArr.map((p) => (typeof p === "number" ? `[${p}]` : `.${p}`)).join("");
}

/**
 * Formats all Zod issues for a single file as a grouped block.
 * Format:
 *   \n  filename
 *   \n  └─ JSON path
 *   \n     message
 *   \n     Received: <value>   (if applicable)
 */
function formatZodError(filename, error) {
  const lines = [`\n  ${filename}`];
  for (const issue of error.issues) {
    lines.push(`  └─ ${formatPath(issue.path)}`);
    lines.push(`     ${issue.message}`);
    if ("received" in issue && issue.received !== undefined) {
      lines.push(`     Received: ${JSON.stringify(issue.received)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Formats a photo-existence error for a single person entry.
 * Kept separate from Zod errors so the error category is visually distinct.
 */
function formatPhotoError(filename, pathStr, relativePath) {
  return [
    ``,
    `  ${filename}`,
    `  └─ ${pathStr}`,
    `     Photo not found: public/${relativePath}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main validation
// ---------------------------------------------------------------------------

const errors = [];

const files = [
  { name: "people.json",       schema: PeopleSchema },
  { name: "publications.json", schema: PublicationsFileSchema },
  { name: "research.json",     schema: ResearchSchema },
  { name: "journal-club.json", schema: JournalClubSchema },
  { name: "outreach.json",     schema: OutreachSchema },
];

// 1. Schema validation — load + parse each file
for (const { name, schema } of files) {
  const raw = loadJSON(name);
  if (raw.__loadError) {
    errors.push(`\n  ${name}\n  └─ (parse)\n     ${raw.__loadError}`);
    continue;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    errors.push(formatZodError(name, result.error));
  }
}

// 2. Photo existence check for people.json
//    Post-parse so the people schema stays filesystem-free.
//    Uses the raw JSON (re-loaded) so this step runs even if people.json
//    passes schema validation with valid photo path strings.
const rawPeople = loadJSON("people.json");
if (Array.isArray(rawPeople)) {
  rawPeople.forEach((person, i) => {
    if (person && typeof person.photo === "string" && person.photo.length > 0) {
      const full = join(PUBLIC_DIR, person.photo);
      if (!existsSync(full)) {
        errors.push(formatPhotoError("people.json", `[${i}].photo`, person.photo));
      }
    }
  });
}

// 3. Report and exit
if (errors.length > 0) {
  console.error("\n\u2716 Content validation failed\n");
  for (const e of errors) console.error(e);
  console.error("");
  process.exit(1);
}

console.log("\u2714 Content validation passed (5 files, all entries parsed, all photos exist)");
process.exit(0);
