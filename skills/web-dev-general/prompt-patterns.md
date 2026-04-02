# Effective Prompt Patterns

> Templates for prompting Claude in web development projects. Derived from real conversations — what worked on first try vs. what needed iterations.

## How to Use

Copy the relevant template, fill in the `{{placeholders}}`, and send as your prompt. These are starting points — adapt to your specific project.

---

## 1. Project Kickoff

### What works (high-context, constrained)

```
I want to build {{project description — 1-2 sentences}}.

Target users: {{who will use this}}
Core action: {{the ONE thing users must be able to do}}
Stack: {{framework, language, CSS, key libraries}}
Data source: {{where data comes from — API, database, static, etc.}}
Deployment: {{Vercel, Netlify, self-hosted, etc.}}
Design reference: {{link to inspiration, or "clean/minimal/professional"}}

Start with fake data. Build the UI first, connect real data later.
```

**Why it works**: Defines scope, constraints, and the fake-data-first strategy upfront. Prevents Claude from over-engineering the first version.

### What fails (vague, open-ended)

```
Build me a dashboard.
```

**Why it fails**: No stack preference, no scope boundary, no data strategy. Claude will ask 5 clarifying questions or make assumptions that need correction.

---

## 2. Phase Planning

### Effective pattern

```
We need to build {{feature description}}.

What exists: {{current state of the codebase — relevant files, patterns, types}}
What we need: {{concrete deliverables — components, routes, data flows}}
Constraints: {{library versions, browser support, performance targets}}

Break this into 2-3 plans that can be executed sequentially. Each plan
should produce a working increment (not just scaffolding).
```

### Gray area questions pattern

When discussing a feature, identify decisions that affect scope but aren't obvious:

```
Before planning, I want to resolve these open questions:
1. {{Question about scope — "Should X include Y?"}}
2. {{Question about UX — "Should users see A or B?"}}
3. {{Question about data — "Where does this come from?"}}
4. {{Question about edge cases — "What happens when Z?"}}
```

**Lesson learned**: The best phases came from 5-10 minutes of discussion BEFORE planning. Answering gray-area questions saved hours of rework.

---

## 3. Component Building

### First-try success pattern

```
Create a {{ComponentName}} component.

It should:
- {{Behavior 1 — what it does, not how}}
- {{Behavior 2}}
- {{Behavior 3}}

Data: It gets data from {{hook name / props / store}}
Styling: Use {{Tailwind / CSS modules / styled-components}} matching existing patterns
Location: {{file path}}
Similar to: {{existing component to reference for patterns}}
```

**Key insight**: "Similar to: existing component" is the most effective single line you can add. It grounds Claude in your codebase's actual patterns instead of generic best practices.

### What needs iteration

```
Make a chart component.
```

**Why it needs iteration**: No data shape, no library choice, no styling context, no behavioral spec. Results in a generic component that doesn't match your patterns.

---

## 4. Bug Fixes

### Effective bug report

```
Bug: {{what's wrong — observed behavior}}
Expected: {{what should happen}}
Where: {{file path and approximate line, or component name}}
Repro: {{steps to reproduce, or "always happens"}}
```

### Quick fix pattern

```
Quick fix: {{description of what needs to change}}

Don't refactor surrounding code. Just fix this specific issue.
```

**Lesson learned**: Adding "don't refactor surrounding code" prevents scope creep in bug fixes. Without it, Claude tends to "improve" adjacent code, which creates unnecessary diffs and review burden.

---

## 5. API Integration

### Effective pattern

```
Integrate {{API name}} for {{what data we need}}.

API docs: {{URL or summary of endpoints}}
Auth: {{API key / OAuth / none}}
Data format: {{JSON response shape or link to docs}}
Our types: {{reference to existing TypeScript interfaces}}

Follow the existing provider pattern:
1. Create client module at src/lib/{{service}}-client.ts
2. Create BFF routes at src/app/api/{{resource}}/route.ts
3. Implement {{Service}}Provider in src/providers/

Map their response to our existing {{TypeName}} interface.
```

**Key insight**: Always reference existing provider patterns. Claude will match the abstraction level, error handling, and caching strategy of what's already there.

### API pre-validation spike (run BEFORE planning integration)

```
Before we plan the {{API name}} integration, let's validate the API is usable:

1. Can we reach {{API base URL}} from Vercel serverless functions?
   Check if {{API name}} is known to block AWS/cloud IPs.

2. Fetch {{endpoint}} and show me the actual JSON response shape.
   Do NOT assume all fields exist — show me exactly what comes back.

3. What is the rate limit and how many requests will our UI make per:
   - Page load (initial fetch for all panels)
   - Range/filter change (user interaction)
   - Background polling (60s interval × open panels)

4. Does the free tier support the intervals/granularity our UI needs?
   (Some APIs return different granularities automatically based on time range.)

Only proceed to building the provider after we have answers to all four.
```

**Why this pattern**: Some APIs block cloud provider IPs, and many endpoints return fewer fields than documented. A 10-minute spike at planning time catches both issues before you build the entire data layer around wrong assumptions.

---

## 6. Refactoring

### Safe refactoring prompt

```
Refactor: {{what to change}}
Reason: {{why — performance, readability, pattern consistency}}

Rules:
- Don't change any external behavior
- Don't add new features
- Don't change the public API of any function/component
- Run tests after to verify nothing broke
```

---

## 7. Learning / Explanation

### When you want to understand code

```
Explain {{file path or function name}}:
- What does it do? (one paragraph)
- What are the key decisions and why?
- What would break if I changed X?
```

### When you want to understand a pattern

```
Why did we use {{pattern}} instead of {{alternative}}?
What would we need to change if we wanted to switch to {{alternative}}?
```

---

## 8. Meta-Prompts (Prompt Hygiene)

### Scope containment

Add this when you want focused work:
```
Only modify the files needed for this change. Don't add docstrings,
comments, or type annotations to code you didn't change.
```

### Quality gate

Add this when you want verification:
```
After implementing, run: npx tsc --noEmit && npm test
Fix any errors before presenting the result.
```

### Pattern consistency

Add this when extending existing code:
```
Match the patterns in {{reference file}}. Don't introduce new patterns
or abstractions unless the existing ones genuinely don't work.
```

---

## Common Anti-Patterns in Prompts

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| "Make it production-ready" | Triggers over-engineering (error boundaries, logging, monitoring, feature flags) | "Make it work correctly for the current use case" |
| "Add comprehensive error handling" | Every function gets try/catch even when errors can't happen | "Add error handling at the API boundary" |
| "Follow best practices" | Vague — results in boilerplate and unnecessary abstraction | Name the specific practice you want |
| "Refactor while you're at it" | Scope creep — bug fix becomes a rewrite | Separate ticket/prompt for refactoring |
| No file path references | Claude guesses where to put things | Always specify target file paths |

---

---

## 9. Dark Theme Verification

When building dark-first UIs, add this to the visual verification prompt:

```
Before marking this complete, verify dark theme rendering:

[ ] Native browser controls (select, input[type=date], checkbox) look correct in dark mode
    — Add [color-scheme:dark] to any <select> or date input that uses text-white
[ ] Dropdown/popup containers don't clip their scrollable children
    — Remove overflow-hidden from any popup that contains a scrollable list
[ ] ThemeProvider is set to enableSystem={false} and defaultTheme="dark"
    — Otherwise OS light mode preference will override the dark default
```

---

---

## 10. Bilingual Content & i18n

### Pre-implementation validation pattern

Before starting any phase that involves translation:

```
Before building the {{component name}}, verify:

1. All translation namespaces this component needs exist in both es.json and en.json:
   - Namespace: {{Nav / Hero / QuoteForm / etc.}}
   - Keys needed: {{list specific keys}}

2. If this is a wave with multiple tasks, verify keys exist BEFORE the component task,
   not after. Translation lookups fail at runtime if keys are missing.

3. For any component that uses both getTranslations() (server) AND useTranslations() (client):
   - Server component fetches and passes serialized data as props
   - Client component uses useTranslations() only for interactive labels (aria-labels, etc.)
   - Never call getTranslations() in a client component
```

### Bilingual content architecture decision prompt

Ask this BEFORE building any bilingual content section:

```
For the {{section name}} section, we need to decide the bilingual content strategy:

Option A: Translation files (messages/es.json + messages/en.json)
- Use for: UI strings, labels, error messages, short copy
- Access via: getTranslations() in server components, useTranslations() in client components

Option B: BilingualText data fields ({ es: string; en: string })
- Use for: Business content that varies per entity (service names, material descriptions)
- Access via: data[field][locale] in any component (no i18n library needed)

Option C: Separate page files per locale
- Use for: Long-form content (blog posts, legal pages) that differs structurally by language
- Access via: File-based routing ([locale]/page.tsx)

Decision for {{section name}}: {{Option A/B/C}}
Reason: {{why this choice fits this content type}}
```

**Rule of thumb**:
- Labels → Option A (translation files)
- Product/service data → Option B (BilingualText in data files)
- Long-form content → Option C (page files)

### i18n URL strategy decision prompt

Decide this BEFORE building legal pages or multi-locale routes:

```
For {{legal pages / blog posts / etc.}}, decide the URL slug strategy:

Option A: Same slug across locales
- /aviso-legal (ES) and /en/aviso-legal (EN)
- Simpler: one page file handles both locales
- Downside: English users see Spanish URL slug

Option B: Translated slugs
- /aviso-legal (ES) and /en/legal-notice (EN)
- Requires: separate page files OR dynamic routing with locale-based slug mapping
- Better: semantically correct for English SEO

Decision: {{Option A or B}}
Implementation path: {{if B: describe the routing approach}}
```

**Choose before starting legal pages, not after.** Changing URL structure after launch breaks inbound links.

---

*Last updated: 2026-04-02*
