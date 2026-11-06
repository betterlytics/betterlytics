import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import moment from 'moment-timezone';
import { fetchMonitorDailyUptime, fetchMonitorMetrics } from '@/services/analytics/monitoring.service';
import { getUptimeBuckets } from '@/repositories/clickhouse/monitoring.repository';

vi.mock('@/repositories/postgres/monitoring.repository', () => ({
  getMonitorCheckById: vi.fn(async () => ({
    id: 'monitor-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  })),
}));
vi.mock('@/repositories/clickhouse/monitoring.repository', () => ({
  getUptimeBuckets: vi.fn(async () => new Map()),
  getOpenIncidentsForMonitors: vi.fn(async () => new Map()),
  getIncidentSegments24h: vi.fn(async () => []),
  getLastResolvedIncidentForMonitors: vi.fn(async () => new Map()),
  getLatency24h: vi.fn(async () => ({ avgMs: null, minMs: null, maxMs: null })),
  getLatencySeries24h: vi.fn(async () => []),
  getIncidentCount24h: vi.fn(async () => 0),
  getLatestCheckInfoForMonitors: vi.fn(async () => ({})),
}));

const uptimeBuckets = vi.mocked(getUptimeBuckets);

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchMonitorDailyUptime', () => {
  it.each([
    // Tokyo is already on 09-27 at 20:00 UTC
    ['Asia/Tokyo', '2026-03-31T15:00:00.000Z', '2026-09-27T15:00:00.000Z'],
    ['America/Los_Angeles', '2026-03-31T07:00:00.000Z', '2026-09-27T07:00:00.000Z'],
  ])('ends the range after today in %s', async (timezone, rangeStart, rangeEnd) => {
    vi.setSystemTime(new Date('2026-09-26T20:00:00Z'));

    await fetchMonitorDailyUptime('monitor-1', 'dashboard-1', 'site-1', timezone, 180);

    expect(uptimeBuckets).toHaveBeenCalledWith([{ checkId: 'monitor-1', createdAt: expect.any(Date) }], 'site-1', {
      rangeStart: new Date(rangeStart),
      rangeEnd: new Date(rangeEnd),
      granularity: 'day',
      timezone,
    });
  });

  it('keys each day bucket by its calendar day in the zone', async () => {
    vi.setSystemTime(new Date('2026-09-26T20:00:00Z'));
    uptimeBuckets.mockResolvedValueOnce(
      new Map([
        [
          'monitor-1',
          [{ bucket: '2026-09-26T15:00:00.000Z', upRatio: 0.5, monitoredSeconds: 7200, upSeconds: 3600 }],
        ],
      ]),
    );

    const days = await fetchMonitorDailyUptime('monitor-1', 'dashboard-1', 'site-1', 'Asia/Tokyo', 180);

    expect(days).toEqual([{ date: '2026-09-27', upRatio: 0.5, monitoredSeconds: 7200, upSeconds: 3600 }]);
  });
});

describe('fetchMonitorMetrics 24h pills', () => {
  it.each([
    // 10:50 local: the last pill is 10:00 to 11:00 Kolkata
    ['Asia/Kolkata', '2026-10-23T05:20:00Z', '2026-10-22T05:30:00Z', '2026-10-23T05:30:00Z'],
    // 11:05 local: the last pill is 11:00 to 12:00 Kathmandu
    ['Asia/Kathmandu', '2026-10-23T05:20:00Z', '2026-10-22T06:15:00Z', '2026-10-23T06:15:00Z'],
    ['UTC', '2026-10-23T05:20:00Z', '2026-10-22T06:00:00Z', '2026-10-23T06:00:00Z'],
  ])('buckets on local hours in %s', async (timezone, now, rangeStart, rangeEnd) => {
    vi.setSystemTime(new Date(now));
    uptimeBuckets.mockResolvedValueOnce(
      new Map([['monitor-1', [{ bucket: rangeStart, upRatio: 0.5, monitoredSeconds: 3600, upSeconds: 1800 }]]]),
    );

    const metrics = await fetchMonitorMetrics('dashboard-1', 'monitor-1', 'site-1', timezone);

    expect(uptimeBuckets).toHaveBeenCalledWith([{ checkId: 'monitor-1', createdAt: expect.any(Date) }], 'site-1', {
      rangeStart: new Date(rangeStart),
      rangeEnd: new Date(rangeEnd),
      granularity: 'hour',
      timezone,
    });

    const localTimes = metrics.uptimeBuckets.map((b) => moment.tz(b.bucket, timezone).format('mm'));
    expect(metrics.uptimeBuckets).toHaveLength(24);
    expect(new Set(localTimes)).toEqual(new Set(['00']));
    expect(metrics.uptimeBuckets[0].upRatio).toBe(0.5);
    expect(metrics.uptimeBuckets[23].bucket).toBe(moment.tz(now, timezone).startOf('hour').toISOString());
    expect(metrics.uptime24hPercent).toBe(50);
  });

  it('keeps one pill per real hour across the autumn DST change', async () => {
    // 06:20 CET on the day Copenhagen falls back from 03:00 CEST to 02:00 CET
    vi.setSystemTime(new Date('2026-10-25T05:20:00Z'));

    const metrics = await fetchMonitorMetrics('dashboard-1', 'monitor-1', 'site-1', 'Europe/Copenhagen');

    const instants = metrics.uptimeBuckets.map((b) => new Date(b.bucket).getTime());
    const localHours = metrics.uptimeBuckets.map((b) => moment.tz(b.bucket, 'Europe/Copenhagen').format('HH:mm'));
    expect(instants).toHaveLength(24);
    expect(instants.slice(1).every((t, i) => t - instants[i] === 60 * 60 * 1000)).toBe(true);
    expect(localHours[0]).toBe('08:00');
    expect(localHours.at(-1)).toBe('06:00');
    expect(localHours.filter((h) => h === '02:00')).toHaveLength(2);
  });

  it('keeps one pill per real hour across the spring DST change', async () => {
    // 05:20 EDT on the day New York skips from 02:00 EST to 03:00 EDT
    vi.setSystemTime(new Date('2026-03-08T09:20:00Z'));

    const metrics = await fetchMonitorMetrics('dashboard-1', 'monitor-1', 'site-1', 'America/New_York');

    const localHours = metrics.uptimeBuckets.map((b) =>
      moment.tz(b.bucket, 'America/New_York').format('MM-DD HH:mm'),
    );
    expect(localHours).toHaveLength(24);
    expect(new Set(localHours).size).toBe(24);
    expect(localHours).not.toContain('03-08 02:00');
    expect(localHours[0]).toBe('03-07 05:00');
    expect(localHours.at(-1)).toBe('03-08 05:00');
  });
});
