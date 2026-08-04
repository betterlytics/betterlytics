import 'server-only';

import { getUserSubscription } from '@/repositories/postgres/subscription.repository';
import {
  getOwnedSiteIds,
  getOwnedSitesWithDomain,
  findDashboardOwner,
} from '@/repositories/postgres/dashboard.repository';
import {
  getUserEventCountForPeriod,
  getUsageBreakdownForPeriod,
} from '@/repositories/clickhouse/usage.repository';
import { toDateString } from '@/utils/dateFormatters';
import {
  UserBillingDataSchema,
  type UsageData,
  type UserBillingData,
  type UsageBreakdown,
} from '@/entities/billing/billing.entities';
import { UserException } from '@/lib/exceptions';

export async function getUserBillingStats(userId: string): Promise<UserBillingData> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      throw new Error('No subscription found for user');
    }

    const siteIds = await getOwnedSiteIds(userId, true);

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

    const isExistingPaidSubscriber = subscription.paymentSubscriptionId !== null;
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

export async function getUserUsageBreakdownStats(userId: string): Promise<UsageBreakdown> {
  try {
    const [subscription, sites] = await Promise.all([
      getUserSubscription(userId),
      getOwnedSitesWithDomain(userId, true),
    ]);
    if (!subscription) {
      throw new Error('No subscription found for user');
    }

    const rows = await getUsageBreakdownForPeriod(
      sites.map((site) => site.siteId),
      toDateString(subscription.currentPeriodStart),
    );

    const total = rows.reduce((sum, row) => sum + row.total, 0);

    const eventLimit = Math.max(1, subscription.eventLimit);
    const share = (value: number) => (value / eventLimit) * 100;

    const typeTotals = new Map<string, number>();
    const siteTotals = new Map<string, number>();
    for (const row of rows) {
      typeTotals.set(row.eventType, (typeTotals.get(row.eventType) ?? 0) + row.total);
      siteTotals.set(row.siteId, (siteTotals.get(row.siteId) ?? 0) + row.total);
    }

    const byEventType = [...typeTotals.entries()]
      .map(([eventType, value]) => ({ eventType, total: value, percentageOfLimit: share(value) }))
      .sort((a, b) => b.total - a.total);

    const bySite = sites
      .filter((site) => siteTotals.has(site.siteId))
      .map((site) => ({
        siteId: site.siteId,
        domain: site.domain,
        total: siteTotals.get(site.siteId)!,
        percentageOfLimit: share(siteTotals.get(site.siteId)!),
      }))
      .sort((a, b) => b.total - a.total);

    return { total, byEventType, bySite };
  } catch (error) {
    console.error('Failed to get usage breakdown:', error);
    throw new UserException('Failed to get usage breakdown');
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
