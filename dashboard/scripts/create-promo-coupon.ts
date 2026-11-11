import Stripe from 'stripe';
import { BLACK_FRIDAY_2026 } from '../src/lib/billing/promo';

/*
 * Creates the Stripe coupon that checkout applies while the promo runs.
 * Dry run unless --apply; a live key also needs --live.
 *   pnpm --filter dashboard exec tsx --env-file=../.env scripts/create-promo-coupon.ts
 */

// a checkout session lives 30 minutes, so one opened just before the end can still be paid
const REDEEM_GRACE_SECONDS = 60 * 60;

function isMissing(error: unknown): boolean {
  return error instanceof Stripe.errors.StripeInvalidRequestError && error.code === 'resource_missing';
}

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

  const params = {
    id: promo.couponId,
    name: 'Black Friday 2026',
    percent_off: promo.percentOff,
    duration: 'repeating',
    duration_in_months: promo.months,
    redeem_by: Math.floor(promo.endsAt.getTime() / 1000) + REDEEM_GRACE_SECONDS,
  } satisfies Stripe.CouponCreateParams;

  const existing = await stripe.coupons.retrieve(promo.couponId).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
  if (existing) {
    const wrong = (['percent_off', 'duration', 'duration_in_months', 'redeem_by'] as const).filter(
      (field) => existing[field] !== params[field],
    );
    if (wrong.length || !existing.valid) {
      console.log(
        `MISMATCH ${existing.id}: ${wrong.map((f) => `${f} is ${existing[f]}, want ${params[f]}`).join('; ')}${existing.valid ? '' : '; not valid'}`,
      );
      process.exitCode = 1;
    } else {
      console.log(`${existing.id} matches the promo`);
    }
    return;
  }

  console.log(`${apply ? 'creating' : 'would create'} coupon`, params);
  if (apply) await stripe.coupons.create(params);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
