'use client';

import { useMemo, useState } from 'react';
import type { Publication } from '@/content';
import { SourceFilter, type SourceFilterValue } from './SourceFilter';
import { PublicationsYearGroup } from './PublicationsYearGroup';

interface YearGroup {
  year: number;
  publications: Publication[];
}

interface PublicationsClientShellProps {
  groups: YearGroup[];
  memberSurnameList: string[];
  memberOrcidList: [string, string][];
  labels: {
    arxiv: string;
    doi: string;
    preprint: string;
    published: string;
  };
}

export function PublicationsClientShell({
  groups,
  memberSurnameList,
  memberOrcidList,
  labels,
}: PublicationsClientShellProps) {
  const [source, setSource] = useState<SourceFilterValue>('all');

  // Rebuild Set from serializable string[] — Set<string> does not survive the
  // RSC → client boundary in Next.js serialization protocol (non-JSON-serializable).
  // Pass string[] from the server page, rebuild Set once here.
  const memberSurnameSet = useMemo(
    () => new Set(memberSurnameList),
    [memberSurnameList],
  );

  // Rebuild Map from serializable [string, string][] — Map does not survive
  // the RSC → client boundary. Pass entries array from the server page, rebuild once here.
  const memberOrcidMap = useMemo(
    () => new Map(memberOrcidList),
    [memberOrcidList],
  );

  const filteredGroups = useMemo(() => {
    if (source === 'all') return groups;
    return groups
      .map((g) => ({
        year: g.year,
        publications: g.publications.filter((p) => p.source === source),
      }))
      .filter((g) => g.publications.length > 0);
  }, [groups, source]);

  return (
    <>
      <SourceFilter value={source} onChange={setSource} />
      {filteredGroups.map((g) => (
        <PublicationsYearGroup
          key={g.year}
          year={g.year}
          publications={g.publications}
          memberSurnameSet={memberSurnameSet}
          memberOrcidMap={memberOrcidMap}
          labels={labels}
        />
      ))}
    </>
  );
}
