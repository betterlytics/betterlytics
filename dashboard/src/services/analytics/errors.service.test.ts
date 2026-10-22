import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getErrorGroupSidebarDataForSite } from '@/services/analytics/errors.service';
import { getErrorGroupDailyVolume } from '@/repositories/clickhouse/errors.repository';

vi.mock('@/repositories/clickhouse/errors.repository', () => ({
  getErrorGroupBrowserBreakdown: vi.fn(async () => []),
  getErrorGroupDeviceTypeBreakdown: vi.fn(async () => []),
  getErrorGroupDailyVolume: vi.fn(async () => []),
}));
vi.mock('@/repositories/clickhouse/sessionReplays.repository', () => ({}));
vi.mock('@/repositories/postgres/errorGroup.repository', () => ({}));

beforeEach(() => {
  vi.useFakeTimers();
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

    await getErrorGroupSidebarDataForSite('site-1', 'fp-1', timezone);

    expect(getErrorGroupDailyVolume).toHaveBeenCalledWith('site-1', 'fp-1', timezone, rangeStart, rangeEnd);
  });
});
