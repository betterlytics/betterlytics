const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const BASELINE_DAYS = 5;
export const BASELINE_MIN_DAILY_AVERAGE = 20;
export const SILENCE_HOURS = 24;
// Silences older than this are no longer new episodes, so a late or restarted worker can't email stale ones
export const SILENCE_LOOKBACK_HOURS = 72;
export const OUTAGE_SILENT_SHARE = 0.2;

/** Event totals per UTC day (YYYY-MM-DD) for one site. */
export type DailyEventTotals = Map<string, number>;

export type SilentSite = { siteId: string; lastEventAt: Date };

export type TrackingSilenceClassification = {
  baselineSiteCount: number;
  silent: SilentSite[];
  isOutage: boolean;
};

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDayKey(dayKey: string, days: number): string {
  return utcDayKey(new Date(Date.parse(`${dayKey}T00:00:00Z`) + days * DAY_MS));
}

export function lookbackStart(now: Date): Date {
  return new Date(now.getTime() - SILENCE_LOOKBACK_HOURS * HOUR_MS);
}

/** First UTC day whose totals the classification may need. */
export function earliestNeededDay(now: Date): string {
  return shiftDayKey(utcDayKey(lookbackStart(now)), -BASELINE_DAYS);
}

export function latestActiveDay(daily: DailyEventTotals): string | null {
  let latest: string | null = null;
  for (const [day, total] of daily) {
    if (total > 0 && (latest === null || day > latest)) latest = day;
  }
  return latest;
}

/** Events on each of the 5 full UTC days before the last event's day, averaging at least 20 a day. */
export function hasBaseline(daily: DailyEventTotals, lastEventDay: string): boolean {
  let sum = 0;
  for (let offset = 1; offset <= BASELINE_DAYS; offset++) {
    const total = daily.get(shiftDayKey(lastEventDay, -offset)) ?? 0;
    if (total <= 0) return false;
    sum += total;
  }
  return sum / BASELINE_DAYS >= BASELINE_MIN_DAILY_AVERAGE;
}

export function isSilent(lastEventAt: Date, now: Date): boolean {
  return now.getTime() - lastEventAt.getTime() >= SILENCE_HOURS * HOUR_MS;
}

export function isOutage(silentCount: number, baselineSiteCount: number): boolean {
  return baselineSiteCount > 0 && silentCount / baselineSiteCount > OUTAGE_SILENT_SHARE;
}

/** Sites with nothing today whose last active day is inside the lookback; only these need an exact last-event time. */
export function findSilenceCandidates(dailyBySite: Map<string, DailyEventTotals>, now: Date): string[] {
  const today = utcDayKey(now);
  const firstLookbackDay = utcDayKey(lookbackStart(now));
  const candidates: string[] = [];
  for (const [siteId, daily] of dailyBySite) {
    const latest = latestActiveDay(daily);
    if (latest !== null && latest < today && latest >= firstLookbackDay) candidates.push(siteId);
  }
  return candidates;
}

/**
 * Classifies every site with recent daily totals. Sites active today use today as their last-event day;
 * candidates use their exact last-event time, and drop out once it is older than the lookback.
 */
export function classifyTrackingSilence(
  dailyBySite: Map<string, DailyEventTotals>,
  lastEventAtByCandidate: Map<string, Date>,
  now: Date,
): TrackingSilenceClassification {
  const today = utcDayKey(now);
  const lookbackStartMs = lookbackStart(now).getTime();
  let baselineSiteCount = 0;
  const silent: SilentSite[] = [];

  for (const [siteId, daily] of dailyBySite) {
    const latest = latestActiveDay(daily);
    if (latest === null) continue;

    if (latest === today) {
      if (hasBaseline(daily, today)) baselineSiteCount++;
      continue;
    }

    const lastEventAt = lastEventAtByCandidate.get(siteId);
    if (!lastEventAt || lastEventAt.getTime() <= lookbackStartMs) continue;
    if (!hasBaseline(daily, utcDayKey(lastEventAt))) continue;

    baselineSiteCount++;
    if (isSilent(lastEventAt, now)) silent.push({ siteId, lastEventAt });
  }

  return { baselineSiteCount, silent, isOutage: isOutage(silent.length, baselineSiteCount) };
}
