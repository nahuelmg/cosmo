/**
 * Pure helpers for the journal club display layer.
 *
 * Side-effect-free (no React, no I/O). Consumed by
 * src/components/journal-club/JournalClubArchive.tsx.
 */

interface DatedSession {
  date: string; // ISO YYYY-MM-DD
}

/**
 * Heading label for one archive group.
 *
 * Sessions are grouped by `academic_year`, the "YYYY-YYYY" Argentine season
 * (August of Y through July of Y+1). The season key is the right grouping
 * anchor but the wrong heading: a season whose sessions all happened in one
 * calendar year would advertise a year in which nothing was presented. The
 * label therefore spans only the years actually covered by the group, so
 * "2026-2027" reads as "2026" until a 2027 session exists.
 */
export function formatArchiveYearLabel(
  academicYear: string,
  sessions: readonly DatedSession[],
): string {
  const years = [...new Set(sessions.map((s) => s.date.slice(0, 4)))].sort();
  if (years.length === 0) return academicYear;
  const [first] = years;
  const last = years[years.length - 1];
  return first === last ? first : `${first}-${last}`;
}

/**
 * Labels for every archive group, keyed by academic year.
 *
 * Two adjacent seasons can collapse to the same calendar year (Jan–Jul 2026
 * belongs to "2025-2026", Aug–Dec 2026 to "2026-2027"). Repeating a heading
 * would read as a duplicate, so on a collision every colliding group falls
 * back to its full season label.
 */
export function formatArchiveYearLabels(
  grouped: Record<string, readonly DatedSession[]>,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [academicYear, sessions] of Object.entries(grouped)) {
    labels[academicYear] = formatArchiveYearLabel(academicYear, sessions);
  }

  const counts = new Map<string, number>();
  for (const label of Object.values(labels)) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  for (const [academicYear, label] of Object.entries(labels)) {
    if ((counts.get(label) ?? 0) > 1) labels[academicYear] = academicYear;
  }

  return labels;
}
