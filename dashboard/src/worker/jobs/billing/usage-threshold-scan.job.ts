'server-only';

import type { Job } from '@/worker/jobs/types';
import { usageThresholdScanJobDefinition } from '@/worker/jobs/definitions';
import {
  findSubscriptionsForUsageScan,
  rollForwardStaleFreeTierPeriods,
} from '@/repositories/postgres/subscription.repository';
import { getDailyEventCountsForSites } from '@/repositories/clickhouse/usage.repository';
import { type DailySiteUsage, type SubscriptionForUsageScan } from '@/entities/billing/billing.entities';
import { enqueueEmail } from '@/services/email/email.service';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { toDateString } from '@/utils/dateFormatters';

type ThresholdKind = 'exceeded' | 'approaching';

function thresholdFor(pct: number): ThresholdKind | null {
  if (pct >= 100) return 'exceeded';
  if (pct >= 80) return 'approaching';
  return null;
}

function formatPlanName(tier: SubscriptionForUsageScan['tier']): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function indexBySite(rows: DailySiteUsage[]): Map<string, DailySiteUsage[]> {
  const out = new Map<string, DailySiteUsage[]>();
  for (const row of rows) {
    const arr = out.get(row.siteId);
    if (arr) arr.push(row);
    else out.set(row.siteId, [row]);
  }
  return out;
}

function sumUsageForUser(sub: SubscriptionForUsageScan, bySite: Map<string, DailySiteUsage[]>): number {
  const periodStart = toDateString(sub.currentPeriodStart);
  let total = 0;
  for (const siteId of sub.siteIds) {
    const rows = bySite.get(siteId);
    if (!rows) continue;
    for (const row of rows) {
      if (row.date >= periodStart) total += row.total;
    }
  }
  return total;
}

async function runUsageThresholdScan(): Promise<void> {
  const rawSubs = await findSubscriptionsForUsageScan();

  if (rawSubs.length === 0) {
    console.info('usage-threshold-scan: no active subscriptions');
    return;
  }

  const subs = await rollForwardStaleFreeTierPeriods(rawSubs);

  const allSiteIds = [...new Set(subs.flatMap((s) => s.siteIds))];
  const earliestStart = subs.reduce(
    (min, s) => (s.currentPeriodStart < min ? s.currentPeriodStart : min),
    subs[0].currentPeriodStart,
  );

  const dailyRows = await getDailyEventCountsForSites(allSiteIds, toDateString(earliestStart));
  const bySite = indexBySite(dailyRows);

  const upgradeUrl = `${sharedEmailEnv.publicBaseUrl}/billing`;
  let enqueued = 0;

  for (const sub of subs) {
    try {
      const usage = sumUsageForUser(sub, bySite);
      const pct = Math.floor((usage / sub.eventLimit) * 100);
      const kind = thresholdFor(pct);
      if (!kind) continue;

      await enqueueEmail({
        type: 'usage-alert',
        recipientKey: sub.userId,
        campaignKey: `usage-alert:${kind}:${sub.currentPeriodStart.toISOString()}`,
        data: {
          to: sub.userEmail,
          userName: sub.userName ?? sub.userEmail,
          currentUsage: usage,
          usageLimit: sub.eventLimit,
          usagePercentage: pct,
          planName: formatPlanName(sub.tier),
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          upgradeUrl,
        },
      });
      enqueued++;
    } catch (err) {
      console.error(`usage-threshold-scan: user ${sub.userId} failed`, err);
    }
  }

  console.info(`usage-threshold-scan: scanned ${subs.length} subs, enqueued ${enqueued} emails`);
}

export const usageThresholdScanJob: Job = {
  ...usageThresholdScanJobDefinition,
  runOnStart: false,
  handler: async () => {
    await runUsageThresholdScan();
  },
};
