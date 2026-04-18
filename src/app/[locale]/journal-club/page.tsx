import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  getUpcomingSessions,
  getPastSessionsByYear,
  getLocalizedSession,
} from "@/content";
import { buildPageMetadata } from "@/lib/metadata";
import { SessionRow } from "@/components/journal-club/SessionRow";
import { JournalClubArchive } from "@/components/journal-club/JournalClubArchive";

type Locale = (typeof routing.locales)[number];
type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    href: "/journal-club",
    title: t("journalClub.title"),
    description: t("journalClub.description"),
  });
}

export default async function JournalClubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("journalClub");

  // Localize notes on every session pulled from the content layer.
  // getLocalizedSession is called HERE in the page RSC before passing sessions
  // down to server child components — same pattern as getLocalizedPeople.
  const upcoming = getUpcomingSessions().map((s) =>
    getLocalizedSession(s, locale),
  );
  const grouped = getPastSessionsByYear();
  const groupedLocalized: Record<
    string,
    ReturnType<typeof getLocalizedSession>[]
  > = {};
  for (const [year, sessions] of Object.entries(grouped)) {
    groupedLocalized[year] = sessions.map((s) => getLocalizedSession(s, locale));
  }

  const paperLinkLabel = t("paperLink");

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <header>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-2xl font-serif text-lg text-ink-muted">
          {t("intro")}
        </p>
      </header>

      <section aria-labelledby="jc-upcoming" className="mt-12">
        <h2
          id="jc-upcoming"
          className="font-serif text-3xl font-semibold tracking-tight"
        >
          {t("upcoming")}
        </h2>
        {upcoming.length > 0 ? (
          <ol className="mt-4 list-none">
            {upcoming.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                locale={locale}
                paperLinkLabel={paperLinkLabel}
              />
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-ink-muted">{t("noUpcoming")}</p>
        )}
      </section>

      {Object.keys(groupedLocalized).length > 0 && (
        <JournalClubArchive
          grouped={groupedLocalized}
          locale={locale}
          archiveTitle={t("past")}
          paperLinkLabel={paperLinkLabel}
        />
      )}
    </section>
  );
}
