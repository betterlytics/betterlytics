import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getErrorGroupSidebarDataForSite, getErrorOccurrenceForSite } from '@/services/analytics/errors.service';
import { getErrorGroupDailyVolume, getErrorOccurrence } from '@/repositories/clickhouse/errors.repository';

vi.mock('@/repositories/clickhouse/errors.repository', () => ({
  getErrorGroupBrowserBreakdown: vi.fn(async () => []),
  getErrorGroupDeviceTypeBreakdown: vi.fn(async () => []),
  getErrorGroupDailyVolume: vi.fn(async () => []),
  getErrorOccurrence: vi.fn(),
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

describe('getErrorOccurrenceForSite', () => {
  function mockOccurrence(exception: Record<string, unknown>) {
    vi.mocked(getErrorOccurrence).mockResolvedValue({
      timestamp: new Date('2026-09-26T20:00:00Z'),
      url: 'https://example.com/',
      browser: 'Chrome',
      os: 'macOS',
      device_type: 'desktop',
      country_code: 'DK',
      session_id: 'session-1',
      error_type: String(exception.type),
      error_message: String(exception.value),
      error_exceptions: JSON.stringify([exception]),
    });
  }

  it('returns the request details of a failed request', async () => {
    const request = {
      method: 'GET',
      url: 'https://example.com/api/orders/*',
      status_code: 503,
      duration_ms: 120,
      failure_type: 'http',
    };
    mockOccurrence({
      type: 'HTTPError',
      value: 'GET https://example.com/api/orders/* 503',
      mechanism: 'onfetch',
      stack: '',
      request,
    });

    const occurrence = await getErrorOccurrenceForSite('site-1', 'fp-1', 0);

    expect(occurrence?.mechanism).toBe('onfetch');
    expect(occurrence?.request).toEqual(request);
  });

  it('returns no request details for other errors', async () => {
    mockOccurrence({ type: 'TypeError', value: 'oops', mechanism: 'onuncaughtexception', stack: '' });

    const occurrence = await getErrorOccurrenceForSite('site-1', 'fp-1', 0);

    expect(occurrence?.request).toBeNull();
  });
});
