import { describe, expect, it } from 'vitest';
import { BLACK_FRIDAY_2026, livePromo, PROMO_TIME_ZONE, promoCents, promoLastDay } from './promo';

describe('livePromo', () => {
  const end = BLACK_FRIDAY_2026.endsAt.getTime();

  it('runs on cloud until the end', () => {
    expect(livePromo(true, end - 1)).toBe(BLACK_FRIDAY_2026);
    expect(livePromo(true, end)).toBeNull();
  });

  it('never runs self-hosted', () => {
    expect(livePromo(false, end - 1)).toBeNull();
  });
});

describe('promoCents', () => {
  it('matches what Stripe charges for a percent-off coupon', () => {
    expect(promoCents(900, BLACK_FRIDAY_2026)).toBe(630);
    expect(promoCents(25_400, BLACK_FRIDAY_2026)).toBe(17_780);
  });
});

describe('promoLastDay', () => {
  it('is December 1 in the promo time zone', () => {
    const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: PROMO_TIME_ZONE });
    expect(day.format(promoLastDay(BLACK_FRIDAY_2026))).toBe('Dec 1');
  });
});
