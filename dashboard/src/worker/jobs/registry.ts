import { emailReportsJob } from '@/worker/jobs/reports/email-reports.job';
import { sendEmailJob } from '@/worker/jobs/email/send-email.job';

export const JOB_REGISTRY = [emailReportsJob, sendEmailJob];
