'server-only';

import { env } from '@/lib/env';
import { EMAIL_TYPES, SEND_EMAIL_JOB_NAME, type SendEmailPayload } from '@/services/email/email-types';
import { emailSkipReason } from '@/services/email/email-guards';
import { enqueueJob } from '@/worker/queue';

export async function enqueueEmail(payload: SendEmailPayload): Promise<void> {
  const skip = emailSkipReason(payload.type, payload.data, {
    enableEmails: env.ENABLE_EMAILS,
    isCloud: env.IS_CLOUD,
    isDevelopment: process.env.NODE_ENV === 'development',
  });
  if (skip) {
    console.warn(`[email] skipping enqueue: ${skip}`);
    return;
  }

  const { retry } = EMAIL_TYPES[payload.type];
  await enqueueJob(SEND_EMAIL_JOB_NAME, payload, {
    singletonKey: `${payload.campaignKey}:${payload.recipientKey}`,
    ...retry,
  });
}
