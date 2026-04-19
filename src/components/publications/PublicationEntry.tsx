import type { Publication } from "@/content";
import { formatAuthors, getSourcePillHref } from "@/lib/publications-helpers";

interface PublicationEntryProps {
  publication: Publication;
  memberSurnameSet: Set<string>;
  labels: {
    arxiv: string;      // "arXiv" — from messages/publications.arxiv
    doi: string;        // "DOI"   — from messages/publications.doi
    preprint: string;   // "Preprint" / "Preprint" — from messages/publications.preprint
    published: string;  // "Publicado" / "Published" — NEW (publications.published)
  };
}

export function PublicationEntry({
  publication,
  memberSurnameSet,
  labels,
}: PublicationEntryProps) {
  const { tokens, etAl } = formatAuthors(publication.authors, memberSurnameSet);

  return (
    <li id={`pub-${publication.id}`} className="py-5 border-b border-ink/5 last:border-b-0">
      {/* Author list with member bold-highlighting */}
      <p className="font-serif leading-snug">
        <span className="text-ink">
          {tokens.map((token, i) => (
            <span key={i}>
              {i > 0 && ", "}
              {token.isEllipsis ? (
                <span>{token.display}</span>
              ) : token.isMember ? (
                <strong className="font-bold">{token.display}</strong>
              ) : (
                <span>{token.display}</span>
              )}
            </span>
          ))}
          {etAl && " et al."}
          {"."}
        </span>{" "}
        <span className="italic">{publication.title}</span>.{" "}
        <span className="text-ink-muted">{publication.journal}</span>
        <span className="text-ink-muted"> ({publication.year}).</span>
      </p>

      {/* Two-chip cluster: source pill + preprint/published status */}
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {/* Source pill — link for InspireHEP/arXiv, non-link span for Manual */}
        {(() => {
          const href = getSourcePillHref(publication);
          const pillBase =
            "inline-flex items-center rounded-full px-2 py-0.5 font-medium";
          const tone =
            publication.source === "inspirehep"
              ? "bg-[oklch(0.95_0.04_235)] text-[oklch(0.38_0.10_235)]"
              : publication.source === "arxiv"
                ? "bg-[oklch(0.95_0.05_30)] text-[oklch(0.42_0.12_30)]"
                : "bg-surface-alt text-ink-muted";
          const label =
            publication.source === "inspirehep"
              ? "InspireHEP"
              : publication.source === "arxiv"
                ? "arXiv"
                : "Manual";
          return href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${pillBase} ${tone} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring`}
            >
              {label}
            </a>
          ) : (
            <span className={`${pillBase} ${tone}`}>{label}</span>
          );
        })()}

        {/* Preprint / published chip — always neutral, never a link */}
        <span className="inline-flex items-center rounded-full bg-surface-alt px-2 py-0.5 font-medium text-ink-subtle">
          {publication.journal === "Preprint" ? labels.preprint : labels.published}
        </span>
      </p>

      {/* arXiv / DOI external link row — preserved as before */}
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
