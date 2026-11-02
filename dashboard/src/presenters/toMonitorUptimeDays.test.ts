import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toMonitorUptimePresentation } from '@/presenters/toMonitorUptimeDays';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-26T20:00:00Z')); // Sep 27 05:00 in Tokyo
});

afterEach(() => {
  vi.useRealTimers();
});

function day(date: string, upSeconds: number, monitoredSeconds = 86_400) {
  return { date, upRatio: upSeconds / monitoredSeconds, upSeconds, monitoredSeconds };
}

describe('toMonitorUptimePresentation grid', () => {
  it('places each day on its zone calendar day and ends on the zone today', () => {
    const rows = [day('2026-09-26', 86_400), day('2026-09-27', 9_000, 18_000)];

    const { grid } = toMonitorUptimePresentation(rows, 'Asia/Tokyo');

    expect(grid).toHaveLength(180);
    expect(grid.slice(-2)).toMatchObject([
      { date: '2026-09-25T15:00:00.000Z', upRatio: 1 },
      { date: '2026-09-26T15:00:00.000Z', upRatio: 0.5 },
    ]);
  });
});

describe('toMonitorUptimePresentation stats', () => {
  it('covers the last N calendar days including today, not the last N days with data', () => {
    // Only two monitored days: today, and a fully down day 20 days ago
    const rows = [day('2026-09-26', 3_600, 3_600), day('2026-09-06', 0)];

    const { stats } = toMonitorUptimePresentation(rows, 'UTC');
    const byWindow = new Map(stats.map((stat) => [stat.windowDays, stat.percent]));

    expect(byWindow.get(7)).toBe(100);
    expect(byWindow.get(30)).toBeCloseTo((3_600 / (3_600 + 86_400)) * 100, 10);
  });

  it('starts the window on the zone calendar day', () => {
    // In Tokyo today is 09-27, so the 7 day window starts on 09-21
    const rows = [day('2026-09-21', 86_400), day('2026-09-20', 0)];

    const { stats } = toMonitorUptimePresentation(rows, 'Asia/Tokyo');

    expect(stats.find((stat) => stat.windowDays === 7)?.percent).toBe(100);
  });

  it('shows no percentage for a window with no monitored time', () => {
    const { stats } = toMonitorUptimePresentation([day('2026-08-01', 86_400)], 'UTC');

    expect(stats.find((stat) => stat.windowDays === 7)).toMatchObject({ percent: null, downtime: null });
    expect(stats.find((stat) => stat.windowDays === 90)?.percent).toBe(100);
  });
});
