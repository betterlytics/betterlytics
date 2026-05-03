'server-only';

import { workerEnv } from '@/lib/env/worker.env';
import type { Job } from '@/worker/jobs/types';
import { sendEmailJobDefinition } from '@/worker/jobs/definitions';
import { hasBeenSent, recordSent } from '@/repositories/postgres/sentEmail.repository';
import { dispatchEmail } from '@/services/email/transport';
import { emailSendsTotal } from '@/worker/metrics';
import { EMAIL_TYPES, renderEmail, type SendEmailPayload } from '@/services/email/email-types';

async function handleSendEmail(payload: SendEmailPayload): Promise<void> {
  const { saasOnly } = EMAIL_TYPES[payload.type];

  if (!workerEnv.ENABLE_EMAILS) {
    return;
  }

  if (saasOnly && !workerEnv.IS_CLOUD) {
    return;
  }

  if (process.env.NODE_ENV === 'development' && !payload.data.to.includes('@betterlytics.io')) {
    console.warn('Refusing to send to non-@betterlytics.io recipient in dev:', payload.data.to);
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
