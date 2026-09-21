/**
 * SessionRow — a single past journal club session (dense archive card).
 *
 * Server Component. Consumes a locale-resolved session from the content layer.
 */

interface Session {
  id: string;
  date: string; // "YYYY-MM-DD"
  start_time?: string; // "HH:MM" (24-hour, local)
  location?: string; // room / venue
  speaker: string;
  speaker_position?: string;
  affiliation?: string;
  title: string;
  abstract?: string;
  paper_link?: string;
  notes?: string;
}

interface SessionRowProps {
  session: Session;
  locale: "es" | "en";
  paperLinkLabel: string;
  abstractLabel: string;
}

function longDate(iso: string, locale: "es" | "en") {
  // Noon avoids the UTC-midnight → previous-day rollover in western timezones.
  return new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

function speakerLine(s: Session) {
  return [
    s.speaker_position ? `${s.speaker}, ${s.speaker_position}` : s.speaker,
    s.affiliation,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function SessionRow({
  session,
  locale,
  paperLinkLabel,
  abstractLabel,
}: SessionRowProps) {
  return (
    <li id={`session-${session.id}`}>
      <article className="rounded-md bg-surface-alt p-4">
        <p className="text-sm text-ink-muted">
          <time
            dateTime={
              session.start_time
                ? `${session.date}T${session.start_time}`
                : session.date
            }
          >
            {longDate(session.date, locale)}
          </time>
          {session.start_time && ` · ${session.start_time}`}
          {session.location && ` · ${session.location}`}
          {" · "}
          {speakerLine(session)}
        </p>
        <p className="mt-1 font-serif text-lg leading-snug">{session.title}</p>

        {session.notes && (
          <p className="mt-1 text-sm text-ink-muted">{session.notes}</p>
        )}

        {session.abstract && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-ink-muted marker:text-ink-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt rounded">
              {abstractLabel}
            </summary>
            <p className="mt-2 leading-relaxed text-ink-muted">
              {session.abstract}
            </p>
          </details>
        )}

        {session.paper_link && (
          <a
            href={session.paper_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt rounded"
          >
            {paperLinkLabel} →
          </a>
        )}
      </article>
    </li>
  );
}
