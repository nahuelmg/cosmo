import { PersonRow } from './PersonRow';

// LocalizedPerson is the return type of getLocalizedPeople from @/content
// with bilingual fields resolved to plain strings.
type LocalizedPerson = {
  slug: string;
  name: string;
  role: string;
  thesis_topic?: string;
  current_position?: string;
  years?: { start: number; end?: number };
  [key: string]: unknown;
};

interface PeoplePlainSectionProps {
  id: string;
  title: string;
  people: LocalizedPerson[];
  category: 'undergrad' | 'past' | 'plain';
  thesisLabel: string;
  nowAtLabel: string;
}

export function PeoplePlainSection({
  id,
  title,
  people,
  category,
  thesisLabel,
  nowAtLabel,
}: PeoplePlainSectionProps) {
  return (
    <section
      aria-labelledby={`people-${id}`}
      className="mx-auto max-w-5xl px-6 py-12"
    >
      <h2
        id={`people-${id}`}
        className="font-serif text-3xl font-semibold tracking-tight"
      >
        {title}
      </h2>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {people.map((p) => {
          if (category === 'past') {
            return (
              <PersonRow
                key={p.slug}
                name={p.name}
                role={p.role}
                years={p.years}
                currentPosition={p.current_position}
                nowAtLabel={nowAtLabel}
              />
            );
          }
          if (category === 'undergrad') {
            return (
              <PersonRow
                key={p.slug}
                name={p.name}
                thesisTopic={p.thesis_topic}
                thesisLabel={thesisLabel}
              />
            );
          }
          return (
            <PersonRow
              key={p.slug}
              name={p.name}
              role={p.role}
            />
          );
        })}
      </ul>
    </section>
  );
}
