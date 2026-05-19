import { createResetPasswordEmailTemplate } from '@/services/email/template/reset-password-mail';
import { createEmailVerificationTemplate } from '@/services/email/template/email-verification-mail';
import { createUsageAlertEmailTemplate } from '@/services/email/template/usage-alert-mail';
import { createFirstPaymentWelcomeEmailTemplate } from '@/services/email/template/first-payment-welcome-mail';
import { createDashboardInvitationEmailTemplate } from '@/services/email/template/invitation-mail';
import { createReportEmailTemplate } from '@/services/email/template/weekly-report-mail';
import { createDataRetentionClampEmailTemplate } from '@/services/email/template/data-retention-clamp-mail';
import type { EmailTemplate } from '@/services/email/types';
import { createSubscriptionEndingSoonEmailTemplate } from './template/subscription-ending-soon-mail';
import { createSubscriptionPaymentCancelledEmailTemplate } from './template/subscription-payment-cancelled-mail';

export const SEND_EMAIL_JOB_NAME = 'send-email';

const DEFAULT_RETRY = { retryLimit: 3, retryDelay: 60, retryBackoff: true };
const URGENT_RETRY = { retryLimit: 5, retryDelay: 30, retryBackoff: false };

export const EMAIL_TYPES = {
  'reset-password': {
    template: createResetPasswordEmailTemplate,
    saasOnly: false,
    retry: URGENT_RETRY,
  },
  'email-verification': {
    template: createEmailVerificationTemplate,
    saasOnly: true,
    retry: URGENT_RETRY,
  },
  'dashboard-invitation': {
    template: createDashboardInvitationEmailTemplate,
    saasOnly: false,
    retry: DEFAULT_RETRY,
  },
  'usage-alert': {
    template: createUsageAlertEmailTemplate,
    saasOnly: true,
    retry: DEFAULT_RETRY,
  },
  'first-payment-welcome': {
    template: createFirstPaymentWelcomeEmailTemplate,
    saasOnly: true,
    retry: DEFAULT_RETRY,
  },
  report: {
    template: createReportEmailTemplate,
    saasOnly: false,
    retry: DEFAULT_RETRY,
  },
  'data-retention-clamp': {
    template: createDataRetentionClampEmailTemplate,
    saasOnly: true,
    retry: DEFAULT_RETRY,
  },
  'subscription-ending-soon': {
    template: createSubscriptionEndingSoonEmailTemplate,
    saasOnly: true,
    retry: DEFAULT_RETRY,
  },
  'subscription-payment-cancelled': {
    template: createSubscriptionPaymentCancelledEmailTemplate,
    saasOnly: true,
    retry: DEFAULT_RETRY,
  },
} as const;

export type EmailType = keyof typeof EMAIL_TYPES;
type DataFor<T extends EmailType> = Parameters<(typeof EMAIL_TYPES)[T]['template']>[0];

export type SendEmailPayload = {
  [T in EmailType]: {
    type: T;
    recipientKey: string;
    campaignKey: string;
    data: DataFor<T>;
  };
}[EmailType];

export async function renderEmail(payload: SendEmailPayload): Promise<EmailTemplate> {
  const template = EMAIL_TYPES[payload.type].template as (data: unknown) => EmailTemplate | Promise<EmailTemplate>;
  return template(payload.data);
}
