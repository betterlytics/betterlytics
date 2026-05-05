import type { Job } from '@/worker/jobs/types';
import { emailReportsJob } from '@/worker/jobs/reports/email-reports.job';

export const JOB_REGISTRY: Job[] = [emailReportsJob];
