'server-only';

import type { Job } from '@/worker/jobs/types';
import { usageThresholdScanJobDefinition } from '@/worker/jobs/definitions';
import {
  classifyUsageThreshold,
  formatPlanName,
  getScannableSubscriptions,
  loadRecordedSessionsForSubscriptions,
  loadUsageForSubscriptions,
  sumRecordedSessionsForSubscription,
  sumUsageForSubscription,
} from '@/services/billing/usage-scan.service';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { getRecordedSessionLimitForTier } from '@/lib/billing/capabilities';
import type { DailySiteUsage, SubscriptionWithOwnedSites } from '@/entities/billing/billing.entities';
import type { UsageAlertQuota } from '@/services/email/template/usage-alert-mail';

type QuotaCheck = {
  quota: UsageAlertQuota;
  usage: number;
  limit: number;
  campaignPrefix: string;
};

async function enqueueUsageAlert(sub: SubscriptionWithOwnedSites, check: QuotaCheck, upgradeUrl: string) {
  const pct = Math.floor((check.usage / check.limit) * 100);
  const kind = classifyUsageThreshold(pct);
  if (!kind) return false;

  await enqueueEmail({
    type: 'usage-alert',
    recipientKey: createUserRecipientKey(sub.userId),
    campaignKey: `${check.campaignPrefix}:${kind}:${sub.currentPeriodStart.toISOString()}`,
    data: {
      to: sub.userEmail,
      userName: sub.userName,
      quota: check.quota,
      currentUsage: check.usage,
      usageLimit: check.limit,
      usagePercentage: pct,
      planName: formatPlanName(sub.tier),
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      upgradeUrl,
    },
  });
  return true;
}

async function loadRecordedSessionsOrNull(
  subs: SubscriptionWithOwnedSites[],
): Promise<Map<string, DailySiteUsage[]> | null> {
  try {
    return await loadRecordedSessionsForSubscriptions(subs);
  } catch (err) {
    // Event alerts must not depend on the replay count succeeding.
    console.error('usage-threshold-scan: failed to load recorded sessions, skipping replay alerts', err);
    return null;
  }
}

async function runUsageThresholdScan(): Promise<void> {
  const subs = await getScannableSubscriptions();

  if (subs.length === 0) {
    console.info('usage-threshold-scan: no scannable subscriptions');
    return;
  }

  const bySite = await loadUsageForSubscriptions(subs);
  const replaysBySite = await loadRecordedSessionsOrNull(subs);
  const upgradeUrl = `${sharedEmailEnv.publicBaseUrl}/billing`;
  let enqueued = 0;

  for (const sub of subs) {
    const checks: QuotaCheck[] = [
      {
        quota: 'events',
        usage: sumUsageForSubscription(sub, bySite),
        limit: sub.eventLimit,
        campaignPrefix: 'usage-alert',
      },
    ];
    if (replaysBySite) {
      checks.push({
        quota: 'replays',
        usage: sumRecordedSessionsForSubscription(sub, replaysBySite),
        limit: getRecordedSessionLimitForTier(sub.tier),
        campaignPrefix: 'usage-alert:replay',
      });
    }

    for (const check of checks) {
      try {
        if (await enqueueUsageAlert(sub, check, upgradeUrl)) enqueued++;
      } catch (err) {
        console.error(`usage-threshold-scan: user ${sub.userId} ${check.quota} alert failed`, err);
      }
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
