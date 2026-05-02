import type { Job } from '@/worker/jobs/types';
import { heartbeatJob } from '@/worker/jobs/test/heartbeat.job';
import { emailReportsJob } from '@/worker/jobs/reports/email-reports.job';
import { sendEmailJob } from '@/worker/jobs/email/send-email.job';

export const JOB_REGISTRY: Job<any>[] = [heartbeatJob, emailReportsJob, sendEmailJob];
