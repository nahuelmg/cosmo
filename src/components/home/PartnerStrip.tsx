interface PartnerStripProps {
  title: string;
  partners: Array<{ name: string; url?: string }>;
}

export function PartnerStrip({ title, partners }: PartnerStripProps) {
  return (
    <section aria-labelledby="home-partners" className="border-t border-ink/5 bg-surface-alt">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h2 id="home-partners" className="text-sm uppercase tracking-wider text-ink-subtle">
          {title}
        </h2>
        <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 font-serif text-lg text-ink-muted">
          {partners.map(p => (
            <li key={p.name}>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {p.name}
                </a>
              ) : (
                <span>{p.name}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
