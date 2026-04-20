import { PersonCard } from './PersonCard';

// LocalizedPerson is the return type of getLocalizedPeople/getLocalizedPerson
// from @/content — bilingual fields resolved to plain strings.
type LocalizedPerson = {
  slug: string;
  name: string;
  role: string;
  photo?: string;
  category: string;
  [key: string]: unknown;
};

interface PeopleSectionProps {
  id: string;
  title: string;
  people: LocalizedPerson[];
}

export function PeopleSection({ id, title, people }: PeopleSectionProps) {
  return (
    <section aria-labelledby={`people-${id}`} className="mx-auto max-w-6xl px-6 py-12">
      <h2
        id={`people-${id}`}
        className="font-serif text-3xl font-semibold tracking-tight"
      >
        {title}
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {people.map((p) => (
          <PersonCard
            key={p.slug}
            slug={p.slug}
            name={p.name}
            role={p.role}
            photo={p.photo}
          />
        ))}
      </div>
    </section>
  );
}
