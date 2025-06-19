'use server';

import { EmailTemplateType } from '@/constants/emailTemplateConst';
import {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendUsageAlertEmail,
  sendFirstPaymentWelcomeEmail,
} from '@/services/email/mail.service';
import { getWelcomeEmailPreview } from '@/services/email/template/welcome-mail';
import { getResetPasswordEmailPreview } from '@/services/email/template/reset-password-mail';
import { getUsageAlertEmailPreview } from '@/services/email/template/usage-alert-mail';
import { getFirstPaymentWelcomeEmailPreview } from '@/services/email/template/first-payment-welcome-mail';

export async function sendTestEmail(email: string, template: EmailTemplateType) {
  try {
    switch (template) {
      case 'welcome':
        await sendWelcomeEmail({ to: email, userName: 'Test User' });
        break;
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
      default:
        throw new Error('Invalid template');
    }
  } catch (error) {
    console.error('Error sending test welcome email:', error);
    throw error;
  }
}

export async function getEmailPreview(template: EmailTemplateType): Promise<string> {
  try {
    switch (template) {
      case 'welcome':
        return getWelcomeEmailPreview();
      case 'reset-password':
        return getResetPasswordEmailPreview();
      case 'usage-alert':
        return getUsageAlertEmailPreview();
      case 'first-payment-welcome':
        return getFirstPaymentWelcomeEmailPreview();
      default:
        return '<p>Template not found.</p>';
    }
  } catch (error) {
    console.error('Error generating email preview:', error);
    return '<p>Failed to generate email preview.</p>';
  }
}
