import { getWorkerClickHouseClient } from '@/worker/workerClickhouse';
import type { Job } from '@/worker/jobs/types';
import { replayStorageStatsJobDefinition } from '@/worker/jobs/definitions';
import {
  replayClickHouseOldestSegmentAgeSeconds,
  replayStoredBytes,
  replayStoredSessions,
} from '@/worker/metrics';

const STORAGE_MODES = ['clickhouse', 's3'] as const;

// Every version of a session row shares its date partition, so FINAL never needs to merge across partitions
const STORED_TOTALS_QUERY = `SELECT storage, count() AS sessions, sum(size_bytes) AS bytes
  FROM analytics.session_replays FINAL
  GROUP BY storage
  SETTINGS do_not_merge_across_partitions_select_final = 1`;

// count() and min() of the partition key column are answered from part metadata, not a scan
const OLDEST_SEGMENT_QUERY = `SELECT count() AS segments, toString(min(date)) AS oldest
  FROM analytics.session_replay_segments`;

type StoredTotalsRow = { storage: string; sessions: number; bytes: number };
type OldestSegmentRow = { segments: number; oldest: string };

export function oldestSegmentAgeSeconds(row: OldestSegmentRow | undefined, now: Date): number {
  if (!row || row.segments === 0) return 0;
  const oldestMs = Date.parse(`${row.oldest}T00:00:00Z`);
  return Math.max(0, Math.floor((now.getTime() - oldestMs) / 1000));
}

async function refreshReplayStorageStats(): Promise<void> {
  const client = getWorkerClickHouseClient();
  const [totals, oldest] = await Promise.all([
    client.query(STORED_TOTALS_QUERY).toPromise() as Promise<StoredTotalsRow[]>,
    client.query(OLDEST_SEGMENT_QUERY).toPromise() as Promise<OldestSegmentRow[]>,
  ]);

  for (const storage of STORAGE_MODES) {
    const row = totals.find((r) => r.storage === storage);
    replayStoredBytes.set({ storage }, Number(row?.bytes ?? 0));
    replayStoredSessions.set({ storage }, Number(row?.sessions ?? 0));
  }
  replayClickHouseOldestSegmentAgeSeconds.set(oldestSegmentAgeSeconds(oldest[0], new Date()));
}

export const replayStorageStatsJob: Job = {
  ...replayStorageStatsJobDefinition,
  runOnStart: true,
  handler: refreshReplayStorageStats,
};
