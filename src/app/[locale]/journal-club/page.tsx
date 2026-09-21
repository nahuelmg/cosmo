import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getUpcomingSessions, getPastSessionsByYear } from "@/content";
import { buildPageMetadata } from "@/lib/metadata";
import { SessionCard } from "@/components/journal-club/SessionCard";
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

  const upcoming = getUpcomingSessions(locale);
  const grouped = getPastSessionsByYear(locale);
  const hasArchive = Object.keys(grouped).length > 0;
  // The sheet is empty (no session has been loaded yet) — show a placeholder
  // instead of an "Upcoming" heading with nothing under it.
  const isEmpty = upcoming.length === 0 && !hasArchive;

  const paperLinkLabel = t("paperLink");
  const abstractLabel = t("abstract");

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold leading-tight">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-ink-muted">
          {t("intro")}
        </p>
      </header>

      {isEmpty ? (
        <p className="mt-12 text-ink-muted">{t("empty")}</p>
      ) : (
        <>
          <section aria-labelledby="jc-upcoming" className="mt-12">
            <h2
              id="jc-upcoming"
              className="font-serif text-3xl font-semibold tracking-tight leading-tight"
            >
              {t("upcoming")}
            </h2>
            {upcoming.length > 0 ? (
              <ul className="mt-6 grid list-none grid-cols-1 gap-4">
                {upcoming.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    locale={locale}
                    paperLinkLabel={paperLinkLabel}
                    abstractLabel={abstractLabel}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-ink-muted">{t("noUpcoming")}</p>
            )}
          </section>

          {hasArchive && (
            <JournalClubArchive
              grouped={grouped}
              locale={locale}
              archiveTitle={t("past")}
              paperLinkLabel={paperLinkLabel}
              abstractLabel={abstractLabel}
            />
          )}
        </>
      )}
    </section>
  );
}
