import { describe, expect, it } from 'vitest';
import type { Stripe } from 'stripe';
import { activeDiscount, applyPercentOff, percentDiscountOf } from './discount';

function subscriptionWith(discounts: unknown[]): Stripe.Subscription {
  return { discounts } as unknown as Stripe.Subscription;
}

describe('percentDiscountOf', () => {
  it('reads an expanded percent-off coupon and its end', () => {
    const sub = subscriptionWith([{ end: 1_826_201_904, source: { coupon: { id: 'X', percent_off: 30 } } }]);
    expect(percentDiscountOf(sub)).toEqual({ percentOff: 30, endsAt: new Date(1_826_201_904_000) });
  });

  it('treats a discount without an end as permanent', () => {
    const sub = subscriptionWith([{ end: null, source: { coupon: { id: 'X', percent_off: 20 } } }]);
    expect(percentDiscountOf(sub)).toEqual({ percentOff: 20, endsAt: null });
  });

  it('keeps a fractional percent', () => {
    const sub = subscriptionWith([{ end: null, source: { coupon: { id: 'X', percent_off: 12.5 } } }]);
    expect(percentDiscountOf(sub)).toEqual({ percentOff: 12.5, endsAt: null });
  });

  it('ignores amount-off coupons and unexpanded discounts', () => {
    const sub = subscriptionWith(['di_123', { end: null, source: { coupon: { id: 'X', percent_off: null } } }]);
    expect(percentDiscountOf(sub)).toBeNull();
  });
});

describe('activeDiscount', () => {
  const endsAt = new Date('2027-11-14T14:18:24Z');

  it('applies until the end', () => {
    expect(
      activeDiscount({ discountPercentOff: 30, discountEndsAt: endsAt }, new Date('2027-11-14T14:18:23Z')),
    ).toEqual({ percentOff: 30, endsAt });
    expect(activeDiscount({ discountPercentOff: 30, discountEndsAt: endsAt }, endsAt)).toBeNull();
  });

  it('is null without a discount', () => {
    expect(activeDiscount({ discountPercentOff: null, discountEndsAt: null })).toBeNull();
  });
});

describe('applyPercentOff', () => {
  it('rounds to whole cents', () => {
    expect(applyPercentOff(1400, 30)).toBe(980);
    expect(applyPercentOff(25400, 30)).toBe(17780);
    expect(applyPercentOff(1400, 12.5)).toBe(1225);
    expect(applyPercentOff(999, 12.5)).toBe(874);
  });
});
