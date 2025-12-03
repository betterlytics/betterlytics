'server-only';

import { upsertSubscription } from '@/repositories/postgres/subscription';
import { STARTER_SUBSCRIPTION_STATIC, buildStarterSubscriptionWindow } from '@/entities/billing';

export async function createStarterSubscriptionForUser(userId: string): Promise<void> {
  const { currentPeriodStart, currentPeriodEnd } = buildStarterSubscriptionWindow();

  await upsertSubscription({
    userId,
    ...STARTER_SUBSCRIPTION_STATIC,
    currentPeriodStart,
    currentPeriodEnd,
  });
}
