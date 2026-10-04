import { describe, expect, it } from 'vitest';
import { formatWeekRange, getPartialBucketRange } from './dateFormatters';

const TZ = 'Asia/Tokyo';
const tokyoMonday = new Date('2026-09-20T15:00:00Z'); // Mon Sep 21 00:00 in Tokyo
const tokyoSundayEnd = new Date('2026-09-27T14:59:59Z'); // Sun Sep 27 23:59:59 in Tokyo

describe('formatWeekRange in a zone', () => {
  it('starts on the zone date', () => {
    expect(formatWeekRange(tokyoMonday, 'en', false, TZ)).toBe('Sep 21 – 27');
  });
});

describe('getPartialBucketRange in a zone', () => {
  it('returns undefined for a fully covered week', () => {
    expect(getPartialBucketRange(tokyoMonday, tokyoMonday, tokyoSundayEnd, 'week', 'en', TZ)).toBeUndefined();
  });

  it('returns the covered days of a partial week', () => {
    const wednesday = new Date('2026-09-22T15:00:00Z'); // Wed Sep 23 00:00 in Tokyo

    expect(getPartialBucketRange(tokyoMonday, wednesday, tokyoSundayEnd, 'week', 'en', TZ)).toBe('Sep 23 – 27');
  });
});
