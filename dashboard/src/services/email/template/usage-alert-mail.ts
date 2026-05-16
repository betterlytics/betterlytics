import {
  createEmailButton,
  createEmailSignature,
  createTextEmailSignature,
  emailStyles,
} from './email-components';
import type { EmailData } from '@/services/email/types';
import { wrapEmailContent, wrapTextEmailContent } from '@/services/email/content';
import { format } from 'date-fns';
import escapeHtml from 'escape-html';

type SerializableDate = Date | string;

export interface UsageAlertEmailData extends EmailData {
  userName: string;
  currentUsage: number;
  usageLimit: number;
  usagePercentage: number;
  planName: string;
  currentPeriodStart: SerializableDate;
  currentPeriodEnd: SerializableDate;
  upgradeUrl: string;
}

type AlertSeverity = 'warning' | 'critical' | 'exceeded';

function getSeverity(percentage: number): AlertSeverity {
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 90) return 'critical';
  return 'warning';
}

function normalizePlainText(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function getSubjectLine(percentage: number, planName: string): string {
  const safePlanName = normalizePlainText(planName);
  if (percentage >= 100) {
    return `Usage alert: ${safePlanName} plan event limit exceeded`;
  }
  return `Usage alert: ${percentage}% of your ${safePlanName} plan event limit used`;
}

function getPreheader(percentage: number): string {
  if (percentage >= 100) {
    return 'Your account has exceeded the event limit included in your plan. Review your billing options.';
  }
  if (percentage >= 90) {
    return `Your account is close to the monthly event limit included in your plan.`;
  }
  return `Your account has crossed 80% of the monthly event limit included in your plan.`;
}

function createPreheader(text: string): string {
  return `
    <div style="display:none; font-size:1px; color:#f8fafc; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
      ${escapeHtml(text)}${'&nbsp;'.repeat(120)}
    </div>
  `;
}

function formatBillingDate(value: SerializableDate): string {
  return format(new Date(value), 'MMM d, yyyy');
}

function getBillingPeriodLabel(data: UsageAlertEmailData): string {
  return `${formatBillingDate(data.currentPeriodStart)} to ${formatBillingDate(data.currentPeriodEnd)}`;
}

function getStatusCopy(severity: AlertSeverity): {
  heading: string;
  guidance: string;
  quotaWarning: string;
  ctaLabel: string;
} {
  if (severity === 'exceeded') {
    return {
      heading: 'Usage alert',
      guidance: 'Your account has exceeded the event limit included in your plan.',
      quotaWarning:
        'Please be aware that events above 100% of your plan limit may not be retained. Review your billing options to keep future data within plan.',
      ctaLabel: 'Review billing options',
    };
  }

  if (severity === 'critical') {
    return {
      heading: 'Usage alert',
      guidance: 'Your account is close to the event limit included in your plan.',
      quotaWarning:
        'Please be aware that events above 100% of your plan limit may not be retained, so we recommend reviewing your billing options before usage reaches 100%.',
      ctaLabel: 'Review billing options',
    };
  }

  return {
    heading: 'Usage alert',
    guidance: 'Your account has crossed 80% of the event limit included in your plan.',
    quotaWarning:
      'No action is required yet, but please be aware that events above 100% of your plan limit may not be retained.',
    ctaLabel: 'Review billing options',
  };
}

function getIntroCopy(data: UsageAlertEmailData, severity: AlertSeverity, periodLabel: string): string {
  if (severity === 'exceeded') {
    return `Your account has exceeded the event limit included in your <strong>${escapeHtml(
      data.planName,
    )}</strong> plan for <strong>${escapeHtml(periodLabel)}</strong>.`;
  }

  return `You've used <strong>${data.usagePercentage}%</strong> of the event limit included in your <strong>${escapeHtml(
    data.planName,
  )}</strong> plan for <strong>${escapeHtml(periodLabel)}</strong>.`;
}

function createUsageSummaryBox(data: UsageAlertEmailData, periodLabel: string): string {
  const remaining = Math.max(0, data.usageLimit - data.currentUsage);
  const remainingColor = remaining > 0 ? '#059669' : '#dc2626';
  const barColor = data.usagePercentage >= 100 ? '#dc2626' : data.usagePercentage >= 90 ? '#f59e0b' : '#10b981';
  const barWidth = Math.min(100, data.usagePercentage);

  const row = (label: string, value: string, valueStyle = `${emailStyles.primaryText} font-weight: 600;`) => `
    <tr>
      <td style="padding: 4px 0; ${emailStyles.secondaryText}">${label}</td>
      <td style="padding: 4px 0; text-align: right; ${valueStyle}">${value}</td>
    </tr>
  `;

  return `
    <div class="content-section" style="margin: 24px 0;">
      <h2 style="margin: 0 0 12px 0;">Current usage</h2>
      <p style="margin: 0 0 18px 0; ${emailStyles.secondaryText}">
        ${escapeHtml(periodLabel)}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tbody>
          ${row('Plan', `${escapeHtml(data.planName)} plan`)}
          ${row('Current usage', `${data.currentUsage.toLocaleString()} events`)}
          ${row('Plan limit', `${data.usageLimit.toLocaleString()} events`)}
          ${row('Remaining', `${remaining.toLocaleString()} events`, `font-weight: 600; color: ${remainingColor};`)}
        </tbody>
      </table>
      <div style="background-color: #e5e7eb; height: 8px; border-radius: 4px; margin-top: 16px; overflow: hidden;">
        <div style="background-color: ${barColor}; height: 8px; width: ${barWidth}%;">&nbsp;</div>
      </div>
      <p style="margin: 8px 0 0 0; text-align: right; font-size: 14px; ${emailStyles.secondaryText}">
        ${data.usagePercentage}% used
      </p>
    </div>
  `;
}

export function generateUsageAlertEmailContent(data: UsageAlertEmailData): string {
  const severity = getSeverity(data.usagePercentage);
  const statusCopy = getStatusCopy(severity);
  const periodLabel = getBillingPeriodLabel(data);
  const preheader = createPreheader(getPreheader(data.usagePercentage));

  return `
    ${preheader}
    <h1>${statusCopy.heading}</h1>

    <p style="margin: 0 0 16px 0;">Hi <strong>${escapeHtml(data.userName)}</strong>,</p>

    <p style="margin: 0 0 24px 0;">
      ${getIntroCopy(data, severity, periodLabel)}
    </p>

    ${createUsageSummaryBox(data, periodLabel)}

    <p style="margin: 24px 0 12px 0; ${emailStyles.mutedText}">
      ${statusCopy.guidance}
    </p>
    <p style="margin: 0 0 24px 0; ${emailStyles.mutedText}">
      ${statusCopy.quotaWarning}
    </p>

    <div class="center" style="margin: 24px 0 8px 0;">
      ${createEmailButton(statusCopy.ctaLabel, data.upgradeUrl)}
    </div>

    <p style="font-size: 14px; ${emailStyles.secondaryText}">
      Questions about your usage? Reply to this email or contact support@betterlytics.io.
    </p>

    ${createEmailSignature()}
  `;
}

export function generateUsageAlertEmailText(data: UsageAlertEmailData): string {
  const severity = getSeverity(data.usagePercentage);
  const statusCopy = getStatusCopy(severity);
  const remaining = Math.max(0, data.usageLimit - data.currentUsage);
  const periodLabel = getBillingPeriodLabel(data);

  const headline =
    severity === 'exceeded'
      ? `You've exceeded your ${data.planName} plan event limit.`
      : severity === 'critical'
        ? `You're at ${data.usagePercentage}% of your ${data.planName} plan event limit.`
        : `You've used ${data.usagePercentage}% of your ${data.planName} plan event limit.`;

  return `
${statusCopy.heading}

Hi ${data.userName},

${headline}
Billing period: ${periodLabel}

USAGE SUMMARY
Plan:          ${data.planName}
Current usage: ${data.currentUsage.toLocaleString()} events
Plan limit:    ${data.usageLimit.toLocaleString()} events
Remaining:     ${remaining.toLocaleString()} events
Used:          ${data.usagePercentage}%

${statusCopy.guidance}
${statusCopy.quotaWarning}
${data.upgradeUrl}

Questions? Reply to this email or reach us at support@betterlytics.io.

${createTextEmailSignature()}`.trim();
}

export function createUsageAlertEmailTemplate(data: UsageAlertEmailData) {
  return {
    subject: getSubjectLine(data.usagePercentage, data.planName),
    html: wrapEmailContent(generateUsageAlertEmailContent(data)),
    text: wrapTextEmailContent(generateUsageAlertEmailText(data)),
  };
}

export function getUsageAlertEmailPreview(data?: Partial<UsageAlertEmailData>): string {
  const sampleData: UsageAlertEmailData = {
    to: 'user@example.com',
    userName: data?.userName || 'John Doe',
    currentUsage: data?.currentUsage || 9500,
    usageLimit: data?.usageLimit || 10000,
    usagePercentage: data?.usagePercentage || 85,
    planName: data?.planName || 'Growth',
    currentPeriodStart: data?.currentPeriodStart || new Date('2026-04-01T00:00:00.000Z'),
    currentPeriodEnd: data?.currentPeriodEnd || new Date('2026-04-30T00:00:00.000Z'),
    upgradeUrl: data?.upgradeUrl || 'https://betterlytics.io/billing',
    ...data,
  };

  return createUsageAlertEmailTemplate(sampleData).html;
}
