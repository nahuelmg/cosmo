# References

Curated research findings from real projects. When Claude researches a library, API, or technique during a project, the useful findings get extracted here so future projects don't repeat the same investigation.

## How This Works

1. **During a project**: Claude researches libraries, APIs, deployment options, etc. This research lives in `.planning/phases/*/RESEARCH.md` (project-specific).

2. **After a project**: Extract findings that would be useful for future projects into this folder. Delete project-specific details — keep only what's reusable.

3. **On future projects**: Claude checks `references/` before researching from scratch. If a reference exists, skip the web search and use the validated findings.

## Directory Structure

```
references/
├── README.md                  ← This file
├── libraries/                 ← Library comparisons and usage notes
│   ├── charting.md            ← Chart libraries compared (LWC vs Recharts vs D3)
│   ├── state-management.md   ← Zustand vs Redux vs Jotai
│   └── ...
├── apis/                      ← External API integration notes
│   ├── binance.md             ← Endpoints, rate limits, gotchas
│   └── ...
├── deployment/                ← Hosting and deployment findings
│   ├── vercel.md              ← Vercel-specific notes and gotchas
│   └── ...
└── patterns/                  ← Validated architectural patterns
    └── ...
```

## What to Save

- **Library comparisons**: "We evaluated X, Y, Z — chose X because..." with links to docs
- **API documentation summaries**: Endpoints used, auth method, rate limits, response shapes, known issues
- **Deployment findings**: Platform-specific gotchas, config needed, pricing notes
- **Validated patterns**: Architectural approaches that were tested and proven to work

## What NOT to Save

- Project-specific implementation details (those belong in the domain skill)
- Outdated information (libraries change fast — mark entries with dates)
- Untested recommendations (only save what you actually used and verified)

## Extraction Prompt

After a project, ask Claude:

```
Review .planning/phases/*/RESEARCH.md and extract any findings that would
help future projects. Save to references/ using the directory structure above.

Only include:
- Library comparisons with clear winners and reasoning
- API integration notes (endpoints, auth, rate limits, gotchas)
- Deployment discoveries
- Patterns that were validated in production

Skip anything project-specific or likely to be outdated within 6 months.
Mark each entry with the date and source project.
```
