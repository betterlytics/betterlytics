import type { Job } from '@/worker/jobs/types';
import { emailReportsJob } from '@/worker/jobs/reports/email-reports.job';
import { sendEmailJob } from '@/worker/jobs/email/send-email.job';

export const JOB_REGISTRY: Job<any>[] = [emailReportsJob, sendEmailJob];
