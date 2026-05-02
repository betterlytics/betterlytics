'server-only';

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import nodemailer from 'nodemailer';
import type { EmailData, EmailTemplate } from '@/services/email/types';

export type EmailTransportConfig = {
  mailerSendApiToken?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;
};

const DEFAULT_SENDER = {
  email: 'info@betterlytics.io',
  name: 'Betterlytics',
};

function getSenderInfo(config: EmailTransportConfig, data: EmailData) {
  return {
    email: data.from ?? config.smtpFrom ?? DEFAULT_SENDER.email,
    name: data.fromName ?? DEFAULT_SENDER.name,
  };
}

async function sendViaMailerSend(
  template: EmailTemplate,
  data: EmailData,
  config: EmailTransportConfig,
): Promise<string | null> {
  const mailerSend = new MailerSend({ apiKey: config.mailerSendApiToken ?? '' });
  const sender = getSenderInfo(config, data);
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

async function sendViaSmtp(template: EmailTemplate, data: EmailData, config: EmailTransportConfig): Promise<string | null> {
  if (!config.smtpFrom && !data.from) {
    console.warn('SMTP_FROM is not set. Emails may be rejected by the SMTP server.');
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort ?? 587,
    secure: (config.smtpPort ?? 587) === 465,
    auth:
      config.smtpUser && config.smtpPassword
        ? { user: config.smtpUser, pass: config.smtpPassword }
        : undefined,
  });

  const sender = getSenderInfo(config, data);
  const info = await transporter.sendMail({
    from: `${sender.name} <${sender.email}>`,
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

  console.warn('No email provider configured (set MAILER_SEND_API_TOKEN or SMTP_HOST); dropping email');
  return null;
}
