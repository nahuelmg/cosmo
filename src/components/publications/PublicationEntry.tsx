interface PublicationEntryProps {
  publication: {
    id: string;
    authors: string[];
    title: string;
    journal: string;
    year: number;
    arxiv?: string;
    doi?: string;
  };
  labels: {
    arxiv: string; // "arXiv" — from messages/publications.arxiv
    doi: string;   // "DOI"   — from messages/publications.doi
  };
}

export function PublicationEntry({ publication, labels }: PublicationEntryProps) {
  return (
    <li id={`pub-${publication.id}`} className="py-5 border-b border-ink/5 last:border-b-0">
      <p className="font-serif leading-snug">
        <span className="text-ink">{publication.authors.join(', ')}.</span>{' '}
        <span className="italic">{publication.title}</span>.{' '}
        <span className="text-ink-muted">{publication.journal}</span>
        <span className="text-ink-muted"> ({publication.year}).</span>
      </p>
      {(publication.arxiv || publication.doi) && (
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {publication.arxiv && (
            <a
              href={`https://arxiv.org/abs/${publication.arxiv}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring rounded"
            >
              {labels.arxiv}:{publication.arxiv}
            </a>
          )}
          {publication.doi && (
            <a
              href={`https://doi.org/${publication.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring rounded"
            >
              {labels.doi}:{publication.doi}
            </a>
          )}
        </p>
      )}
    </li>
  );
}
