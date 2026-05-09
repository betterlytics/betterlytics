'server-only';

import { getBoss } from '@/lib/pgboss';
import { workerEnv } from '@/lib/env/worker.env';
import { registerWorkersOnce } from '@/worker/runtime';

export async function startEmbeddedWorker(): Promise<void> {
  if (!workerEnv.BACKGROUND_JOBS_ENABLED) {
    console.info('BACKGROUND_JOBS_ENABLED=false, skipping embedded worker');
    return;
  }

  const boss = await getBoss();
  await registerWorkersOnce(boss);
}
