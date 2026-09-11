/**
 * Schema.org JSON-LD builders — ResearchOrganization, Person, ScholarlyArticle.
 *
 * Consumed by the JsonLd server component (src/components/seo/JsonLd.tsx).
 *
 * CRITICAL (NAV-03):
 * No builder emits an `email` field. The raw group / contact email never
 * appears in prerendered HTML — JSON-LD included. ResearchOrganization uses
 * `contactPoint.url` pointing at the localised contact page; Person relies
 * on ORCID + Google Scholar + social_links via `sameAs` for discoverability.
 *
 * SSG-safe (PERF-01): pure functions, no runtime APIs. All URL construction
 * routes through getPathname({ locale, href }) so routing.ts pathnames config
 * remains the single source of truth (a rename of `/contact` → `/contacto`
 * in routing.ts propagates here without code changes).
 */

import { getPathname } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { localize, type Locale } from "@/content";
import type { Person } from "@/content";
import type { Publication } from "@/content";

/**
 * ResearchOrganization schema emitted once per page via the root locale layout.
 * contactPoint.url points at the localised contact page instead of exposing
 * mailto: in prerendered HTML (NAV-03).
 */
export function buildOrganizationSchema(locale: Locale) {
  // All URL construction MUST flow through getPathname so the pathnames config
  // in routing.ts remains the single source of truth. Hardcoded
  // `/contacto` / `/contact` ternaries would silently diverge on rename.
  const contactUrl = `${siteConfig.url}${getPathname({
    locale,
    href: "/contact",
  })}`;

  return {
    "@context": "https://schema.org",
    "@type": "ResearchOrganization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.groupName, // canonical Spanish — always, regardless of locale
    url: siteConfig.url,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "inquiries",
      url: contactUrl,
    },
    parentOrganization: siteConfig.affiliations.map((a) => ({
      "@type": a.schemaType ?? "Organization",
      name: a.name.es,
      url: a.url,
      ...(a.sameAs ? { sameAs: a.sameAs } : {}),
    })),
  };
}

/**
 * Person schema emitted per /people/[slug] page.
 * CRITICAL (NAV-03): the email field is intentionally omitted. ORCID + Scholar
 * + social_links populate sameAs so academic identity is discoverable without
 * exposing the raw email in prerendered HTML.
 */
export function buildPersonSchema(person: Person, locale: Locale) {
  const orgId = `${siteConfig.url}/#organization`;
  const sameAs: string[] = [];
  if (person.contact.scholar) sameAs.push(person.contact.scholar);
  person.social_links.forEach((l) => sameAs.push(l.url));

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: localize(person.role, locale),
    ...(person.short_bio
      ? { description: localize(person.short_bio, locale) }
      : {}),
    worksFor: { "@id": orgId },
    affiliation: person.affiliation
      ? { "@type": "Organization", name: localize(person.affiliation, locale) }
      : { "@id": orgId },
  };

  if (person.contact.orcid) {
    schema.identifier = {
      "@type": "PropertyValue",
      propertyID: "ORCID",
      value: `https://orcid.org/${person.contact.orcid}`,
    };
  }
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }
  if (person.photo) {
    schema.image = `${siteConfig.url}/${person.photo}`;
  }
  // NAV-03: no email key — omitted entirely.
  return schema;
}

/**
 * ScholarlyArticle schema emitted per publication entry on the publications
 * page. arXiv + DOI populate sameAs / identifier when present.
 */
export function buildScholarlyArticleSchema(pub: Publication) {
  const sameAs: string[] = [];
  if (pub.arxiv) sameAs.push(`https://arxiv.org/abs/${pub.arxiv}`);
  if (pub.doi) sameAs.push(`https://doi.org/${pub.doi}`);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: pub.title,
    author: pub.authors.map((name) => ({ "@type": "Person", name })),
    datePublished: String(pub.year),
    isPartOf: { "@type": "Periodical", name: pub.journal },
  };
  if (sameAs.length > 0) schema.sameAs = sameAs;
  if (pub.doi) {
    schema.identifier = {
      "@type": "PropertyValue",
      propertyID: "DOI",
      value: `https://doi.org/${pub.doi}`,
    };
  }
  return schema;
}
