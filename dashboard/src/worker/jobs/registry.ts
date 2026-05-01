import type { Job } from '@/worker/jobs/types';
import { heartbeatJob } from '@/worker/jobs/test/heartbeat.job';

export const JOB_REGISTRY: Job[] = [heartbeatJob];
