import type { JobDefinition } from '@/worker/jobs/types';

export const emailReportsJobDefinition = {
  name: 'email-reports',
  schedule: '0 8-20 * * *',
  retryLimit: 3,
  retryBackoff: true,
  expireInSeconds: 3600,
  policy: 'standard',
  deadLetter: undefined,
} as const satisfies JobDefinition;

export const sendEmailJobDefinition = {
  name: 'send-email',
  schedule: undefined,
  retryLimit: 3,
  retryBackoff: true,
  expireInSeconds: 300,
  policy: 'exclusive',
  deadLetter: undefined,
} as const satisfies JobDefinition;

export const usageThresholdScanJobDefinition = {
  name: 'usage-threshold-scan',
  schedule: '0 8-18/2 * * *',
  retryLimit: 3,
  retryBackoff: true,
  expireInSeconds: 600,
  policy: 'standard',
  deadLetter: undefined,
  saasOnly: true,
} as const satisfies JobDefinition;

export const retentionPurgeJobDefinition = {
  name: 'retention-purge',
  schedule: '0 * * * *',
  retryLimit: 2,
  retryBackoff: true,
  expireInSeconds: 600,
  policy: 'exclusive',
  deadLetter: undefined,
} as const satisfies JobDefinition;

export const JOB_DEFINITIONS = [
  emailReportsJobDefinition,
  sendEmailJobDefinition,
  usageThresholdScanJobDefinition,
  retentionPurgeJobDefinition,
] as const;

export type JobName = (typeof JOB_DEFINITIONS)[number]['name'];
