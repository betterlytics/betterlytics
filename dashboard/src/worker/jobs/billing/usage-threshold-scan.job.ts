'server-only';

import type { Job } from '@/worker/jobs/types';
import { usageThresholdScanJobDefinition } from '@/worker/jobs/definitions';
import {
  classifyUsageThreshold,
  getScannableSubscriptions,
  isUsageAlertSent,
  loadUsageForSubscriptions,
  sumUsageForSubscription,
  usageAlertCampaignKey,
  usageAlertSentKeys,
  type UsageThresholdKind,
} from '@/services/billing/usage-scan.service';
import { findSentCampaignKeysByRecipient } from '@/repositories/postgres/sentEmail.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { getPlan } from '@/lib/billing/catalog';
import { type SubscriptionWithOwnedSites } from '@/entities/billing/billing.entities';

type UsageAlertCandidate = {
  sub: SubscriptionWithOwnedSites;
  recipientKey: string;
  kind: UsageThresholdKind;
  usage: number;
  pct: number;
};

async function runUsageThresholdScan(): Promise<void> {
  const subs = await getScannableSubscriptions();

  if (subs.length === 0) {
    console.info('usage-threshold-scan: no scannable subscriptions');
    return;
  }

  const bySite = await loadUsageForSubscriptions(subs);
  const candidates: UsageAlertCandidate[] = [];
  for (const sub of subs) {
    const usage = sumUsageForSubscription(sub, bySite);
    const pct = Math.floor((usage / sub.eventLimit) * 100);
    const kind = classifyUsageThreshold(pct);
    if (kind) candidates.push({ sub, recipientKey: createUserRecipientKey(sub.userId), kind, usage, pct });
  }

  const sentByRecipient = await findSentCampaignKeysByRecipient(
    candidates.map((c) => c.recipientKey),
    candidates.flatMap((c) => usageAlertSentKeys(c.kind, c.sub.currentPeriodStart, c.sub.eventLimit)),
  );
  const upgradeUrl = `${sharedEmailEnv.publicBaseUrl}/billing`;
  let enqueued = 0;
  let alreadySent = 0;

  for (const { sub, recipientKey, kind, usage, pct } of candidates) {
    const sentKeys = sentByRecipient.get(recipientKey) ?? new Set<string>();
    if (isUsageAlertSent(sentKeys, kind, sub.currentPeriodStart, sub.eventLimit)) {
      alreadySent++;
      continue;
    }

    try {
      const result = await enqueueEmail({
        type: 'usage-alert',
        recipientKey,
        campaignKey: usageAlertCampaignKey(kind, sub.currentPeriodStart, sub.eventLimit),
        data: {
          to: sub.userEmail,
          userName: sub.userName,
          currentUsage: usage,
          usageLimit: sub.eventLimit,
          usagePercentage: pct,
          planName: getPlan(sub.planId).name,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          upgradeUrl,
        },
      });
      if (result === 'enqueued') enqueued++;
    } catch (err) {
      console.error(`usage-threshold-scan: user ${sub.userId} failed`, err);
    }
  }

  console.info(
    `usage-threshold-scan: scanned ${subs.length} subs, enqueued ${enqueued} emails, skipped ${alreadySent} already sent`,
  );
}

export const usageThresholdScanJob: Job = {
  ...usageThresholdScanJobDefinition,
  runOnStart: false,
  handler: async () => {
    await runUsageThresholdScan();
  },
};
