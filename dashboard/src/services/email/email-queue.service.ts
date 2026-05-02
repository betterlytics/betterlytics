'server-only';

import { env } from '@/lib/env';
import { EMAIL_TYPES, SEND_EMAIL_JOB_NAME, type SendEmailPayload } from '@/services/email/email-types';
import { enqueueJob } from '@/worker/queue';

export async function enqueueEmail(payload: SendEmailPayload): Promise<void> {
  const { saasOnly, retry } = EMAIL_TYPES[payload.type];

  if (saasOnly && !env.IS_CLOUD) return;

  await enqueueJob(SEND_EMAIL_JOB_NAME, payload, {
    singletonKey: payload.campaignKey,
    ...retry,
  });
}
