import Stripe from 'stripe';
import { env } from '../env';
import { isFeatureEnabled } from '../feature-flags';

let _stripe: Stripe | null = null;

function createStripeInstance(): Stripe {
  if (!isFeatureEnabled('enableBilling')) {
    throw new Error('Billing is disabled');
  }

  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key is not configured');
  }

  return new Stripe(env.STRIPE_SECRET_KEY, {
    typescript: true,
  });
}

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = createStripeInstance();
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const stripeInstance = getStripe();
    const value = stripeInstance[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(stripeInstance) : value;
  },
});
