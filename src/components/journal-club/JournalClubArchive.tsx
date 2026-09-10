/**
 * JournalClubArchive — past sessions grouped by academic year.
 *
 * Server Component. Academic-year keys are "YYYY-YYYY"; lexicographic
 * descending sort gives newest season first.
 */

import { SessionRow } from "./SessionRow";

interface Session {
  id: string;
  date: string;
  start_time?: string;
  location?: string;
  speaker: string;
  speaker_position?: string;
  affiliation?: string;
  title: string;
  abstract?: string;
  paper_link?: string;
  notes?: string;
}

interface JournalClubArchiveProps {
  grouped: Record<string, Session[]>;
  locale: "es" | "en";
  archiveTitle: string;
  paperLinkLabel: string;
  abstractLabel: string;
}

export function JournalClubArchive({
  grouped,
  locale,
  archiveTitle,
  paperLinkLabel,
  abstractLabel,
}: JournalClubArchiveProps) {
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <section aria-labelledby="jc-archive" className="mt-16">
      <h2
        id="jc-archive"
        className="font-serif text-3xl font-semibold tracking-tight leading-tight"
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
          <ul className="mt-4 grid list-none grid-cols-1 gap-3">
            {grouped[year].map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                locale={locale}
                paperLinkLabel={paperLinkLabel}
                abstractLabel={abstractLabel}
              />
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
