import { getUserSubscription } from '@/repositories/postgres/subscription';
import { getUserSiteIds } from '@/repositories/postgres/dashboard';
import { getUserEventCountForPeriod } from '@/repositories/clickhouse/usage';
import { getBillingHistoryByUserId } from '@/repositories/postgres/billingHistory';
import { toDateString } from '@/utils/dateFormatters';
import {
  UserBillingDataSchema,
  type UsageData,
  type UserBillingData,
  type BillingHistory,
} from '@/entities/billing';

export async function getUserBillingStats(userId: string): Promise<UserBillingData> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      throw new Error('No subscription found for user');
    }

    const siteIds = await getUserSiteIds(userId);

    const currentUsage = await getUserEventCountForPeriod(siteIds, toDateString(subscription.currentPeriodStart));

    const usage: UsageData = {
      current: currentUsage,
      limit: subscription.eventLimit,
      remaining: Math.max(0, subscription.eventLimit - currentUsage),
      isOverLimit: currentUsage >= subscription.eventLimit,
      usagePercentage: (currentUsage / subscription.eventLimit) * 100,
      daysUntilReset: getDaysUntilReset(subscription.currentPeriodEnd),
      billingPeriod: {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd,
      },
    };

    const isExistingPaidSubscriber = subscription.pricePerMonth > 0 && subscription.status === 'active';
    const isFreePlanUser = subscription.pricePerMonth === 0;

    return UserBillingDataSchema.parse({
      subscription: { ...subscription },
      usage,
      isExistingPaidSubscriber,
      isFreePlanUser,
    });
  } catch (error) {
    console.error('Failed to get billing stats:', error);
    throw new Error('Failed to get billing stats');
  }
}

export async function getUserBillingHistory(userId: string): Promise<BillingHistory[]> {
  try {
    return await getBillingHistoryByUserId(userId);
  } catch (error) {
    console.error('Failed to get billing history:', error);
    return [];
  }
}

function getDaysUntilReset(endDate: Date): number {
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
