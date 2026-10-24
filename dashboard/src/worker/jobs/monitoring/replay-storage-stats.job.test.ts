import { beforeEach, describe, expect, it, vi } from 'vitest';
import { register } from 'prom-client';

const runQuery = vi.hoisted(() => vi.fn<(sql: string) => Promise<unknown[]>>());
vi.mock('@/worker/workerClickhouse', () => ({
  getWorkerClickHouseClient: () => ({ query: (sql: string) => ({ toPromise: () => runQuery(sql) }) }),
}));
vi.mock('@/lib/env/worker.env', () => ({ workerEnv: { ENABLE_MONITORING: false } }));

const { oldestSegmentAgeSeconds, replayStorageStatsJob } = await import('./replay-storage-stats.job');

const DAY_S = 24 * 60 * 60;

async function gaugeValues(name: string) {
  const metric = register.getSingleMetric(name);
  return (await metric!.get()).values;
}

describe('replay-storage-stats', () => {
  beforeEach(() => {
    runQuery.mockReset();
  });

  it('measures the oldest segment from the start of its UTC date', () => {
    const now = new Date('2026-03-11T12:00:00Z');
    expect(oldestSegmentAgeSeconds({ segments: 3, oldest: '2026-03-01' }, now)).toBe(10 * DAY_S + 12 * 60 * 60);
    expect(oldestSegmentAgeSeconds({ segments: 0, oldest: '1970-01-01' }, now)).toBe(0);
    expect(oldestSegmentAgeSeconds(undefined, now)).toBe(0);
  });

  it('sets both storage modes, zeroing one without stored sessions', async () => {
    runQuery.mockImplementation(async (sql) =>
      sql.includes('session_replays FINAL')
        ? [{ storage: 'clickhouse', sessions: 4, bytes: 1200 }]
        : [{ segments: 0, oldest: '1970-01-01' }],
    );
    await replayStorageStatsJob.handler(undefined);

    const bytes = await gaugeValues('replay_stored_bytes');
    expect(bytes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ labels: { storage: 'clickhouse' }, value: 1200 }),
        expect.objectContaining({ labels: { storage: 's3' }, value: 0 }),
      ]),
    );
    const sessions = await gaugeValues('replay_stored_sessions');
    expect(sessions).toEqual(
      expect.arrayContaining([expect.objectContaining({ labels: { storage: 'clickhouse' }, value: 4 })]),
    );
    const [age] = await gaugeValues('replay_clickhouse_oldest_segment_age_seconds');
    expect(age.value).toBe(0);
  });
});
