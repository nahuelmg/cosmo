/**
 * Accessor for journal club sessions content.
 * Parses and validates content/journal-club.json at module load.
 * All consumers receive typed, validated data.
 */

import rawSessions from "../../../content/journal-club.json";
import {
  JournalClubSchema,
  type JournalClubSession,
} from "../schemas/journal-club.schema";
import { localize, type Locale } from "../schemas/shared";

// Parse at module load — throws immediately if JSON is malformed or invalid
const sessions: JournalClubSession[] = JournalClubSchema.parse(rawSessions);

/**
 * Returns all journal club sessions (unfiltered, unsorted).
 */
export function getJournalClub(): JournalClubSession[] {
  return sessions;
}

/**
 * Returns upcoming sessions sorted by date ascending (soonest first).
 */
export function getUpcomingSessions(): JournalClubSession[] {
  return sessions
    .filter((s) => s.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Returns past sessions grouped by academic_year.
 * Within each group sessions are sorted by date descending (most recent first).
 * Consumers use Object.keys() to get available academic years for display.
 */
export function getPastSessionsByYear(): Record<string, JournalClubSession[]> {
  const past = sessions.filter((s) => s.status === "past");
  const grouped: Record<string, JournalClubSession[]> = {};
  past.forEach((s) => {
    const year = s.academic_year!; // superRefine guarantees academic_year present on past sessions
    (grouped[year] ??= []).push(s);
  });
  // Sort each group by date descending
  Object.values(grouped).forEach((arr) =>
    arr.sort((a, b) => b.date.localeCompare(a.date)),
  );
  return grouped;
}

/**
 * Returns a single session with the optional `notes` bilingual field resolved
 * to the requested locale. All other fields are returned as-is.
 */
export function getLocalizedSession(
  session: JournalClubSession,
  locale: Locale,
) {
  return {
    ...session,
    notes: session.notes ? localize(session.notes, locale) : undefined,
  };
}
