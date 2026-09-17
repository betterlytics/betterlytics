'server-only';

import { env } from '@/lib/env';
import {
  EMAIL_TYPES,
  SEND_EMAIL_JOB_NAME,
  sendEmailSingletonKey,
  type EmailTypeDefinition,
  type SendEmailPayload,
} from '@/services/email/email-types';
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

  const { retry, throttleSeconds }: EmailTypeDefinition = EMAIL_TYPES[payload.type];
  const jobId = await enqueueJob(SEND_EMAIL_JOB_NAME, payload, {
    singletonKey: sendEmailSingletonKey(payload),
    ...(throttleSeconds ? { singletonSeconds: throttleSeconds } : {}),
    ...retry,
  });
  return jobId ? 'enqueued' : 'throttled';
}
