import { describe, expect, it } from 'vitest';
import { dateLabelFormatter, granularityDateFormatter } from './chartUtils';

describe('chart date formatters in a zone', () => {
  it('labels an hour bucket with the zone wall clock', () => {
    const bucket = new Date('2026-09-22T05:00:00Z'); // 01:00 in New York

    expect(dateLabelFormatter('hour', 'en', 'America/New_York')(bucket.getTime())).toContain('01:00');
    expect(granularityDateFormatter('hour', 'en', 'America/New_York')(bucket)).toContain('01:00');
  });

  it('labels a week bucket with the zone date', () => {
    const tokyoMonday = new Date('2026-09-20T15:00:00Z'); // Mon Sep 21 00:00 in Tokyo

    expect(granularityDateFormatter('week', 'en', 'Asia/Tokyo')(tokyoMonday)).toContain('Sep 21');
    expect(dateLabelFormatter('week', 'en', 'Asia/Tokyo')(tokyoMonday.getTime())).toContain('Sep 21');
  });
});
