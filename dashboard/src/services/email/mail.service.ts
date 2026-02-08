'server-only';

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import nodemailer from 'nodemailer';
import { env } from '@/lib/env';
import {
  createResetPasswordEmailTemplate,
  createUsageAlertEmailTemplate,
  createFirstPaymentWelcomeEmailTemplate,
  createEmailVerificationTemplate,
  getEmailHeader,
  getEmailFooter,
  getTextEmailFooter,
} from '@/services/email/template';
import { ResetPasswordEmailData } from '@/services/email/template/reset-password-mail';
import { UsageAlertEmailData } from '@/services/email/template/usage-alert-mail';
import { FirstPaymentWelcomeEmailData } from '@/services/email/template/first-payment-welcome-mail';
import { EmailVerificationData } from '@/services/email/template/email-verification-mail';
import { isFeatureEnabled } from '@/lib/feature-flags';
import {
  createDashboardInvitationEmailTemplate,
  DashboardInvitationEmailData,
} from '@/services/email/template/invitation-mail';
import { createReportEmailTemplate, EmailReportData } from '@/services/email/template/weekly-report-mail';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
  cloudOnly?: boolean;
}

export interface EmailData {
  to: string;
  toName?: string;
  from?: string;
  fromName?: string;
}

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

function getSenderInfo(emailData: EmailData) {
  return {
    email: emailData.from || env.SMTP_FROM || DEFAULT_SENDER.email,
    name: emailData.fromName || DEFAULT_SENDER.name,
  };
}

async function sendViaMailerSend(template: EmailTemplate, emailData: EmailData): Promise<void> {
  const mailerSend = new MailerSend({
    apiKey: env.MAILER_SEND_API_TOKEN,
  });

  const sender = getSenderInfo(emailData);
  const from = new Sender(sender.email, sender.name);
  const recipient = new Recipient(emailData.to, emailData.toName);

  const emailParams = new EmailParams()
    .setFrom(from)
    .setTo([recipient])
    .setSubject(template.subject)
    .setHtml(template.html);

  if (template.text) {
    emailParams.setText(template.text);
  }

  await mailerSend.email.send(emailParams);
}

async function sendViaSmtp(template: EmailTemplate, emailData: EmailData): Promise<void> {
  if (!env.SMTP_FROM && !emailData.from) {
    console.warn('SMTP_FROM is not set. Emails may be rejected by the SMTP server. Set SMTP_FROM to your sender address.');
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });

  const sender = getSenderInfo(emailData);

  const mailOptions: nodemailer.SendMailOptions = {
    from: `${sender.name} <${sender.email}>`,
    to: emailData.toName ? `${emailData.toName} <${emailData.to}>` : emailData.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  };

  await transporter.sendMail(mailOptions);
}

async function sendEmail(template: EmailTemplate, emailData: EmailData): Promise<void> {
  try {
    if (!isFeatureEnabled('enableEmails')) {
      return;
    }

    if (template.cloudOnly && !env.IS_CLOUD) {
      console.warn('Attempted to send a cloud-only email on a self-hosted instance, skipping');
      return;
    }

    if (process.env.NODE_ENV === 'development' && !emailData.to.includes('@betterlytics.io')) {
      console.warn('WARN: You are only allowed to send emails to @betterlytics.io from dev environment');
      return;
    }

    if (env.MAILER_SEND_API_TOKEN) {
      await sendViaMailerSend(template, emailData);
    } else if (env.SMTP_HOST) {
      await sendViaSmtp(template, emailData);
    } else {
      console.warn('No email provider configured (set MAILER_SEND_API_TOKEN or SMTP_HOST), skipping email send');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
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

export async function sendDashboardInvitationEmail(data: DashboardInvitationEmailData): Promise<void> {
  await sendEmail(createDashboardInvitationEmailTemplate(data), data);
}

export async function sendReportEmail(data: EmailReportData): Promise<void> {
  await sendEmail(createReportEmailTemplate(data), data);
}
