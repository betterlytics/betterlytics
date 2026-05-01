import { PgBoss } from 'pg-boss';
import { JOB_REGISTRY } from '@/worker/jobs/registry';
import { jobDurationSeconds, jobLastRunTimestamp, jobRunsTotal, jobsInFlight } from '@/worker/metrics';
import { workerEnv } from '@/worker/workerEnv';

export function createBoss(): PgBoss {
  const boss = new PgBoss(workerEnv.POSTGRES_URL);
  boss.on('error', (err) => console.error({ event: 'pg-boss:error', err }));
  boss.on('warning', (warning) => console.warn({ event: 'pg-boss:warning', warning }));
  return boss;
}

export async function registerJobs(boss: PgBoss): Promise<void> {
  console.info(`Registering ${JOB_REGISTRY.length} jobs.`);

  for (const job of JOB_REGISTRY) {
    await boss.createQueue(job.name, {
      ...(job.deadLetter ? { deadLetter: job.deadLetter } : {}),
      retryLimit: job.retryLimit,
      retryBackoff: job.retryBackoff,
      expireInSeconds: job.expireInSeconds,
    });

    if (job.schedule) {
      await boss.schedule(job.name, job.schedule, null);
    }

    await boss.work(job.name, async ([j]) => {
      const startedAt = Date.now();
      const endTimer = jobDurationSeconds.startTimer({ job_name: job.name });
      jobsInFlight.inc({ job_name: job.name });
      try {
        await job.handler(j.data);
        jobRunsTotal.inc({ job_name: job.name, status: 'success' });
        endTimer({ status: 'success' });
        jobLastRunTimestamp.set({ job_name: job.name, status: 'success' }, Date.now() / 1000);
        console.info({ job: job.name, jobId: j.id, success: true, durationMs: Date.now() - startedAt });
      } catch (err) {
        jobRunsTotal.inc({ job_name: job.name, status: 'failure' });
        endTimer({ status: 'failure' });
        jobLastRunTimestamp.set({ job_name: job.name, status: 'failure' }, Date.now() / 1000);
        console.error({ job: job.name, jobId: j.id, success: false, err, durationMs: Date.now() - startedAt });
        throw err;
      } finally {
        jobsInFlight.dec({ job_name: job.name });
      }
    });

    if (job.runOnStart) {
      await boss.send(job.name);
    }

    const tags = [job.schedule ? job.schedule : 'triggered', job.runOnStart ? 'run-on-start' : null].filter(Boolean);
    console.info(`✓ ${job.name} (${tags.join(', ')})`);
  }
}
