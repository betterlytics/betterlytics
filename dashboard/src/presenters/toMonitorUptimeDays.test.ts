import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toMonitorUptimePresentation } from '@/presenters/toMonitorUptimeDays';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-26T20:00:00Z')); // Sep 27 05:00 in Tokyo
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toMonitorUptimePresentation grid', () => {
  it('places each day on its zone calendar day and ends on the zone today', () => {
    const rows = [
      { date: '2026-09-26', upRatio: 1, totalSeconds: 86_400 },
      { date: '2026-09-27', upRatio: 0.5, totalSeconds: 18_000 },
    ];

    const { grid } = toMonitorUptimePresentation(rows, 'Asia/Tokyo');

    expect(grid).toHaveLength(180);
    expect(grid.slice(-2)).toMatchObject([
      { date: '2026-09-25T15:00:00.000Z', upRatio: 1 },
      { date: '2026-09-26T15:00:00.000Z', upRatio: 0.5 },
    ]);
  });
});
