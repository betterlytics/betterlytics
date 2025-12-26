import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import {
  MonitorDailyUptimeSchema,
  RawMonitorMetricsSchema,
  MonitorResultSchema,
  MonitorTlsResultSchema,
  MonitorUptimeBucketSchema,
  LatestCheckInfoSchema,
  type MonitorUptimeBucket,
  type MonitorDailyUptime,
  type RawMonitorMetrics,
  type MonitorResult,
  type MonitorTlsResult,
  type LatestCheckInfo,
  MonitorIncidentSegmentSchema,
  type MonitorIncidentSegment,
} from '@/entities/analytics/monitoring.entities';
import { toIsoUtc } from '@/utils/dateHelpers';

type LatencyRow = { avg_ms: number | null; min_ms: number | null; max_ms: number | null };
type UptimeBucketRow = { bucket: string; up_ratio: number | null };
type LatencySeriesRow = { bucket: string; p50_ms: number | null; p95_ms: number | null; avg_ms: number | null };

export async function getMonitorMetrics(checkId: string, siteId: string): Promise<RawMonitorMetrics> {
  const [uptimeRow, lastCheckInfo, latencyRow, buckets, latencySeries, incidentCount] = await Promise.all([
    fetchUptime(checkId, siteId),
    getLatestCheckInfoForMonitors([checkId], siteId).then((r) => r[checkId] ?? null),
    fetchLatency(checkId, siteId),
    fetchUptimeBuckets(checkId, siteId),
    fetchLatencySeries(checkId, siteId),
    fetchIncidentCount(checkId, siteId),
  ]);

  const uptimePercent = uptimeRow.total_count > 0 ? (uptimeRow.up_count / uptimeRow.total_count) * 100 : null;

  return RawMonitorMetricsSchema.parse({
    lastCheckAt: lastCheckInfo?.ts ? toIsoUtc(lastCheckInfo.ts) : null,
    lastStatus: lastCheckInfo?.status ?? null,
    uptime24hPercent: uptimePercent,
    incidents24h: incidentCount,
    uptimeBuckets: buckets.map((b) => ({
      bucket: toIsoUtc(b.bucket) ?? b.bucket,
      upRatio: b.up_ratio,
    })),
    latency: {
      avgMs: latencyRow.avg_ms,
      minMs: latencyRow.min_ms,
      maxMs: latencyRow.max_ms,
    },
    latencySeries: latencySeries.map((point) => ({
      bucket: toIsoUtc(point.bucket) ?? point.bucket,
      p50Ms: point.p50_ms,
      p95Ms: point.p95_ms,
      avgMs: point.avg_ms,
    })),
    effectiveIntervalSeconds: lastCheckInfo?.effectiveIntervalSeconds ?? null,
    backoffLevel: lastCheckInfo?.backoffLevel ?? null,
  });
}

export async function getRecentMonitorResults(
  checkId: string,
  siteId: string,
  limit = 20,
  nonOkOnly = false,
): Promise<MonitorResult[]> {
  const statusCondition = nonOkOnly ? safeSql`status != 'ok'` : safeSql`1=1`;
  const query = safeSql`
    SELECT
      toString(ts) AS ts,
      status,
      latency_ms,
      status_code,
      reason_code
    FROM analytics.monitor_results
    WHERE check_id = {check_id:String}
      AND kind != 'tls'
      AND site_id = {site_id:String}
      AND ${statusCondition}
    ORDER BY ts DESC
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId, limit },
    })
    .toPromise()) as any[];

  return rows.map((row) =>
    MonitorResultSchema.parse({
      ts: toIsoUtc(row.ts) ?? row.ts,
      status: row.status,
      latencyMs: row.latency_ms,
      statusCode: row.status_code,
      reasonCode: row.reason_code,
    }),
  );
}

export async function getLatestTlsResult(checkId: string, siteId: string): Promise<MonitorTlsResult | null> {
  const query = safeSql`
    SELECT
      toString(ts) AS ts,
      status,
      reason_code,
      tls_not_after
    FROM analytics.monitor_results
    WHERE check_id = {check_id:String}
      AND kind = 'tls'
      AND site_id = {site_id:String}
    ORDER BY ts DESC
    LIMIT 1
  `;

  const [row] = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId },
    })
    .toPromise()) as any[];

  if (!row) return null;

  return MonitorTlsResultSchema.parse({
    ts: toIsoUtc(row.ts) ?? row.ts,
    status: row.status,
    reasonCode: row.reason_code,
    tlsNotAfter: toIsoUtc(row.tls_not_after),
  });
}

export async function getLatestTlsResultsForMonitors(
  checkIds: string[],
  siteId: string,
): Promise<Record<string, MonitorTlsResult | null>> {
  if (!checkIds.length) return {};

  const query = safeSql`
    SELECT
      check_id,
      toString(ts) AS ts,
      status,
      reason_code,
      tls_not_after
    FROM analytics.monitor_results
    WHERE check_id IN {check_ids:Array(String)}
      AND kind = 'tls'
      AND site_id = {site_id:String}
    ORDER BY check_id, ts DESC
    LIMIT 1 BY check_id
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as any[];

  return rows.reduce<Record<string, MonitorTlsResult>>((acc, row) => {
    acc[row.check_id] = MonitorTlsResultSchema.parse({
      ts: toIsoUtc(row.ts) ?? row.ts,
      status: row.status,
      reasonCode: row.reason_code,
      tlsNotAfter: toIsoUtc(row.tls_not_after),
    });
    return acc;
  }, {});
}

export async function getMonitorDailyUptime(
  checkId: string,
  siteId: string,
  days = 180,
): Promise<MonitorDailyUptime[]> {
  const safeDays = Math.max(1, Math.min(days, 366));
  const query = safeSql`
    SELECT
      toString(toStartOfDay(ts)) AS day,
      avg(status IN ('ok', 'warn')) AS up_ratio
    FROM analytics.monitor_results
    WHERE check_id = {check_id:String}
      AND kind != 'tls'
      AND site_id = {site_id:String}
      AND ts >= now() - INTERVAL {days:Int32} DAY
    GROUP BY day
    ORDER BY day ASC
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId, days: safeDays },
    })
    .toPromise()) as any[];

  return rows.map((row) =>
    MonitorDailyUptimeSchema.parse({
      date: toIsoUtc(row.day) ?? row.day,
      upRatio: row.up_ratio,
    }),
  );
}

export async function getMonitorIncidentSegments(
  checkId: string,
  siteId: string,
  days = 7,
  limit = 5,
): Promise<MonitorIncidentSegment[]> {
  const query = safeSql`
    SELECT
      last_status,
      reason_code,
      started_at,
      resolved_at,
      last_event_at
    FROM analytics.monitor_incidents FINAL
    WHERE check_id = {check_id:String}
      AND site_id = {site_id:String}
      AND started_at >= now() - INTERVAL {days:Int32} DAY
    ORDER BY started_at DESC
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId, days, limit },
    })
    .toPromise()) as any[];

  return rows.map((row) =>
    MonitorIncidentSegmentSchema.parse({
      status: row.last_status,
      reason: row.reason_code,
      start: toIsoUtc(row.started_at) ?? row.started_at,
      end: row.resolved_at ? (toIsoUtc(row.resolved_at) ?? row.resolved_at) : null,
      durationMs: computeDurationMs(row.started_at, row.resolved_at ?? row.last_event_at),
    }),
  );
}

export async function getOpenIncidentsForMonitors(checkIds: string[], siteId: string): Promise<Set<string>> {
  if (!checkIds.length) return new Set();

  const query = safeSql`
    SELECT DISTINCT check_id
    FROM analytics.monitor_incidents FINAL
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
      AND state = 'open'
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as { check_id: string }[];

  return new Set(rows.map((row) => row.check_id));
}

/**
 * Returns the set of monitor IDs that have at least one result recorded
 */
export async function getMonitorsWithResults(checkIds: string[], siteId: string): Promise<Set<string>> {
  if (!checkIds.length) return new Set();

  const query = safeSql`
    SELECT check_id
    FROM analytics.monitor_results
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
    LIMIT 1 BY check_id
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as { check_id: string }[];

  return new Set(rows.map((row) => row.check_id));
}

export async function getMonitorUptimeBucketsForMonitors(
  checkIds: string[],
  siteId: string,
): Promise<Record<string, MonitorUptimeBucket[]>> {
  if (!checkIds.length) return {};

  const query = safeSql`
    SELECT
      check_id,
      toString(toStartOfInterval(ts, INTERVAL 1 HOUR)) AS bucket,
      avg(status IN ('ok', 'warn')) AS up_ratio
    FROM analytics.monitor_results
    WHERE check_id IN ({check_ids:Array(String)})
      AND kind != 'tls'
      AND site_id = {site_id:String}
      AND ts >= now() - INTERVAL 24 HOUR
    GROUP BY check_id, bucket
    ORDER BY check_id ASC, bucket ASC
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as any[];

  return rows.reduce<Record<string, MonitorUptimeBucket[]>>((acc, row) => {
    const bucketsForCheck = acc[row.check_id] ?? [];
    bucketsForCheck.push(
      MonitorUptimeBucketSchema.parse({
        bucket: toIsoUtc(row.bucket),
        upRatio: row.up_ratio,
      }),
    );
    acc[row.check_id] = bucketsForCheck;
    return acc;
  }, {});
}

export async function getLatestCheckInfoForMonitors(
  checkIds: string[],
  siteId: string,
): Promise<Record<string, LatestCheckInfo>> {
  if (!checkIds.length) return {};

  const query = safeSql`
    SELECT
      check_id,
      toString(ts) AS ts,
      status,
      effective_interval_seconds,
      backoff_level
    FROM analytics.monitor_results
    WHERE check_id IN {check_ids:Array(String)}
      AND kind != 'tls'
      AND site_id = {site_id:String}
    ORDER BY check_id, ts DESC
    LIMIT 1 BY check_id
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as any[];

  return rows.reduce<Record<string, LatestCheckInfo>>((acc, row) => {
    acc[row.check_id] = LatestCheckInfoSchema.parse({
      ts: toIsoUtc(row.ts) ?? null,
      status: row.status ?? null,
      effectiveIntervalSeconds: row.effective_interval_seconds ?? null,
      backoffLevel: row.backoff_level ?? null,
    });
    return acc;
  }, {});
}

function computeDurationMs(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const startIso = toIsoUtc(start) ?? start;
  const endIso = toIsoUtc(end) ?? end;
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Number.isFinite(diff) && diff >= 0 ? diff : null;
}

async function fetchUptime(checkId: string, siteId: string): Promise<{ up_count: number; total_count: number }> {
  const query = safeSql`
    SELECT
      sum(status IN ('ok', 'warn')) AS up_count,
      count() AS total_count
    FROM analytics.monitor_results
    WHERE check_id = {check_id:String}
      AND kind != 'tls'
      AND site_id = {site_id:String}
      AND ts >= now() - INTERVAL 24 HOUR
  `;

  const [row] = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId },
    })
    .toPromise()) as any[];

  return row ?? { up_count: 0, total_count: 0 };
}

async function fetchLatency(checkId: string, siteId: string): Promise<LatencyRow> {
  const query = safeSql`
    SELECT
      avg(latency_ms) AS avg_ms,
      min(latency_ms) AS min_ms,
      max(latency_ms) AS max_ms
    FROM analytics.monitor_results
    WHERE check_id = {check_id:String}
      AND kind != 'tls'
      AND site_id = {site_id:String}
      AND ts >= now() - INTERVAL 24 HOUR
      AND latency_ms IS NOT NULL
  `;

  const [row] = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId },
    })
    .toPromise()) as any[];

  return row ?? { avg_ms: null, min_ms: null, max_ms: null };
}

async function fetchUptimeBuckets(checkId: string, siteId: string): Promise<UptimeBucketRow[]> {
  const query = safeSql`
    SELECT
      toString(toStartOfInterval(ts, INTERVAL 1 HOUR)) AS bucket,
      avg(status IN ('ok', 'warn')) AS up_ratio
    FROM analytics.monitor_results
    WHERE check_id = {check_id:String}
      AND kind != 'tls'
      AND site_id = {site_id:String}
      AND ts >= now() - INTERVAL 24 HOUR
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId },
    })
    .toPromise()) as any[];

  return rows;
}

async function fetchLatencySeries(checkId: string, siteId: string): Promise<LatencySeriesRow[]> {
  const query = safeSql`
    SELECT
      toStartOfFifteenMinutes(ts) AS bucket,
      quantile(0.5)(latency_ms) AS p50_ms,
      quantile(0.95)(latency_ms) AS p95_ms,
      avg(latency_ms) AS avg_ms
    FROM analytics.monitor_results
    WHERE check_id = {check_id:String}
      AND kind != 'tls'
      AND site_id = {site_id:String}
      AND ts >= toStartOfFifteenMinutes(now() - INTERVAL 24 HOUR)
      AND latency_ms IS NOT NULL
    GROUP BY bucket
    ORDER BY bucket ASC WITH FILL FROM toStartOfFifteenMinutes(addSeconds(now(), 1) - INTERVAL 24 HOUR) TO now() STEP INTERVAL 15 MINUTE
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId },
    })
    .toPromise()) as any[];

  return rows;
}

async function fetchIncidentCount(checkId: string, siteId: string): Promise<number> {
  const query = safeSql`
    SELECT count() AS count
    FROM analytics.monitor_incidents FINAL
    WHERE check_id = {check_id:String}
      AND site_id = {site_id:String}
      AND started_at >= now() - INTERVAL 24 HOUR
  `;

  const [row] = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId },
    })
    .toPromise()) as any[];

  return row?.count ?? 0;
}
