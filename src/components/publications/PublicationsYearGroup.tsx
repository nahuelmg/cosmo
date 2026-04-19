import type { Publication } from '@/content';
import { PublicationEntry } from './PublicationEntry';

interface PublicationsYearGroupProps {
  year: number;
  publications: Publication[];
  memberSurnameSet: Set<string>;
  labels: {
    arxiv: string;
    doi: string;
    preprint: string;
    published: string;
  };
}

export function PublicationsYearGroup({
  year,
  publications,
  memberSurnameSet,
  labels,
}: PublicationsYearGroupProps) {
  return (
    <section aria-labelledby={`year-${year}`} className="mt-10">
      <h2 id={`year-${year}`} className="font-serif text-3xl font-semibold tracking-tight">
        {year}
      </h2>
      <ol className="mt-4 list-none">
        {publications.map((pub) => (
          <PublicationEntry
            key={pub.id}
            publication={pub}
            memberSurnameSet={memberSurnameSet}
            labels={labels}
          />
        ))}
      </ol>
    </section>
  );
}
