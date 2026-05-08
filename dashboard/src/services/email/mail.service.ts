'server-only';

import { env } from '@/lib/env';
import type { EmailTemplate } from '@/services/email/types';
import { dispatchEmail, type EmailTransportConfig } from '@/services/email/transport';
import { EMAIL_TYPES, type EmailType, type SendEmailPayload } from '@/services/email/email-types';
import { emailSkipReason } from '@/services/email/email-guards';

const transportConfig: EmailTransportConfig = {
  mailerSendApiToken: env.MAILER_SEND_API_TOKEN,
  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  smtpUser: env.SMTP_USER,
  smtpPassword: env.SMTP_PASSWORD,
  smtpFrom: env.SMTP_FROM,
};

type DataFor<T extends EmailType> = Extract<SendEmailPayload, { type: T }>['data'];

export async function sendDirectEmailTemplate<T extends EmailType>(type: T, data: DataFor<T>): Promise<void> {
  const skip = emailSkipReason(type, data, {
    enableEmails: env.ENABLE_EMAILS,
    isCloud: env.IS_CLOUD,
    isDevelopment: process.env.NODE_ENV === 'development',
  });
  if (skip) {
    console.warn(`[email] direct send skipped: ${skip}`);
    return;
  }

  try {
    const render = EMAIL_TYPES[type].template as (input: DataFor<T>) => EmailTemplate;
    await dispatchEmail(render(data), data, transportConfig);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}
