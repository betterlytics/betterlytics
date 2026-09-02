'server-only';

import { env } from '@/lib/env';
import { EMAIL_TYPES, SEND_EMAIL_JOB_NAME, type SendEmailPayload } from '@/services/email/email-types';
import { emailSkipReason } from '@/services/email/email-guards';
import { enqueueJob } from '@/worker/queue';

export type EnqueueEmailResult = 'enqueued' | 'skipped' | 'throttled';

export async function enqueueEmail(payload: SendEmailPayload): Promise<EnqueueEmailResult> {
  const skip = emailSkipReason(payload.type, payload.data, {
    enableEmails: env.ENABLE_EMAILS,
    isCloud: env.IS_CLOUD,
    isDevelopment: process.env.NODE_ENV === 'development',
  });
  if (skip) {
    console.warn(`[email] skipping enqueue: ${skip}`);
    return 'skipped';
  }

  const emailType = EMAIL_TYPES[payload.type];
  const throttleSeconds = 'throttleSeconds' in emailType ? emailType.throttleSeconds : undefined;
  const jobId = await enqueueJob(SEND_EMAIL_JOB_NAME, payload, {
    singletonKey: `${payload.campaignKey}:${payload.recipientKey}`,
    ...(throttleSeconds ? { singletonSeconds: throttleSeconds } : {}),
    ...emailType.retry,
  });
  return jobId ? 'enqueued' : 'throttled';
}
