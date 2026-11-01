import 'server-only';

import moment from 'moment-timezone';
import { DEMO_ERROR_GROUPS, type DemoErrorGroup, type DemoErrorOccurrence } from '@/constants/demoErrors';
import type {
  ErrorGroupEnvironmentRow,
  ErrorGroupRow,
  ErrorGroupVolumePoint,
  ErrorGroupVolumeRow,
  ErrorOccurrence,
  SessionTrailEvent,
  ErrorGroupSidebarData,
} from '@/entities/analytics/errors.entities';
import type { ErrorGroupTimestamps } from '@/repositories/clickhouse/errors.repository';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { parseStackTrace } from '@/utils/parseStackTrace';
import { toDateTimeString } from '@/utils/dateFormatters';

type DemoOccurrence = {
  timestamp: Date;
  sessionId: string;
  template: DemoErrorOccurrence;
};

const MINUTE_MS = 60_000;
const SESSION_INDEX_DIGITS = 5;
const REPLAY_EVERY_NTH_SESSION = 3;
const ENVIRONMENT_LIMIT = 5;

const BUCKET_STEP: Record<string, { amount: number; unit: moment.unitOfTime.DurationConstructor }> = {
  minute_1: { amount: 1, unit: 'minutes' },
  minute_15: { amount: 15, unit: 'minutes' },
  minute_30: { amount: 30, unit: 'minutes' },
  hour: { amount: 1, unit: 'hour' },
  day: { amount: 1, unit: 'day' },
  week: { amount: 1, unit: 'week' },
  month: { amount: 1, unit: 'month' },
};

// Deterministic value in [0, 1), so every request spreads the occurrences the same way
function hashToUnit(...parts: Array<string | number>): number {
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

// Whole minutes, so the occurrence list and a later session trail request agree on timestamps
function demoNow(): number {
  return Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
}

function shapeAge(position: number, trend: DemoErrorGroup['trend']): number {
  if (trend === 'rising') return position * position;
  if (trend === 'fading') return Math.sqrt(position);
  return position;
}

function pickTemplate(group: DemoErrorGroup, index: number): DemoErrorOccurrence {
  const totalWeight = group.occurrences.reduce((sum, occurrence) => sum + occurrence.weight, 0);
  let target = hashToUnit(group.error_fingerprint, 'template', index) * totalWeight;
  for (const occurrence of group.occurrences) {
    target -= occurrence.weight;
    if (target < 0) return occurrence;
  }
  return group.occurrences[0];
}

// Every occurrence of a group, newest first, re-dated relative to now
function buildOccurrences(group: DemoErrorGroup, now: number): DemoOccurrence[] {
  const newest = now - group.lastSeenMinutesAgo * MINUTE_MS;
  const span = (group.firstSeenMinutesAgo - group.lastSeenMinutesAgo) * MINUTE_MS;
  const last = group.count - 1;
  const ages = Array.from({ length: group.count }, (_, index) => {
    if (index === 0 || index === last) return index === 0 ? 0 : 1;
    const jittered = (index + (hashToUnit(group.error_fingerprint, 'age', index) - 0.5) * 0.9) / last;
    return shapeAge(Math.min(1, Math.max(0, jittered)), group.trend);
  }).sort((a, b) => a - b);

  return ages.map((age, index) => ({
    timestamp: new Date(newest - Math.round((age * span) / 1000) * 1000),
    sessionId: group.sessionIdPrefix + String(index).padStart(SESSION_INDEX_DIGITS, '0'),
    template: pickTemplate(group, index),
  }));
}

function findGroup(fingerprint: string): DemoErrorGroup | undefined {
  return DEMO_ERROR_GROUPS.find((group) => group.error_fingerprint === fingerprint);
}

function findSession(sessionId: string): { group: DemoErrorGroup; index: number } | null {
  for (const group of DEMO_ERROR_GROUPS) {
    if (!sessionId.startsWith(group.sessionIdPrefix)) continue;
    const suffix = sessionId.slice(group.sessionIdPrefix.length);
    if (suffix.length !== SESSION_INDEX_DIGITS) continue;
    const index = Number(suffix);
    if (Number.isInteger(index) && index < group.count) return { group, index };
  }
  return null;
}

function countInRange(occurrences: DemoOccurrence[], start: number, end: number): number {
  return occurrences.filter(({ timestamp }) => timestamp.getTime() >= start && timestamp.getTime() <= end).length;
}

function toEnvironmentRows(
  occurrences: DemoOccurrence[],
  field: 'browser' | 'device_type',
): ErrorGroupEnvironmentRow[] {
  const counts = new Map<string, number>();
  for (const { template } of occurrences) {
    counts.set(template[field], (counts.get(template[field]) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, ENVIRONMENT_LIMIT);
}

// Bucket starts as ClickHouse's toStartOfInterval in the query timezone would produce them
function bucketStarts(siteQuery: BASiteQuery): moment.Moment[] {
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
    starts.push(cursor.clone());
    cursor.add(step.amount, step.unit);
  }
  return starts;
}

export function getDemoErrorGroups(siteQuery: BASiteQuery): ErrorGroupRow[] {
  const now = demoNow();
  const start = siteQuery.startDate.getTime();
  const end = siteQuery.endDate.getTime();
  return DEMO_ERROR_GROUPS.map((group) => {
    const count = countInRange(buildOccurrences(group, now), start, end);
    return {
      error_fingerprint: group.error_fingerprint,
      error_type: group.error_type,
      error_message: group.error_message,
      count,
      session_count: count,
      status: group.status,
    };
  })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function getDemoErrorGroup(fingerprint: string): ErrorGroupRow | null {
  const group = findGroup(fingerprint);
  if (!group) return null;
  const occurrences = buildOccurrences(group, demoNow());
  return {
    error_fingerprint: group.error_fingerprint,
    error_type: group.error_type,
    error_message: group.error_message,
    count: group.count,
    session_count: group.count,
    first_seen: occurrences[occurrences.length - 1].timestamp,
    last_seen: occurrences[0].timestamp,
    status: group.status,
  };
}

export function getDemoErrorGroupTimestamps(fingerprints: string[]): ErrorGroupTimestamps {
  const now = demoNow();
  const timestamps: ErrorGroupTimestamps = { firstSeenMap: {}, lastSeenMap: {} };
  for (const fingerprint of fingerprints) {
    const group = findGroup(fingerprint);
    if (!group) continue;
    const occurrences = buildOccurrences(group, now);
    timestamps.firstSeenMap[fingerprint] = occurrences[occurrences.length - 1].timestamp;
    timestamps.lastSeenMap[fingerprint] = occurrences[0].timestamp;
  }
  return timestamps;
}

export function getDemoErrorGroupVolumes(siteQuery: BASiteQuery, fingerprints: string[]): ErrorGroupVolumeRow[] {
  const now = demoNow();
  const step = BUCKET_STEP[siteQuery.granularity] ?? BUCKET_STEP.hour;
  const starts = bucketStarts(siteQuery);
  const rangeStart = siteQuery.startDate.getTime();
  const rangeEnd = siteQuery.endDate.getTime();

  return fingerprints.flatMap((fingerprint) => {
    const group = findGroup(fingerprint);
    if (!group) return [];
    const occurrences = buildOccurrences(group, now);
    // Zeros stay in so the sparkline dips between bursts
    return starts.map((start) => {
      const bucketStart = Math.max(start.valueOf(), rangeStart);
      const bucketEnd = Math.min(start.clone().add(step.amount, step.unit).valueOf() - 1, rangeEnd);
      return {
        error_fingerprint: fingerprint,
        date: toDateTimeString(start.toDate()),
        error_count: countInRange(occurrences, bucketStart, bucketEnd),
      };
    });
  });
}

export function getDemoErrorGroupSidebarData(
  fingerprint: string,
  timezone: string,
  rangeStartDate: moment.Moment,
  rangeEndDate: moment.Moment,
): ErrorGroupSidebarData {
  const group = findGroup(fingerprint);
  if (!group) return { browsers: [], deviceTypes: [], dailyVolume: [] };
  const occurrences = buildOccurrences(group, demoNow());

  const dailyVolume: ErrorGroupVolumePoint[] = [];
  for (const day = rangeStartDate.clone().tz(timezone); day.isBefore(rangeEndDate); day.add(1, 'day')) {
    const dayEnd = day.clone().add(1, 'day').valueOf() - 1;
    dailyVolume.push({ date: day.format('YYYY-MM-DD'), count: countInRange(occurrences, day.valueOf(), dayEnd) });
  }

  return {
    browsers: toEnvironmentRows(occurrences, 'browser'),
    deviceTypes: toEnvironmentRows(occurrences, 'device_type'),
    dailyVolume,
  };
}

export function getDemoErrorOccurrence(fingerprint: string, offset: number): ErrorOccurrence | null {
  const group = findGroup(fingerprint);
  if (!group || offset >= group.count) return null;
  const { timestamp, sessionId, template } = buildOccurrences(group, demoNow())[offset];
  return {
    timestamp,
    url: template.url,
    browser: template.browser,
    os: template.os,
    device_type: template.device_type,
    country_code: template.country_code,
    session_id: sessionId,
    error_type: group.error_type,
    error_message: group.error_message,
    mechanism: group.mechanism,
    frames: parseStackTrace(template.stack),
  };
}

export function getDemoSessionTrailEvents(sessionId: string): SessionTrailEvent[] {
  const session = findSession(sessionId);
  if (!session) return [];
  const { group, index } = session;
  const { timestamp, template } = buildOccurrences(group, demoNow())[index];
  const blank = {
    url: template.url,
    custom_event_name: '',
    outbound_link_url: '',
    error_type: '',
    error_message: '',
    error_fingerprint: '',
  };

  const steps: SessionTrailEvent[] = template.trail.map(({ secondsFromError, ...step }) => ({
    ...blank,
    ...step,
    timestamp: new Date(timestamp.getTime() + secondsFromError * 1000),
  }));
  const error: SessionTrailEvent = {
    ...blank,
    timestamp,
    event_type: 'client_error',
    error_type: group.error_type,
    error_message: group.error_message,
    error_fingerprint: group.error_fingerprint,
  };
  // Steps at the same second as the error, like the page it fired on, come first
  const before = steps.filter((step) => step.timestamp <= timestamp);
  const after = steps.filter((step) => step.timestamp > timestamp);
  return [...before, error, ...after];
}

export function hasDemoSessionReplay(sessionId: string): boolean {
  const session = findSession(sessionId);
  return !!session && session.group.hasReplay && session.index % REPLAY_EVERY_NTH_SESSION === 0;
}

export function findDemoReplaySessionForError(fingerprint: string): string | null {
  const group = findGroup(fingerprint);
  if (!group?.hasReplay) return null;
  return buildOccurrences(group, demoNow())[0].sessionId;
}
