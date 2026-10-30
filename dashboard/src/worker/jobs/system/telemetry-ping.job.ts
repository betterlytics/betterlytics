import type { Job } from '@/worker/jobs/types';
import { telemetryPingJobDefinition } from '@/worker/jobs/definitions';
import { sendTelemetryPingIfDue } from '@/services/system/telemetry.service';

let lastLoggedOutcome: string | undefined;

export const telemetryPingJob: Job = {
  ...telemetryPingJobDefinition,
  runOnStart: true,
  handler: async () => {
    const result = await sendTelemetryPingIfDue();
    if (
      result.outcome === 'skipped_policy' ||
      result.outcome === 'skipped_recent' ||
      result.outcome === 'skipped_first_day'
    )
      return;
    // Failures log only when the outcome changes, so an air-gapped host doesn't log every hour
    if (result.outcome !== 'delivered' && result.outcome === lastLoggedOutcome) return;
    lastLoggedOutcome = result.outcome;
    console.info({ job: 'telemetry-ping', ...result });
  },
};
