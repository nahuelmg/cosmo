/**
 * SessionRow — single journal club session row.
 *
 * Server Component. Receives already-localized session props from the page RSC.
 * Does NOT call getLocalizedSession itself.
 */

interface SessionRowProps {
  session: {
    id: string;
    date: string; // "YYYY-MM-DD"
    speaker: string; // canonical
    affiliation: string; // canonical institution
    title: string; // paper title (paper-native language)
    paper_link?: string; // full URL
    notes?: string; // already localized (from getLocalizedSession in page)
  };
  locale: "es" | "en"; // for Intl.DateTimeFormat
  paperLinkLabel: string; // from t('journalClub.paperLink')
}

export function SessionRow({ session, locale, paperLinkLabel }: SessionRowProps) {
  const formatted = new Intl.DateTimeFormat(
    locale === "es" ? "es-AR" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  ).format(new Date(session.date));

  return (
    <li
      id={`session-${session.id}`}
      className="py-5 border-b border-ink/5 last:border-b-0"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm text-ink-muted">
          <time dateTime={session.date}>{formatted}</time> · {session.speaker}{" "}
          ({session.affiliation})
        </p>
        <p className="font-serif text-lg leading-snug">{session.title}</p>
        {session.notes && (
          <p className="text-sm text-ink-muted">{session.notes}</p>
        )}
        {session.paper_link && (
          <a
            href={session.paper_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring rounded self-start"
          >
            {paperLinkLabel} →
          </a>
        )}
      </div>
    </li>
  );
}
