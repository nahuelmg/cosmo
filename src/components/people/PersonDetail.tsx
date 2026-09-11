import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { EmailLink } from '@/components/ui/EmailLink';
import type { Publication } from '@/content';
import { PublicationEntry } from '@/components/publications/PublicationEntry';

interface Labels {
  researchInterests: string;
  email: string;
  office: string;
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
  full_bio?: string;
  research_interests: string[];
  current_position?: string;
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
  memberPubs: Publication[];
  memberSurnameSet: Set<string>;
  memberOrcidMap: Map<string, string>;
  pubLabels: {
    arxiv: string;
    doi: string;
    preprint: string;
    published: string;
  };
  publicationsHeading: string;
}

export function PersonDetail({
  person,
  labels,
  memberPubs,
  memberSurnameSet,
  memberOrcidMap,
  pubLabels,
  publicationsHeading,
}: PersonDetailProps) {
  const emailParts = person.contact.email
    ? person.contact.email.split('@')
    : null;

  return (
    <article className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/people"
        className="text-sm text-ink-muted hover:text-ink underline underline-offset-4 decoration-accent"
      >
        ← {labels.backToPeople}
      </Link>

      <header className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[180px_1fr] md:items-start">
        <div className="relative w-full aspect-[4/5] rounded-md overflow-hidden bg-surface-alt max-w-[180px] mx-auto md:mx-0">
          {person.photo ? (
            <Image
              src={`/${person.photo}`}
              alt=""
              fill
              sizes="(min-width: 768px) 180px, 180px"
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
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">
            {person.name}
          </h1>
          <p className="mt-2 text-lg text-ink-muted">{person.role}</p>
          {person.current_position && (
            <p className="mt-1 text-sm text-ink-subtle">
              {person.current_position}
            </p>
          )}
          {(emailParts || person.contact.office) && (
            <dl className="mt-4 space-y-1 text-sm text-ink-muted">
              {emailParts && (
                <div className="flex gap-2">
                  <dt className="text-ink-subtle">{labels.email}</dt>
                  <dd>
                    <EmailLink
                      user={emailParts[0]}
                      domain={emailParts[1]}
                      className="text-accent underline underline-offset-4"
                    />
                  </dd>
                </div>
              )}
              {person.contact.office && (
                <div className="flex gap-2">
                  <dt className="text-ink-subtle">{labels.office}</dt>
                  <dd>{person.contact.office}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </header>

      {person.full_bio && (
        <section className="mt-12 prose max-w-none">
          {person.full_bio.split('\n\n').map((para, i) => (
            <p key={i} className="font-serif text-lg leading-relaxed">
              {para}
            </p>
          ))}
        </section>
      )}

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

      {memberPubs.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">
            {publicationsHeading}
          </h2>
          <ol className="mt-4 list-none">
            {memberPubs.map((pub) => (
              <PublicationEntry
                key={pub.id}
                publication={pub}
                memberSurnameSet={memberSurnameSet}
                memberOrcidMap={memberOrcidMap}
                labels={pubLabels}
              />
            ))}
          </ol>
        </section>
      )}

      {(Boolean(person.contact.scholar) || person.social_links.length > 0) && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">{labels.links}</h2>
          {person.contact.scholar && (
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-[140px_1fr]">
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
