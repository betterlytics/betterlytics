import { emailReportsJob } from '@/worker/jobs/reports/email-reports.job';
import { sendEmailJob } from '@/worker/jobs/email/send-email.job';
import { usageThresholdScanJob } from '@/worker/jobs/billing/usage-threshold-scan.job';
import { subscriptionEndingScanJob } from '@/worker/jobs/billing/subscription-ending-scan.job';
import { onboardingEmailsJob } from '@/worker/jobs/onboarding/onboarding-emails.job';
import { retentionPurgeJob } from './data-retention/retention-purge.job';

export const JOB_REGISTRY = [
  emailReportsJob,
  sendEmailJob,
  usageThresholdScanJob,
  subscriptionEndingScanJob,
  retentionPurgeJob,
  onboardingEmailsJob,
];
