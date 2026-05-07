import type { JobDefinition } from '@/worker/jobs/types';

export const emailReportsJobDefinition = {
  name: 'email-reports',
  schedule: '0 8 * * *',
  retryLimit: 3,
  retryBackoff: true,
  expireInSeconds: 3600,
} as const satisfies JobDefinition;

export const sendEmailJobDefinition = {
  name: 'send-email',
  retryLimit: 3,
  retryBackoff: true,
  expireInSeconds: 300,
} as const satisfies JobDefinition;

export const JOB_DEFINITIONS = [emailReportsJobDefinition, sendEmailJobDefinition] as const;

export type JobName = (typeof JOB_DEFINITIONS)[number]['name'];
