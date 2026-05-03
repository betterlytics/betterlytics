'server-only';

import type { PgBoss } from 'pg-boss';
import { createBoss, registerJobs } from '@/worker/runtime';
import { workerEnv } from '@/worker/workerEnv';

const globalForBoss = global as unknown as { boss?: PgBoss };

export async function startEmbeddedWorker(): Promise<void> {
  if (!workerEnv.BACKGROUND_JOBS_ENABLED) {
    console.info('BACKGROUND_JOBS_ENABLED=false, skipping embedded worker');
    return;
  }

  if (globalForBoss.boss) {
    console.info('Embedded worker already running, skipping');
    return;
  }

  const boss = createBoss();
  globalForBoss.boss = boss;

  await boss.start();
  await registerJobs(boss);
}
