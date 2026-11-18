import type { Stripe } from 'stripe';

export type SubscriptionDiscount = { percentOff: number; endsAt: Date | null };

export const DISCOUNT_EXPAND = ['discounts.source.coupon'];

export function applyPercentOff(cents: number, percentOff: number): number {
  return Math.round((cents * (100 - percentOff)) / 100);
}

/** Reads a subscription retrieved with `DISCOUNT_EXPAND`. */
export function percentDiscountOf(subscription: Stripe.Subscription): SubscriptionDiscount | null {
  for (const discount of subscription.discounts ?? []) {
    if (typeof discount === 'string') continue;
    const coupon = discount.source.coupon;
    if (coupon && typeof coupon !== 'string' && coupon.percent_off) {
      return { percentOff: coupon.percent_off, endsAt: discount.end ? new Date(discount.end * 1000) : null };
    }
  }
  return null;
}

export function activeDiscount(
  subscription: { discountPercentOff: number | null; discountEndsAt: Date | null },
  at: Date = new Date(),
): SubscriptionDiscount | null {
  const { discountPercentOff: percentOff, discountEndsAt: endsAt } = subscription;
  if (!percentOff || (endsAt && endsAt <= at)) return null;
  return { percentOff, endsAt };
}
