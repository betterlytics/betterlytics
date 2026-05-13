'server-only';

import { workerEnv } from '@/lib/env/worker.env';
import type { Job } from '@/worker/jobs/types';
import { sendEmailJobDefinition } from '@/worker/jobs/definitions';
import { hasBeenSent, recordSent } from '@/repositories/postgres/sentEmail.repository';
import { dispatchEmail } from '@/services/email/transport';
import { emailSendsTotal } from '@/worker/metrics';
import { renderEmail, type SendEmailPayload } from '@/services/email/email-types';
import { emailSkipReason } from '@/services/email/email-guards';

async function handleSendEmail(payload: SendEmailPayload): Promise<void> {
  const skip = emailSkipReason(payload.type, payload.data, {
    enableEmails: workerEnv.ENABLE_EMAILS,
    isCloud: workerEnv.IS_CLOUD,
    isDevelopment: process.env.NODE_ENV === 'development',
  });
  if (skip) {
    console.warn(`[email-worker] skipping send: ${skip}`);
    return;
  }

  if (await hasBeenSent(payload.recipientKey, payload.campaignKey)) {
    emailSendsTotal.inc({ type: payload.type, status: 'skipped_duplicate' });
    return;
  }

  try {
    const template = renderEmail(payload);
    const providerMessageId = await dispatchEmail(template, payload.data, {
      mailerSendApiToken: workerEnv.MAILER_SEND_API_TOKEN,
      smtpHost: workerEnv.SMTP_HOST,
      smtpPort: workerEnv.SMTP_PORT,
      smtpUser: workerEnv.SMTP_USER,
      smtpPassword: workerEnv.SMTP_PASSWORD,
      smtpFrom: workerEnv.SMTP_FROM,
    });
    await recordSent(payload.recipientKey, payload.campaignKey, providerMessageId);
    emailSendsTotal.inc({ type: payload.type, status: 'success' });
  } catch (err) {
    emailSendsTotal.inc({ type: payload.type, status: 'failure' });
    throw err;
  }
}

export const sendEmailJob: Job<SendEmailPayload> = {
  ...sendEmailJobDefinition,
  runOnStart: false,
  handler: handleSendEmail,
};
