'use server';

import { EmailTemplateType } from '@/constants/emailTemplateConst';
import {
  sendResetPasswordEmail,
  sendUsageAlertEmail,
  sendFirstPaymentWelcomeEmail,
  sendReportEmail,
} from '@/services/email/mail.service';
import { getResetPasswordEmailPreview } from '@/services/email/template/reset-password-mail';
import { getUsageAlertEmailPreview } from '@/services/email/template/usage-alert-mail';
import { getFirstPaymentWelcomeEmailPreview } from '@/services/email/template/first-payment-welcome-mail';
import { getReportEmailPreview } from '@/services/email/template/weekly-report-mail';

export async function sendTestEmail(email: string, template: EmailTemplateType) {
  try {
    switch (template) {
      case 'reset-password':
        await sendResetPasswordEmail({
          to: email,
          userName: 'Test User',
          resetUrl: 'https://betterlytics.io/reset-password?token=test-token-123',
          expirationTime: '30 minutes',
        });
        break;
      case 'usage-alert':
        await sendUsageAlertEmail({
          to: email,
          userName: 'Test User',
          currentUsage: 9500,
          usageLimit: 10000,
          usagePercentage: 95,
          planName: 'Starter',
          upgradeUrl: 'https://betterlytics.io/billing',
        });
        break;
      case 'first-payment-welcome':
        await sendFirstPaymentWelcomeEmail({
          to: email,
          userName: 'Test User',
          planName: 'Pro',
          monthlyEventLimit: '100K',
          dashboardUrl: 'https://betterlytics.io/dashboards',
          billingAmount: '$19/month',
          newFeatures: [{ title: 'Test-Feature', description: 'Test-Feature' }],
        });
        break;
      case 'weekly-report':
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        await sendReportEmail({
          to: email,
          toName: 'Test User',
          dashboardUrl: 'https://betterlytics.io/dashboard/example',
          reportData: {
            dashboardId: 'example',
            siteId: 'example',
            domain: 'example.com',
            periodType: 'weekly',
            period: { start: weekAgo, end: now },
            comparisonPeriod: { start: twoWeeksAgo, end: weekAgo },
            metrics: {
              visitors: 1234,
              visitorChange: 12,
              pageViews: 5678,
              pageViewChange: -5,
              sessions: 987,
              sessionChange: 8,
              bounceRate: 42,
              avgVisitDuration: 185,
            },
            topPages: [
              { path: '/', pageviews: 1500 },
              { path: '/about', pageviews: 890 },
              { path: '/products', pageviews: 654 },
              { path: '/blog/getting-started', pageviews: 432 },
              { path: '/contact', pageviews: 321 },
            ],
            topSources: [
              { source: 'Google', visits: 456 },
              { source: 'Twitter', visits: 234 },
              { source: 'Direct', visits: 189 },
              { source: 'LinkedIn', visits: 145 },
              { source: 'GitHub', visits: 98 },
            ],
          },
        });
        break;
      default:
        throw new Error('Invalid template');
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
}

export async function getEmailPreview(template: EmailTemplateType): Promise<string> {
  try {
    switch (template) {
      case 'reset-password':
        return getResetPasswordEmailPreview();
      case 'usage-alert':
        return getUsageAlertEmailPreview();
      case 'first-payment-welcome':
        return getFirstPaymentWelcomeEmailPreview();
      case 'weekly-report':
        return getReportEmailPreview();
      default:
        return '<p>Template not found.</p>';
    }
  } catch (error) {
    console.error('Error generating email preview:', error);
    return '<p>Failed to generate email preview.</p>';
  }
}
