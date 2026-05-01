import type { Job } from '@/worker/jobs/types';

export const heartbeatJob: Job = {
  name: 'heartbeat',
  schedule: '* * * * *',
  runOnStart: true,
  retryLimit: 0,
  retryBackoff: false,
  expireInSeconds: 30,
  handler: async () => {
    console.info({ job: 'heartbeat', ts: new Date().toISOString() });
  },
};
