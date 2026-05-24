'use client';

import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(publishableKey: string): Promise<Stripe | null> {
  if (!publishableKey) {
    throw new Error('Stripe publishable key is not configured');
  }
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}
