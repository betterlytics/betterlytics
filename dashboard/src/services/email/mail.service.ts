'server-only';

import { env } from '@/lib/env';
import { ResetPasswordEmailData } from '@/services/email/template/reset-password-mail';
import { UsageAlertEmailData } from '@/services/email/template/usage-alert-mail';
import { FirstPaymentWelcomeEmailData } from '@/services/email/template/first-payment-welcome-mail';
import { EmailVerificationData } from '@/services/email/template/email-verification-mail';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { DashboardInvitationEmailData } from '@/services/email/template/invitation-mail';
import { createReportEmailTemplate, EmailReportData } from '@/services/email/template/weekly-report-mail';
import type { EmailData, EmailTemplate } from '@/services/email/types';
import { dispatchEmail, type EmailTransportConfig } from '@/services/email/transport';
import { enqueueEmail } from '@/services/email/email-queue.service';
import type { EmailType, SendEmailPayload } from '@/services/email/email-types';
 
export type QueueEmailOptions = {
  recipientKey: string;
  campaignKey: string;
};

export type QueuedEmailInput<T> = {
  data: T;
  queue: QueueEmailOptions;
};

const transportConfig: EmailTransportConfig = {
  mailerSendApiToken: env.MAILER_SEND_API_TOKEN,
  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  smtpUser: env.SMTP_USER,
  smtpPassword: env.SMTP_PASSWORD,
  smtpFrom: env.SMTP_FROM,
};

export async function sendDirectEmailTemplate<T extends EmailData>(
  renderTemplate: (data: T) => EmailTemplate,
  data: T,
): Promise<void> {
  try {
    if (!isFeatureEnabled('enableEmails')) {
      return;
    }

    if (process.env.NODE_ENV === 'development' && !data.to.includes('@betterlytics.io')) {
      console.warn('WARN: You are only allowed to send emails to @betterlytics.io from dev environment');
      return;
    }

    await dispatchEmail(renderTemplate(data), data, transportConfig);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

type DataFor<T extends EmailType> = Extract<SendEmailPayload, { type: T }>['data'];
type PayloadFor<T extends EmailType> = Extract<SendEmailPayload, { type: T }>;

function createQueuedPayload<T extends EmailType>(type: T, data: DataFor<T>, queue: QueueEmailOptions): PayloadFor<T> {
  return {
    type,
    recipientKey: queue.recipientKey,
    campaignKey: queue.campaignKey,
    data,
  } as PayloadFor<T>;
}

async function enqueueEmailByType<T extends EmailType>(input: QueuedEmailInput<DataFor<T>>, type: T): Promise<void> {
  const { data, queue } = input;
  await enqueueEmail(createQueuedPayload(type, data, queue));
}

export async function sendResetPasswordEmail(input: QueuedEmailInput<ResetPasswordEmailData>): Promise<void> {
  await enqueueEmailByType(input, 'reset-password');
}

export async function sendFirstPaymentWelcomeEmail(
  input: QueuedEmailInput<FirstPaymentWelcomeEmailData>,
): Promise<void> {
  await enqueueEmailByType(input, 'first-payment-welcome');
}

export async function sendUsageAlertEmail(input: QueuedEmailInput<UsageAlertEmailData>): Promise<void> {
  await enqueueEmailByType(input, 'usage-alert');
}

export async function sendEmailVerificationEmail(input: QueuedEmailInput<EmailVerificationData>): Promise<void> {
  await enqueueEmailByType(input, 'email-verification');
}

export async function sendDashboardInvitationEmail(
  input: QueuedEmailInput<DashboardInvitationEmailData>,
): Promise<void> {
  await enqueueEmailByType(input, 'dashboard-invitation');
}

export async function sendReportEmail(data: EmailReportData): Promise<void> {
  await sendDirectEmailTemplate(createReportEmailTemplate, data);
}
