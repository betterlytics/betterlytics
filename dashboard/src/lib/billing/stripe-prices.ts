import 'server-only';

import type { Stripe } from 'stripe';
import { stripe } from '@/lib/billing/stripe';

/**
 * Look up the active Stripe Price for a price lookup key (with currency options
 * expanded), or undefined if none exists. Callers decide how to surface "not found".
 */
export async function findActivePriceByLookupKey(lookupKey: string): Promise<Stripe.Price | undefined> {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    expand: ['data.currency_options'],
  });
  return prices.data[0];
}
