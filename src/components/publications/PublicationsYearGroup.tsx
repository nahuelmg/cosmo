import { PublicationEntry } from './PublicationEntry';

interface PublicationEntryPublication {
  id: string;
  authors: string[];
  title: string;
  journal: string;
  year: number;
  arxiv?: string;
  doi?: string;
}

interface PublicationsYearGroupProps {
  year: number;
  publications: PublicationEntryPublication[];
  labels: {
    arxiv: string;
    doi: string;
  };
}

export function PublicationsYearGroup({ year, publications, labels }: PublicationsYearGroupProps) {
  return (
    <section aria-labelledby={`year-${year}`} className="mt-10">
      <h2 id={`year-${year}`} className="font-serif text-3xl font-semibold tracking-tight">
        {year}
      </h2>
      <ol className="mt-4 list-none">
        {publications.map((pub) => (
          <PublicationEntry key={pub.id} publication={pub} labels={labels} />
        ))}
      </ol>
    </section>
  );
}
