'server-only';

import { getUserSubscription } from '@/repositories/postgres/subscription.repository';
import { getOwnedSiteIds, findDashboardOwner } from '@/repositories/postgres/dashboard.repository';
import { getUserEventCountForPeriod } from '@/repositories/clickhouse/usage.repository';
import { toDateString } from '@/utils/dateFormatters';
import { UserBillingDataSchema, type UsageData, type UserBillingData } from '@/entities/billing/billing.entities';
import { UserException } from '@/lib/exceptions';

export async function getUserBillingStats(userId: string): Promise<UserBillingData> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      throw new Error('No subscription found for user');
    }

    const siteIds = await getOwnedSiteIds(userId);

    const currentUsage = await getUserEventCountForPeriod(siteIds, toDateString(subscription.currentPeriodStart));

    const usage: UsageData = {
      current: currentUsage,
      limit: subscription.eventLimit,
      remaining: Math.max(0, subscription.eventLimit - currentUsage),
      isOverLimit: currentUsage > subscription.eventLimit,
      usagePercentage: (currentUsage / subscription.eventLimit) * 100,
      daysUntilReset: getDaysUntilReset(subscription.currentPeriodEnd),
      billingPeriod: {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd,
      },
    };

    const isExistingPaidSubscriber =
      (subscription.tier !== 'growth' || subscription.pricePerMonth > 0) && subscription.status === 'active';
    const isFreePlanUser = subscription.tier === 'growth' && subscription.pricePerMonth === 0;

    return UserBillingDataSchema.parse({
      subscription: { ...subscription },
      usage,
      isExistingPaidSubscriber,
      isFreePlanUser,
    });
  } catch (error) {
    console.error('Failed to get billing stats:', error);
    throw new UserException('Failed to get billing stats');
  }
}

export async function getDashboardOwnerBillingStats(dashboardId: string): Promise<UserBillingData> {
  const owner = await findDashboardOwner(dashboardId);
  if (!owner) {
    throw new Error('Dashboard owner not found');
  }

  return getUserBillingStats(owner.userId);
}

function getDaysUntilReset(endDate: Date): number {
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
