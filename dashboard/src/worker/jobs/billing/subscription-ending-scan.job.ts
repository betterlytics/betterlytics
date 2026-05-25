import 'server-only';

import type { Job } from '@/worker/jobs/types';
import { subscriptionEndingScanJobDefinition } from '@/worker/jobs/definitions';
import { findSubscriptionsEndingSoon } from '@/repositories/postgres/subscription.repository';
import { findOwnedDashboardDomainsExceedingRetention } from '@/repositories/postgres/dashboardSettings.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import {
  STARTER_SUBSCRIPTION_STATIC,
  type SubscriptionEndingSoonCandidate,
} from '@/entities/billing/billing.entities';
import { getMaxRetentionDaysForTier } from '@/lib/billing/capabilities';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOTICE_WINDOW_DAYS = 7;
const FREE_TIER = STARTER_SUBSCRIPTION_STATIC.tier;
const FREE_EVENT_LIMIT = STARTER_SUBSCRIPTION_STATIC.eventLimit;
const FREE_RETENTION_DAYS = getMaxRetentionDaysForTier(FREE_TIER);

async function enqueueSubscriptionEndingSoon(candidate: SubscriptionEndingSoonCandidate): Promise<void> {
  const affectedDashboards = await findOwnedDashboardDomainsExceedingRetention(
    candidate.userId,
    FREE_RETENTION_DAYS,
  );

  await enqueueEmail({
    type: 'subscription-ending-soon',
    recipientKey: createUserRecipientKey(candidate.userId),
    campaignKey: `subscription-ending-soon:${candidate.currentPeriodEnd.toISOString()}`,
    data: {
      to: candidate.userEmail,
      userName: candidate.userName,
      periodEnd: candidate.currentPeriodEnd,
      billingUrl: `${sharedEmailEnv.publicBaseUrl}/billing`,
      freeEventLimit: FREE_EVENT_LIMIT,
      freeRetentionDays: FREE_RETENTION_DAYS,
      affectedDashboards,
    },
  });
}

async function runSubscriptionEndingScan(): Promise<void> {
  const endingBefore = new Date(Date.now() + NOTICE_WINDOW_DAYS * DAY_MS);
  const candidates = await findSubscriptionsEndingSoon(endingBefore);
  if (candidates.length === 0) {
    console.info({ job: 'subscription-ending-scan', candidates: 0 });
    return;
  }

  let enqueued = 0;
  for (const candidate of candidates) {
    try {
      await enqueueSubscriptionEndingSoon(candidate);
      enqueued++;
    } catch (err) {
      console.error({ job: 'subscription-ending-scan', userId: candidate.userId, err });
    }
  }

  console.info({ job: 'subscription-ending-scan', candidates: candidates.length, enqueued });
}

export const subscriptionEndingScanJob: Job = {
  ...subscriptionEndingScanJobDefinition,
  runOnStart: false,
  handler: async () => {
    await runSubscriptionEndingScan();
  },
};
