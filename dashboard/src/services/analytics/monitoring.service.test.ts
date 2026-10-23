import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import moment from 'moment-timezone';
import { fetchMonitorDailyUptime, fetchMonitorMetrics } from '@/services/analytics/monitoring.service';
import {
  getMonitorDailyUptime,
  getUptime24h,
  getUptimeBuckets24h,
} from '@/repositories/clickhouse/monitoring.repository';

vi.mock('@/repositories/postgres/monitoring.repository', () => ({
  getMonitorCheckById: vi.fn(async () => ({ createdAt: new Date('2026-01-01T00:00:00Z') })),
}));
vi.mock('@/repositories/postgres/statusPage.repository', () => ({}));
vi.mock('@/repositories/clickhouse/monitoring.repository', () => ({
  getMonitorDailyUptime: vi.fn(async () => []),
  getOpenIncidentsForMonitors: vi.fn(async () => new Map()),
  getIncidentSegments24h: vi.fn(async () => []),
  getLastResolvedIncidentForMonitors: vi.fn(async () => new Map()),
  getUptime24h: vi.fn(async () => ({ uptimeSeconds: 0, totalSeconds: 0 })),
  getLatency24h: vi.fn(async () => ({ avgMs: null, minMs: null, maxMs: null })),
  getUptimeBuckets24h: vi.fn(async () => []),
  getLatencySeries24h: vi.fn(async () => []),
  getIncidentCount24h: vi.fn(async () => 0),
  getLatestCheckInfoForMonitors: vi.fn(async () => ({})),
}));

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
    ['Asia/Tokyo', '2026-03-31 15:00:00', '2026-09-27 15:00:00'],
    ['America/Los_Angeles', '2026-03-31 07:00:00', '2026-09-27 07:00:00'],
  ])('ends the range after today in %s', async (timezone, rangeStart, rangeEnd) => {
    vi.setSystemTime(new Date('2026-09-26T20:00:00Z'));

    await fetchMonitorDailyUptime('monitor-1', 'dashboard-1', 'site-1', timezone, 180);

    expect(getMonitorDailyUptime).toHaveBeenCalledWith(
      'monitor-1',
      'site-1',
      expect.any(Date),
      timezone,
      rangeStart,
      rangeEnd,
      180,
    );
  });
});

describe('fetchMonitorMetrics 24h pills', () => {
  it.each([
    // 10:50 local: the last pill is 10:00 to 11:00 Kolkata
    ['Asia/Kolkata', '2026-10-23T05:20:00Z', '2026-10-22 05:30:00', '2026-10-23 05:30:00'],
    // 11:05 local: the last pill is 11:00 to 12:00 Kathmandu
    ['Asia/Kathmandu', '2026-10-23T05:20:00Z', '2026-10-22 06:15:00', '2026-10-23 06:15:00'],
    ['UTC', '2026-10-23T05:20:00Z', '2026-10-22 06:00:00', '2026-10-23 06:00:00'],
  ])('buckets on local hours in %s', async (timezone, now, rangeStart, rangeEnd) => {
    vi.setSystemTime(new Date(now));
    vi.mocked(getUptimeBuckets24h).mockResolvedValueOnce([
      { bucket: new Date(`${rangeStart.replace(' ', 'T')}Z`).toISOString(), upRatio: 0.5, totalSeconds: 3600 },
    ]);

    const metrics = await fetchMonitorMetrics('dashboard-1', 'monitor-1', 'site-1', timezone);

    expect(getUptimeBuckets24h).toHaveBeenCalledWith(
      'monitor-1',
      'site-1',
      expect.any(Date),
      timezone,
      rangeStart,
      rangeEnd,
    );
    expect(getUptime24h).toHaveBeenCalledWith('monitor-1', 'site-1', expect.any(Date), rangeStart, rangeEnd);

    const localTimes = metrics.uptimeBuckets.map((b) => moment.tz(b.bucket, timezone).format('mm'));
    expect(metrics.uptimeBuckets).toHaveLength(24);
    expect(new Set(localTimes)).toEqual(new Set(['00']));
    expect(metrics.uptimeBuckets[0].upRatio).toBe(0.5);
    expect(metrics.uptimeBuckets[23].bucket).toBe(moment.tz(now, timezone).startOf('hour').toISOString());
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
