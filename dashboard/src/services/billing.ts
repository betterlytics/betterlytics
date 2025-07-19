import { getUserSubscription } from '@/repositories/postgres/subscription';
import { getUserSiteIds } from '@/repositories/postgres/dashboard';
import { getUserEventCountForPeriod } from '@/repositories/clickhouse/usage';
import { toDateString } from '@/utils/dateFormatters';
import { UserBillingDataSchema, type UsageData, type UserBillingData } from '@/entities/billing';
import { UserException } from '@/lib/exceptions';

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

function getDaysUntilReset(endDate: Date): number {
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
