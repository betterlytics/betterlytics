'server-only';

import type { Job } from '@/worker/jobs/types';
import { hasBeenSent, recordSent } from '@/repositories/postgres/sentEmail.repository';
import { dispatch } from '@/worker/services/email-dispatch';
import { emailSendsTotal, emailSendDuration } from '@/worker/metrics';
import { workerEnv } from '@/worker/workerEnv';
import { EMAIL_TYPES, SEND_EMAIL_JOB_NAME, type SendEmailPayload } from '@/services/email/email-types';
import { EmailTemplate } from '@/services/email/mail.service';

export function renderEmail(payload: SendEmailPayload): EmailTemplate {
  const template = EMAIL_TYPES[payload.type].template as (data: unknown) => EmailTemplate;
  return template(payload.data);
}

async function handleSendEmail(payload: SendEmailPayload): Promise<void> {
  if (!workerEnv.ENABLE_EMAILS) return;

  if (process.env.NODE_ENV === 'development' && !payload.data.to.includes('@betterlytics.io')) {
    console.warn('Refusing to send to non-@betterlytics.io recipient in dev:', payload.data.to);
    return;
  }

  if (await hasBeenSent(payload.recipientKey, payload.campaignKey)) {
    emailSendsTotal.inc({ type: payload.type, status: 'skipped_duplicate' });
    return;
  }

  const endTimer = emailSendDuration.startTimer({ type: payload.type });
  try {
    const template = renderEmail(payload);
    const providerMessageId = await dispatch(template, payload.data);
    await recordSent(payload.recipientKey, payload.campaignKey, providerMessageId);
    emailSendsTotal.inc({ type: payload.type, status: 'success' });
  } catch (err) {
    emailSendsTotal.inc({ type: payload.type, status: 'failure' });
    throw err;
  } finally {
    endTimer();
  }
}

export const sendEmailJob: Job<SendEmailPayload> = {
  name: SEND_EMAIL_JOB_NAME,
  runOnStart: false,
  retryLimit: 3,
  retryBackoff: true,
  expireInSeconds: 300,
  handler: handleSendEmail,
};
