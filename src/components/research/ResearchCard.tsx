import { Atom, Waves, Sparkles, Cpu, HelpCircle, type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  atom: Atom,
  waves: Waves,
  sparkles: Sparkles,
  cpu: Cpu,
};

interface ResearchCardProps {
  id: string;
  title: string;
  shortDescription: string;
  iconName?: string;
}

export function ResearchCard({ id, title, shortDescription, iconName }: ResearchCardProps) {
  const Icon = iconName ? (ICON_MAP[iconName] ?? HelpCircle) : HelpCircle;

  return (
    <article aria-labelledby={`research-${id}`} className="rounded-md bg-surface-alt p-8">
      <Icon aria-hidden="true" className="h-10 w-10 text-accent" />
      <h2 id={`research-${id}`} className="mt-6 font-serif text-2xl font-semibold">
        {title}
      </h2>
      <p className="mt-3 leading-relaxed text-ink-muted">{shortDescription}</p>
    </article>
  );
}
