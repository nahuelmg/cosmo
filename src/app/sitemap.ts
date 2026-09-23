import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { getPeople } from "@/content";

export const dynamic = "force-static";

const SITE_URL = siteConfig.url;

// Static href keys are literal-typed so TypeScript narrows them to the concrete
// pathnames config in routing.ts — no cast required.
type StaticHref =
  | "/"
  | "/people"
  | "/research"
  | "/publications"
  | "/journal-club"
  | "/resources"
  | "/outreach"
  | "/contact";

function staticEntry(href: StaticHref): MetadataRoute.Sitemap[number] {
  const esUrl = `${SITE_URL}${getPathname({ locale: "es", href })}`;
  const enUrl = `${SITE_URL}${getPathname({ locale: "en", href })}`;
  return {
    url: esUrl, // canonical default = Spanish (matches x-default)
    lastModified: new Date(),
    alternates: {
      languages: {
        es: esUrl,
        en: enUrl,
        "x-default": esUrl,
      },
    },
  };
}

// Dynamic `/people/[slug]` entries MUST use the object form of getPathname so
// next-intl substitutes the slug against the pathnames map. The string-template
// + type-cast pattern (casting a concatenated `/people/${slug}` string to the
// Href type) defeats the type system and creates a trap if /people/[slug] ever
// gets renamed to wrap the slug segment in routing.ts.
function personEntry(slug: string): MetadataRoute.Sitemap[number] {
  const esUrl = `${SITE_URL}${getPathname({
    locale: "es",
    href: { pathname: "/people/[slug]", params: { slug } },
  })}`;
  const enUrl = `${SITE_URL}${getPathname({
    locale: "en",
    href: { pathname: "/people/[slug]", params: { slug } },
  })}`;
  return {
    url: esUrl, // canonical default = Spanish (matches x-default)
    lastModified: new Date(),
    alternates: {
      languages: {
        es: esUrl,
        en: enUrl,
        "x-default": esUrl,
      },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticHrefs: StaticHref[] = [
    "/",
    "/people",
    "/research",
    "/publications",
    "/journal-club",
    "/resources",
    "/outreach",
    "/contact",
  ];

  const people = getPeople().filter((person) => person.category !== "past");

  return [
    ...staticHrefs.map(staticEntry),
    ...people.map((p) => personEntry(p.slug)),
  ];
}
