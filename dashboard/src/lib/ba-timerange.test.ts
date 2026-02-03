import { describe, it, expect } from 'vitest';
import moment from 'moment-timezone';
import { getResolvedRanges } from './ba-timerange';

const TZ = 'UTC';

function mainBuckets(result: ReturnType<typeof getResolvedRanges>) {
  const { start, end } = result.main;
  const s = moment.tz(start, TZ);
  const e = moment.tz(end, TZ).add(1, 'second');
  const unit = result.granularity === 'month' ? 'month' : 'week';
  const floored = s.clone().startOf(unit === 'week' ? 'isoWeek' : unit);
  const ceiled = e.clone();
  const ceiledFloored = ceiled.clone().startOf(unit === 'week' ? 'isoWeek' : unit);
  const alignedEnd = ceiledFloored.isSame(ceiled) ? ceiled : ceiledFloored.add(1, unit);
  return alignedEnd.diff(floored, unit);
}

function compareBuckets(result: ReturnType<typeof getResolvedRanges>) {
  if (!result.compare) return undefined;
  const { start, end } = result.compare;
  const s = moment.tz(start, TZ);
  const e = moment.tz(end, TZ).add(1, 'second');
  const unit = result.granularity === 'month' ? 'month' : 'week';
  const floored = s.clone().startOf(unit === 'week' ? 'isoWeek' : unit);
  const ceiled = e.clone();
  const ceiledFloored = ceiled.clone().startOf(unit === 'week' ? 'isoWeek' : unit);
  const alignedEnd = ceiledFloored.isSame(ceiled) ? ceiled : ceiledFloored.add(1, unit);
  return alignedEnd.diff(floored, unit);
}

function isMonday(d: Date) {
  return moment.tz(d, TZ).isoWeekday() === 1;
}

function isFirstOfMonth(d: Date) {
  return moment.tz(d, TZ).date() === 1;
}

describe('ba-timerange week granularity — start never floored', () => {
  it('90d with week granularity does not floor start to Monday', () => {
    const result = getResolvedRanges('90d', 'off', TZ, new Date(), new Date(), 'week');
    expect(result.granularity).toBe('week');
    const start = moment.tz(result.main.start, TZ);
    const end = moment.tz(result.main.end, TZ).add(1, 'second');
    const days = end.diff(start, 'days');
    expect(days).toBeGreaterThanOrEqual(90);
    expect(days).toBeLessThanOrEqual(96);
  });

  it('28d with week granularity — start not floored, end snap-ceiled to Monday', () => {
    const result = getResolvedRanges('28d', 'off', TZ, new Date(), new Date(), 'week');
    const end = moment.tz(result.main.end, TZ).add(1, 'second');
    expect(end.isoWeekday()).toBe(1);
    const start = moment.tz(result.main.start, TZ);
    const days = end.diff(start, 'days');
    expect(days).toBeGreaterThanOrEqual(28);
    expect(days).toBeLessThanOrEqual(34);
  });

  it('1y with week granularity does not floor start to Monday', () => {
    const result = getResolvedRanges('1y', 'off', TZ, new Date(), new Date(), 'week');
    expect(result.granularity).toBe('week');
    const end = moment.tz(result.main.end, TZ).add(1, 'second');
    expect(end.isoWeekday()).toBe(1);
  });

  it('ytd with week granularity does not floor start to Monday', () => {
    const result = getResolvedRanges('ytd', 'off', TZ, new Date(), new Date(), 'week');
    expect(result.granularity).toBe('week');
    const end = moment.tz(result.main.end, TZ).add(1, 'second');
    expect(end.isoWeekday()).toBe(1);
  });

  it('custom range (Wed to Thu) with week granularity — start unaligned', () => {
    const wed = new Date('2025-01-08T12:00:00Z');
    const thu = new Date('2025-02-06T12:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, wed, thu, 'week');
    const start = moment.tz(result.main.start, TZ);
    expect(start.format('YYYY-MM-DD')).toBe('2025-01-08');
    const end = moment.tz(result.main.end, TZ).add(1, 'second');
    expect(end.isoWeekday()).toBe(1);
  });
});

describe('ba-timerange month granularity — start never floored', () => {
  it('1y with month granularity — end snap-ceiled to 1st', () => {
    const result = getResolvedRanges('1y', 'off', TZ, new Date(), new Date(), 'month');
    expect(result.granularity).toBe('month');
    const end = moment.tz(result.main.end, TZ).add(1, 'second');
    expect(end.date()).toBe(1);
  });

  it('custom range (Jan 15 to Jul 20) with month granularity — start unaligned, end snap-ceiled', () => {
    const jan15 = new Date('2025-01-15T00:00:00Z');
    const jul20 = new Date('2025-07-20T00:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, jan15, jul20, 'month');
    expect(result.granularity).toBe('month');
    const start = moment.tz(result.main.start, TZ);
    expect(start.format('YYYY-MM-DD')).toBe('2025-01-15');
    const end = moment.tz(result.main.end, TZ).add(1, 'second');
    expect(end.date()).toBe(1);
    expect(end.format('YYYY-MM-DD')).toBe('2025-08-01');
  });
});

describe('ba-timerange startBucketIncomplete flag', () => {
  it('28d + week → startBucketIncomplete depends on start day', () => {
    const result = getResolvedRanges('28d', 'off', TZ, new Date(), new Date(), 'week');
    const startDay = moment.tz(result.main.start, TZ).isoWeekday();
    expect(result.startBucketIncomplete).toBe(startDay !== 1);
  });

  it('28d + day → startBucketIncomplete = false', () => {
    const result = getResolvedRanges('28d', 'off', TZ, new Date(), new Date(), 'day');
    expect(result.startBucketIncomplete).toBe(false);
  });

  it('1y + month → startBucketIncomplete depends on start date', () => {
    const result = getResolvedRanges('1y', 'off', TZ, new Date(), new Date(), 'month');
    const startDate = moment.tz(result.main.start, TZ).date();
    expect(result.startBucketIncomplete).toBe(startDate !== 1);
  });

  it('1y + week → startBucketIncomplete depends on start day', () => {
    const result = getResolvedRanges('1y', 'off', TZ, new Date(), new Date(), 'week');
    const startDay = moment.tz(result.main.start, TZ).isoWeekday();
    expect(result.startBucketIncomplete).toBe(startDay !== 1);
  });

  it('custom range starting on Monday + week → startBucketIncomplete = false', () => {
    const monday = new Date('2025-01-06T00:00:00Z');
    const sunday = new Date('2025-02-16T00:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, monday, sunday, 'week');
    expect(result.startBucketIncomplete).toBe(false);
  });

  it('custom range starting on Wednesday + week → startBucketIncomplete = true', () => {
    const wed = new Date('2025-01-08T00:00:00Z');
    const thu = new Date('2025-02-06T00:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, wed, thu, 'week');
    expect(result.startBucketIncomplete).toBe(true);
  });

  it('custom range starting on 1st + month → startBucketIncomplete = false', () => {
    const jan1 = new Date('2025-01-01T00:00:00Z');
    const jul1 = new Date('2025-07-01T00:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, jan1, jul1, 'month');
    expect(result.startBucketIncomplete).toBe(false);
  });

  it('custom range starting on 15th + month → startBucketIncomplete = true', () => {
    const jan15 = new Date('2025-01-15T00:00:00Z');
    const jul20 = new Date('2025-07-20T00:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, jan15, jul20, 'month');
    expect(result.startBucketIncomplete).toBe(true);
  });
});

describe('ba-timerange week granularity — compare ranges', () => {
  it('previous mode bucket count within ±1 of main', () => {
    const result = getResolvedRanges('90d', 'previous', TZ, new Date(), new Date(), 'week');
    expect(result.compare).toBeDefined();
    expect(Math.abs(compareBuckets(result)! - mainBuckets(result))).toBeLessThanOrEqual(1);
  });

  it('previous mode with 28d produces exact same bucket count as main', () => {
    const result = getResolvedRanges('28d', 'previous', TZ, new Date(), new Date(), 'week');
    expect(result.compare).toBeDefined();
    expect(compareBuckets(result)).toBe(mainBuckets(result));
  });

  it('year mode bucket count within ±1 of main', () => {
    const result = getResolvedRanges('90d', 'year', TZ, new Date(), new Date(), 'week');
    expect(result.compare).toBeDefined();
    expect(Math.abs(compareBuckets(result)! - mainBuckets(result))).toBeLessThanOrEqual(1);
  });

  it('custom compare mode bucket count within ±1 of main', () => {
    const mainStart = new Date('2025-01-06T00:00:00Z');
    const mainEnd = new Date('2025-03-03T00:00:00Z');
    const cmpStart = new Date('2024-01-10T00:00:00Z');
    const cmpEnd = new Date('2024-03-07T00:00:00Z');
    const result = getResolvedRanges('custom', 'custom', TZ, mainStart, mainEnd, 'week', cmpStart, cmpEnd);
    expect(result.compare).toBeDefined();
    expect(Math.abs(compareBuckets(result)! - mainBuckets(result))).toBeLessThanOrEqual(1);
  });

  it('previous mode compare end equals main start', () => {
    const result = getResolvedRanges('90d', 'previous', TZ, new Date(), new Date(), 'week');
    expect(result.compare).toBeDefined();
    const compareEnd = moment.tz(result.compare!.end, TZ).add(1, 'second');
    const mainStart = moment.tz(result.main.start, TZ);
    expect(compareEnd.format('YYYY-MM-DD')).toBe(mainStart.format('YYYY-MM-DD'));
  });
});

describe('ba-timerange month granularity — compare ranges', () => {
  it('previous mode bucket count within ±1 of main', () => {
    const result = getResolvedRanges('1y', 'previous', TZ, new Date(), new Date(), 'month');
    expect(result.granularity).toBe('month');
    expect(result.compare).toBeDefined();
    expect(Math.abs(compareBuckets(result)! - mainBuckets(result))).toBeLessThanOrEqual(1);
  });

  it('year mode produces same bucket count as main', () => {
    const result = getResolvedRanges('1y', 'year', TZ, new Date(), new Date(), 'month');
    expect(result.granularity).toBe('month');
    expect(result.compare).toBeDefined();
    expect(compareBuckets(result)).toBe(mainBuckets(result));
  });

  it('custom compare mode bucket count within ±1 of main', () => {
    const mainStart = new Date('2025-01-01T00:00:00Z');
    const mainEnd = new Date('2025-07-01T00:00:00Z');
    const cmpStart = new Date('2024-01-15T00:00:00Z');
    const cmpEnd = new Date('2024-07-15T00:00:00Z');
    const result = getResolvedRanges('custom', 'custom', TZ, mainStart, mainEnd, 'month', cmpStart, cmpEnd);
    expect(result.granularity).toBe('month');
    expect(result.compare).toBeDefined();
    expect(Math.abs(compareBuckets(result)! - mainBuckets(result))).toBeLessThanOrEqual(1);
  });
});

describe('ba-timerange edge cases', () => {
  it('range already on Monday boundaries stays correct', () => {
    const monday1 = new Date('2025-01-06T00:00:00Z');
    const sunday = new Date('2025-02-16T00:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, monday1, sunday, 'week');
    const start = moment.tz(result.main.start, TZ);
    expect(start.format('YYYY-MM-DD')).toBe('2025-01-06');
    expect(result.startBucketIncomplete).toBe(false);
  });

  it('single-week range', () => {
    const monday = new Date('2025-01-06T00:00:00Z');
    const sunday = new Date('2025-01-12T00:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, monday, sunday, 'week');
    const start = moment.tz(result.main.start, TZ);
    const end = moment.tz(result.main.end, TZ).add(1, 'second');
    expect(start.isoWeekday()).toBe(1);
    expect(end.diff(start, 'week')).toBe(1);
  });

  it('single-month range with month granularity', () => {
    const jan1 = new Date('2024-01-01T00:00:00Z');
    const jul1 = new Date('2024-07-01T00:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, jan1, jul1, 'month');
    expect(result.granularity).toBe('month');
    const start = moment.tz(result.main.start, TZ);
    const end = moment.tz(result.main.end, TZ).add(1, 'second');
    expect(start.date()).toBe(1);
    expect(end.diff(start, 'month')).toBeGreaterThan(0);
  });

  it('year boundary crossing with week granularity', () => {
    const dec = new Date('2024-12-15T00:00:00Z');
    const jan = new Date('2025-01-15T00:00:00Z');
    const result = getResolvedRanges('custom', 'off', TZ, dec, jan, 'week');
    const start = moment.tz(result.main.start, TZ);
    expect(start.format('YYYY-MM-DD')).toBe('2024-12-15');
  });
});
