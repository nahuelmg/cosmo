'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Publication } from '@/content';
import { PublicationsFilterBar } from './PublicationsFilterBar';
import { PublicationsYearGroup } from './PublicationsYearGroup';

interface YearGroup {
  year: number;
  publications: Publication[];
}

interface PublicationsClientShellProps {
  groups: YearGroup[];
  memberSurnameList: string[];
  memberOrcidList: [string, string][];
  /** Members who authored ≥ 1 publication — populates the member dropdown. */
  memberOptions: { slug: string; name: string }[];
  /** [publicationId, memberSlugs] pairs — rebuilt into a Map on the client. */
  memberMatchList: [string, string[]][];
  labels: {
    arxiv: string;
    doi: string;
    preprint: string;
    published: string;
  };
}

// NFD-fold + lowercase for accent-insensitive substring search.
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function PublicationsClientShell({
  groups,
  memberSurnameList,
  memberOrcidList,
  memberOptions,
  memberMatchList,
  labels,
}: PublicationsClientShellProps) {
  const t = useTranslations('publications');
  const [query, setQuery] = useState('');
  const [member, setMember] = useState('');

  // Rebuild Set / Map from serializable arrays — neither survives the
  // RSC → client boundary in Next.js serialization (non-JSON-serializable).
  const memberSurnameSet = useMemo(
    () => new Set(memberSurnameList),
    [memberSurnameList],
  );
  const memberOrcidMap = useMemo(
    () => new Map(memberOrcidList),
    [memberOrcidList],
  );
  const memberMatch = useMemo(
    () => new Map(memberMatchList),
    [memberMatchList],
  );

  const terms = useMemo(
    () => fold(query).split(/\s+/).filter(Boolean),
    [query],
  );

  const { filteredGroups, total } = useMemo(() => {
    const matches = (p: Publication) => {
      if (member && !memberMatch.get(p.id)?.includes(member)) return false;
      if (terms.length > 0) {
        const haystack = fold(
          `${p.title} ${p.authors.join(' ')} ${p.journal} ${p.year}`,
        );
        if (!terms.every((term) => haystack.includes(term))) return false;
      }
      return true;
    };

    const groupsOut = groups
      .map((g) => ({ year: g.year, publications: g.publications.filter(matches) }))
      .filter((g) => g.publications.length > 0);

    const count = groupsOut.reduce((sum, g) => sum + g.publications.length, 0);
    return { filteredGroups: groupsOut, total: count };
  }, [groups, terms, member, memberMatch]);

  const active = query.trim() !== '' || member !== '';

  return (
    <>
      <PublicationsFilterBar
        query={query}
        onQueryChange={setQuery}
        member={member}
        onMemberChange={setMember}
        memberOptions={memberOptions}
        total={total}
        active={active}
        onClear={() => {
          setQuery('');
          setMember('');
        }}
      />
      {filteredGroups.length === 0 ? (
        <p className="mt-10 text-ink-muted">{t('noResults')}</p>
      ) : (
        filteredGroups.map((g) => (
          <PublicationsYearGroup
            key={g.year}
            year={g.year}
            publications={g.publications}
            memberSurnameSet={memberSurnameSet}
            memberOrcidMap={memberOrcidMap}
            labels={labels}
          />
        ))
      )}
    </>
  );
}
