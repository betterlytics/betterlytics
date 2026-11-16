import 'server-only';

import moment from 'moment-timezone';
import {
  DEMO_ERROR_GROUPS,
  type DemoErrorGroup,
  type DemoErrorOccurrence,
  type DemoErrorReplayLink,
} from '@/constants/demoErrors';
import { DEMO_SESSION_REPLAYS } from '@/constants/demoSessionReplays';
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
import { BUCKET_STEP, bucketStarts, demoNow, demoReplayWindow, hashToUnit } from '@/utils/demoData';

type DemoOccurrence = {
  timestamp: Date;
  sessionId: string;
  template: Omit<DemoErrorOccurrence, 'weight'>;
};

const MINUTE_MS = 60_000;
const SESSION_INDEX_DIGITS = 5;
const ENVIRONMENT_LIMIT = 5;

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

// The moment of the error inside the recording, on the demo replay list's clock
function replayErrorTime(replay: DemoErrorReplayLink, now: number): number {
  const recording = DEMO_SESSION_REPLAYS.find((candidate) => candidate.session_id === replay.sessionId);
  if (!recording) throw new Error(`Unknown demo replay ${replay.sessionId}`);
  return demoReplayWindow(recording, now).startedAt + replay.secondsIntoRecording * 1000;
}

// Every occurrence of a group, newest first, re-dated relative to now
function buildOccurrences(group: DemoErrorGroup, now: number): DemoOccurrence[] {
  const newest = group.replay ? replayErrorTime(group.replay, now) : now - group.lastSeenMinutesAgo * MINUTE_MS;
  const span = newest - (now - group.firstSeenMinutesAgo * MINUTE_MS);
  const last = group.count - 1;
  const ages = Array.from({ length: group.count }, (_, index) => {
    if (index === 0 || index === last) return index === 0 ? 0 : 1;
    const jittered = (index + (hashToUnit(group.error_fingerprint, 'age', index) - 0.5) * 0.9) / last;
    return shapeAge(Math.min(1, Math.max(0, jittered)), group.trend);
  }).sort((a, b) => a - b);

  return ages.map((age, index) => {
    if (index === 0 && group.replay) {
      return { timestamp: new Date(newest), sessionId: group.replay.sessionId, template: group.replay.occurrence };
    }
    return {
      timestamp: new Date(newest - Math.round((age * span) / 1000) * 1000),
      sessionId: group.sessionIdPrefix + String(index).padStart(SESSION_INDEX_DIGITS, '0'),
      template: pickTemplate(group, index),
    };
  });
}

function findGroup(fingerprint: string): DemoErrorGroup | undefined {
  return DEMO_ERROR_GROUPS.find((group) => group.error_fingerprint === fingerprint);
}

function findSession(sessionId: string): { group: DemoErrorGroup; index: number } | null {
  for (const group of DEMO_ERROR_GROUPS) {
    if (group.replay?.sessionId === sessionId) return { group, index: 0 };
    if (!sessionId.startsWith(group.sessionIdPrefix)) continue;
    const suffix = sessionId.slice(group.sessionIdPrefix.length);
    if (suffix.length !== SESSION_INDEX_DIGITS) continue;
    const index = Number(suffix);
    // A linked group's first occurrence carries the recording's session id instead
    const firstIndex = group.replay ? 1 : 0;
    if (Number.isInteger(index) && index >= firstIndex && index < group.count) return { group, index };
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
  const buckets = starts.map((start) => ({
    date: toDateTimeString(start.toDate()),
    start: Math.max(start.valueOf(), rangeStart),
    end: Math.min(start.clone().add(step.amount, step.unit).valueOf() - 1, rangeEnd),
  }));
  const groups = DEMO_ERROR_GROUPS.filter((group) => fingerprints.includes(group.error_fingerprint));

  return groups.flatMap((group) => {
    const oldestFirst = buildOccurrences(group, now)
      .map(({ timestamp }) => timestamp.getTime())
      .reverse();
    let next = 0;
    // Zeros stay in so the sparkline dips between bursts
    return buckets.map(({ date, start, end }) => {
      while (next < oldestFirst.length && oldestFirst[next] < start) next++;
      let count = 0;
      while (next < oldestFirst.length && oldestFirst[next] <= end) {
        count++;
        next++;
      }
      return { error_fingerprint: group.error_fingerprint, date, error_count: count };
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

// Only recordings that exist: the replay page silently opens another recording for an unknown session id
export function hasDemoSessionReplay(sessionId: string): boolean {
  return DEMO_ERROR_GROUPS.some((group) => group.replay?.sessionId === sessionId);
}

export function findDemoReplaySessionForError(fingerprint: string): string | null {
  return findGroup(fingerprint)?.replay?.sessionId ?? null;
}
