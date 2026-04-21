import { getResearchIcon } from './icons';

interface ResearchCardProps {
  id: string;
  title: string;
  shortDescription: string;
  iconName?: string;
}

export function ResearchCard({ id, title, shortDescription, iconName }: ResearchCardProps) {
  const Icon = getResearchIcon(iconName);

  return (
    <a
      href={`#detail-${id}`}
      aria-labelledby={`research-${id}`}
      className="group block cursor-pointer rounded-md bg-surface-alt p-6 transition-transform duration-150 motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <Icon aria-hidden="true" className="h-10 w-10 text-accent" />
      <h2
        id={`research-${id}`}
        className="mt-6 font-serif text-2xl font-semibold transition-colors duration-150 group-hover:text-accent"
      >
        {title}
      </h2>
      <p className="mt-3 leading-relaxed text-ink-muted">{shortDescription}</p>
    </a>
  );
}
