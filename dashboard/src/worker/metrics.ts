import { Counter, Gauge, Histogram, collectDefaultMetrics, register } from 'prom-client';
import { workerEnv } from '@/worker/workerEnv';

if (workerEnv.ENABLE_MONITORING) {
  collectDefaultMetrics({ register });
}

export const jobRunsTotal = new Counter({
  name: 'worker_job_runs_total',
  help: 'Total number of worker job executions',
  labelNames: ['job', 'status'] as const,
});

export const jobDurationSeconds = new Histogram({
  name: 'worker_job_duration_seconds',
  help: 'Duration of worker job executions in seconds',
  labelNames: ['job', 'status'] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
});

export const jobLastRunTimestamp = new Gauge({
  name: 'worker_job_last_run_timestamp_seconds',
  help: 'Unix timestamp of the most recent job run',
  labelNames: ['job', 'status'] as const,
});

export const jobsInFlight = new Gauge({
  name: 'worker_jobs_in_flight',
  help: 'Number of job executions currently in progress',
  labelNames: ['job'] as const,
});

export { register };
