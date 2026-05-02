'server-only';

import { getBoss } from '@/lib/pgboss';
import { registerJobs } from '@/worker/runtime';
import { workerEnv } from '@/worker/workerEnv';

export async function startEmbeddedWorker(): Promise<void> {
  if (!workerEnv.BACKGROUND_JOBS_ENABLED) {
    console.info('BACKGROUND_JOBS_ENABLED=false, skipping embedded worker');
    return;
  }

  const boss = await getBoss();
  await registerJobs(boss);
}
