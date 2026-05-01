import { findRetentionPurgeTargets } from '@/repositories/postgres/dashboardSettings.repository';
import type { RetentionPurgeTarget } from '@/entities/dashboard/dashboardSettings.entities';
import { getWorkerClickHouseClient } from '@/worker/workerClickhouse';
import type { Job } from '@/worker/jobs/types';

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1_000;

async function purgeSite(target: RetentionPurgeTarget): Promise<void> {
  const client = getWorkerClickHouseClient();
  const cutoff = new Date(Date.now() - target.effectiveRetentionDays * 24 * 60 * 60 * 1000);
  const cutoffSeconds = Math.floor(cutoff.getTime() / 1000);

  const startedAt = Date.now();
  try {
    await client.command(
      `DELETE FROM analytics.events
        WHERE site_id = {siteId:String}
        AND timestamp < toDateTime({cutoff:UInt32})`,
      { params: { siteId: target.siteId, cutoff: cutoffSeconds } },
    );
    console.info({
      job: 'retention-purge',
      siteId: target.siteId,
      retentionDays: target.effectiveRetentionDays,
      graceActive: target.graceActive,
      cutoff: cutoff.toISOString(),
      success: true,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error({
      job: 'retention-purge',
      siteId: target.siteId,
      retentionDays: target.effectiveRetentionDays,
      graceActive: target.graceActive,
      cutoff: cutoff.toISOString(),
      success: false,
      err,
      durationMs: Date.now() - startedAt,
    });
    throw err;
  }
}

async function runRetentionPurge(): Promise<void> {
  const targets = await findRetentionPurgeTargets();
  console.info({
    job: 'retention-purge',
    phase: 'start',
    siteCount: targets.length,
  });

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(purgeSite));
    for (const r of results) {
      if (r.status === 'fulfilled') succeeded++;
      else failed++;
    }

    if (i + BATCH_SIZE < targets.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.info({
    job: 'retention-purge',
    phase: 'done',
    siteCount: targets.length,
    succeeded,
    failed,
  });

  if (failed > 0) {
    throw new Error(`retention-purge: ${failed}/${targets.length} sites failed`);
  }
}

export const retentionPurgeJob: Job = {
  name: 'retention-purge',
  schedule: '0 2 * * 6',
  runOnStart: false,
  retryLimit: 2,
  retryBackoff: true,
  expireInSeconds: 3_600,
  handler: runRetentionPurge,
};
