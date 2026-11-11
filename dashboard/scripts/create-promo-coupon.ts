import Stripe from 'stripe';
import { BLACK_FRIDAY_2026 } from '../src/lib/billing/promo';

/*
 * Creates the Stripe coupon that checkout applies while the promo runs.
 * Dry run unless --apply; a live key also needs --live.
 *   pnpm --filter dashboard exec tsx --env-file=../.env scripts/create-promo-coupon.ts
 */

// a checkout session lives 30 minutes, so one opened just before the end can still be paid
const REDEEM_GRACE_SECONDS = 60 * 60;

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  const isLive = /^(sk|rk)_live_/.test(key);
  if (isLive && !argv.includes('--live'))
    throw new Error('STRIPE_SECRET_KEY is a live key; pass --live to use it');

  const stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
  const promo = BLACK_FRIDAY_2026;
  console.log(`${isLive ? 'LIVE' : 'test'} mode${apply ? '' : ' (dry run; pass --apply to write)'}`);

  const existing = await stripe.coupons.retrieve(promo.couponId).catch(() => null);
  if (existing) {
    const redeemBy = existing.redeem_by ? new Date(existing.redeem_by * 1000).toISOString() : 'no end';
    console.log(
      `${existing.id} exists: ${existing.percent_off}% off for ${existing.duration_in_months} months, redeemable until ${redeemBy}, valid ${existing.valid}`,
    );
    return;
  }

  const params: Stripe.CouponCreateParams = {
    id: promo.couponId,
    name: 'Black Friday 2026',
    percent_off: promo.percentOff,
    duration: 'repeating',
    duration_in_months: promo.months,
    redeem_by: Math.floor(promo.endsAt.getTime() / 1000) + REDEEM_GRACE_SECONDS,
  };
  console.log(`${apply ? 'creating' : 'would create'} coupon`, params);
  if (apply) await stripe.coupons.create(params);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
