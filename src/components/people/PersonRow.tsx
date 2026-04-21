interface PersonRowProps {
  name: string;
  role?: string;
  thesisTopic?: string;
  currentPosition?: string;
  years?: { start: number; end?: number };
  thesisLabel?: string;
  nowAtLabel?: string;
}

export function PersonRow({
  name,
  role,
  thesisTopic,
  currentPosition,
  years,
  thesisLabel,
  nowAtLabel,
}: PersonRowProps) {
  const yearRange = years
    ? years.end
      ? `${years.start}\u2013${years.end}`
      : `${years.start}\u2013`
    : undefined;
  const dateTime = years
    ? years.end
      ? `${years.start}/${years.end}`
      : `${years.start}/`
    : undefined;

  return (
    <li>
      <article className="flex h-full flex-col rounded-md bg-surface-alt p-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-serif text-lg font-semibold leading-snug">{name}</h3>
          {yearRange && (
            <time
              dateTime={dateTime}
              className="shrink-0 text-sm tabular-nums text-ink-muted"
            >
              {yearRange}
            </time>
          )}
        </div>
        {role && <p className="mt-1 text-sm text-ink-muted">{role}</p>}
        {thesisTopic && (
          <p className="mt-2 text-sm text-ink-muted">
            {thesisLabel && (
              <span className="mr-2 text-xs uppercase tracking-wider text-ink-subtle">
                {thesisLabel}
              </span>
            )}
            <em className="font-normal italic">{thesisTopic}</em>
          </p>
        )}
        {currentPosition && (
          <p className="mt-2 text-sm text-ink-muted">
            {nowAtLabel && (
              <span className="mr-2 text-xs uppercase tracking-wider text-ink-subtle">
                {nowAtLabel}
              </span>
            )}
            {currentPosition}
          </p>
        )}
      </article>
    </li>
  );
}
