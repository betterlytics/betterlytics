import { getWorkerClickHouseClient } from '@/worker/workerClickhouse';
import type { Job } from '@/worker/jobs/types';
import { telemetryRetentionJobDefinition } from '@/worker/jobs/definitions';

const DELETE_INACTIVE_INSTANCES = `DELETE FROM analytics.telemetry_instances
  WHERE instance_id IN (
    SELECT instance_id FROM analytics.telemetry_instances
    GROUP BY instance_id
    HAVING max(last_seen) < now() - INTERVAL 365 DAY
  )`;

export const telemetryRetentionJob: Job = {
  ...telemetryRetentionJobDefinition,
  runOnStart: false,
  handler: async () => {
    await getWorkerClickHouseClient().command(DELETE_INACTIVE_INSTANCES);
    console.info({ job: 'telemetry-retention', phase: 'done' });
  },
};
