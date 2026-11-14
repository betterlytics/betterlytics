import moment from 'moment-timezone';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const MINUTE_MS = 60_000;
// Far beyond what the granularity picker produces, so a crafted range can't make a demo view build millions of buckets
const MAX_BUCKETS = 5_000;

export const BUCKET_STEP: Record<string, { amount: number; unit: moment.unitOfTime.DurationConstructor }> = {
  minute_1: { amount: 1, unit: 'minutes' },
  minute_15: { amount: 15, unit: 'minutes' },
  minute_30: { amount: 30, unit: 'minutes' },
  hour: { amount: 1, unit: 'hour' },
  day: { amount: 1, unit: 'day' },
  week: { amount: 1, unit: 'week' },
  month: { amount: 1, unit: 'month' },
};

// Deterministic value in [0, 1), so every request renders the same numbers
export function hashToUnit(...parts: Array<string | number>): number {
  let hash = 0x811c9dc5;
  for (const char of parts.join('|')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  // Final mix, so inputs that differ only in their last characters still land far apart
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0x100000000;
}

// Bucket starts as ClickHouse's toStartOfInterval in the query timezone would produce them, none past MAX_BUCKETS
export function bucketStarts(siteQuery: BASiteQuery): moment.Moment[] {
  const step = BUCKET_STEP[siteQuery.granularity] ?? BUCKET_STEP.hour;
  const cursor = moment.tz(siteQuery.startDate, siteQuery.timezone);
  if (step.unit === 'minutes') {
    cursor.startOf('minute').subtract(cursor.minute() % step.amount, 'minutes');
  } else {
    cursor.startOf(
      step.unit === 'week' ? 'isoWeek' : step.unit === 'month' ? 'month' : step.unit === 'day' ? 'day' : 'hour',
    );
  }
  const starts: moment.Moment[] = [];
  while (cursor.valueOf() <= siteQuery.endDate.getTime()) {
    if (starts.length === MAX_BUCKETS) return [];
    starts.push(cursor.clone());
    cursor.add(step.amount, step.unit);
  }
  return starts;
}

// Whole minutes, so separate requests for the same demo view agree on timestamps
export function demoNow(): number {
  return Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
}

// A demo recording re-dated relative to now, so the demo always shows recent sessions
export function demoReplayWindow(replay: { endedMinutesAgo: number; duration: number }, now: number) {
  const endedAt = now - replay.endedMinutesAgo * MINUTE_MS;
  return { startedAt: endedAt - replay.duration * 1000, endedAt };
}
