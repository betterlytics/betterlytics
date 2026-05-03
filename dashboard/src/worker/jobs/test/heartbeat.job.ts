import type { Job } from '@/worker/jobs/types';
import { heartbeatJobDefinition } from '@/worker/jobs/definitions';

export const heartbeatJob: Job = {
  ...heartbeatJobDefinition,
  runOnStart: true,
  handler: async () => {
    console.info({ job: 'heartbeat', ts: new Date().toISOString() });
  },
};
