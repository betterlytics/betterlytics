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
