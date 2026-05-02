'server-only';

import { getBoss } from '@/lib/pgboss';
import { env } from '@/lib/env';
import { EMAIL_TYPES, SEND_EMAIL_JOB_NAME, type SendEmailPayload } from '@/services/email/email-types';

export async function enqueueEmail(payload: SendEmailPayload): Promise<void> {
  const { saasOnly, retry } = EMAIL_TYPES[payload.type];

  if (saasOnly && !env.IS_CLOUD) return;

  const boss = await getBoss();
  await boss.send(SEND_EMAIL_JOB_NAME, payload, {
    singletonKey: payload.campaignKey,
    ...retry,
  });
}
