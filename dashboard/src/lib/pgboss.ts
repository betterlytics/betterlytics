'server-only';

import { PgBoss } from 'pg-boss';
import { SEND_EMAIL_JOB_NAME } from '@/services/email/email-types';

type BossGlobal = { _bossInstance?: Promise<PgBoss> };
const globalForBoss = globalThis as unknown as BossGlobal;

async function createBossInstance(): Promise<PgBoss> {
  const boss = new PgBoss(process.env.POSTGRES_URL!);
  boss.on('error', (err: Error) => console.error({ event: 'pg-boss:error', err }));
  await boss.start();
  await boss.createQueue(SEND_EMAIL_JOB_NAME);
  return boss;
}

export function getBoss(): Promise<PgBoss> {
  if (!globalForBoss._bossInstance) {
    globalForBoss._bossInstance = createBossInstance();
  }
  return globalForBoss._bossInstance;
}
