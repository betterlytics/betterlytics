import { Counter, Gauge, Histogram, collectDefaultMetrics, register } from 'prom-client';
import { workerEnv } from '@/lib/env/worker.env';

if (workerEnv.ENABLE_MONITORING) {
  collectDefaultMetrics({ register });
}

export const jobRunsTotal = new Counter({
  name: 'worker_job_runs_total',
  help: 'Total number of worker job executions',
  labelNames: ['job_name', 'status'] as const,
});

export const jobDurationSeconds = new Histogram({
  name: 'worker_job_duration_seconds',
  help: 'Duration of worker job executions in seconds',
  labelNames: ['job_name', 'status'] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
});

export const jobLastRunTimestamp = new Gauge({
  name: 'worker_job_last_run_timestamp_seconds',
  help: 'Unix timestamp of the most recent job run',
  labelNames: ['job_name', 'status'] as const,
});

export const jobsInFlight = new Gauge({
  name: 'worker_jobs_in_flight',
  help: 'Number of job executions currently in progress',
  labelNames: ['job_name'] as const,
});

export const emailSendsTotal = new Counter({
  name: 'email_sends_total',
  help: 'Email send attempts by template type and outcome',
  labelNames: ['type', 'status'] as const,
});

export const replayStoredBytes = new Gauge({
  name: 'replay_stored_bytes',
  help: 'Replay bytes held by stored sessions, per storage, as counted at upload',
  labelNames: ['storage'] as const,
});

export const replayStoredSessions = new Gauge({
  name: 'replay_stored_sessions',
  help: 'Stored replay sessions per storage',
  labelNames: ['storage'] as const,
});

export const replayClickHouseOldestSegmentAgeSeconds = new Gauge({
  name: 'replay_clickhouse_oldest_segment_age_seconds',
  help: 'Age in seconds of the oldest replay segment date stored in ClickHouse (0 when none are stored)',
});

export { register };
