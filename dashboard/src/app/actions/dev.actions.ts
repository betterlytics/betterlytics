'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { env } from '@/lib/env';
import { upsertSubscription, getUserSubscription } from '@/repositories/postgres/subscription.repository';
import { PlanIdSchema, buildFreeSubscription } from '@/entities/billing/billing.entities';
import { getPlan, type PlanId } from '@/lib/billing/catalog';
import type { User } from '@/entities/auth/session.entities';
import { revalidatePath } from 'next/cache';

const UNLIMITED_EVENTS = 999_999_999;

export const updateDevSubscriptionAction = withUserAuth(async (user: User, planId: PlanId) => {
  if (!env.IS_DEVELOPMENT) {
    throw new Error('Dev actions are only available in development mode');
  }

  const plan = getPlan(PlanIdSchema.parse(planId));

  const currentSubscription = await getUserSubscription(user.id);
  const { currentPeriodStart, currentPeriodEnd } = currentSubscription ?? buildFreeSubscription();

  const firstBand = plan.bands[0];

  await upsertSubscription({
    userId: user.id,
    planId: plan.id,
    status: 'active',
    eventLimit: firstBand?.events ?? UNLIMITED_EVENTS,
    pricePerMonth: firstBand?.prices.month?.USD ?? 0,
    currency: 'USD',
    cancelAtPeriodEnd: false,
    currentPeriodStart,
    currentPeriodEnd,
  });

  revalidatePath('/');
});
