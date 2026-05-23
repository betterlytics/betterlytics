import { createResetPasswordEmailTemplate } from '@/services/email/template/reset-password-mail';
import { createEmailVerificationTemplate } from '@/services/email/template/email-verification-mail';
import { createUsageAlertEmailTemplate } from '@/services/email/template/usage-alert-mail';
import { createFirstPaymentWelcomeEmailTemplate } from '@/services/email/template/first-payment-welcome-mail';
import { createDashboardInvitationEmailTemplate } from '@/services/email/template/invitation-mail';
import { createReportEmailTemplate } from '@/services/email/template/weekly-report-mail';
import { createDataRetentionClampEmailTemplate } from '@/services/email/template/data-retention-clamp-mail';
import { createPasswordChangedEmailTemplate } from '@/services/email/template/password-changed-mail';
import { createTwoFactorEnabledEmailTemplate } from '@/services/email/template/two-factor-enabled-mail';
import { createTwoFactorDisabledEmailTemplate } from '@/services/email/template/two-factor-disabled-mail';
import { createCreateSiteNudgeEmailTemplate } from '@/services/email/template/create-site-nudge-mail';
import { createSetupHelpEmailTemplate } from '@/services/email/template/setup-help-mail';
import { createFirstVisitorDetectedEmailTemplate } from '@/services/email/template/first-visitor-detected-mail';
import type { EmailTemplate } from '@/services/email/types';

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
  'password-changed': {
    template: createPasswordChangedEmailTemplate,
    saasOnly: false,
    retry: URGENT_RETRY,
  },
  'two-factor-enabled': {
    template: createTwoFactorEnabledEmailTemplate,
    saasOnly: false,
    retry: URGENT_RETRY,
  },
  'two-factor-disabled': {
    template: createTwoFactorDisabledEmailTemplate,
    saasOnly: false,
    retry: URGENT_RETRY,
  },
  'create-site-nudge': {
    template: createCreateSiteNudgeEmailTemplate,
    saasOnly: true,
    retry: DEFAULT_RETRY,
  },
  'setup-help': {
    template: createSetupHelpEmailTemplate,
    saasOnly: true,
    retry: DEFAULT_RETRY,
  },
  'first-visitor-detected': {
    template: createFirstVisitorDetectedEmailTemplate,
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
