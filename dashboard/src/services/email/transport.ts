'server-only';

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import nodemailer from 'nodemailer';
import type { SenderAddress } from '@/lib/env/email-sender';
import type { EmailData, EmailTemplate } from '@/services/email/types';

export type EmailTransportConfig = {
  isCloud: boolean;
  mailerSendApiToken?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  configuredSender?: SenderAddress;
  defaultSender?: { email?: string; name: string };
};

const CLOUD_FALLBACK_SENDER_EMAIL = 'info@betterlytics.io';
const DEFAULT_SENDER_NAME = 'Betterlytics';

export function resolveSender(config: EmailTransportConfig, data: EmailData): { email: string; name: string } {
  const email =
    data.from ??
    config.defaultSender?.email ??
    config.configuredSender?.email ??
    (config.isCloud ? CLOUD_FALLBACK_SENDER_EMAIL : undefined);
  if (!email) {
    // Unreachable after the worker env boot check; never send as a betterlytics.io address off-cloud
    throw new Error('No sender address configured: set SMTP_FROM (used for MailerSend and SMTP)');
  }
  const name = data.fromName ?? config.defaultSender?.name ?? config.configuredSender?.name ?? DEFAULT_SENDER_NAME;
  return { email, name };
}

async function sendViaMailerSend(
  template: EmailTemplate,
  data: EmailData,
  config: EmailTransportConfig,
): Promise<string | null> {
  const mailerSend = new MailerSend({ apiKey: config.mailerSendApiToken ?? '' });
  const sender = resolveSender(config, data);
  const emailParams = new EmailParams()
    .setFrom(new Sender(sender.email, sender.name))
    .setTo([new Recipient(data.to, data.toName)])
    .setSubject(template.subject)
    .setHtml(template.html);

  if (template.text) {
    emailParams.setText(template.text);
  }

  const response = await mailerSend.email.send(emailParams);
  const messageId = response.headers?.['x-message-id'] ?? null;
  return typeof messageId === 'string' ? messageId : null;
}

async function sendViaSmtp(
  template: EmailTemplate,
  data: EmailData,
  config: EmailTransportConfig,
): Promise<string | null> {
  const sender = resolveSender(config, data);
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort ?? 587,
    secure: (config.smtpPort ?? 587) === 465,
    auth:
      config.smtpUser && config.smtpPassword ? { user: config.smtpUser, pass: config.smtpPassword } : undefined,
  });

  const info = await transporter.sendMail({
    from: { name: sender.name, address: sender.email },
    to: data.toName ? `${data.toName} <${data.to}>` : data.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return info.messageId ?? null;
}

export async function dispatchEmail(
  template: EmailTemplate,
  data: EmailData,
  config: EmailTransportConfig,
): Promise<string | null> {
  if (config.mailerSendApiToken) {
    return sendViaMailerSend(template, data, config);
  }

  if (config.smtpHost) {
    return sendViaSmtp(template, data, config);
  }

  throw new Error('No email provider configured (set MAILER_SEND_API_TOKEN or SMTP_HOST)');
}
