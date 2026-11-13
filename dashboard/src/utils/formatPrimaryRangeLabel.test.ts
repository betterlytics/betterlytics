import { describe, expect, it } from 'vitest';
import { formatPrimaryRangeLabel } from './formatPrimaryRangeLabel';

const TZ = 'Asia/Tokyo';

describe('formatPrimaryRangeLabel in a zone', () => {
  it('treats a zone midnight-to-midnight range as one full day', () => {
    const label = formatPrimaryRangeLabel({
      interval: 'custom',
      offset: 0,
      startDate: new Date('2026-09-21T15:00:00Z'), // Sep 22 00:00 in Tokyo
      endDate: new Date('2026-09-22T14:59:59Z'), // Sep 22 23:59:59 in Tokyo
      locale: 'en',
      timeZone: TZ,
    });

    expect(label).toBe('Sep 22');
  });

  it('spans full zone days', () => {
    const label = formatPrimaryRangeLabel({
      interval: 'custom',
      offset: 0,
      startDate: new Date('2026-09-19T15:00:00Z'), // Sep 20 00:00 in Tokyo
      endDate: new Date('2026-09-22T14:59:59Z'), // Sep 22 23:59:59 in Tokyo
      locale: 'en',
      timeZone: TZ,
    });

    expect(label).toBe('Sep 20 - Sep 22');
  });
});

describe('formatPrimaryRangeLabel with the year', () => {
  it('adds the year to a sub-day range', () => {
    const label = formatPrimaryRangeLabel({
      interval: 'custom',
      offset: 0,
      startDate: new Date('2025-10-23T05:00:00Z'), // Oct 23 14:00 in Tokyo
      endDate: new Date('2025-10-23T08:59:59Z'), // Oct 23 17:59:59 in Tokyo
      locale: 'en',
      timeZone: TZ,
      showYear: true,
    });

    expect(label).toBe('Oct 23, 2025 14:00 - 18:00');
  });
});
