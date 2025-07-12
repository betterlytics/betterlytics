import {
  createEmailButton,
  createInfoBox,
  createEmailSignature,
  createTextEmailSignature,
  emailStyles,
  createPrimaryLink,
} from './email-components';
import { EmailData, wrapEmailContent, wrapTextEmailContent } from '@/services/email/mail.service';
import escapeHtml from 'escape-html';

export interface EmailVerificationData extends EmailData {
  userName: string;
  verificationToken: string;
  verificationUrl: string;
}

export function generateEmailVerificationContent(data: EmailVerificationData): string {
  const content = `
    <h1>Verify Your Email Address</h1>
    
    <p>Hi <strong>${escapeHtml(data.userName)}</strong>,</p>
    
    <p>Welcome to Betterlytics! To complete your registration, please verify your email address by clicking the button below.</p>

    <div class="center" style="margin: 30px 0;">
      ${createEmailButton('Verify Email Address', data.verificationUrl, 'primary')}
    </div>

    ${createInfoBox(
      `
      <h3 style="${emailStyles.infoHeading}">
        Security Notice
      </h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.4;">
        This verification link will expire in <strong>24 hours</strong> for your security. 
        If you didn't create an account with Betterlytics, you can safely ignore this email.
      </p>
    `,
      'info',
    )}

    <div class="content-section">
      <h2>What's Next?</h2>
      <p>Check out these helpful guides to get started:</p>
      ${createResourceList([
        {
          text: 'Installation Guide',
          url: 'https://betterlytics.io/docs/installation',
          description: 'Add tracking to your website in minutes',
        },
        {
          text: 'Dashboard Overview',
          url: 'https://betterlytics.io/docs/dashboard',
          description: 'Make the most of your analytics data',
        },
        {
          text: 'Pricing Plans',
          url: 'https://betterlytics.io/billing',
          description: 'Explore features and upgrade options',
        },
      ])}
    </div>

    <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 14px; background: #f5f5f5; padding: 10px; border-radius: 4px;">
      ${escapeHtml(data.verificationUrl)}
    </p>

    <p>If you have any questions or need assistance, don't hesitate to reach out to our support team at support@betterlytics.io.</p>

    ${createEmailSignature()}
  `;

  return content;
}

function createResourceList(resources: Array<{ text: string; url: string; description?: string }>): string {
  const listItems = resources
    .map(
      (resource) => `
    <li style="${emailStyles.resourceListItem}">
      ${createPrimaryLink(escapeHtml(resource.text), resource.url)}
      ${resource.description ? `<span style="${emailStyles.mutedText}"> - ${escapeHtml(resource.description)}</span>` : ''}
    </li>
  `,
    )
    .join('');

  return `<ul style="${emailStyles.unorderedList}">${listItems}</ul>`;
}

export function generateEmailVerificationText(data: EmailVerificationData): string {
  const content = `
Verify Your Email Address

Hi ${data.userName},

Welcome to Betterlytics! To complete your registration and start using our privacy-focused analytics platform, please verify your email address by clicking the link below.

Verify your email: ${data.verificationUrl}

Security Notice:
This verification link will expire in 24 hours for your security. If you didn't create an account with Betterlytics, you can safely ignore this email.

What's Next?

Check out these helpful guides to get started:
• Installation Guide: https://betterlytics.io/docs/installation - Add tracking to your website in minutes
• Dashboard Overview: https://betterlytics.io/docs/dashboard - Make the most of your analytics data
• Pricing Plans: https://betterlytics.io/billing - Explore features and upgrade options


If you have any questions or need assistance, don't hesitate to reach out to our support team at support@betterlytics.io.

${createTextEmailSignature()}`.trim();

  return content;
}

export function createEmailVerificationTemplate(data: EmailVerificationData) {
  return {
    subject: `Verify your email address for Betterlytics`,
    html: wrapEmailContent(generateEmailVerificationContent(data)),
    text: wrapTextEmailContent(generateEmailVerificationText(data)),
  };
}

export function getEmailVerificationPreview(data?: Partial<EmailVerificationData>): string {
  const sampleData: EmailVerificationData = {
    to: 'user@example.com',
    userName: data?.userName || 'John Doe',
    verificationToken: data?.verificationToken || 'sample-token-123',
    verificationUrl: data?.verificationUrl || 'https://betterlytics.io/verify-email?token=sample-token-123',
    ...data,
  };

  return createEmailVerificationTemplate(sampleData).html;
}
