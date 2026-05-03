import type { PgBoss } from 'pg-boss';
import type { Job } from '@/worker/jobs/types';
import { syncJobQueuesOnce } from '@/worker/queue';
import { JOB_REGISTRY } from '@/worker/jobs/registry';
import { jobDurationSeconds, jobLastRunTimestamp, jobRunsTotal, jobsInFlight } from '@/worker/metrics';

type RuntimeGlobal = { _workerRegistration?: Promise<void> };
type RuntimeJob = Job<unknown>;
const globalForWorkerRuntime = globalThis as unknown as RuntimeGlobal;

async function syncJobSchedules(boss: PgBoss): Promise<void> {
  for (const job of JOB_REGISTRY) {
    if (job.schedule) {
      await boss.schedule(job.name, job.schedule, null);
    }
  }
}

async function registerWorkers(boss: PgBoss): Promise<void> {
  console.info(`Registering ${JOB_REGISTRY.length} jobs.`);

  for (const job of JOB_REGISTRY) {
    const runtimeJob = job as RuntimeJob;

    await boss.work(runtimeJob.name, async ([j]) => {
      const startedAt = Date.now();
      const endTimer = jobDurationSeconds.startTimer({ job_name: runtimeJob.name });
      jobsInFlight.inc({ job_name: runtimeJob.name });
      try {
        await runtimeJob.handler(j.data);
        jobRunsTotal.inc({ job_name: runtimeJob.name, status: 'success' });
        endTimer({ status: 'success' });
        jobLastRunTimestamp.set({ job_name: runtimeJob.name, status: 'success' }, Date.now() / 1000);
        console.info({ job: runtimeJob.name, jobId: j.id, success: true, durationMs: Date.now() - startedAt });
      } catch (err) {
        jobRunsTotal.inc({ job_name: runtimeJob.name, status: 'failure' });
        endTimer({ status: 'failure' });
        jobLastRunTimestamp.set({ job_name: runtimeJob.name, status: 'failure' }, Date.now() / 1000);
        console.error({ job: runtimeJob.name, jobId: j.id, success: false, err, durationMs: Date.now() - startedAt });
        throw err;
      } finally {
        jobsInFlight.dec({ job_name: runtimeJob.name });
      }
    });

    if (runtimeJob.runOnStart) {
      await boss.send(runtimeJob.name);
    }

    const tags = [runtimeJob.schedule ? runtimeJob.schedule : 'triggered', runtimeJob.runOnStart ? 'run-on-start' : null].filter(Boolean);
    console.info(`Registered ${runtimeJob.name} (${tags.join(', ')})`);
  }
}

export async function registerWorkersOnce(boss: PgBoss): Promise<void> {
  if (!globalForWorkerRuntime._workerRegistration) {
    globalForWorkerRuntime._workerRegistration = (async () => {
      await syncJobQueuesOnce(boss);
      await syncJobSchedules(boss);
      await registerWorkers(boss);
    })().catch((err) => {
      globalForWorkerRuntime._workerRegistration = undefined;
      throw err;
    });
  }

  await globalForWorkerRuntime._workerRegistration;
}
