/**
 * Shared metadata helper — single-call composition of canonical + hreflang
 * alternates + Open Graph + Twitter card metadata for a page.
 *
 * Why this lives in src/lib/:
 * Every static page under [locale]/ calls this from its generateMetadata().
 * Centralising the shape here means the canonical URL, hreflang, OG, and
 * Twitter fields stay consistent across pages — a change lands in one file.
 *
 * SSG-safe (PERF-01): uses only the explicit `locale` parameter plus
 * getPathname() from @/i18n/navigation. No cookies(), headers(), or
 * connection() calls — pages that call this stay statically prerenderable.
 *
 * URL construction: all paths flow through getPathname({ locale, href }) so
 * the routing.ts pathnames config remains the single source of truth. Never
 * hardcode `/es/investigacion` or similar — pass the internal key `/research`
 * and let next-intl map it.
 */

import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";

/**
 * Href extracted from getPathname's parameter type so it stays in sync with
 * the pathnames config declared in src/i18n/routing.ts.
 */
type Href = Parameters<typeof getPathname>[0]["href"];

export interface BuildPageMetadataOptions {
  locale: string;
  href: Href;
  title: string;
  description: string;
  /** Relative path from public/; defaults to the shared portada. */
  ogImage?: string;
  /** If true, the title is treated as absolute (suppresses parent template). */
  absoluteTitle?: boolean;
  /** OG type override — defaults to "website". Use "profile" on person pages. */
  ogType?: "website" | "profile" | "article";
}

export function buildPageMetadata({
  locale,
  href,
  title,
  description,
  ogImage = "/Portadas/portada_1.jpg",
  absoluteTitle = false,
  ogType = "website",
}: BuildPageMetadataOptions): Metadata {
  const esPath = getPathname({ locale: "es", href });
  const enPath = getPathname({ locale: "en", href });
  const esUrl = `${siteConfig.url}${esPath}`;
  const enUrl = `${siteConfig.url}${enPath}`;
  const canonicalUrl = locale === "es" ? esUrl : enUrl;

  const ogTitle = absoluteTitle ? title : `${siteConfig.groupName} — ${title}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: esUrl,
        en: enUrl,
        "x-default": esUrl,
      },
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.groupName,
      locale: locale === "en" ? "en_US" : "es_AR",
      type: ogType,
      images: [{ url: ogImage, width: 1920, height: 820 }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImage],
    },
  };
}
