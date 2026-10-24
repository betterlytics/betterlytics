import { describe, expect, it } from 'vitest';
import moment from 'moment-timezone';
import { getResolvedRanges } from './ba-timerange';

const at = (date: string, tz: string) => moment.tz(date, tz).toDate();

describe('getResolvedRanges granularity fallback', () => {
  it('keeps the picked days when a short custom range falls back from day to hour', () => {
    const tz = 'Etc/UTC';
    const result = getResolvedRanges('custom', 'off', tz, at('2026-09-20', tz), at('2026-09-21', tz), 'day');

    expect(result.granularity).toBe('hour');
    expect(result.main).toEqual({ start: at('2026-09-20', tz), end: at('2026-09-21 23:59:59', tz) });
  });

  it('keeps the picked days when a DST change makes a custom range too short for week', () => {
    const tz = 'America/New_York';
    const result = getResolvedRanges('custom', 'off', tz, at('2026-03-01', tz), at('2026-03-27', tz), 'week');

    expect(result.granularity).toBe('day');
    expect(result.main).toEqual({ start: at('2026-03-01', tz), end: at('2026-03-27 23:59:59', tz) });
  });
});

describe('getResolvedRanges custom time of day', () => {
  const tz = 'Europe/Copenhagen';
  const resolveCustom = (start: Date, end: Date, keepTimeOfDay: boolean, offset = 0) =>
    getResolvedRanges(
      'custom',
      'previous',
      tz,
      start,
      end,
      'minute_15',
      undefined,
      undefined,
      offset,
      false,
      keepTimeOfDay,
    );

  it('keeps exact times when asked', () => {
    const result = resolveCustom(at('2026-09-20 14:00', tz), at('2026-09-20 17:59:59', tz), true);

    expect(result.main).toEqual({ start: at('2026-09-20 14:00', tz), end: at('2026-09-20 17:59:59', tz) });
    expect(result.compare).toEqual({ start: at('2026-09-20 10:00', tz), end: at('2026-09-20 13:59:59', tz) });
  });

  it('still covers whole days for plain dates', () => {
    const result = resolveCustom(at('2026-09-20', tz), at('2026-09-22', tz), true);

    expect(result.main).toEqual({ start: at('2026-09-20', tz), end: at('2026-09-22 23:59:59', tz) });
  });

  it('covers whole days by default, as MCP inputs do', () => {
    const result = resolveCustom(at('2026-09-20 14:00', tz), at('2026-09-20 17:59:59', tz), false);

    expect(result.main).toEqual({ start: at('2026-09-20', tz), end: at('2026-09-20 23:59:59', tz) });
  });

  it('shifts a sub-day range by its own length', () => {
    const result = resolveCustom(at('2026-09-20 14:00', tz), at('2026-09-20 17:59:59', tz), true, -1);

    expect(result.main).toEqual({ start: at('2026-09-20 10:00', tz), end: at('2026-09-20 13:59:59', tz) });
  });

  it('shifts a whole-day range by calendar days across a DST change', () => {
    const result = resolveCustom(at('2026-10-24', tz), at('2026-10-25', tz), true, 1);

    expect(result.main).toEqual({ start: at('2026-10-26', tz), end: at('2026-10-27 23:59:59', tz) });
  });
});
