export type Promo = {
  id: string;
  /** Created in Stripe by scripts/create-promo-coupon.ts. */
  couponId: string;
  percentOff: number;
  months: number;
  /** Exclusive: midnight after the last day in PROMO_TIME_ZONE. */
  endsAt: Date;
};

export const PROMO_TIME_ZONE = 'America/Los_Angeles';

export const BLACK_FRIDAY_2026: Promo = {
  id: 'black-friday-2026',
  couponId: 'BLACKFRIDAY2026',
  percentOff: 30,
  months: 12,
  endsAt: new Date('2026-12-02T08:00:00Z'),
};

export function promoHasEnded(promo: Promo, now: number = Date.now()): boolean {
  return now >= promo.endsAt.getTime();
}

export function livePromo(isCloud: boolean, now: number = Date.now()): Promo | null {
  return isCloud && !promoHasEnded(BLACK_FRIDAY_2026, now) ? BLACK_FRIDAY_2026 : null;
}

export function promoCents(cents: number, promo: Promo): number {
  return Math.round((cents * (100 - promo.percentOff)) / 100);
}

export function promoLastDay(promo: Promo): Date {
  return new Date(promo.endsAt.getTime() - 1);
}
