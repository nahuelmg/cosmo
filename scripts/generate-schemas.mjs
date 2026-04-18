/**
 * JSON Schema generator — DATA-08
 *
 * Generates draft-07 JSON Schema files from Zod v4 schemas for VS Code IntelliSense.
 * Run manually after any change to src/content/schemas/*.ts:
 *   pnpm generate-schemas
 *
 * Why draft-07 (not the Zod v4 default 2020-12):
 * VS Code's JSON language server fully supports Drafts 4 through 7.
 * Draft 2020-12 has "limited support" — required-field highlighting breaks in practice.
 * RESEARCH.md Pitfall #2.
 *
 * The generated files are committed to the repo (not gitignored) so editors work
 * immediately after git clone without needing to regenerate.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as z from "zod";

import { PeopleSchema } from "../src/content/schemas/people.schema.ts";
import { PublicationsSchema } from "../src/content/schemas/publications.schema.ts";
import { ResearchSchema } from "../src/content/schemas/research.schema.ts";
import { JournalClubSchema } from "../src/content/schemas/journal-club.schema.ts";
import { OutreachSchema } from "../src/content/schemas/outreach.schema.ts";

const ROOT        = new URL("..", import.meta.url).pathname;
const CONTENT_DIR = join(ROOT, "content");

/**
 * Converts a Zod schema to a draft-07 JSON Schema and writes it to content/.
 * Sets the $schema URI explicitly so the file is portable to any draft-07-aware tool.
 */
function writeSchema(zodSchema, filename) {
  // z.toJSONSchema is Zod v4 native — no third-party package required.
  // target: "draft-07" downgrades from Zod v4's default (draft 2020-12).
  const jsonSchema = z.toJSONSchema(zodSchema, { target: "draft-07" });

  // $schema URI tells VS Code which validation semantics to apply.
  // Must be the draft-07 URI, not draft-2020-12.
  jsonSchema["$schema"] = "http://json-schema.org/draft-07/schema#";

  const outPath = join(CONTENT_DIR, filename);
  writeFileSync(outPath, JSON.stringify(jsonSchema, null, 2) + "\n", "utf-8");
  console.log(`  wrote ${filename}`);
}

console.log("Generating content JSON Schemas (draft-07 for VS Code compatibility)...");
writeSchema(PeopleSchema,       "people.schema.json");
writeSchema(PublicationsSchema, "publications.schema.json");
writeSchema(ResearchSchema,     "research.schema.json");
writeSchema(JournalClubSchema,  "journal-club.schema.json");
writeSchema(OutreachSchema,     "outreach.schema.json");
console.log("Done.");
