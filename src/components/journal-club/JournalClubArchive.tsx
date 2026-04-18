/**
 * JournalClubArchive — past sessions grouped by academic year.
 *
 * Server Component. Receives already-localized session objects from the page RSC.
 * Academic-year keys are "YYYY-YYYY" format — lexicographic descending sort gives newest-first.
 */

import { SessionRow } from "./SessionRow";

type LocalizedSession = {
  id: string;
  date: string;
  speaker: string;
  affiliation: string;
  title: string;
  paper_link?: string;
  notes?: string;
};

interface JournalClubArchiveProps {
  grouped: Record<string, LocalizedSession[]>; // already localized
  locale: "es" | "en";
  archiveTitle: string; // from t('journalClub.past')
  paperLinkLabel: string;
}

export function JournalClubArchive({
  grouped,
  locale,
  archiveTitle,
  paperLinkLabel,
}: JournalClubArchiveProps) {
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <section aria-labelledby="jc-archive" className="mt-16">
      <h2
        id="jc-archive"
        className="font-serif text-3xl font-semibold tracking-tight"
      >
        {archiveTitle}
      </h2>
      {years.map((year) => (
        <section
          key={year}
          aria-labelledby={`jc-year-${year}`}
          className="mt-10"
        >
          <h3
            id={`jc-year-${year}`}
            className="font-serif text-xl font-semibold text-ink-muted"
          >
            {year}
          </h3>
          <ol className="mt-4 list-none">
            {grouped[year].map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                locale={locale}
                paperLinkLabel={paperLinkLabel}
              />
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}
