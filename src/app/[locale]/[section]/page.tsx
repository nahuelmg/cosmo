import * as people from "@/views/people";
import * as research from "@/views/research";
import * as publications from "@/views/publications";
import * as journal_club from "@/views/journal-club";
import * as resources from "@/views/resources";
import * as outreach from "@/views/outreach";
import * as contact from "@/views/contact";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { sectionKeys, localizedSection, resolveSection, type Locale } from "@/i18n/sections";

const pages = { people, research, publications, "journal-club": journal_club, resources, outreach, contact };
export const dynamicParams = false;
type Props = { params: Promise<{ locale: Locale; section: string }> };

export function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!hasLocale(routing.locales, params.locale)) return [];
  const locale = params.locale;
  return sectionKeys.map((key) => ({ section: localizedSection(key, locale) }));
}

async function resolvePage(params: Props["params"]) {
  const { locale, section } = await params;
  const key = resolveSection(section, locale);
  if (!key) notFound();
  return pages[key];
}

export async function generateMetadata({ params }: Props) {
  const page = await resolvePage(params);
  return page.generateMetadata({ params });
}

export default async function SectionPage({ params }: Props) {
  const page = await resolvePage(params);
  return page.default({ params });
}
