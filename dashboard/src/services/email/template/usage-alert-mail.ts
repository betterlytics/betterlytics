import {
  createEmailButton,
  createInfoBox,
  createEmailSignature,
  createTextEmailSignature,
  emailStyles,
  createPrimaryLink,
  emailIcons,
} from './email-components';
import { EmailData, wrapEmailContent, wrapTextEmailContent } from '@/services/email/mail.service';
import escapeHtml from 'escape-html';

export interface UsageAlertEmailData extends EmailData {
  userName: string;
  currentUsage: number;
  usageLimit: number;
  usagePercentage: number;
  planName: string;
  upgradeUrl: string;
}

function getAlertLevel(percentage: number): 'warning' | 'error' {
  if (percentage >= 90) return 'error';
  return 'warning';
}

function getAlertMessage(percentage: number, currentUsage: number, usageLimit: number): string {
  if (percentage >= 100) {
    return `
      <h3 style="${emailStyles.errorHeading}">
        ${emailIcons.warning} Usage Limit Exceeded
      </h3>
      <p style="margin: 10px 0 0 0; ${emailStyles.mutedText}">
        You have exceeded your usage limit of <strong>${usageLimit.toLocaleString()}</strong> events. 
        Your account is currently at <strong>${currentUsage.toLocaleString()}</strong> events (${percentage}%).
      </p>
      <p style="margin: 10px 0 0 0; color: #dc2626; font-weight: 600;">
        As outlined in our Terms of Service, excess data above plan limits may be lost. Please upgrade to protect your analytics data.
      </p>
    `;
  } else if (percentage >= 90) {
    return `
      <h3 style="${emailStyles.warningHeading}">
        ${emailIcons.alert} Critical Usage Alert
      </h3>
      <p style="margin: 10px 0 0 0; ${emailStyles.mutedText}">
        You have used <strong>${currentUsage.toLocaleString()}</strong> of your <strong>${usageLimit.toLocaleString()}</strong> events (${percentage}%).
      </p>
      <p style="margin: 10px 0 0 0; color: #f59e0b; font-weight: 600;">
        You're approaching your limit. Per our Terms of Service, excess data may be lost if limits are exceeded.
      </p>
    `;
  } else {
    return `
      <h3 style="${emailStyles.warningHeading}">
        ${emailIcons.stats} Usage Alert
      </h3>
      <p style="margin: 10px 0 0 0; ${emailStyles.mutedText}">
        You have used <strong>${currentUsage.toLocaleString()}</strong> of your <strong>${usageLimit.toLocaleString()}</strong> events (${percentage}%).
      </p>
      <p style="margin: 10px 0 0 0; ${emailStyles.mutedText}">
        You're approaching your usage limit. To ensure data continuity, consider upgrading before reaching your limit.
      </p>
    `;
  }
}

function getSubjectLine(percentage: number, planName: string): string {
  if (percentage >= 100) {
    return `${emailIcons.warning} Data Protection Alert: Usage limit exceeded on your ${escapeHtml(planName)} plan`;
  } else if (percentage >= 90) {
    return `${emailIcons.alert} Data Protection Warning: ${percentage}% usage reached on your ${escapeHtml(planName)} plan`;
  } else {
    return `${emailIcons.stats} Usage Notification: ${percentage}% of your ${escapeHtml(planName)} plan used`;
  }
}

function createUsageSummaryBox(data: UsageAlertEmailData): string {
  const remaining = Math.max(0, data.usageLimit - data.currentUsage);

  return `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="${emailStyles.secondaryText}">Current Usage:</span>
        <span style="font-weight: 600; ${emailStyles.primaryText}">${data.currentUsage.toLocaleString()} events</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="${emailStyles.secondaryText}">Plan Limit:</span>
        <span style="font-weight: 600; ${emailStyles.primaryText}">${data.usageLimit.toLocaleString()} events</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <span style="${emailStyles.secondaryText}">Remaining:</span>
        <span style="font-weight: 600; color: ${remaining > 0 ? '#059669' : '#dc2626'};">${remaining.toLocaleString()} events</span>
      </div>
      <div style="background-color: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
        <div style="background-color: ${data.usagePercentage >= 90 ? '#dc2626' : data.usagePercentage >= 75 ? '#f59e0b' : '#10b981'}; height: 100%; width: ${Math.min(100, data.usagePercentage)}%; transition: width 0.3s ease;"></div>
      </div>
      <div style="text-align: center; margin-top: 8px; font-size: 14px; ${emailStyles.secondaryText}">
        ${data.usagePercentage}% used
      </div>
    </div>
  `;
}

export function generateUsageAlertEmailContent(data: UsageAlertEmailData): string {
  const alertLevel = getAlertLevel(data.usagePercentage);
  const alertMessage = getAlertMessage(data.usagePercentage, data.currentUsage, data.usageLimit);

  const content = `
    <h1>Usage Alert for Your Betterlytics Account</h1>
    
    <p>Hi <strong>${escapeHtml(data.userName)}</strong>,</p>
    
    <p>We're writing to inform you about your current usage on the <strong>${escapeHtml(data.planName)}</strong> plan.</p>

    ${createInfoBox(alertMessage, alertLevel)}

    ${
      data.usagePercentage < 100
        ? `
            <div class="content-section">
              <h2>Current Usage Summary</h2>
              ${createUsageSummaryBox(data)}
            </div>
          `
        : ''
    }

    <div class="content-section">
      <h2>Protect Your Analytics Data</h2>
      <p style="${emailStyles.mutedText} line-height: 1.6;">
        To ensure your analytics data remains accessible and prevent any potential data loss, 
        please upgrade to a plan that accommodates your current usage levels.
      </p>
      
      <div class="center" style="margin: 20px 0;">
        ${createEmailButton('Upgrade Your Plan', data.upgradeUrl, 'primary')}
      </div>
      
      <p style="margin-top: 15px; text-align: center;">
        ${createPrimaryLink('View billing options →', data.upgradeUrl)}
      </p>
    </div>

    <p>If you have any questions about your usage or need help choosing the right plan, our support team is here to help at ${createPrimaryLink('support@betterlytics.io', 'mailto:support@betterlytics.io')}.</p>

    <p>Thank you for using Betterlytics!</p>

    ${createEmailSignature()}
  `;

  return content;
}

export function generateUsageAlertEmailText(data: UsageAlertEmailData): string {
  const remaining = Math.max(0, data.usageLimit - data.currentUsage);

  const content = `
Usage Alert for Your Betterlytics Account

Hi ${data.userName},

We're writing to inform you about your current usage on the ${data.planName} plan.

USAGE SUMMARY:
Current Usage: ${data.currentUsage.toLocaleString()} events
Plan Limit: ${data.usageLimit.toLocaleString()} events
Remaining: ${remaining.toLocaleString()} events
Usage: ${data.usagePercentage}%

${
  data.usagePercentage >= 100
    ? `${emailIcons.warning} URGENT: You have exceeded your usage limit. Per our Terms of Service, excess data may be lost if limits are exceeded. Please upgrade immediately to prevent data loss.`
    : data.usagePercentage >= 90
      ? `${emailIcons.alert} CRITICAL: You are very close to your usage limit. Per our Terms of Service, excess data may be lost if limits are exceeded. Consider upgrading to avoid data loss.`
      : `${emailIcons.stats} You are approaching your usage limit. To ensure data continuity, consider upgrading before reaching your limit.`
}

PROTECT YOUR ANALYTICS DATA:
To ensure your analytics data remains accessible and prevent any potential data loss, please upgrade to a plan that accommodates your current usage levels.

UPGRADE YOUR PLAN: ${data.upgradeUrl}

If you have any questions about your usage or need help choosing the right plan, contact us at support@betterlytics.io.

Thank you for using Betterlytics!

${createTextEmailSignature()}`.trim();

  return content;
}

export function createUsageAlertEmailTemplate(data: UsageAlertEmailData) {
  return {
    subject: getSubjectLine(data.usagePercentage, data.planName),
    html: wrapEmailContent(generateUsageAlertEmailContent(data)),
    text: wrapTextEmailContent(generateUsageAlertEmailText(data)),
    cloudOnly: true,
  };
}

export function getUsageAlertEmailPreview(data?: Partial<UsageAlertEmailData>): string {
  const sampleData: UsageAlertEmailData = {
    to: 'user@example.com',
    userName: data?.userName || 'John Doe',
    currentUsage: data?.currentUsage || 7500,
    usageLimit: data?.usageLimit || 10000,
    usagePercentage: data?.usagePercentage || 75,
    planName: data?.planName || 'Starter',
    upgradeUrl: data?.upgradeUrl || 'https://betterlytics.io/billing',
    ...data,
  };

  return createUsageAlertEmailTemplate(sampleData).html;
}
