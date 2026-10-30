import { afterEach, describe, expect, it } from 'vitest';
import { formatShortWeekdayNames, formatWeekRange, getPartialBucketRange } from './dateFormatters';

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

describe('formatShortWeekdayNames', () => {
  const originalRuntimeZone = process.env.TZ;

  function setRuntimeZone(zone: string | undefined) {
    if (zone === undefined) delete process.env.TZ;
    else process.env.TZ = zone;
  }

  afterEach(() => setRuntimeZone(originalRuntimeZone));

  it.each(['America/New_York', 'UTC', 'Asia/Tokyo'])(
    'lists Monday to Sunday when the runtime zone is %s',
    (zone) => {
      setRuntimeZone(zone);
      expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(zone);

      expect(formatShortWeekdayNames('en')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    },
  );

  it('follows the locale', () => {
    setRuntimeZone('America/New_York');

    expect(formatShortWeekdayNames('da')).toEqual(['man.', 'tirs.', 'ons.', 'tors.', 'fre.', 'lør.', 'søn.']);
  });
});
