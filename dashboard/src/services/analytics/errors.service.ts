'server-only';

import moment from 'moment-timezone';
import { toDateTimeString } from '@/utils/dateFormatters';
import {
  hasAnyErrors,
  getErrorGroups,
  getErrorGroupVolumes,
  getErrorGroupTimestamps,
  type ErrorGroupTimestamps,
  getErrorGroup,
  getErrorGroupBrowserBreakdown,
  getErrorGroupDailyVolume,
  getErrorGroupDeviceTypeBreakdown,
  getErrorOccurrence,
  getSessionTrailEvents,
} from '@/repositories/clickhouse/errors.repository';
import { hasSessionReplay, findReplaySessionForError } from '@/repositories/clickhouse/sessionReplays.repository';
import {
  ErrorGroupEnvironmentRow,
  ErrorGroupRow,
  ErrorGroupVolumePoint,
  ErrorGroupVolumeRow,
  ErrorOccurrence,
  SessionTrailEvent,
  StackFrame,
  type ErrorGroupSidebarData,
  type ErrorGroupStatusValue,
  type GroupedSessionTrailEvent,
} from '@/entities/analytics/errors.entities';
import { parseStackTrace } from '@/utils/parseStackTrace';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import {
  getTrackedErrorGroups,
  upsertErrorGroup,
  bulkUpsertErrorGroup,
} from '@/repositories/postgres/errorGroup.repository';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import {
  findDemoReplaySessionForError,
  getDemoErrorGroup,
  getDemoErrorGroups,
  getDemoErrorGroupSidebarData,
  getDemoErrorGroupTimestamps,
  getDemoErrorGroupVolumes,
  getDemoErrorOccurrence,
  getDemoSessionTrailEvents,
  hasDemoSessionReplay,
} from '@/services/analytics/demoErrors.service';

// Public demo visitors get static errors: real error messages can carry other users' URLs
export type ErrorsContext = Pick<AuthContext, 'siteId' | 'dashboardId' | 'isDemo'>;

export async function getErrorGroupForSite(
  ctx: ErrorsContext,
  fingerprint: string,
): Promise<ErrorGroupRow | null> {
  if (ctx.isDemo) return getDemoErrorGroup(fingerprint);

  const row = await getErrorGroup(ctx.siteId, fingerprint);
  if (!row) return null;

  const statusMap = await getTrackedErrorGroups(ctx.dashboardId, [fingerprint]);
  return { ...row, status: statusMap[fingerprint] ?? 'unresolved' };
}

export async function getErrorGroupSidebarDataForSite(
  ctx: ErrorsContext,
  fingerprint: string,
  timezone: string,
  days = 30,
): Promise<ErrorGroupSidebarData> {
  // Whole calendar days in the zone, ending after today so only today is partial
  const rangeEndDate = moment.tz(timezone).startOf('day').add(1, 'day');
  const rangeStartDate = rangeEndDate.clone().subtract(days, 'days');
  if (ctx.isDemo) return getDemoErrorGroupSidebarData(fingerprint, timezone, rangeStartDate, rangeEndDate);

  const { siteId } = ctx;
  const rangeStart = toDateTimeString(rangeStartDate.toDate());
  const rangeEnd = toDateTimeString(rangeEndDate.toDate());

  const [browsers, deviceTypes, dailyVolume] = await Promise.all([
    getErrorGroupBrowserBreakdown(siteId, fingerprint),
    getErrorGroupDeviceTypeBreakdown(siteId, fingerprint),
    getErrorGroupDailyVolume(siteId, fingerprint, timezone, rangeStart, rangeEnd),
  ]);
  return { browsers, deviceTypes, dailyVolume };
}

export async function getErrorOccurrenceForSite(
  ctx: ErrorsContext,
  fingerprint: string,
  offset: number,
): Promise<ErrorOccurrence | null> {
  if (ctx.isDemo) return getDemoErrorOccurrence(fingerprint, offset);

  const raw = await getErrorOccurrence(ctx.siteId, fingerprint, offset);
  if (!raw) return null;

  let mechanism = '';
  let frames: StackFrame[] = [];
  try {
    const exceptions = JSON.parse(raw.error_exceptions);
    const ex = exceptions?.[0];
    mechanism = ex?.mechanism ?? '';
    frames = ex?.stack ? parseStackTrace(ex.stack) : [];
  } catch {
    // If we encounter a malformed exception_list we leave frames empty
  }

  return {
    timestamp: raw.timestamp,
    url: raw.url,
    browser: raw.browser,
    os: raw.os,
    device_type: raw.device_type,
    country_code: raw.country_code,
    session_id: raw.session_id,
    error_type: raw.error_type,
    error_message: raw.error_message,
    mechanism,
    frames,
  };
}

export async function getSessionTrailForSite(
  ctx: ErrorsContext,
  sessionId: string,
): Promise<GroupedSessionTrailEvent[]> {
  const events = ctx.isDemo
    ? getDemoSessionTrailEvents(sessionId)
    : await getSessionTrailEvents(ctx.siteId, sessionId);
  return groupConsecutiveEvents(events);
}

function getSessionTrailEventLabel(event: SessionTrailEvent): string {
  switch (event.event_type) {
    case 'pageview':
      return event.url;
    case 'custom':
      return event.custom_event_name;
    case 'outbound_link':
      return event.outbound_link_url;
    case 'client_error':
      return `${event.error_type}: ${event.error_message}`;
    default:
      return event.event_type;
  }
}

function groupConsecutiveEvents(events: SessionTrailEvent[]): GroupedSessionTrailEvent[] {
  const groups: GroupedSessionTrailEvent[] = [];
  for (const event of events) {
    const label = getSessionTrailEventLabel(event);
    const prev = groups[groups.length - 1];
    if (prev && prev.label === label) {
      prev.count++;
    } else {
      groups.push({ event, count: 1, label });
    }
  }
  return groups;
}

export async function hasSessionReplayForSite(ctx: ErrorsContext, sessionId: string): Promise<boolean> {
  if (ctx.isDemo) return hasDemoSessionReplay(sessionId);
  return hasSessionReplay(ctx.siteId, sessionId);
}

export async function findReplaySessionForErrorGroup(
  ctx: ErrorsContext,
  fingerprint: string,
): Promise<string | null> {
  if (ctx.isDemo) return findDemoReplaySessionForError(fingerprint);
  return findReplaySessionForError(ctx.siteId, fingerprint);
}

export async function hasAnyErrorsForSite(ctx: ErrorsContext): Promise<boolean> {
  if (ctx.isDemo) return true;
  return hasAnyErrors(ctx.siteId);
}

// Filters other than the date range don't apply on the public demo, like demo session replay
export async function getErrorGroupsForSite(ctx: ErrorsContext, siteQuery: BASiteQuery): Promise<ErrorGroupRow[]> {
  if (ctx.isDemo) return getDemoErrorGroups(siteQuery);

  const rows = await getErrorGroups(siteQuery);
  if (rows.length === 0) return rows;

  const fingerprints = rows.map((r) => r.error_fingerprint);
  const statusMap = await getTrackedErrorGroups(ctx.dashboardId, fingerprints);

  return rows.map((r) => ({
    ...r,
    status: statusMap[r.error_fingerprint] ?? 'unresolved',
  }));
}

export async function upsertErrorGroupForSite(
  dashboardId: string,
  errorFingerprint: string,
  status: ErrorGroupStatusValue,
): Promise<void> {
  return upsertErrorGroup(dashboardId, errorFingerprint, status);
}

export async function bulkUpsertErrorGroupForSite(
  dashboardId: string,
  fingerprints: string[],
  status: ErrorGroupStatusValue,
): Promise<void> {
  return bulkUpsertErrorGroup(dashboardId, fingerprints, status);
}

export async function getErrorGroupTimestampsForSite(
  ctx: ErrorsContext,
  fingerprints: string[],
): Promise<ErrorGroupTimestamps> {
  if (ctx.isDemo) return getDemoErrorGroupTimestamps(fingerprints);
  return getErrorGroupTimestamps(ctx.siteId, fingerprints);
}

export async function getErrorGroupVolumesForSite(
  ctx: ErrorsContext,
  siteQuery: BASiteQuery,
  fingerprints: string[],
): Promise<ErrorGroupVolumeRow[]> {
  if (ctx.isDemo) return getDemoErrorGroupVolumes(siteQuery, fingerprints);
  return getErrorGroupVolumes(siteQuery, fingerprints);
}
