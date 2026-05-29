import 'server-only';

import type { User } from 'next-auth';
import { stripe } from '@/lib/billing/stripe';
import {
  getUserSubscription,
  setSubscriptionPaymentCustomerId,
} from '@/repositories/postgres/subscription.repository';

export async function getOrCreateStripeCustomer(user: User): Promise<string> {
  const subscription = await getUserSubscription(user.id);
  if (subscription?.paymentCustomerId) {
    return subscription.paymentCustomerId;
  }

  const customer = await stripe.customers.create(
    {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    },
    { idempotencyKey: `customer-create:${user.id}` },
  );

  await setSubscriptionPaymentCustomerId(user.id, customer.id);
  return customer.id;
}

export async function getLockedCustomerCurrency(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId);
  if ('deleted' in customer && customer.deleted) return null;
  return customer.currency ?? null;
}
