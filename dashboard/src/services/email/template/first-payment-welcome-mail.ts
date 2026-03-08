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

export interface FirstPaymentWelcomeEmailData extends EmailData {
  userName: string;
  planName: string;
  monthlyEventLimit: string;
  dashboardUrl: string;
  billingAmount: string;
  newFeatures: {
    title: string;
    description: string;
  }[];
}

export function generateFirstPaymentWelcomeEmailContent(data: FirstPaymentWelcomeEmailData): string {
  const content = `
    <h1>Welcome to the ${escapeHtml(data.planName)} plan!</h1>
    
    <p>Hi <strong>${escapeHtml(data.userName)}</strong>,</p>
    
    <p>Thank you for upgrading to Betterlytics ${escapeHtml(data.planName)}! Your payment has been processed successfully, and all premium features are now active on your account.</p>

    ${createInfoBox(
      `
      <h3 style="${emailStyles.successHeading} margin: 0 0 15px 0;">
        Your Account is Now Upgraded
      </h3>
      <div style="${emailStyles.mutedText}">
        <div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span><strong>Plan:</strong></span>
          <span>${escapeHtml(data.planName)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span><strong>Monthly Events:</strong></span>
          <span>${escapeHtml(data.monthlyEventLimit)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;">
          <span><strong>Billing:</strong></span>
          <span>${escapeHtml(data.billingAmount)}</span>
        </div>
      </div>
    `,
      'success',
    )}

    <div class="center" style="margin: 30px 0;">
      ${createEmailButton('Access Your Dashboard', data.dashboardUrl, 'primary')}
    </div>

    <div class="content-section">
      <h2>What's New for You</h2>
      <div style="margin: 20px 0;">
        ${createNumberedFeaturesList(data.newFeatures)}
      </div>
    </div>

    <div class="content-section">
      <h2>Need Help?</h2>
      <p style="${emailStyles.mutedText}">
        Our team is here to help you make the most of your analytics. Check out our documentation or reach out directly:
      </p>
      <div style="margin: 15px 0;">
        <p style="margin: 8px 0;">
          ${createPrimaryLink('Documentation', 'https://betterlytics.io/docs')}
        </p>
        <p style="margin: 8px 0;">
          ${createPrimaryLink('Support', 'mailto:support@betterlytics.io')}
        </p>
      </div>
    </div>

    <p>We're excited to see how the ${escapeHtml(data.planName)} plan helps you gain better insights into your website performance!</p>

    <p>Welcome to the team!</p>

    ${createEmailSignature()}
  `;

  return content;
}

export function generateFirstPaymentWelcomeEmailText(data: FirstPaymentWelcomeEmailData): string {
  const newFeatures = data.newFeatures.map(
    (feature) => `
    ${feature.title}
    ${feature.description}
  `,
  );

  const content = `
Welcome to ${data.planName}!

Hi ${data.userName},

Thank you for upgrading to Betterlytics ${data.planName}! Your payment has been processed successfully, and all premium features are now active on your account.

YOUR ACCOUNT UPGRADE:
Plan: ${data.planName}
Monthly Events: ${data.monthlyEventLimit}
Billing: ${data.billingAmount}

Access Your Dashboard: ${data.dashboardUrl}

WHAT'S NEW FOR YOU:

${newFeatures.join('\n')}

NEED HELP?
Our team is here to help you make the most of your analytics:

Documentation: https://betterlytics.io/docs
Support: support@betterlytics.io

We're excited to see how the ${data.planName} plan helps you gain better insights into your website performance!

Welcome to the team!

${createTextEmailSignature()}`.trim();

  return content;
}

function createNumberedFeaturesList(features: { title: string; description: string }[]): string {
  return features
    .map(
      (feature, index) => `
        <div style="display: flex; align-items: flex-start; margin: 15px 0;">
          <div style="background-color: #2563eb; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; font-size: 12px; flex-shrink: 0;">${index + 1}</div>
          <div>
            <h4 style="margin: 0 0 5px 0; ${emailStyles.primaryText} font-size: 16px;">${escapeHtml(feature.title)}</h4>
            <p style="margin: 0; ${emailStyles.secondaryText} font-size: 14px;">${escapeHtml(feature.description)}</p>
          </div>
        </div>
      `,
    )
    .join('');
}

export function createFirstPaymentWelcomeEmailTemplate(data: FirstPaymentWelcomeEmailData) {
  return {
    subject: `Welcome to the ${escapeHtml(data.planName)} plan! Your premium features are now active`,
    html: wrapEmailContent(generateFirstPaymentWelcomeEmailContent(data)),
    text: wrapTextEmailContent(generateFirstPaymentWelcomeEmailText(data)),
    cloudOnly: true,
  };
}

export function getFirstPaymentWelcomeEmailPreview(data?: Partial<FirstPaymentWelcomeEmailData>): string {
  const sampleData: FirstPaymentWelcomeEmailData = {
    to: 'user@example.com',
    userName: data?.userName || 'John Doe',
    planName: data?.planName || 'Pro',
    monthlyEventLimit: data?.monthlyEventLimit || '100K',
    dashboardUrl: data?.dashboardUrl || 'https://betterlytics.io/dashboards',
    billingAmount: data?.billingAmount || '$19/month',
    newFeatures: data?.newFeatures || [
      {
        title: 'Higher Event Limits',
        description: `Track up to ${data?.monthlyEventLimit} events per month with no data loss concerns.`,
      },
      {
        title: 'Longer Data Retention',
        description: `Your data will be retained for 3+ years, giving you more time to analyze, compare and gain insights over time.`,
      },
      {
        title: 'Up to 50 sites',
        description: `Track up to 50 websites with your ${data?.planName} plan.`,
      },
    ],
    ...data,
  };

  return createFirstPaymentWelcomeEmailTemplate(sampleData).html;
}
