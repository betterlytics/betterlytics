import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMonitorDailyUptime } from '@/services/analytics/monitoring.service';
import { getUptimeBuckets } from '@/repositories/clickhouse/monitoring.repository';

vi.mock('@/repositories/postgres/monitoring.repository', () => ({
  getMonitorCheckById: vi.fn(async () => ({
    id: 'monitor-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    intervalSeconds: 300,
  })),
}));
vi.mock('@/repositories/postgres/statusPage.repository', () => ({}));
vi.mock('@/repositories/clickhouse/monitoring.repository', () => ({
  getUptimeBuckets: vi.fn(async () => new Map()),
}));
vi.mock('@/presenters/toMonitorMetrics', () => ({}));

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

    expect(uptimeBuckets).toHaveBeenCalledWith(
      [{ checkId: 'monitor-1', createdAt: expect.any(Date), intervalSeconds: 300 }],
      'site-1',
      { rangeStart: new Date(rangeStart), rangeEnd: new Date(rangeEnd), granularity: 'day', timezone },
    );
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
