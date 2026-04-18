# 05-04 Summary — Per-person metadata + Person JSON-LD

**Status:** ✓ Complete
**Commit:** `bc896a1`
**File touched:** [src/app/[locale]/people/[slug]/page.tsx](src/app/[locale]/people/[slug]/page.tsx)

## Final `generateMetadata` signature

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const person = getPersonBySlug(slug);
  if (!person) return {};
  if (person.category === 'undergrad' || person.category === 'past') return {};

  const localizedRole = person.role[locale as Locale];
  const description = `${localizedRole} — ${siteConfig.groupName}`;

  return buildPageMetadata({
    locale,
    href: { pathname: '/people/[slug]', params: { slug } },
    title: person.name,
    description,
    ogType: 'profile',
    absoluteTitle: false,
  });
}
```

Picks up the default layout title template so the rendered `<title>` suffixes "Grupo de Cosmología — {Name}". OG image intentionally omitted → inherits shared portada per CONTEXT.md 2026-04-18 decision.

## JsonLd placement snippet

```tsx
return (
  <>
    <JsonLd data={buildPersonSchema(rawPerson, locale)} />
    <PersonDetail ... />
  </>
);
```

`<JsonLd>` is the first fragment child; `rawPerson` (pre-localization) is passed so the schema builder can select the right locale internally.

## Build route table — all 13 × 2 person paths static

```
├ ● /[locale]/people/[slug]
│ ├ /es/people/esteban-calzetta
│ ├ /es/people/diana-lopez-nacir
│ ├ /es/people/susana-landau
│ └ [+23 more paths]
```

26 static paths (13 clickable people × 2 locales). `undergrad`/`past` categories are filtered out of `generateStaticParams`. PERF-01 preserved.

## Curl excerpts — 2 sample people × 2 locales

### PI — Esteban Calzetta (es)

```
"@type":"Person","name":"Esteban Calzetta","jobTitle":"Investigador Principal","description":"Esteban Calzetta es Doctor en Fisica por la Universidad de Buenos Aires y miembro de la Carrera del Investigador Cientific…
```

email/mailto count: **0**

### PI — Esteban Calzetta (en)

```
"@type":"Person","name":"Esteban Calzetta","jobTitle":"Principal Investigator","description":"Esteban Calzetta holds a PhD in Physics from the Universidad de Buenos Aires and is a CONICET Principal Researcher. His wo…
```

email/mailto count: **0**

### PhD — Nahuel Miron Granese (es)

```
"@type":"Person","name":"Nahuel Miron Granese","jobTitle":"Investigador Principal","description":"Nahuel Miron Granese es investigador del grupo de cosmologia. Biogra…
```

email/mailto count: **0**

### PhD — Nahuel Miron Granese (en)

```
"@type":"Person","name":"Nahuel Miron Granese","jobTitle":"Principal Investigator","description":"Nahuel Miron Granese is a researcher in the cosmology group. Detaile…
```

email/mailto count: **0**

## Deviations from the planned shape

1. **Used object-form `href`** (`{ pathname: '/people/[slug]', params: { slug } }`) instead of the plan's string literal. Matches what 05-05 does for sitemap person entries and avoids a TypeScript cast. Safer and consistent.
2. **Split `rawPerson` / `person` fetches.** `buildPersonSchema` needs the raw bilingual record to choose the right locale; `PersonDetail` needs the pre-localized shape. Both calls are cheap (same-file lookup) so no perf concern.
3. **Added defensive `return {}` for `undergrad`/`past`** in `generateMetadata` in addition to the `notFound()` guard in the page body. Protects the metadata path even though these categories are filtered out of `generateStaticParams`.
