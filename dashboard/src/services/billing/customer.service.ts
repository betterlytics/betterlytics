import 'server-only';

import type { User } from 'next-auth';
import { stripe } from '@/lib/billing/stripe';
import {
  getUserSubscription,
  setSubscriptionPaymentCustomerId,
} from '@/repositories/postgres/subscription.repository';
import type { CustomerCreditBalance } from '@/entities/billing/billing.entities';

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

export async function getCustomerCreditBalance(userId: string): Promise<CustomerCreditBalance> {
  const subscription = await getUserSubscription(userId);
  if (!subscription?.paymentCustomerId) {
    return { creditBalance: 0, currency: subscription?.currency ?? 'USD' };
  }

  const customer = await stripe.customers.retrieve(subscription.paymentCustomerId);
  if ('deleted' in customer && customer.deleted) {
    return { creditBalance: 0, currency: subscription.currency ?? 'USD' };
  }

  const balance = customer.balance ?? 0;
  if (balance < 0 && !customer.currency) {
    console.warn('Credit balance has no customer currency', {
      customerId: subscription.paymentCustomerId,
    });
    return { creditBalance: 0, currency: 'USD' };
  }

  return {
    creditBalance: balance < 0 ? -balance : 0,
    currency: (customer.currency ?? 'USD').toUpperCase(),
  };
}
