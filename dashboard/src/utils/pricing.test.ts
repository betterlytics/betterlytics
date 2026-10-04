import { describe, expect, it } from 'vitest';
import { EVENT_RANGES } from '@/lib/billing/plans';
import { compactEventParts, formatEventCount } from './pricing';

/** `_` stands for the no-break space CLDR puts between a number and some units. */
const nbsp = (text: string) => text.replace(/_/g, '\u00a0');

describe('formatEventCount', () => {
  it.each([
    ['en', '10K | 50K | 100K | 200K | 500K | 1M | 2M | 5M | 10M | 10M+'],
    ['da', '10_t | 50_t | 100_t | 200_t | 500_t | 1_mio. | 2_mio. | 5_mio. | 10_mio. | 10_mio.+'],
    ['it', '10K | 50K | 100K | 200K | 500K | 1_Mln | 2_Mln | 5_Mln | 10_Mln | 10_Mln+'],
    ['nb', '10k | 50k | 100k | 200k | 500k | 1_mill. | 2_mill. | 5_mill. | 10_mill. | 10_mill.+'],
  ] as const)('labels the pricing tiers in %s whatever the runtime ICU', (locale, expected) => {
    const labels = EVENT_RANGES.map((range) => formatEventCount(range.value, locale)).join(' | ');
    expect(labels).toBe(nbsp(expected));
  });

  it.each([
    [999, '999'],
    [1_499, '1K'],
    [1_500, '2K'],
    [999_499, '999K'],
    [999_500, '1M'],
    [2_500_000, '3M'],
    [10_000_001, '10M+'],
  ])('rounds %i to %s', (value, expected) => {
    expect(formatEventCount(value, 'en')).toBe(expected);
  });
});

describe('compactEventParts', () => {
  it('splits a count into a whole number and its unit, with the plus past the cap', () => {
    expect(compactEventParts(2_000_000, 'da')).toEqual({ scaled: 2, suffix: nbsp('_mio.') });
    expect(compactEventParts(10_000_001, 'it')).toEqual({ scaled: 10, suffix: nbsp('_Mln+') });
  });
});
