import 'server-only';

import type { Stripe } from 'stripe';
import { stripe } from '@/lib/billing/stripe';
import {
  getSubscriptionByPaymentId as getSubscriptionByPaymentIdRepository,
  upsertSubscription as upsertSubscriptionRepository,
  updateSubscriptionStatus as updateSubscriptionStatusRepository,
} from '@/repositories/postgres/subscription.repository';
import { buildStarterSubscription } from '@/entities/billing/billing.entities';

export async function createStarterSubscriptionForUser(userId: string): Promise<void> {
  const starterSubscription = buildStarterSubscription();

  await upsertSubscriptionRepository({
    userId,
    ...starterSubscription,
  });
}

export async function upsertUserSubscription(
  ...args: Parameters<typeof upsertSubscriptionRepository>
): ReturnType<typeof upsertSubscriptionRepository> {
  return upsertSubscriptionRepository(...args);
}

export async function setSubscriptionStatus(
  ...args: Parameters<typeof updateSubscriptionStatusRepository>
): ReturnType<typeof updateSubscriptionStatusRepository> {
  return updateSubscriptionStatusRepository(...args);
}

export async function findSubscriptionByPaymentId(
  ...args: Parameters<typeof getSubscriptionByPaymentIdRepository>
): ReturnType<typeof getSubscriptionByPaymentIdRepository> {
  return getSubscriptionByPaymentIdRepository(...args);
}

export async function clearScheduledCancellation(sub: Stripe.Subscription): Promise<Stripe.Subscription> {
  if (sub.cancel_at_period_end) {
    return stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
  }
  if (sub.cancel_at !== null) {
    return stripe.subscriptions.update(sub.id, { cancel_at: null });
  }
  return sub;
}
