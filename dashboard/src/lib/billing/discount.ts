import type { Stripe } from 'stripe';
import type { Promo } from '@/lib/billing/promo';

export type SubscriptionDiscount = { percentOff: number; endsAt: Date | null };

/** A checkout promo runs for a number of months; a subscriber's own discount runs until a date. */
export type CardDiscount =
  | { kind: 'promo'; percentOff: number; months: number }
  | ({ kind: 'subscriber' } & SubscriptionDiscount);

export type CardDiscountNote = { key: 'then'; months: number } | { key: 'untilThen'; endsAt: Date } | null;

export const DISCOUNT_EXPAND = ['discounts.source.coupon'];

export function applyPercentOff(cents: number, percentOff: number): number {
  return Math.round((cents * (100 - percentOff)) / 100);
}

// Promo.endsAt is when the sale stops, not when the customer's discount stops, so it stays behind
export function promoCardDiscount(promo: Promo): CardDiscount {
  return { kind: 'promo', percentOff: promo.percentOff, months: promo.months };
}

export function cardDiscountNote(discount: CardDiscount): CardDiscountNote {
  if (discount.kind === 'promo') return { key: 'then', months: discount.months };
  return discount.endsAt ? { key: 'untilThen', endsAt: discount.endsAt } : null;
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
