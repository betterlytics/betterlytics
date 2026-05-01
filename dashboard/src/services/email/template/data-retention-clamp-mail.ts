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

export interface DataRetentionClampEmailData extends EmailData {
  userName: string;
  newPlanName: string;
  previousRetentionDays: number;
  newRetentionDays: number;
  graceUntil: Date;
  upgradeUrl: string;
}

function formatDays(days: number): string {
  if (days % 365 === 0 && days >= 365) {
    const years = days / 365;
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  if (days % 30 === 0 && days >= 30) {
    const months = days / 30;
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  return `${days} day${days === 1 ? '' : 's'}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function generateDataRetentionClampEmailContent(data: DataRetentionClampEmailData): string {
  const previous = formatDays(data.previousRetentionDays);
  const next = formatDays(data.newRetentionDays);
  const graceDate = formatDate(data.graceUntil);

  const alertMessage = `
    <h3 style="${emailStyles.warningHeading}">
      Data retention reduced
    </h3>
    <p style="margin: 10px 0 0 0; ${emailStyles.mutedText}">
      Your <strong>${escapeHtml(data.newPlanName)}</strong> plan supports up to <strong>${escapeHtml(next)}</strong> of data retention.
      Your retention setting was previously <strong>${escapeHtml(previous)}</strong> and has been adjusted down to fit the new plan.
    </p>
    <p style="margin: 10px 0 0 0; color: #f59e0b; font-weight: 600;">
      Events older than ${escapeHtml(next)} will be deleted on <strong>${escapeHtml(graceDate)}</strong> unless you upgrade before then.
    </p>
  `;

  return `
    <h1>Your data retention has changed</h1>

    <p>Hi <strong>${escapeHtml(data.userName)}</strong>,</p>

    <p>
      We're letting you know about a change to your data retention as a result of your recent plan change.
    </p>

    ${createInfoBox(alertMessage, 'warning')}

    <div class="content-section">
      <h2>What happens next</h2>
      <p style="${emailStyles.mutedText} line-height: 1.6;">
        We hold your historical data unchanged until <strong>${escapeHtml(graceDate)}</strong>. After that date,
        the next scheduled cleanup will permanently delete events older than ${escapeHtml(next)}.
        If you upgrade before then, your previous retention window is restored automatically.
      </p>

      <div class="center" style="margin: 20px 0;">
        ${createEmailButton('Upgrade Your Plan', data.upgradeUrl, 'primary')}
      </div>
    </div>

    <p>
      Questions? Reach out to ${createPrimaryLink('support@betterlytics.io', 'mailto:support@betterlytics.io')}.
    </p>

    ${createEmailSignature()}
  `;
}

export function generateDataRetentionClampEmailText(data: DataRetentionClampEmailData): string {
  const previous = formatDays(data.previousRetentionDays);
  const next = formatDays(data.newRetentionDays);
  const graceDate = formatDate(data.graceUntil);

  return `
Your data retention has changed

Hi ${data.userName},

Your ${data.newPlanName} plan supports up to ${next} of data retention. Your retention setting was previously ${previous} and has been adjusted down to fit the new plan.

Events older than ${next} will be deleted on ${graceDate} unless you upgrade before then.

WHAT HAPPENS NEXT:
We hold your historical data unchanged until ${graceDate}. After that date, the next scheduled cleanup will permanently delete events older than ${next}. If you upgrade before then, your previous retention window is restored automatically.

UPGRADE YOUR PLAN: ${data.upgradeUrl}

Questions? Reach out to support@betterlytics.io.

${createTextEmailSignature()}`.trim();
}

export function getDataRetentionClampEmailPreview(): string {
  const sampleData: DataRetentionClampEmailData = {
    to: 'user@example.com',
    userName: 'John Doe',
    newPlanName: 'Growth',
    previousRetentionDays: 365,
    newRetentionDays: 90,
    graceUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    upgradeUrl: 'https://betterlytics.io/billing',
  };
  return createDataRetentionClampEmailTemplate(sampleData).html;
}

export function createDataRetentionClampEmailTemplate(data: DataRetentionClampEmailData) {
  return {
    subject: `Data retention reduced on your ${data.newPlanName} plan`,
    html: wrapEmailContent(generateDataRetentionClampEmailContent(data)),
    text: wrapTextEmailContent(generateDataRetentionClampEmailText(data)),
    cloudOnly: true,
  };
}
