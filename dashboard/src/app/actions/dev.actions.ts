'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { env } from '@/lib/env';
import { upsertSubscription, getUserSubscription } from '@/repositories/postgres/subscription.repository';
import { buildStarterSubscription } from '@/entities/billing/billing.entities';
import { EVENT_RANGES, TIER_TO_PLANNAME_KEY, type TierName } from '@/lib/billing/plans';
import { User } from 'next-auth';
import { revalidatePath } from 'next/cache';

export const updateDevSubscriptionAction = withUserAuth(async (user: User, tier: TierName) => {
  if (!env.IS_DEVELOPMENT) {
    throw new Error('Dev actions are only available in development mode');
  }

  if (!(tier in TIER_TO_PLANNAME_KEY)) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  const currentSubscription = await getUserSubscription(user.id);
  const { currentPeriodStart, currentPeriodEnd } = currentSubscription ?? buildStarterSubscription();

  const firstRange = EVENT_RANGES[0];
  const priceData = firstRange[tier === 'enterprise' ? 'professional' : tier];

  await upsertSubscription({
    userId: user.id,
    tier,
    status: 'active',
    eventLimit: tier === 'enterprise' ? 999_999_999 : firstRange.value,
    pricePerMonth: tier === 'enterprise' ? 0 : Math.max(0, priceData.price.usd_cents),
    currency: 'USD',
    cancelAtPeriodEnd: false,
    currentPeriodStart,
    currentPeriodEnd,
  });

  revalidatePath('/');
});
