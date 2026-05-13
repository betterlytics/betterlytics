'use server';

import { notFound } from 'next/navigation';
import { requireAuth } from '@/auth/auth-actions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { enqueueEmail } from '@/services/email/email.service';
import type { EmailType, SendEmailPayload } from '@/services/email/email-types';
import { getResetPasswordEmailPreview } from '@/services/email/template/reset-password-mail';
import { getUsageAlertEmailPreview } from '@/services/email/template/usage-alert-mail';
import { getFirstPaymentWelcomeEmailPreview } from '@/services/email/template/first-payment-welcome-mail';
import { getEmailVerificationPreview } from '@/services/email/template/email-verification-mail';
import { getInvitationEmailPreview } from '@/services/email/template/invitation-mail';
import { getReportEmailPreview } from '@/services/email/template/weekly-report-mail';

async function requireEmailPreviewAccess(): Promise<string> {
  if (!isFeatureEnabled('enableEmailPreview')) {
    notFound();
  }
  const session = await requireAuth();
  return session.user.id;
}

type DataFor<T extends EmailType> = Extract<SendEmailPayload, { type: T }>['data'];

function buildTestPayload<T extends EmailType>(
  type: T,
  data: DataFor<T>,
  userId: string,
): Extract<SendEmailPayload, { type: T }> {
  return {
    type,
    recipientKey: `test:${userId}`,
    campaignKey: `test:${type}:${Date.now()}`,
    data,
  } as Extract<SendEmailPayload, { type: T }>;
}

export async function sendTestEmail(email: string, template: EmailType) {
  const userId = await requireEmailPreviewAccess();

  try {
    switch (template) {
      case 'reset-password':
        await enqueueEmail(buildTestPayload('reset-password', {
          to: email,
          userName: 'Test User',
          resetUrl: 'https://betterlytics.io/reset-password?token=test-token-123',
          expirationTime: '30 minutes',
        }, userId));
        break;
      case 'email-verification':
        await enqueueEmail(buildTestPayload('email-verification', {
          to: email,
          userName: 'Test User',
          verificationToken: 'test-token-123',
          verificationUrl: 'https://betterlytics.io/verify-email?token=test-token-123',
        }, userId));
        break;
      case 'dashboard-invitation':
        await enqueueEmail(buildTestPayload('dashboard-invitation', {
          to: email,
          inviterName: 'Test User',
          dashboardName: 'example.com',
          role: 'editor',
          inviteToken: 'test-token-123',
          userExists: false,
        }, userId));
        break;
      case 'usage-alert':
        await enqueueEmail(buildTestPayload('usage-alert', {
          to: email,
          userName: 'Test User',
          currentUsage: 9500,
          usageLimit: 10000,
          usagePercentage: 95,
          planName: 'Starter',
          upgradeUrl: 'https://betterlytics.io/billing',
        }, userId));
        break;
      case 'first-payment-welcome':
        await enqueueEmail(buildTestPayload('first-payment-welcome', {
          to: email,
          userName: 'Test User',
          planName: 'Pro',
          monthlyEventLimit: '100K',
          dashboardUrl: 'https://betterlytics.io/dashboards',
          billingAmount: '$19/month',
          newFeatures: [{ title: 'Test-Feature', description: 'Test-Feature' }],
        }, userId));
        break;
      case 'report': {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        await enqueueEmail(buildTestPayload('report', {
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
        }, userId));
        break;
      }
      default: {
        const _exhaustive: never = template;
        throw new Error(`Invalid template: ${_exhaustive}`);
      }
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
}

export async function getEmailPreview(template: EmailType): Promise<string> {
  await requireEmailPreviewAccess();

  try {
    switch (template) {
      case 'reset-password':
        return getResetPasswordEmailPreview();
      case 'email-verification':
        return getEmailVerificationPreview();
      case 'dashboard-invitation':
        return getInvitationEmailPreview();
      case 'usage-alert':
        return getUsageAlertEmailPreview();
      case 'first-payment-welcome':
        return getFirstPaymentWelcomeEmailPreview();
      case 'report':
        return getReportEmailPreview();
      default: {
        const _exhaustive: never = template;
        return `<p>Template not found: ${_exhaustive}</p>`;
      }
    }
  } catch (error) {
    console.error('Error generating email preview:', error);
    return '<p>Failed to generate email preview.</p>';
  }
}
