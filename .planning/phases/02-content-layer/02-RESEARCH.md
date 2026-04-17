# Phase 2: Content Layer - Research

**Researched:** 2026-04-17
**Domain:** Zod v4 schema validation, JSON content layer, Next.js App Router SSG, next-intl 4 locale accessors
**Confidence:** HIGH (primary findings from official docs + npm); MEDIUM for build-integration patterns

---

## Summary

Phase 2 adds a Zod-validated JSON content layer to the existing Next.js 16 + next-intl 4 project. The five content types (people, publications, research, journal-club, outreach) live as flat JSON arrays at `content/*.json`. Each file has a neighbouring `*.schema.json` generated from Zod for VS Code IntelliSense. Typed accessors in `src/content/` statically import and parse JSON at module-load time so pages get pre-resolved data with zero per-request overhead.

**Zod v4 is the correct choice** — it is stable on npm (current release 4.3.x), ships `z.toJSONSchema()` natively (making `zod-to-json-schema` obsolete), replaces `.strict()` with `z.strictObject()`, and produces significantly faster parsing. The `zod-to-json-schema` third-party library is no longer actively maintained and explicitly defers to Zod v4's built-in method.

Build-time validation belongs in a `prebuild` npm script (a Node script that imports schemas, parses all JSON, then exits 0 or 1). This is more reliable than `next.config.ts` side-effects and gives a clear, separate failure surface before Turbopack/webpack touches any code.

**Primary recommendation:** Install `zod@^4`, use `z.strictObject()` everywhere, generate `*.schema.json` with `z.toJSONSchema({ target: "draft-07" })`, wire VS Code via `.vscode/settings.json` json.schemas, and run `node scripts/validate-content.mjs` as `prebuild`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^4.3.x | Schema definition + runtime validation + JSON Schema generation | Single-package solution: defines TS types AND runtime guards AND generates JSON Schema; v4 is stable on npm as of 2025-08 |
| Node.js fs (built-in) | 20+ | Photo-existence check in prebuild script | No extra dep; `fs.existsSync` is synchronous and safe in Node scripts |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none required) | — | — | Zod v4 covers validation + JSON Schema generation natively |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zod v4 | zod v3 | v3 still works but requires `zod-to-json-schema` (abandoned), slower parsing, older API (.strict() method vs z.strictObject()) |
| zod v4 | valibot | Smaller bundle but lacks first-party JSON Schema output; ecosystem smaller |
| z.toJSONSchema() | zod-to-json-schema | zod-to-json-schema no longer actively maintained; author recommends Zod v4 native method |
| prebuild script | next.config.ts side-effect | next.config.ts runs inside Next.js/Turbopack and FS calls there have edge-case behaviour; prebuild is explicit and separate |

### Installation

```bash
pnpm add zod@^4
```

No other packages required. Zod v4 ships JSON Schema generation built-in.

---

## Architecture Patterns

### Recommended Project Structure

```
content/
├── people.json                  # DATA-01 array of person objects
├── people.schema.json           # Generated from Zod (for VS Code)
├── publications.json            # DATA-02
├── publications.schema.json
├── research.json                # DATA-03
├── research.schema.json
├── journal-club.json            # DATA-04
├── journal-club.schema.json
├── outreach.json                # DATA-05
└── outreach.schema.json

src/
├── config/
│   └── site.ts                  # DATA-06 typed site config
├── content/
│   ├── schemas/
│   │   ├── shared.ts            # bilingualString(), safeString(), photoRef()
│   │   ├── people.schema.ts
│   │   ├── publications.schema.ts
│   │   ├── research.schema.ts
│   │   ├── journal-club.schema.ts
│   │   └── outreach.schema.ts
│   ├── accessors/
│   │   ├── people.ts
│   │   ├── publications.ts
│   │   ├── research.ts
│   │   ├── journal-club.ts
│   │   └── outreach.ts
│   └── index.ts                 # Re-exports all accessors
│
scripts/
├── validate-content.mjs         # Node script: parse + photo check + smart-quote check
└── generate-schemas.mjs         # Node script: write *.schema.json files

.vscode/
└── settings.json                # json.schemas wiring for VS Code IntelliSense
```

### Pattern 1: Bilingual Field Helper

All user-visible text uses a shared `bilingualString()` helper. Both locales required; missing either fails build.

```typescript
// src/content/schemas/shared.ts
import * as z from "zod";

const SMART_QUOTES = /[\u201C\u201D\u2018\u2019]/;

/**
 * Prose string: rejects smart quotes.
 * Use for bios, descriptions — any content maintainers paste from Word/Docs.
 */
export const proseString = (label: string) =>
  z.string().min(1).refine(
    (val) => !SMART_QUOTES.test(val),
    { error: `${label}: smart quotes detected — use straight quotes (" or ')` }
  );

/**
 * Bilingual prose field: { es, en }, both required, both prose-validated.
 * Use for bios, research descriptions, outreach descriptions, roles.
 */
export const bilingualString = (label: string) =>
  z.strictObject({
    es: proseString(`${label}.es`),
    en: proseString(`${label}.en`),
  });

/**
 * Canonical string: no smart-quote check. For paper titles, author names,
 * journal names — stays in paper's original language.
 */
export const canonicalString = z.string().min(1);

/**
 * Optional photo path. Empty string or absent → no photo (renders blank state).
 * Actual file-existence check is in the prebuild script (not in Zod refine).
 */
export const optionalPhoto = z.string().optional().default("");
```

**Smart-quote false-positive analysis:**
- Regex `[\u201C\u201D\u2018\u2019]` targets curly double-quotes and curly single-quotes only.
- Straight apostrophe `'` (U+0027) and straight single-quote `'` are NOT caught — correct.
- Accented characters (á, é, ñ, ü) are NOT caught — correct, Latin extended range is unrelated to these code points.
- Spanish text with apostrophes in names (e.g. D'Angelo): not caught — correct.
- Only risk: intentional typographic quotes in prose. Since the policy is strict ("fail build"), this is correct behaviour.

### Pattern 2: Strict Object Schemas (Zod v4 API)

Zod v4 replaces the `.strict()` method with the `z.strictObject()` top-level function. The old `.strict()` still works but is deprecated. Use `z.strictObject()` for all content schemas so unknown fields (e.g. typo `affilation`) fail the build.

```typescript
// src/content/schemas/people.schema.ts
import * as z from "zod";
import { bilingualString, proseString, optionalPhoto, canonicalString } from "./shared";

const SocialLinkSchema = z.strictObject({
  platform: z.enum(["twitter", "linkedin", "github", "orcid", "scholar", "website"]),
  url: z.url(),
});

const PersonSchema = z.strictObject({
  slug:               z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  name:               canonicalString,
  role:               bilingualString("role"),          // "PhD Student" / "Estudiante de Doctorado"
  category:           z.enum(["pi", "postdoc", "phd", "undergrad", "past"]),
  photo:              optionalPhoto,
  short_bio:          bilingualString("short_bio"),
  full_bio:           bilingualString("full_bio"),
  research_interests: z.array(bilingualString("research_interest")).min(1),
  publications_selected: z.array(z.string()).optional().default([]), // pub IDs
  contact:            z.strictObject({
    email:  z.email().optional(),
    orcid:  z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, "ORCID format: 0000-0000-0000-0000").optional(),
  }),
  social_links:       z.array(SocialLinkSchema).optional().default([]),
});

// Array-level schema with uniqueness enforcement
export const PeopleSchema = z.array(PersonSchema).superRefine((people, ctx) => {
  const slugs = people.map((p) => p.slug);
  const seen = new Set<string>();
  slugs.forEach((slug, i) => {
    if (seen.has(slug)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate slug "${slug}" at index ${i}`,
        path: [i, "slug"],
        input: slug,
      });
    }
    seen.add(slug);
  });
});

export type Person = z.infer<typeof PersonSchema>;
export type People = z.infer<typeof PeopleSchema>;
```

### Pattern 3: Static Import + Parse at Module Load (Zero Per-Request Work)

With `resolveJsonModule: true` (already in tsconfig), TypeScript can statically import JSON. The accessor module parses with Zod once at import time. Next.js App Router SSG sees the parsed result as static at build time.

```typescript
// src/content/accessors/people.ts
import rawPeople from "../../../content/people.json";
import { PeopleSchema, type Person } from "../schemas/people.schema";

// Parse once at module load. If invalid, build fails here.
const people = PeopleSchema.parse(rawPeople);

export function getPeople(): Person[] {
  return people;
}

export function getPeopleByCategory(category: Person["category"]): Person[] {
  return people.filter((p) => p.category === category);
}

export function getPersonBySlug(slug: string): Person | undefined {
  return people.find((p) => p.slug === slug);
}
```

**Why static import over dynamic `await import()`:**
- Static import is resolved at build time by Next.js/Turbopack — zero per-request overhead.
- Dynamic `await import()` would cause per-request evaluation in Server Components (defeats PERF-01).
- `resolveJsonModule: true` is already set in this project's tsconfig.
- The parse result is a module-level constant — effectively a compile-time cache.

### Pattern 4: Locale-Resolved Accessors (next-intl 4 Integration)

Server Components in App Router call `getLocale()` from `next-intl/server`. Pass this to accessors to resolve bilingual fields.

```typescript
// src/content/accessors/people.ts (extended)

type Locale = "es" | "en";

/** Resolve a bilingual field to a plain string for the given locale. */
export function localize(field: { es: string; en: string }, locale: Locale): string {
  return field[locale];
}

/** Return a person with all bilingual fields resolved for the given locale. */
export function getLocalizedPerson(slug: string, locale: Locale) {
  const person = getPersonBySlug(slug);
  if (!person) return undefined;
  return {
    ...person,
    role:               localize(person.role, locale),
    short_bio:          localize(person.short_bio, locale),
    full_bio:           localize(person.full_bio, locale),
    research_interests: person.research_interests.map((ri) => localize(ri, locale)),
  };
}
```

**Usage in an async Server Component:**
```typescript
// src/app/[locale]/personas/[slug]/page.tsx
import { getLocale } from "next-intl/server";
import { getLocalizedPerson } from "@/content/accessors/people";

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale(); // reads from next-intl request context
  const person = getLocalizedPerson(slug, locale as "es" | "en");
  // ...
}
```

**`getLocale()` vs passing locale from params:**
- `getLocale()` reads from the next-intl store set by `setRequestLocale` (called in locale layout). This is the idiomatic pattern — locale is available without threading it through every prop.
- Alternative: extract `locale` from `params` and pass explicitly. Both work; `getLocale()` is cleaner for deeply nested components.
- For SSG, `setRequestLocale` must have been called higher in the tree (the locale layout already does this from Phase 1).

### Pattern 5: Prebuild Validation Script

```javascript
// scripts/validate-content.mjs
import { existsSync } from "fs";
import { join } from "path";
import { readFileSync } from "fs";
import * as z from "zod";

// Import all schemas (these are .mjs-friendly re-exports or use ts-node/tsx)
// In practice: run with `node --import tsx/esm scripts/validate-content.mjs`

const CONTENT_DIR = new URL("../content/", import.meta.url).pathname;
const PUBLIC_DIR = new URL("../public/", import.meta.url).pathname;

function loadJSON(filename) {
  return JSON.parse(readFileSync(join(CONTENT_DIR, filename), "utf-8"));
}

function formatZodError(error, filename) {
  const lines = [`\n  ${filename}`];
  for (const issue of error.issues) {
    const path = issue.path.length > 0
      ? issue.path.map((p) => (typeof p === "number" ? `[${p}]` : `.${p}`)).join("")
      : "(root)";
    lines.push(`  └─ ${path}`);
    lines.push(`     ${issue.message}`);
    if (issue.received !== undefined) lines.push(`     Received: ${JSON.stringify(issue.received)}`);
  }
  return lines.join("\n");
}

function checkPhotoExists(relativePath, filename, jsonPath) {
  if (!relativePath) return null; // optional field absent — ok
  const fullPath = join(PUBLIC_DIR, relativePath);
  if (!existsSync(fullPath)) {
    return `  ${filename}\n  └─ ${jsonPath}\n     Photo not found: public/${relativePath}`;
  }
  return null;
}

let failed = false;
const errors = [];

// --- Validate each content file ---
const files = [
  { name: "people.json", schema: PeopleSchema },
  { name: "publications.json", schema: PublicationsSchema },
  { name: "research.json", schema: ResearchSchema },
  { name: "journal-club.json", schema: JournalClubSchema },
  { name: "outreach.json", schema: OutreachSchema },
];

for (const { name, schema } of files) {
  const raw = loadJSON(name);
  const result = schema.safeParse(raw);
  if (!result.success) {
    errors.push(formatZodError(result.error, name));
    failed = true;
  }
}

// --- Photo existence check (people) ---
const rawPeople = loadJSON("people.json");
if (Array.isArray(rawPeople)) {
  rawPeople.forEach((person, i) => {
    if (person.photo) {
      const err = checkPhotoExists(person.photo, "people.json", `[${i}].photo`);
      if (err) { errors.push(err); failed = true; }
    }
  });
}
// Same pattern for outreach images...

if (failed) {
  console.error("\n✖ Content validation failed");
  errors.forEach((e) => console.error(e));
  process.exit(1);
}

console.log("✔ Content validation passed");
```

**Package.json integration:**
```json
{
  "scripts": {
    "prebuild": "node --import tsx/esm scripts/validate-content.mjs",
    "build": "next build",
    "validate-content": "node --import tsx/esm scripts/validate-content.mjs"
  }
}
```

`tsx` is needed to import TypeScript schemas from `.mjs` context. Alternative: compile schemas to `.mjs` as a separate step, or write schemas in pure `.mjs`. The tsx approach is simpler.

**Why prebuild over next.config.ts:**
- `next.config.ts` is evaluated inside the Next.js/Turbopack module graph. `fs.existsSync` calls there may behave unexpectedly with Turbopack's static analysis.
- A prebuild Node script runs in plain Node 20 before any bundler touches files — deterministic behaviour in both local dev and Vercel CI.
- Vercel runs `npm run build` (or `pnpm build`), which triggers `prebuild` automatically.

### Pattern 6: JSON Schema Generation Script

```javascript
// scripts/generate-schemas.mjs
import { writeFileSync } from "fs";
import { join } from "path";
import * as z from "zod";
// Import Zod schemas from src/content/schemas/*.ts (via tsx)

const CONTENT_DIR = new URL("../content/", import.meta.url).pathname;

function writeSchema(zodSchema, filename) {
  const jsonSchema = z.toJSONSchema(zodSchema, {
    target: "draft-07",   // VS Code fully supports Draft 7; Draft 2020-12 has limited support
  });
  // Add $schema URI for completeness (VS Code uses $schema field if present)
  jsonSchema["$schema"] = "http://json-schema.org/draft-07/schema#";
  writeFileSync(
    join(CONTENT_DIR, filename),
    JSON.stringify(jsonSchema, null, 2) + "\n",
    "utf-8"
  );
  console.log(`Generated ${filename}`);
}

writeSchema(PeopleSchema, "people.schema.json");
writeSchema(PublicationsSchema, "publications.schema.json");
writeSchema(ResearchSchema, "research.schema.json");
writeSchema(JournalClubSchema, "journal-club.schema.json");
writeSchema(OutreachSchema, "outreach.schema.json");
```

### Anti-Patterns to Avoid

- **Zod `.strict()` method (v3 style):** Use `z.strictObject()` instead. The `.strict()` method is deprecated in Zod v4 and will be removed in future.
- **`zod-to-json-schema` package:** No longer maintained; Zod v4 has native `z.toJSONSchema()`.
- **Zod `.refine()` for photo existence:** Don't use async `fs.promises.access` inside `.refine()` — Zod's parse is synchronous. Do photo checks in the prebuild script after Zod parse.
- **Dynamic `await import()` for content in Server Components:** Forces per-request evaluation. Use static top-level import instead.
- **`import * as z from "zod/v4"`:** Not needed when using `zod@^4` directly. The `/v4` subpath was used when v4 was released inside the v3 package. Install `zod@^4` and import from `"zod"`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema definition + TS types | Custom interface + runtime checks | Zod v4 | Single source of truth for types AND validation |
| JSON Schema for VS Code | Custom JSON Schema writer | `z.toJSONSchema()` | Maintained, spec-correct, zero config |
| Bilingual field shape | Ad-hoc `_es`/`_en` suffix properties | `bilingualString()` helper | Type-safe, reusable, works with accessor pattern |
| Error formatting | Custom ZodError stringifier | Manual `.issues` iteration (see Pattern 5) | Zod v4's `z.prettifyError()` is handy but doesn't produce the file-grouped format required; roll a simple formatter (15 lines) |

**Key insight:** Zod v4 is the single library for this entire phase. Resist adding `ajv`, `joi`, or `yup` — they would duplicate schema logic without adding value here.

---

## Common Pitfalls

### Pitfall 1: Zod v3 vs v4 API Confusion

**What goes wrong:** `.strict()` on object schemas (v3 style) is deprecated in v4. Code using `.strict()` still works (backward compat is maintained) but linters may warn and behaviour subtly differs.
**Why it happens:** Most tutorials online still show Zod v3. Claude training data also skews v3.
**How to avoid:** Use `z.strictObject({ ... })` for every content schema.
**Warning signs:** If you see `.strict()` chained on a schema, update it.

### Pitfall 2: VS Code JSON Schema Draft Version Mismatch

**What goes wrong:** VS Code fully supports Draft 4 through Draft 7. Support for Draft 2020-12 is "limited." `z.toJSONSchema()` defaults to Draft 2020-12. VS Code silently ignores features it doesn't support, so IntelliSense works partially but required-field highlighting may break.
**How to avoid:** Always pass `{ target: "draft-07" }` to `z.toJSONSchema()`.
**Warning signs:** VS Code shows no red squiggles for obviously invalid content.

### Pitfall 3: Smart Quote False Negatives

**What goes wrong:** The regex `[\u201C\u201D\u2018\u2019]` catches curly double (`""`) and curly single (`''`) quotes. It does NOT catch the prime symbol (U+2032 ′) or the double prime (″). Maintainers copying from LaTeX might introduce these.
**How to avoid:** For this phase, the four code points are sufficient. If LaTeX paste becomes common, extend the regex in `proseString()`.
**Warning signs:** Primes appearing in prose that weren't caught.

### Pitfall 4: Photo Paths — Leading Slash Convention

**What goes wrong:** Next.js serves `public/people/Esteban_C.png` as `/people/Esteban_C.png`. In the JSON, store paths WITHOUT the leading slash (e.g. `"people/Esteban_C.png"`). The prebuild script then checks `existsSync(join(PUBLIC_DIR, relativePath))`. If you store paths WITH `/` prefix, `path.join` resolves to root on Unix.
**How to avoid:** Enforce in the Zod schema with `.refine((v) => !v.startsWith("/"), "photo path must not start with /")`. Store as `"people/Esteban_C.png"`.

### Pitfall 5: `tsx` Dependency Not in devDependencies

**What goes wrong:** The prebuild script uses `node --import tsx/esm` to run TypeScript schema files. If `tsx` is not installed, the prebuild fails with a module-not-found error.
**How to avoid:** `pnpm add -D tsx`. It is a zero-config TypeScript runner — no tsconfig changes needed.

### Pitfall 6: Zod v4 `z.string().email()` → `z.email()`

**What goes wrong:** Zod v4 moved string format validators to top-level functions. `z.string().email()` still works for backward compat, but `z.email()` is the canonical v4 form.
**How to avoid:** Use `z.email()`, `z.url()` directly. Either works; pick one style and be consistent.

---

## Code Examples

### Bilingual String Helper (Complete)

```typescript
// Source: based on Zod v4 API (zod.dev/api)
import * as z from "zod";

const SMART_QUOTES = /[\u201C\u201D\u2018\u2019]/;

export const proseString = (label: string) =>
  z.string().min(1).refine(
    (val) => !SMART_QUOTES.test(val),
    { error: `${label}: smart quotes detected — replace with straight quotes` }
  );

export const bilingualString = (label: string) =>
  z.strictObject({
    es: proseString(`${label}.es`),
    en: proseString(`${label}.en`),
  });
```

### Slug Uniqueness via superRefine

```typescript
// Source: Zod v4 API (zod.dev/api)
export const PeopleSchema = z.array(PersonSchema).superRefine((people, ctx) => {
  const seen = new Set<string>();
  people.forEach((p, i) => {
    if (seen.has(p.slug)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate slug "${p.slug}"`,
        path: [i, "slug"],
        input: p.slug,
      });
    }
    seen.add(p.slug);
  });
});
```

### JSON Schema Generation (VS Code Draft 7)

```typescript
// Source: zod.dev/json-schema
import * as z from "zod";
import { writeFileSync } from "fs";

function generateSchema(zodSchema: z.ZodType, outputPath: string) {
  const jsonSchema = z.toJSONSchema(zodSchema, { target: "draft-07" });
  jsonSchema["$schema"] = "http://json-schema.org/draft-07/schema#";
  writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2) + "\n", "utf-8");
}
```

### VS Code IntelliSense Wiring

```json
// .vscode/settings.json
{
  "json.schemas": [
    {
      "fileMatch": ["content/people.json"],
      "url": "./content/people.schema.json"
    },
    {
      "fileMatch": ["content/publications.json"],
      "url": "./content/publications.schema.json"
    },
    {
      "fileMatch": ["content/research.json"],
      "url": "./content/research.schema.json"
    },
    {
      "fileMatch": ["content/journal-club.json"],
      "url": "./content/journal-club.schema.json"
    },
    {
      "fileMatch": ["content/outreach.json"],
      "url": "./content/outreach.schema.json"
    }
  ]
}
```

**Why `.vscode/settings.json` over `$schema` in each JSON file:**
- Adding `$schema` changes the data the JSON file carries — Zod's `.strict()` would reject it as an unknown field (unless schema explicitly allows it).
- `.vscode/settings.json` is a workspace-level configuration that doesn't touch content files.
- Both methods work; `.vscode/settings.json` is cleaner for strict schemas.
- Relative `url` paths work only in workspace settings (`.vscode/settings.json`), not user settings.

### Error Formatter

```typescript
// Produces: file → JSON path → message/received, grouped by file
function formatZodErrors(error: import("zod").ZodError, filename: string): string {
  const lines: string[] = [`\n  ${filename}`];
  for (const issue of error.issues) {
    const path = issue.path.length > 0
      ? issue.path
          .map((p) => (typeof p === "number" ? `[${p}]` : `.${p}`))
          .join("")
      : "(root)";
    lines.push(`  └─ ${path}`);
    lines.push(`     ${issue.message}`);
    if ("received" in issue && issue.received !== undefined) {
      lines.push(`     Received: ${JSON.stringify(issue.received)}`);
    }
  }
  return lines.join("\n");
}
```

**`zod-validation-error` vs rolling our own:** `zod-validation-error` produces flat, user-friendly strings but does not support the file-grouped hierarchical format required here. Rolling 15 lines of custom `.issues` iteration gives full control. Zod v4's `z.prettifyError()` is also flat — same limitation. Roll the formatter; it's trivial.

### src/config/site.ts Shape

```typescript
// src/config/site.ts — no Zod needed; TypeScript types are sufficient for a single TS file
type SocialPlatform = "twitter" | "instagram" | "youtube" | "github" | "linkedin";

interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label: string; // e.g. "@CosmoGroup"
}

interface Affiliation {
  name: { es: string; en: string };
  url?: string;
}

export const siteConfig = {
  groupName:    "Grupo de Cosmología",
  tagline:      { es: "Explorando el universo a gran escala", en: "Exploring the large-scale universe" },
  affiliations: [
    {
      name: { es: "Universidad Nacional de La Plata", en: "National University of La Plata" },
      url: "https://www.unlp.edu.ar",
    },
  ] satisfies Affiliation[],
  contactEmail: "cosmologia@fcaglp.unlp.edu.ar",
  socialLinks:  [] satisfies SocialLink[],
} as const;

export type SiteConfig = typeof siteConfig;
```

**Why not Zod for site.ts:** The file is maintained by a developer (not a content editor), is checked into source, and TypeScript's type system already enforces the shape at compile time. Zod would add runtime overhead with no build-time benefit that TS doesn't already provide. The `satisfies` operator gives full type checking.

### Publications Schema — Academic Metadata Details

```typescript
// Source: arXiv identifier docs (info.arxiv.org/help/arxiv_identifier.html)
// Source: Crossref DOI regex (crossref.org/blog/dois-and-matching-regular-expressions/)

const PublicationSchema = z.strictObject({
  id:       z.string().min(1),                      // explicit, unique
  authors:  z.array(z.string().min(1)).min(1),      // array of strings (canonical form)
  title:    canonicalString,                         // paper-native language; no smart-quote check
  journal:  z.string().min(1),                       // free string (journal name + volume; not enum)
  year:     z.number().int().min(1900).max(2100),
  arxiv:    z.string()
              .regex(/^\d{4}\.\d{4,5}(v\d+)?$/, "arXiv ID format: YYMM.NNNNN or YYMM.NNNN")
              .optional(),
  doi:      z.string()
              .regex(/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i, "DOI format: 10.XXXX/...")
              .optional(),
  topic_tags: z.array(z.string().min(1)).optional().default([]),
});

export const PublicationsSchema = z.array(PublicationSchema).superRefine((pubs, ctx) => {
  const seen = new Set<string>();
  pubs.forEach((p, i) => {
    if (seen.has(p.id)) {
      ctx.addIssue({ code: "custom", message: `Duplicate id "${p.id}"`, path: [i, "id"], input: p.id });
    }
    seen.add(p.id);
  });
});
```

**Academic metadata decisions surfaced for planner:**

| Field | Decision | Rationale |
|-------|----------|-----------|
| `authors` | `string[]` (not `{name, orcid}[]`) | ORCID is optional for most group papers; string is simplest for maintainers; can upgrade to object in v2 |
| `doi` | bare DOI without `https://doi.org/` prefix | Bare DOI is the canonical form (Crossref standard); UI layer constructs the URL |
| `arxiv` | bare ID without `arXiv:` prefix (e.g. `2501.12345`) | Same rationale; UI constructs the URL |
| `journal` | free string | Enum would break on any new journal; free string is maintainer-friendly |
| `title` | canonical (no bilingual) | Per user decision; academic convention — paper title stays in original language |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `zod-to-json-schema` package | `z.toJSONSchema()` built-in | Zod v4 release (Aug 2025) | Remove one dependency; no migration when upgrading Zod |
| `schema.strict()` method | `z.strictObject()` top-level fn | Zod v4 | Old method still works but deprecated |
| `z.string().email()` | `z.email()` | Zod v4 | Old still works; v4 form cleaner |
| `ZodError.format()` | `z.treeifyError()` | Zod v4 | `format()` deprecated |
| `z.string().url()` | `z.url()` | Zod v4 | Same: old works, new is canonical |

**Deprecated/outdated:**
- `zod-to-json-schema` npm package: no longer actively maintained, author recommends `z.toJSONSchema()`.
- Zod v3 `ctx.path` in `.superRefine()`: removed in v4 (path is now computed lazily). Use `issue.path` from `ctx.addIssue({ path: [...] })` argument.

---

## Open Questions

1. **tsx in devDependencies**
   - What we know: `tsx` is a zero-config TypeScript runner for Node scripts; needed to run `.ts` schemas from `.mjs` prebuild script.
   - What's unclear: whether the project already uses `ts-node` or `tsx` (neither appears in current `package.json`).
   - Recommendation: Add `tsx` to devDependencies as part of Phase 2 setup. It's the lighter alternative to `ts-node`.

2. **tsconfig `include` for `content/` and `scripts/`**
   - What we know: current tsconfig `include` targets `**/*.ts` but `exclude` lists `.planning`. The `content/` JSON files don't need TypeScript, but `scripts/*.mjs` need Node types.
   - What's unclear: whether the planner should add `@types/node` (already in devDependencies as `"^20"`) and whether scripts should be `.ts` (using tsx) or `.mjs`.
   - Recommendation: Write scripts as `.ts`, run with `tsx`, no tsconfig changes needed (tsx uses its own resolution).

3. **Vercel `prebuild` execution**
   - What we know: Vercel runs `npm run build` or `pnpm build`, which triggers `prebuild` via npm lifecycle hooks.
   - What's unclear: whether Vercel's build environment has all devDependencies available when `prebuild` runs. Standard behaviour is yes (install → prebuild → build).
   - Recommendation: Treat as confirmed, verify on first Vercel deploy.

---

## Sources

### Primary (HIGH confidence)
- `zod.dev/api` — Zod v4 API: `z.strictObject()`, `.superRefine()`, `.refine()`, `z.email()`, `z.url()`
- `zod.dev/json-schema` — `z.toJSONSchema()` usage and `{ target: "draft-07" }` option
- `zod.dev/v4/changelog` — Breaking changes: `.strict()` deprecated, `z.treeifyError()` replaces `z.formatError()`, ctx.path removed from superRefine
- `code.visualstudio.com/docs/languages/json` — VS Code JSON schema validation, Draft 4–7 supported, `json.schemas` workspace settings
- `info.arxiv.org/help/arxiv_identifier.html` — arXiv ID format: `YYMM.NNNNN` post-2015, `YYMM.NNNN` before Jan 2015
- `next-intl.dev/docs/environments/server-client-components` — `getLocale()` for async server components

### Secondary (MEDIUM confidence)
- Zod v4 current npm version: 4.3.x (latest stable as of research date, confirmed via newreleases.io and search results)
- `zod-to-json-schema` deprecation: multiple search results + GitHub maintainer statement confirm library is no longer actively maintained in favour of Zod v4 native
- `crossref.org/blog/dois-and-matching-regular-expressions/` — DOI regex `^10.\d{4,9}/[-._;()/:A-Z0-9]+$`
- VS Code Draft 7 preference over Draft 2020-12: confirmed by VS Code docs ("limited support for 2019-09 and 2020-12")

### Tertiary (LOW confidence)
- Vercel `prebuild` lifecycle behaviour: inferred from standard npm lifecycle + one GitHub Discussion hit
- `tsx` for running TypeScript prebuild scripts: community pattern, widely used, not from official Next.js docs

---

## Metadata

**Confidence breakdown:**
- Standard stack (Zod v4): HIGH — official docs, confirmed stable npm release
- Architecture patterns: HIGH — derived from Zod v4 API docs + existing project tsconfig
- VS Code IntelliSense wiring: HIGH — official VS Code docs
- Prebuild integration: MEDIUM — npm lifecycle is well-known; Vercel behaviour inferred
- Academic metadata (arXiv/DOI): HIGH — official arXiv + Crossref sources
- next-intl locale accessor pattern: MEDIUM — official next-intl docs + Phase 1 project context

**Research date:** 2026-04-17
**Valid until:** 2026-07-17 (stable ecosystem — 90 days reasonable; Zod v4 API unlikely to change)
