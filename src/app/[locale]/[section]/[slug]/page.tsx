import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getPeople } from "@/content";
import { localizedSection, type Locale } from "@/i18n/sections";
import PersonPage, { generateMetadata as personMetadata } from "@/views/person";

export const dynamicParams = false;
type Props = { params: Promise<{ locale: Locale; section: string; slug: string }> };

export function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!hasLocale(routing.locales, params.locale)) return [];
  const locale = params.locale;
  return getPeople().filter((person) => person.category !== "past").map((person) => ({
    section: localizedSection("people", locale),
    slug: person.slug,
  }));
}

async function validateRoute(params: Props["params"]) {
  const { locale, section } = await params;
  if (section !== localizedSection("people", locale)) notFound();
}

export async function generateMetadata({ params }: Props) {
  await validateRoute(params);
  return personMetadata({ params });
}

export default async function ProfilePage({ params }: Props) {
  await validateRoute(params);
  return PersonPage({ params });
}
