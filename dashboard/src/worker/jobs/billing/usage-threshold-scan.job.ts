'server-only';

import type { Job } from '@/worker/jobs/types';
import { usageThresholdScanJobDefinition } from '@/worker/jobs/definitions';
import {
  classifyUsageThreshold,
  formatPlanName,
  getScannableSubscriptions,
  loadUsageForSubscriptions,
  sumUsageForSubscription,
} from '@/services/billing/usage-scan.service';
import { enqueueEmail } from '@/services/email/email.service';
import { sharedEmailEnv } from '@/lib/env/shared.env';

async function runUsageThresholdScan(): Promise<void> {
  const subs = await getScannableSubscriptions();

  if (subs.length === 0) {
    console.info('usage-threshold-scan: no scannable subscriptions');
    return;
  }

  const bySite = await loadUsageForSubscriptions(subs);
  const upgradeUrl = `${sharedEmailEnv.publicBaseUrl}/billing`;
  let enqueued = 0;

  for (const sub of subs) {
    try {
      const usage = sumUsageForSubscription(sub, bySite);
      const pct = Math.floor((usage / sub.eventLimit) * 100);
      const kind = classifyUsageThreshold(pct);
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
