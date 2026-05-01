import type { Job } from '@/worker/jobs/types';
import { heartbeatJob } from '@/worker/jobs/test/heartbeat.job';
import { retentionPurgeJob } from '@/worker/jobs/data-retention/retention-purge.job';

export const JOB_REGISTRY: Job[] = [heartbeatJob, retentionPurgeJob];
