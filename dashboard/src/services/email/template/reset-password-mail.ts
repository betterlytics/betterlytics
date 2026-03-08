import {
  createEmailButton,
  createInfoBox,
  createEmailSignature,
  createTextEmailSignature,
  emailStyles,
  createPrimaryLink,
} from './email-components';
import { env } from '@/lib/env';
import { EmailData, wrapEmailContent, wrapTextEmailContent } from '@/services/email/mail.service';
import escapeHtml from 'escape-html';

export interface ResetPasswordEmailData extends EmailData {
  userName: string;
  resetUrl: string;
  expirationTime: string;
}

export function generateResetPasswordEmailContent(data: ResetPasswordEmailData): string {
  const content = `
    <h1>Reset Your Password</h1>
    
    <p>Hi <strong>${escapeHtml(data.userName)}</strong>,</p>
    
    <p>We received a request to reset your password for your Betterlytics account. If you made this request, click the button below to reset your password.</p>

    <div class="center" style="margin: 30px 0;">
      ${createEmailButton('Reset Password', data.resetUrl, 'primary')}
    </div>

    ${createInfoBox(
      `
      <h3 style="${emailStyles.errorHeading}">
        Security Notice
      </h3>
      <p style="margin: 10px 0 0 0; ${emailStyles.mutedText}">
        This password reset link will expire in <strong>${escapeHtml(data.expirationTime)}</strong> for security reasons.
      </p>
      <p style="margin: 10px 0 0 0; ${emailStyles.mutedText}">
        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    `,
      'warning',
    )}

    <div class="content-section">
      <h2>Having Trouble?</h2>
      
      <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <a href="${escapeHtml(data.resetUrl)}" style="${emailStyles.mutedLink} word-break: break-all; font-family: monospace; font-size: 14px;">
          ${escapeHtml(data.resetUrl)}
        </a>
      
      ${env.IS_CLOUD ? `<p>If you continue to have problems, contact our support team:</p>
      <p>
        ${createPrimaryLink('support@betterlytics.io', 'mailto:support@betterlytics.io')}
      </p>` : ''}
    </div>

    <p>If you need a new reset link after it expires, you can request another one from the login page.</p>

    ${createEmailSignature()}
  `;

  return content;
}

export function generateResetPasswordEmailText(data: ResetPasswordEmailData): string {
  const content = `
Reset Your Password

Hi ${data.userName},

We received a request to reset your password for your Betterlytics account. If you made this request, use the link below to reset your password.

Reset Password Link:
${data.resetUrl}

SECURITY NOTICE:
This password reset link will expire in ${data.expirationTime} for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Having Trouble?
${env.IS_CLOUD ? 'If you continue to have problems, contact our support team at support@betterlytics.io\n\n' : ''}For your security, this link will expire automatically after ${data.expirationTime}. If you need a new reset link after it expires, you can request another one from the login page.

${createTextEmailSignature()}`.trim();

  return content;
}

export function createResetPasswordEmailTemplate(data: ResetPasswordEmailData) {
  return {
    subject: 'Reset Your Betterlytics Password',
    html: wrapEmailContent(generateResetPasswordEmailContent(data)),
    text: wrapTextEmailContent(generateResetPasswordEmailText(data)),
  };
}

export function getResetPasswordEmailPreview(data?: Partial<ResetPasswordEmailData>): string {
  const sampleData: ResetPasswordEmailData = {
    to: 'user@example.com',
    userName: data?.userName || 'John Doe',
    resetUrl: data?.resetUrl || 'https://betterlytics.io/reset-password?token=abc123xyz',
    expirationTime: data?.expirationTime || '30 minutes',
    ...data,
  };

  return createResetPasswordEmailTemplate(sampleData).html;
}
