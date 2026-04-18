import { ResearchCard } from './ResearchCard';

interface ResearchGridProps {
  areas: Array<{
    id: string;
    title: string;
    shortDescription: string;
    iconName?: string;
  }>;
}

export function ResearchGrid({ areas }: ResearchGridProps) {
  return (
    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
      {areas.map((a) => (
        <ResearchCard
          key={a.id}
          id={a.id}
          title={a.title}
          shortDescription={a.shortDescription}
          iconName={a.iconName}
        />
      ))}
    </div>
  );
}
