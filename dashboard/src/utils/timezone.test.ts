import { describe, expect, it } from 'vitest';
import { FALLBACK_TIMEZONE, isValidTimezone, resolveTimezone } from './timezone';
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
