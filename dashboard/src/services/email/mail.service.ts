'server-only';

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { env } from '@/lib/env';
import {
  createWelcomeEmailTemplate,
  createResetPasswordEmailTemplate,
  createUsageAlertEmailTemplate,
  createFirstPaymentWelcomeEmailTemplate,
  createEmailVerificationTemplate,
  getEmailHeader,
  getEmailFooter,
  getTextEmailFooter,
} from '@/services/email/template';
import { WelcomeEmailData } from '@/services/email/template/welcome-mail';
import { ResetPasswordEmailData } from '@/services/email/template/reset-password-mail';
import { UsageAlertEmailData } from '@/services/email/template/usage-alert-mail';
import { FirstPaymentWelcomeEmailData } from '@/services/email/template/first-payment-welcome-mail';
import { EmailVerificationData } from '@/services/email/template/email-verification-mail';
import { isFeatureEnabled } from '@/lib/feature-flags';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string;
  toName?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  replyToName?: string;
}

const mailerSend = new MailerSend({
  apiKey: env.MAILER_SEND_API_TOKEN,
});

const DEFAULT_SENDER = {
  email: 'info@betterlytics.io',
  name: 'Betterlytics',
};

export function wrapEmailContent(content: string): string {
  return getEmailHeader() + content + getEmailFooter();
}

export function wrapTextEmailContent(content: string): string {
  return content + '\n\n' + getTextEmailFooter();
}

async function sendEmail(template: EmailTemplate, emailData: EmailData): Promise<void> {
  try {
    if (!isFeatureEnabled('enableEmails')) {
      return;
    }

    if (!env.MAILER_SEND_API_TOKEN) {
      console.warn('MailerSend API token not configured, skipping email send');
      return;
    }

    if (process.env.NODE_ENV === 'development' && !emailData.to.includes('@betterlytics.io')) {
      console.warn('WARN: You are only allowed to send emails to @betterlytics.io from dev environment');
      return;
    }

    const sender = new Sender(emailData.from || DEFAULT_SENDER.email, emailData.fromName || DEFAULT_SENDER.name);

    const recipient = new Recipient(emailData.to, emailData.toName);

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo([recipient])
      .setSubject(template.subject)
      .setHtml(template.html);

    if (template.text) {
      emailParams.setText(template.text);
    }

    if (emailData.replyTo) {
      emailParams.setReplyTo(new Sender(emailData.replyTo, emailData.replyToName));
    }

    await mailerSend.email.send(emailParams);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  await sendEmail(createWelcomeEmailTemplate(data), data);
}

export async function sendResetPasswordEmail(data: ResetPasswordEmailData): Promise<void> {
  await sendEmail(createResetPasswordEmailTemplate(data), data);
}

export async function sendUsageAlertEmail(data: UsageAlertEmailData): Promise<void> {
  await sendEmail(createUsageAlertEmailTemplate(data), data);
}

export async function sendFirstPaymentWelcomeEmail(data: FirstPaymentWelcomeEmailData): Promise<void> {
  await sendEmail(createFirstPaymentWelcomeEmailTemplate(data), data);
}

export async function sendEmailVerificationEmail(data: EmailVerificationData): Promise<void> {
  await sendEmail(createEmailVerificationTemplate(data), data);
}
