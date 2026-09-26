import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMonitorDailyUptime } from '@/services/analytics/monitoring.service';
import { getMonitorDailyUptime } from '@/repositories/clickhouse/monitoring.repository';

vi.mock('@/repositories/postgres/monitoring.repository', () => ({
  getMonitorCheckById: vi.fn(async () => ({ createdAt: new Date('2026-01-01T00:00:00Z') })),
}));
vi.mock('@/repositories/postgres/statusPage.repository', () => ({}));
vi.mock('@/repositories/clickhouse/monitoring.repository', () => ({
  getMonitorDailyUptime: vi.fn(async () => []),
}));
vi.mock('@/presenters/toMonitorMetrics', () => ({}));

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
