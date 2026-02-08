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
import { env } from '@/lib/env';

export interface WelcomeEmailData extends EmailData {
  userName: string;
}

export function generateWelcomeEmailContent(data: WelcomeEmailData): string {
  const content = `
    <h1>Welcome to Betterlytics!</h1>
    
    <p>Hi <strong>${escapeHtml(data.userName)}</strong>,</p>
    
    <p>Thank you for joining Betterlytics! We're excited to help you gain powerful insights into your website's performance with our privacy-focused analytics platform.</p>

    <div class="center" style="margin: 30px 0;">
      ${createEmailButton('Go to Dashboard', `${env.PUBLIC_BASE_URL}/dashboards`, 'primary')}
    </div>

    ${createInfoBox(
      `
      <h3 style="${emailStyles.infoHeading}">
        Next Steps
      </h3>
      ${createStepsOrdered([
        'Log in to your dashboard using the button above',
        'Create a new dashboard and add your website',
        'Get your tracking script from your new dashboard',
        'Install the tracking code on your website',
        'Start receiving real-time analytics data!',
      ])}
    `,
      'info',
    )}

    <div class="content-section">
      <h2>Resources to Get You Started</h2>
      
      <p>Check out these helpful resources:</p>
      ${createResourceList([
        {
          text: 'Installation Guide',
          url: 'https://betterlytics.io/docs/installation',
          description: 'Step-by-step setup instructions',
        },
        {
          text: 'Dashboard Features',
          url: 'https://betterlytics.io/docs/dashboard',
          description: 'Learn about all available features',
        },
        {
          text: 'Contact Support',
          url: 'mailto:support@betterlytics.io',
          description: "We're here to help you succeed",
        },
      ])}
    </div>

    <p>If you have any questions or need assistance getting started, don't hesitate to reach out to our support team. We're here to help you make the most of your analytics data!</p>

    <p>Welcome aboard!</p>

    ${createEmailSignature()}
  `;

  return content;
}

export function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const content = `
Welcome to Betterlytics!

Hi ${data.userName},

Thank you for joining Betterlytics! We're excited to help you gain powerful insights into your website's performance with our privacy-focused analytics platform.

Your Analytics Journey Starts Here

Next Steps:
1. Log in to your dashboard: ${env.PUBLIC_BASE_URL}/dashboards
2. Add your website and get your tracking script
3. Install the tracking code on your website
4. Start receiving real-time analytics data!

Resources to Get You Started:
• Installation Guide: https://betterlytics.io/docs/installation
• Dashboard Features: https://betterlytics.io/docs/dashboard-features
• Contact Support: support@betterlytics.io

If you have any questions or need assistance getting started, don't hesitate to reach out to our support team. We're here to help you make the most of your analytics data!

Welcome aboard!

${createTextEmailSignature()}`.trim();

  return content;
}

function createStepsOrdered(steps: string[]): string {
  const listItems = steps
    .map(
      (step) => `
    <li style="${emailStyles.listItem}">${escapeHtml(step)}</li>
  `,
    )
    .join('');

  return `<ol style="${emailStyles.orderedList}">${listItems}</ol>`;
}

export function createResourceList(resources: Array<{ text: string; url: string; description?: string }>): string {
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

export function createWelcomeEmailTemplate(data: WelcomeEmailData) {
  return {
    subject: `Welcome to Betterlytics, ${escapeHtml(data.userName)}!`,
    html: wrapEmailContent(generateWelcomeEmailContent(data)),
    text: wrapTextEmailContent(generateWelcomeEmailText(data)),
  };
}

export function getWelcomeEmailPreview(data?: Partial<WelcomeEmailData>): string {
  const sampleData: WelcomeEmailData = {
    to: 'user@example.com',
    userName: data?.userName || 'John Doe',
    ...data,
  };

  return createWelcomeEmailTemplate(sampleData).html;
}
