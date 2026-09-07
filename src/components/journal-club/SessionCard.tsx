/**
 * SessionCard — a single upcoming journal club session (spacious card).
 *
 * Server Component. Consumes a session straight from the content layer
 * (all fields are canonical / single-language since v1.4).
 */

interface Session {
  id: string;
  date: string; // "YYYY-MM-DD"
  speaker: string;
  speaker_position?: string;
  affiliation?: string;
  title: string;
  abstract?: string;
  paper_link?: string;
  notes?: string;
}

interface SessionCardProps {
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

export function SessionCard({
  session,
  locale,
  paperLinkLabel,
  abstractLabel,
}: SessionCardProps) {
  return (
    <li id={`session-${session.id}`}>
      <article className="rounded-md bg-surface-alt p-6">
        <p className="text-sm font-medium text-ink-muted">
          <time dateTime={session.date}>{longDate(session.date, locale)}</time>
        </p>
        <h3 className="mt-1 font-serif text-2xl font-semibold leading-tight">
          {session.title}
        </h3>
        <p className="mt-2 text-sm text-ink-muted">{speakerLine(session)}</p>

        {session.notes && (
          <p className="mt-3 text-sm leading-relaxed">{session.notes}</p>
        )}

        {session.abstract && (
          <details className="mt-3 text-sm">
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
            className="mt-4 inline-block text-sm text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt rounded"
          >
            {paperLinkLabel} →
          </a>
        )}
      </article>
    </li>
  );
}
