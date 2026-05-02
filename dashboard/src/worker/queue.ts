'server-only';

import type { PgBoss } from 'pg-boss';
import { getBoss } from '@/lib/pgboss';
import { JOB_DEFINITIONS, type JobName } from '@/worker/jobs/definitions';

type SendOptions = Parameters<PgBoss['send']>[2];
type CreateQueueOptions = NonNullable<Parameters<PgBoss['createQueue']>[1]>;
type QueueGlobal = { _jobQueuesSync?: Promise<void> };

const globalForQueue = globalThis as unknown as QueueGlobal;

async function syncJobQueues(boss: PgBoss): Promise<void> {
  console.info(`Syncing ${JOB_DEFINITIONS.length} job queues.`);

  for (const job of JOB_DEFINITIONS) {
    const queueOptions: CreateQueueOptions = {
      retryLimit: job.retryLimit,
      retryBackoff: job.retryBackoff,
      expireInSeconds: job.expireInSeconds,
    };

    if ('deadLetter' in job && typeof job.deadLetter === 'string') {
      queueOptions.deadLetter = job.deadLetter;
    }

    await boss.createQueue(job.name, queueOptions);
  }
}

export async function syncJobQueuesOnce(boss?: PgBoss): Promise<void> {
  if (!globalForQueue._jobQueuesSync) {
    globalForQueue._jobQueuesSync = (async () => {
      const resolvedBoss = boss ?? (await getBoss());
      await syncJobQueues(resolvedBoss);
    })().catch((err) => {
      globalForQueue._jobQueuesSync = undefined;
      throw err;
    });
  }

  await globalForQueue._jobQueuesSync;
}

export async function enqueueJob<TData extends object = object>(
  jobName: JobName,
  payload?: TData,
  options?: SendOptions,
): Promise<string | null> {
  const boss = await getBoss();
  await syncJobQueuesOnce(boss);
  return boss.send(jobName, payload, options);
}
