import { describe, expect, it } from 'vitest';
import {
  FALLBACK_TIMEZONE,
  createDateTimeFormat,
  formatDayKey,
  fromWallClock,
  isValidTimezone,
  resolveTimezone,
  toWallClock,
} from './timezone';
import { BATimeZone } from '@/entities/analytics/analyticsQuery.entities';

describe('isValidTimezone', () => {
  it.each(['Europe/Berlin', 'Etc/UTC', 'America/Edmonton'])('accepts %s', (tz) => {
    expect(isValidTimezone(tz)).toBe(true);
  });

  it.each([undefined, null, '', 'Etc/Unknown', 'Foo/Bar'])('rejects %s', (tz) => {
    expect(isValidTimezone(tz)).toBe(false);
  });
});

describe('resolveTimezone', () => {
  it('prefers the setting over the browser', () => {
    expect(resolveTimezone('America/Edmonton', 'Europe/Berlin')).toEqual({
      timeZone: 'America/Edmonton',
      source: 'setting',
    });
  });

  it('uses the browser when the setting is auto-detect', () => {
    expect(resolveTimezone(null, 'Europe/Berlin')).toEqual({ timeZone: 'Europe/Berlin', source: 'browser' });
  });

  it('falls back to UTC when neither is available', () => {
    expect(resolveTimezone(null, null)).toEqual({ timeZone: FALLBACK_TIMEZONE, source: 'fallback' });
    expect(resolveTimezone(undefined, null)).toEqual({ timeZone: 'Etc/UTC', source: 'fallback' });
  });

  it('ignores an invalid setting', () => {
    expect(resolveTimezone('Foo/Bar', 'Europe/Berlin')).toEqual({ timeZone: 'Europe/Berlin', source: 'browser' });
    expect(resolveTimezone('Etc/Unknown', null)).toEqual({ timeZone: 'Etc/UTC', source: 'fallback' });
  });
});

describe('BATimeZone', () => {
  it.each([
    [undefined, 'Etc/UTC'],
    [null, 'Etc/UTC'],
    ['', 'Etc/UTC'],
    ['Etc/Unknown', 'Etc/UTC'],
    ['Foo/Bar', 'Etc/UTC'],
    ['Europe/Berlin', 'Europe/Berlin'],
  ])('%s → %s', (input, expected) => {
    expect(BATimeZone.parse(input)).toBe(expected);
  });
});

describe('wall clock', () => {
  const instant = new Date('2026-09-22T05:30:00Z');

  it.each(['Asia/Tokyo', 'America/New_York'])('round trips through %s', (tz) => {
    expect(fromWallClock(toWallClock(instant, tz), tz)).toEqual(instant);
  });

  it('carries the zone wall clock in local fields', () => {
    const wall = toWallClock(instant, 'Asia/Tokyo');
    expect([wall.getDate(), wall.getHours(), wall.getMinutes()]).toEqual([22, 14, 30]);
  });
});

describe('createDateTimeFormat', () => {
  it('formats in the given zone', () => {
    const formatter = createDateTimeFormat('en', { hour: '2-digit', hourCycle: 'h23' }, 'Asia/Tokyo');
    expect(formatter.format(new Date('2026-09-22T05:00:00Z'))).toBe('14');
  });

  it('falls back instead of throwing on a zone Intl rejects', () => {
    expect(() => createDateTimeFormat('en', { hour: '2-digit' }, 'Foo/Bar').format(new Date())).not.toThrow();
  });
});

describe('formatDayKey', () => {
  it('uses the zone calendar day', () => {
    const instant = new Date('2026-09-21T16:00:00Z');
    expect(formatDayKey(instant, 'Asia/Tokyo')).toBe('2026-09-22');
    expect(formatDayKey(instant, 'America/New_York')).toBe('2026-09-21');
  });
});
