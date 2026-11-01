import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findReplaySessionForErrorGroup,
  getErrorGroupForSite,
  getErrorGroupSidebarDataForSite,
  getErrorGroupsForSite,
  getErrorGroupTimestampsForSite,
  getErrorGroupVolumesForSite,
  getErrorOccurrenceForSite,
  getSessionTrailForSite,
  hasAnyErrorsForSite,
  hasSessionReplayForSite,
  type ErrorsContext,
} from '@/services/analytics/errors.service';
import * as errorsRepository from '@/repositories/clickhouse/errors.repository';
import * as sessionReplaysRepository from '@/repositories/clickhouse/sessionReplays.repository';
import * as errorGroupRepository from '@/repositories/postgres/errorGroup.repository';
import { DEMO_ERROR_GROUPS } from '@/constants/demoErrors';
import { getResolvedRanges } from '@/lib/ba-timerange';
import { toDateTimeString } from '@/utils/dateFormatters';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import type { GranularityRangeValues } from '@/utils/granularityRanges';

vi.mock('@/repositories/clickhouse/errors.repository', () => ({
  hasAnyErrors: vi.fn(async () => true),
  getErrorGroup: vi.fn(async () => null),
  getErrorGroups: vi.fn(async () => []),
  getErrorGroupVolumes: vi.fn(async () => []),
  getErrorGroupTimestamps: vi.fn(async () => ({ firstSeenMap: {}, lastSeenMap: {} })),
  getErrorGroupBrowserBreakdown: vi.fn(async () => []),
  getErrorGroupDeviceTypeBreakdown: vi.fn(async () => []),
  getErrorGroupDailyVolume: vi.fn(async () => []),
  getErrorOccurrence: vi.fn(async () => null),
  getSessionTrailEvents: vi.fn(async () => []),
}));
vi.mock('@/repositories/clickhouse/sessionReplays.repository', () => ({
  hasSessionReplay: vi.fn(async () => false),
  findReplaySessionForError: vi.fn(async () => null),
}));
vi.mock('@/repositories/postgres/errorGroup.repository', () => ({
  getTrackedErrorGroups: vi.fn(async () => ({})),
  upsertErrorGroup: vi.fn(),
  bulkUpsertErrorGroup: vi.fn(),
}));

const NOW = new Date('2026-10-23T14:23:00Z');
const MEMBER: ErrorsContext = { siteId: 'site-1', dashboardId: 'dash-1', isDemo: false };
const DEMO: ErrorsContext = { siteId: 'site-1', dashboardId: 'dash-1', isDemo: true };
const REAL_FINGERPRINT = '006cbdbec543c1022eefd27148a11a47';

function siteQueryFor(
  interval: '24h' | '7d' | '28d' | '90d',
  granularity: GranularityRangeValues,
  timezone = 'Etc/UTC',
) {
  const range = getResolvedRanges(interval, 'off', timezone, NOW, NOW, granularity);
  return {
    siteId: 'site-1',
    startDate: range.main.start,
    endDate: range.main.end,
    startDateTime: toDateTimeString(range.main.start),
    endDateTime: toDateTimeString(range.main.end),
    granularity: range.granularity,
    queryFilters: [],
    timezone,
    userJourney: { numberOfSteps: 3, numberOfJourneys: 5 },
  } satisfies BASiteQuery;
}

function expectNoRepositoryCalls() {
  for (const repository of [errorsRepository, sessionReplaysRepository, errorGroupRepository]) {
    for (const fn of Object.values(repository)) {
      expect(fn).not.toHaveBeenCalled();
    }
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getErrorGroupSidebarDataForSite', () => {
  it.each([
    // Tokyo is already on 09-27 at 20:00 UTC
    ['Asia/Tokyo', '2026-08-28 15:00:00', '2026-09-27 15:00:00'],
    ['America/Los_Angeles', '2026-08-28 07:00:00', '2026-09-27 07:00:00'],
    ['Etc/UTC', '2026-08-28 00:00:00', '2026-09-27 00:00:00'],
  ])('covers 29 whole days plus today in %s', async (timezone, rangeStart, rangeEnd) => {
    vi.setSystemTime(new Date('2026-09-26T20:00:00Z'));

    await getErrorGroupSidebarDataForSite(MEMBER, 'fp-1', timezone);

    expect(errorsRepository.getErrorGroupDailyVolume).toHaveBeenCalledWith(
      'site-1',
      'fp-1',
      timezone,
      rangeStart,
      rangeEnd,
    );
  });
});

describe('error tracking on the public demo', () => {
  it('serves every view from the static errors without reading real data', async () => {
    const siteQuery = siteQueryFor('28d', 'day');
    const groups = await getErrorGroupsForSite(DEMO, siteQuery);
    const fingerprints = groups.map((group) => group.error_fingerprint);
    const fingerprint = fingerprints[0];

    expect(await hasAnyErrorsForSite(DEMO)).toBe(true);
    await getErrorGroupTimestampsForSite(DEMO, fingerprints);
    await getErrorGroupVolumesForSite(DEMO, siteQuery, fingerprints);
    expect(await getErrorGroupForSite(DEMO, fingerprint)).not.toBeNull();
    await getErrorGroupSidebarDataForSite(DEMO, fingerprint, 'Europe/Copenhagen');
    const occurrence = await getErrorOccurrenceForSite(DEMO, fingerprint, 0);
    expect(occurrence).not.toBeNull();
    await getSessionTrailForSite(DEMO, occurrence!.session_id);
    await hasSessionReplayForSite(DEMO, occurrence!.session_id);
    await findReplaySessionForErrorGroup(DEMO, fingerprint);

    expect(fingerprints.every((fp) => DEMO_ERROR_GROUPS.some((group) => group.error_fingerprint === fp))).toBe(
      true,
    );
    expectNoRepositoryCalls();
  });

  it('keeps real errors for signed-in members of the demo dashboard', async () => {
    await getErrorGroupsForSite(MEMBER, siteQueryFor('7d', 'day'));
    await getErrorGroupForSite(MEMBER, REAL_FINGERPRINT);

    expect(errorsRepository.getErrorGroups).toHaveBeenCalled();
    expect(errorsRepository.getErrorGroup).toHaveBeenCalledWith('site-1', REAL_FINGERPRINT);
  });

  it('lists only the static errors seen in the selected date range, re-dated relative to now', async () => {
    const day = await getErrorGroupsForSite(DEMO, siteQueryFor('24h', 'hour'));
    const quarter = await getErrorGroupsForSite(DEMO, siteQueryFor('90d', 'day'));

    expect(quarter).toHaveLength(DEMO_ERROR_GROUPS.length);
    expect(day.length).toBeGreaterThan(0);
    expect(day.length).toBeLessThan(quarter.length);
    expect(day.map((group) => group.error_fingerprint)).not.toContain(
      DEMO_ERROR_GROUPS.find((group) => group.status === 'resolved')!.error_fingerprint,
    );
    expect(quarter.map((group) => group.count)).toEqual(
      [...quarter.map((group) => group.count)].sort((a, b) => b - a),
    );

    const { lastSeenMap } = await getErrorGroupTimestampsForSite(DEMO, [quarter[0].error_fingerprint]);
    const lastSeen = lastSeenMap[quarter[0].error_fingerprint];
    expect(lastSeen.getTime()).toBeLessThanOrEqual(NOW.getTime());
    expect(lastSeen.getTime()).toBeGreaterThan(NOW.getTime() - 24 * 60 * 60 * 1000);
  });

  it('ignores filters other than the date range', async () => {
    const unfiltered = await getErrorGroupsForSite(DEMO, siteQueryFor('7d', 'day'));
    const filtered = await getErrorGroupsForSite(DEMO, {
      ...siteQueryFor('7d', 'day'),
      queryFilters: [{ id: 'f1', column: 'browser', operator: '=', values: ['Firefox'] }],
    });

    expect(filtered).toEqual(unfiltered);
  });

  it('builds sparkline buckets that add up to the listed counts', async () => {
    const siteQuery = siteQueryFor('7d', 'day');
    const groups = await getErrorGroupsForSite(DEMO, siteQuery);
    const volumes = await getErrorGroupVolumesForSite(
      DEMO,
      siteQuery,
      groups.map((group) => group.error_fingerprint),
    );

    for (const group of groups) {
      const rows = volumes.filter((row) => row.error_fingerprint === group.error_fingerprint);
      expect(rows.length).toBeGreaterThanOrEqual(7);
      expect(rows.reduce((sum, row) => sum + row.error_count, 0)).toBe(group.count);
    }
  });

  it('shows a mix of statuses', async () => {
    const statuses = (await getErrorGroupsForSite(DEMO, siteQueryFor('90d', 'day'))).map((group) => group.status);

    expect(statuses.filter((status) => status === 'resolved')).toHaveLength(1);
    expect(statuses.filter((status) => status === 'ignored')).toHaveLength(1);
    expect(statuses.filter((status) => status === 'unresolved').length).toBeGreaterThan(4);
  });

  it('gives each static error a detail page with breakdowns, volume, occurrences and a session trail', async () => {
    for (const group of DEMO_ERROR_GROUPS) {
      const row = await getErrorGroupForSite(DEMO, group.error_fingerprint);
      const sidebar = await getErrorGroupSidebarDataForSite(DEMO, group.error_fingerprint, 'Europe/Copenhagen');
      const oldest = await getErrorOccurrenceForSite(DEMO, group.error_fingerprint, group.count - 1);

      expect(row).toMatchObject({ count: group.count, status: group.status });
      expect(row!.first_seen!.getTime()).toBeLessThan(row!.last_seen!.getTime());
      expect(sidebar.browsers.length).toBeGreaterThan(0);
      expect(sidebar.deviceTypes.length).toBeGreaterThan(0);
      expect(sidebar.dailyVolume).toHaveLength(30);
      const browsers = new Set(group.occurrences.map((occurrence) => occurrence.browser));
      expect(sidebar.browsers).toHaveLength(browsers.size);
      expect(oldest!.timestamp).toEqual(row!.first_seen);
      expect(await getErrorOccurrenceForSite(DEMO, group.error_fingerprint, group.count)).toBeNull();

      const trail = await getSessionTrailForSite(DEMO, oldest!.session_id);
      const error = trail.find(({ event }) => event.event_type === 'client_error');
      expect(error?.event).toMatchObject({
        error_fingerprint: group.error_fingerprint,
        timestamp: oldest!.timestamp,
      });
    }
  });

  it('parses a stack trace for every static occurrence with a stack', async () => {
    for (const group of DEMO_ERROR_GROUPS) {
      for (let offset = 0; offset < Math.min(group.count, 20); offset++) {
        const occurrence = await getErrorOccurrenceForSite(DEMO, group.error_fingerprint, offset);
        expect(occurrence!.frames.length).toBeGreaterThan(0);
      }
    }
  });

  it('shows not found for a real error fingerprint', async () => {
    expect(await getErrorGroupForSite(DEMO, REAL_FINGERPRINT)).toBeNull();
    expect(await getErrorOccurrenceForSite(DEMO, REAL_FINGERPRINT, 0)).toBeNull();
    expect(await getSessionTrailForSite(DEMO, '12345678901234567890')).toEqual([]);
    expect(await hasSessionReplayForSite(DEMO, '12345678901234567890')).toBe(false);
    expect(await findReplaySessionForErrorGroup(DEMO, REAL_FINGERPRINT)).toBeNull();
  });

  it('points the replay card at a session with a replay only for errors marked as having one', async () => {
    for (const group of DEMO_ERROR_GROUPS) {
      const sessionId = await findReplaySessionForErrorGroup(DEMO, group.error_fingerprint);
      if (!group.hasReplay) {
        expect(sessionId).toBeNull();
        continue;
      }
      expect(sessionId).toMatch(/^\d+$/);
      expect(await hasSessionReplayForSite(DEMO, sessionId!)).toBe(true);
    }
  });

  it('contains no dashboard or share id, query string or customer domain', async () => {
    const strings: string[] = [];
    for (const group of DEMO_ERROR_GROUPS) {
      strings.push(group.error_message);
      for (let offset = 0; offset < group.count; offset++) {
        const occurrence = (await getErrorOccurrenceForSite(DEMO, group.error_fingerprint, offset))!;
        strings.push(occurrence.url, occurrence.error_message, ...occurrence.frames.map((frame) => frame.file));
        if (offset < 3) {
          for (const { event } of await getSessionTrailForSite(DEMO, occurrence.session_id)) {
            strings.push(event.url, event.outbound_link_url, event.error_message, event.custom_event_name);
          }
        }
      }
    }

    const allowedHosts = ['react.dev', 'github.com'];
    for (const value of strings) {
      expect(value).not.toMatch(/\?|queryFilters|\/dashboard\/|\/share\//);
      expect(value).not.toMatch(/\bc[a-z0-9]{24}\b/);
      for (const [, host] of value.matchAll(/https?:\/\/([^/\s]+)/g)) {
        expect(allowedHosts).toContain(host);
      }
    }
    for (const group of DEMO_ERROR_GROUPS) {
      for (const occurrence of group.occurrences) {
        expect(occurrence.url).toMatch(/^\/[a-z0-9/-]*$/);
      }
    }
  });
});
