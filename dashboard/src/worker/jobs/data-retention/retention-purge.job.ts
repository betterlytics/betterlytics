import { findRetentionPurgeCandidates } from '@/repositories/postgres/dashboardSettings.repository';
import type { RetentionPurgeCandidate } from '@/entities/dashboard/dashboardSettings.entities';
import { getWorkerClickHouseClient } from '@/worker/workerClickhouse';
import type { Job } from '@/worker/jobs/types';
import { retentionPurgeJobDefinition } from '@/worker/jobs/definitions';
import { MIN_DATA_RETENTION_DAYS } from '@/lib/billing/capabilities';

const DAY_MS = 24 * 60 * 60 * 1000;

const RETENTION_DELETE_STATEMENTS = [
  {
    table: 'analytics.events',
    query: `DELETE FROM analytics.events
      WHERE site_id IN {siteIds:Array(String)}
      AND session_created_at < toDateTime({cutoff:UInt32})`,
  },
  {
    table: 'analytics.sessions',
    query: `DELETE FROM analytics.sessions
      WHERE site_id IN {siteIds:Array(String)}
      AND session_created_at < toDateTime({cutoff:UInt32})`,
  },
  {
    table: 'analytics.overview_hourly',
    query: `DELETE FROM analytics.overview_hourly
      WHERE site_id IN {siteIds:Array(String)}
      AND hour < toStartOfHour(toDateTime({cutoff:UInt32}))`,
  },
  {
    table: 'analytics.geo_hourly',
    query: `DELETE FROM analytics.geo_hourly
      WHERE site_id IN {siteIds:Array(String)}
      AND hour < toStartOfHour(toDateTime({cutoff:UInt32}))`,
  },
] as const;

type RetentionPurgeTarget = {
  siteId: string;
  effectiveRetentionDays: number;
  graceActive: boolean;
};

function resolveRetentionPurgeTarget(candidate: RetentionPurgeCandidate, now: Date): RetentionPurgeTarget | null {
  if (candidate.dataRetentionDays <= 0) return null;

  const nowMs = now.getTime();
  const graceActive =
    candidate.retentionGraceUntil != null &&
    candidate.retentionGraceUntil.getTime() > nowMs &&
    candidate.retentionGraceRestoreDays != null &&
    candidate.retentionGraceRestoreDays > candidate.dataRetentionDays;

  const effectiveRetentionDays = graceActive ? candidate.retentionGraceRestoreDays! : candidate.dataRetentionDays;
  const retentionCutoff = nowMs - effectiveRetentionDays * DAY_MS;

  if (candidate.createdAt.getTime() > retentionCutoff) return null;

  return {
    siteId: candidate.siteId,
    effectiveRetentionDays,
    graceActive,
  };
}

function groupByRetentionDays(targets: RetentionPurgeTarget[]): Map<number, string[]> {
  const buckets = new Map<number, string[]>();
  for (const target of targets) {
    const list = buckets.get(target.effectiveRetentionDays);
    if (list) {
      list.push(target.siteId);
    } else {
      buckets.set(target.effectiveRetentionDays, [target.siteId]);
    }
  }
  return buckets;
}

async function runRetentionPurge(): Promise<void> {
  const now = new Date();
  const oldestPotentiallyExpiredCreatedAt = new Date(now.getTime() - MIN_DATA_RETENTION_DAYS * DAY_MS);
  const candidates = await findRetentionPurgeCandidates(oldestPotentiallyExpiredCreatedAt);
  const targets = candidates.flatMap((candidate) => {
    const target = resolveRetentionPurgeTarget(candidate, now);
    return target ? [target] : [];
  });
  const buckets = groupByRetentionDays(targets);

  console.info({
    job: 'retention-purge',
    phase: 'start',
    candidateCount: candidates.length,
    siteCount: targets.length,
    bucketCount: buckets.size,
  });

  const client = getWorkerClickHouseClient();
  const failures: Array<{ table: string; retentionDays: number; siteCount: number }> = [];

  for (const [retentionDays, siteIds] of buckets) {
    const cutoffSeconds = Math.floor((now.getTime() - retentionDays * DAY_MS) / 1000);
    for (const statement of RETENTION_DELETE_STATEMENTS) {
      try {
        await client.command(statement.query, { params: { siteIds, cutoff: cutoffSeconds } });
      } catch (err) {
        failures.push({ table: statement.table, retentionDays, siteCount: siteIds.length });
        console.error({
          job: 'retention-purge',
          table: statement.table,
          retentionDays,
          siteCount: siteIds.length,
          cutoff: new Date(cutoffSeconds * 1000).toISOString(),
          success: false,
          err,
        });
      }
    }
  }

  console.info({
    job: 'retention-purge',
    phase: 'done',
    siteCount: targets.length,
    bucketCount: buckets.size,
    failureCount: failures.length,
    failures,
  });

  if (failures.length > 0) {
    throw new Error(
      `retention-purge: ${failures.length} (table, retention) delete(s) failed across ${buckets.size} bucket(s)`,
    );
  }
}

export const retentionPurgeJob: Job = {
  ...retentionPurgeJobDefinition,
  runOnStart: false,
  handler: runRetentionPurge,
};
