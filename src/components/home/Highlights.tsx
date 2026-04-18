interface HighlightCard {
  title: string;
  body: string;
}

interface HighlightsProps {
  sectionTitle: string;
  cards: [HighlightCard, HighlightCard, HighlightCard];
}

export function Highlights({ sectionTitle, cards }: HighlightsProps) {
  return (
    <section aria-labelledby="home-highlights" className="mx-auto max-w-6xl px-6 py-16">
      <h2 id="home-highlights" className="font-serif text-3xl font-semibold tracking-tight">
        {sectionTitle}
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((c, i) => (
          <article key={i} className="rounded-md bg-surface-alt p-6 shadow-sm">
            <h3 className="font-serif text-xl font-semibold">{c.title}</h3>
            <p className="mt-2 text-ink-muted">{c.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
