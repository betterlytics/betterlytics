import type { StatusPageIncidentStatusValue } from '@/entities/analytics/statusPage/statusPageIncident.entities';

export type PlacementRow = {
  status: StatusPageIncidentStatusValue;
  date: Date;
};

export type ComposerPlacement = {
  /** Status the incident was showing at the entry's timestamp, or null if nothing precedes it. */
  previousStatus: StatusPageIncidentStatusValue | null;
  /** Whether the entry lands at the end of the timeline, and so moves the incident's status. */
  isLatestEntry: boolean;
  /** Whether the entry would say nothing new, and so posts nothing on save. */
  isNoop: boolean;
};

/**
 * Works out where a composed update lands in an incident's timeline and what it changes.
 *
 * An update answers to its own timestamp rather than to the end of the timeline: backdating one
 * inserts it mid-history, where the status it follows is whatever was in effect at that moment, and
 * where it leaves the incident's current status untouched because later entries still sit after it.
 *
 * @param rows Existing timeline entries, newest first.
 * @param fallbackStatus Status to assume when `rows` is empty but the incident exists (the timeline
 *   is still loading); pass null when composing a brand-new incident.
 */
export function resolveComposerPlacement({
  rows,
  entryDate,
  status,
  message,
  fallbackStatus,
}: {
  rows: PlacementRow[];
  entryDate: Date;
  status: StatusPageIncidentStatusValue;
  message: string;
  fallbackStatus: StatusPageIncidentStatusValue | null;
}): ComposerPlacement {
  const priorRow = rows.find((row) => row.date.getTime() < entryDate.getTime());
  const isLatestEntry = rows.length === 0 || entryDate.getTime() > rows[0].date.getTime();
  const previousStatus = rows.length === 0 ? fallbackStatus : (priorRow?.status ?? null);
  const isNoop = message.trim().length === 0 && status === previousStatus;

  return { previousStatus, isLatestEntry, isNoop };
}
