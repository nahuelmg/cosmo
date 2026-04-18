interface PersonRowProps {
  name: string;
  role?: string;
  thesisTopic?: string;
  years?: { start: number; end?: number };
}

export function PersonRow({ name, role, thesisTopic, years }: PersonRowProps) {
  let suffix: string | undefined;

  if (years !== undefined) {
    // Past member: "Name — role, YYYY–YYYY" (end omitted → "YYYY–")
    const yearRange = years.end
      ? `${years.start}\u2013${years.end}`
      : `${years.start}\u2013`;
    suffix = role ? `\u2014 ${role}, ${yearRange}` : `\u2014 ${yearRange}`;
  } else if (thesisTopic) {
    // Undergrad with thesis topic: "Name — thesisTopic"
    suffix = `\u2014 ${thesisTopic}`;
  }

  return (
    <li className="py-2 border-b border-ink/5 last:border-b-0">
      <span className="font-serif text-lg">{name}</span>
      {suffix && <span className="ml-2 text-ink-muted">{suffix}</span>}
    </li>
  );
}
