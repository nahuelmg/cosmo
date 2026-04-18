import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { EmailLink } from '@/components/ui/EmailLink';

interface SelectedPub {
  id: string;
  authors: string[];
  title: string;
  journal: string;
  year: number;
  arxiv?: string;
  doi?: string;
}

interface Labels {
  researchInterests: string;
  selectedPublications: string;
  email: string;
  office: string;
  orcid: string;
  scholar: string;
  links: string;
  backToPeople: string;
}

// LocalizedPerson shape with all bilingual fields resolved to plain strings
interface LocalizedPerson {
  slug: string;
  name: string;
  role: string;
  photo?: string;
  full_bio: string;
  research_interests: string[];
  current_position?: string;
  publications_selected: string[];
  contact: {
    email?: string;
    orcid?: string;
    office?: string;
    scholar?: string;
  };
  social_links: Array<{
    platform: string;
    url: string;
  }>;
  [key: string]: unknown;
}

interface PersonDetailProps {
  person: LocalizedPerson;
  labels: Labels;
  selectedPubs: SelectedPub[];
}

export function PersonDetail({ person, labels, selectedPubs }: PersonDetailProps) {
  const hasContactInfo =
    Boolean(person.contact.email) ||
    Boolean(person.contact.office) ||
    Boolean(person.contact.orcid) ||
    Boolean(person.contact.scholar);

  return (
    <article className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/people"
        className="text-sm text-ink-muted hover:text-ink underline underline-offset-4 decoration-accent"
      >
        ← {labels.backToPeople}
      </Link>

      <header className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr] md:items-start">
        <div className="relative w-full aspect-square rounded-md overflow-hidden bg-surface-alt">
          {person.photo ? (
            <Image
              src={`/${person.photo}`}
              alt=""
              fill
              sizes="(min-width: 768px) 240px, 100vw"
              className="object-cover"
              preload={true}
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center text-ink-subtle font-serif text-6xl"
            >
              {person.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            {person.name}
          </h1>
          <p className="mt-2 text-lg text-ink-muted">{person.role}</p>
          {person.current_position && (
            <p className="mt-1 text-sm text-ink-subtle">
              {person.current_position}
            </p>
          )}
        </div>
      </header>

      <section className="mt-12 prose max-w-none">
        {person.full_bio.split('\n\n').map((para, i) => (
          <p key={i} className="font-serif text-lg leading-relaxed">
            {para}
          </p>
        ))}
      </section>

      {person.research_interests.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">
            {labels.researchInterests}
          </h2>
          <ul className="mt-4 list-disc pl-6 space-y-1">
            {person.research_interests.map((interest, idx) => (
              <li key={idx}>{interest}</li>
            ))}
          </ul>
        </section>
      )}

      {selectedPubs.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">
            {labels.selectedPublications}
          </h2>
          <ul className="mt-4 space-y-4">
            {selectedPubs.map((pub) => (
              <li key={pub.id} className="text-ink-muted">
                <span className="text-ink">{pub.authors.join(', ')}</span>.{' '}
                <span className="italic">{pub.title}</span>.{' '}
                <span>{pub.journal}</span> ({pub.year}).
                {pub.arxiv && (
                  <>
                    {' '}
                    <a
                      href={`https://arxiv.org/abs/${pub.arxiv}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline underline-offset-4"
                    >
                      arXiv:{pub.arxiv}
                    </a>
                  </>
                )}
                {pub.doi && (
                  <>
                    {' '}
                    <a
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline underline-offset-4"
                    >
                      doi:{pub.doi}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(hasContactInfo || person.social_links.length > 0) && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">{labels.links}</h2>
          {hasContactInfo && (
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-[140px_1fr]">
              {person.contact.email &&
                (() => {
                  const [user, domain] = person.contact.email!.split('@');
                  return (
                    <>
                      <dt className="text-ink-muted">{labels.email}</dt>
                      <dd>
                        <EmailLink user={user} domain={domain} />
                      </dd>
                    </>
                  );
                })()}
              {person.contact.office && (
                <>
                  <dt className="text-ink-muted">{labels.office}</dt>
                  <dd>{person.contact.office}</dd>
                </>
              )}
              {person.contact.orcid && (
                <>
                  <dt className="text-ink-muted">{labels.orcid}</dt>
                  <dd>
                    <a
                      href={`https://orcid.org/${person.contact.orcid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline underline-offset-4"
                    >
                      {person.contact.orcid}
                    </a>
                  </dd>
                </>
              )}
              {person.contact.scholar && (
                <>
                  <dt className="text-ink-muted">{labels.scholar}</dt>
                  <dd>
                    <a
                      href={person.contact.scholar}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline underline-offset-4"
                    >
                      {labels.scholar}
                    </a>
                  </dd>
                </>
              )}
            </dl>
          )}
          {person.social_links.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-4 text-sm">
              {person.social_links.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline underline-offset-4 capitalize"
                  >
                    {s.platform}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </article>
  );
}
