'server-only';

import { PgBoss } from 'pg-boss';

type BossGlobal = { _bossInstance?: Promise<PgBoss> };
const globalForBoss = globalThis as unknown as BossGlobal;

async function createBossInstance(): Promise<PgBoss> {
  // Schema migrations run in the initializer (scripts/migrate_pgboss.js).
  const boss = new PgBoss({ connectionString: process.env.POSTGRES_URL!, migrate: false });
  boss.on('error', (err: Error) => console.error({ event: 'pg-boss:error', err }));
  boss.on('warning', (warning) => console.warn({ event: 'pg-boss:warning', warning }));
  await boss.start();
  return boss;
}

export function getBoss(): Promise<PgBoss> {
  if (!globalForBoss._bossInstance) {
    globalForBoss._bossInstance = createBossInstance().catch((err) => {
      globalForBoss._bossInstance = undefined;
      throw err;
    });
  }
  return globalForBoss._bossInstance;
}
