'server-only';

import {
  getSubscriptionByPaymentId as getSubscriptionByPaymentIdRepository,
  upsertSubscription as upsertSubscriptionRepository,
  updateSubscriptionStatus as updateSubscriptionStatusRepository,
} from '@/repositories/postgres/subscription';
import { STARTER_SUBSCRIPTION_STATIC, buildStarterSubscriptionWindow } from '@/entities/billing';

export async function createStarterSubscriptionForUser(userId: string): Promise<void> {
  const { currentPeriodStart, currentPeriodEnd } = buildStarterSubscriptionWindow();

  await upsertSubscriptionRepository({
    userId,
    ...STARTER_SUBSCRIPTION_STATIC,
    currentPeriodStart,
    currentPeriodEnd,
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
