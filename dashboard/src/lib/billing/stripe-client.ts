'use client';

// The default entry injects the js.stripe.com script tag as an import side effect;
// the /pure entry only loads it when loadStripe is actually called.
import { loadStripe } from '@stripe/stripe-js/pure';
import type { Stripe } from '@stripe/stripe-js';

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

export async function confirm3DS(publishableKey: string, clientSecret: string): Promise<boolean> {
  const stripe = publishableKey ? await getStripeClient(publishableKey) : null;
  if (!stripe) return false;

  const { error } = await stripe.handleNextAction({ clientSecret });
  return !error;
}
