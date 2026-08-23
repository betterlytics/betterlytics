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
import { createTwoFactorResetRequiredEmailTemplate } from '@/services/email/template/two-factor-reset-required-mail';
import { createCreateSiteNudgeEmailTemplate } from '@/services/email/template/create-site-nudge-mail';
import { createSetupHelpEmailTemplate } from '@/services/email/template/setup-help-mail';
import { createFirstVisitorDetectedEmailTemplate } from '@/services/email/template/first-visitor-detected-mail';
import type { EmailTemplate } from '@/services/email/types';
import type { EmailTransportConfig } from '@/services/email/transport';
import { createSubscriptionEndingSoonEmailTemplate } from './template/subscription-ending-soon-mail';
import { createSubscriptionPaymentCancelledEmailTemplate } from './template/subscription-payment-cancelled-mail';
import { createInvitationAcceptedEmailTemplate } from './template/invitation-accepted-mail';
import { createMemberRemovedEmailTemplate } from './template/member-removed-mail';
import { createMonitorDownEmailTemplate } from './template/monitor-down-mail';
import { createMonitorRecoveryEmailTemplate } from './template/monitor-recovery-mail';
import { createMonitorSslEmailTemplate } from './template/monitor-ssl-mail';
import {
  MonitorDownEmailDataSchema,
  MonitorRecoveryEmailDataSchema,
  MonitorSslEmailDataSchema,
} from '@/entities/system/monitorAlertEmail.entities';
import { z } from 'zod';

export const SEND_EMAIL_JOB_NAME = 'send-email';

const DEFAULT_RETRY = { retryLimit: 3, retryDelay: 60, retryBackoff: true };
const URGENT_RETRY = { retryLimit: 5, retryDelay: 30, retryBackoff: false };

const MONITOR_ALERT_SENDER = { name: 'Betterlytics Alerts', cloudEmail: 'alerts@betterlytics.io' };

export type EmailTypeDefinition = {
  template: (data: never) => EmailTemplate | Promise<EmailTemplate>;
  saasOnly: boolean;
  /**
   * Retry override applied when the dashboard enqueues this type; omitted for types only
   * because producers may want to set their own policy on the job row.
   */
  retry?: { retryLimit: number; retryDelay: number; retryBackoff: boolean };
  /** Runtime validation for payloads produced outside TypeScript (e.g. the Rust backend). */
  schema?: z.ZodType;
  /** Sender override. `cloudEmail` only applies on cloud so a self-host SMTP_FROM stays authoritative. */
  sender?: { name: string; cloudEmail?: string };
};

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
  'invitation-accepted': {
    template: createInvitationAcceptedEmailTemplate,
    saasOnly: false,
    retry: DEFAULT_RETRY,
  },
  'member-removed': {
    template: createMemberRemovedEmailTemplate,
    saasOnly: false,
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
  'two-factor-reset-required': {
    template: createTwoFactorResetRequiredEmailTemplate,
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
  'monitor-down': {
    template: createMonitorDownEmailTemplate,
    saasOnly: false,
    schema: MonitorDownEmailDataSchema,
    sender: MONITOR_ALERT_SENDER,
  },
  'monitor-recovery': {
    template: createMonitorRecoveryEmailTemplate,
    saasOnly: false,
    schema: MonitorRecoveryEmailDataSchema,
    sender: MONITOR_ALERT_SENDER,
  },
  'monitor-ssl': {
    template: createMonitorSslEmailTemplate,
    saasOnly: false,
    schema: MonitorSslEmailDataSchema,
    sender: MONITOR_ALERT_SENDER,
  },
} as const satisfies Record<string, EmailTypeDefinition>;

export type EmailType = keyof typeof EMAIL_TYPES;
export const EMAIL_TYPE_NAMES = Object.keys(EMAIL_TYPES) as [EmailType, ...EmailType[]];
type DataFor<T extends EmailType> = Parameters<(typeof EMAIL_TYPES)[T]['template']>[0];

export type SendEmailPayload = {
  [T in EmailType]: {
    type: T;
    recipientKey: string;
    campaignKey: string;
    data: DataFor<T>;
  };
}[EmailType];

/**
 * Envelope every send-email job must satisfy. Types with a `schema` (those a non-TypeScript
 * producer can enqueue) have their `data` validated further; the rest rely on the compile-time
 * contract of `enqueueEmail`. Lives here rather than in `src/entities` because it is derived
 * from `EMAIL_TYPES`.
 */
export const SendEmailEnvelopeSchema = z.object({
  type: z.enum(EMAIL_TYPE_NAMES),
  recipientKey: z.string().min(1),
  campaignKey: z.string().min(1),
  data: z.object({ to: z.string().min(1) }).passthrough(),
});

export type SendEmailPayloadValidation =
  | { ok: true; payload: SendEmailPayload }
  | { ok: false; type: string; error: string };

export function validateSendEmailPayload(raw: unknown): SendEmailPayloadValidation {
  const envelope = SendEmailEnvelopeSchema.safeParse(raw);
  if (!envelope.success) {
    const rawType = typeof raw === 'object' && raw !== null && 'type' in raw ? raw.type : undefined;
    // Only known types become a metric label; anything else would be unbounded cardinality.
    const type = EMAIL_TYPE_NAMES.find((name) => name === rawType) ?? 'unknown';
    return { ok: false, type, error: envelope.error.message };
  }

  const { schema }: EmailTypeDefinition = EMAIL_TYPES[envelope.data.type];
  if (!schema) {
    return { ok: true, payload: envelope.data as SendEmailPayload };
  }

  const data = schema.safeParse(envelope.data.data);
  if (!data.success) {
    return { ok: false, type: envelope.data.type, error: data.error.message };
  }
  return { ok: true, payload: { ...envelope.data, data: data.data } as SendEmailPayload };
}

export function sendEmailSingletonKey(payload: Pick<SendEmailPayload, 'campaignKey' | 'recipientKey'>): string {
  return `${payload.campaignKey}:${payload.recipientKey}`;
}

/** Sender for the transport layer; the `cloudEmail` only applies on cloud so SMTP_FROM stays authoritative off-cloud. */
export function senderFor(type: EmailType, isCloud: boolean): EmailTransportConfig['defaultSender'] {
  const { sender }: EmailTypeDefinition = EMAIL_TYPES[type];
  if (!sender) return undefined;
  return { name: sender.name, email: isCloud ? sender.cloudEmail : undefined };
}

export async function renderEmail(payload: SendEmailPayload): Promise<EmailTemplate> {
  const template = EMAIL_TYPES[payload.type].template as (data: unknown) => EmailTemplate | Promise<EmailTemplate>;
  return template(payload.data);
}
