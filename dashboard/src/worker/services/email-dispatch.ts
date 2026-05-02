'server-only';

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import nodemailer from 'nodemailer';
import { workerEnv } from '@/worker/workerEnv';
import type { EmailData, EmailTemplate } from '@/services/email/mail.service';

const DEFAULT_SENDER = {
  email: 'info@betterlytics.io',
  name: 'Betterlytics',
};

function getSenderInfo(data: EmailData) {
  return {
    email: data.from ?? workerEnv.SMTP_FROM ?? DEFAULT_SENDER.email,
    name: data.fromName ?? DEFAULT_SENDER.name,
  };
}

async function sendViaMailerSend(template: EmailTemplate, data: EmailData): Promise<string | null> {
  const mailerSend = new MailerSend({ apiKey: workerEnv.MAILER_SEND_API_TOKEN });
  const sender = getSenderInfo(data);
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

async function sendViaSmtp(template: EmailTemplate, data: EmailData): Promise<string | null> {
  if (!workerEnv.SMTP_FROM && !data.from) {
    console.warn('SMTP_FROM is not set. Emails may be rejected by the SMTP server.');
  }

  const transporter = nodemailer.createTransport({
    host: workerEnv.SMTP_HOST,
    port: workerEnv.SMTP_PORT,
    secure: workerEnv.SMTP_PORT === 465,
    auth:
      workerEnv.SMTP_USER && workerEnv.SMTP_PASSWORD
        ? { user: workerEnv.SMTP_USER, pass: workerEnv.SMTP_PASSWORD }
        : undefined,
  });

  const sender = getSenderInfo(data);
  const info = await transporter.sendMail({
    from: `${sender.name} <${sender.email}>`,
    to: data.toName ? `${data.toName} <${data.to}>` : data.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return info.messageId ?? null;
}

export async function dispatch(template: EmailTemplate, data: EmailData): Promise<string | null> {
  if (workerEnv.MAILER_SEND_API_TOKEN) {
    return sendViaMailerSend(template, data);
  }
  if (workerEnv.SMTP_HOST) {
    return sendViaSmtp(template, data);
  }
  console.warn('No email provider configured (set MAILER_SEND_API_TOKEN or SMTP_HOST); dropping email');
  return null;
}
