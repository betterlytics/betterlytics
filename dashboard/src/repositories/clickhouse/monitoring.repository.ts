import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import {
  MonitorDailyUptimeSchema,
  MonitorMetricsSchema,
  MonitorResultSchema,
  MonitorStatusSchema,
  MonitorTlsResultSchema,
  MonitorUptimeBucketSchema,
  type MonitorUptimeBucket,
  type MonitorDailyUptime,
  type MonitorMetrics,
  type MonitorResult,
  type MonitorStatus,
  type MonitorTlsResult,
  MonitorIncidentSegmentSchema,
  type MonitorIncidentSegment,
} from '@/entities/analytics/monitoring.entities';
import { toIsoUtc } from '@/utils/dateHelpers';

type UpCountRow = { up_count: number; total_count: number; incident_count: number };
type LastCheckRow = {
  ts: string;
  status: MonitorStatus;
  effective_interval_seconds: number | null;
  backoff_level: number | null;
};
type LatencyRow = { avg_ms: number | null; min_ms: number | null; max_ms: number | null };
type UptimeBucketRow = { bucket: string; up_ratio: number | null };
type LatencySeriesRow = { bucket: string; p50_ms: number | null; p95_ms: number | null; avg_ms: number | null };
type LatestStatusRow = {
  check_id: string;
  status: MonitorStatus;
  effective_interval_seconds: number | null;
  backoff_level: number | null;
};

type LatestIncidentRow = {
  check_id: string;
  state: string;
  severity: string;
  last_status: string | null;
  started_at: string | null;
  last_event_at: string | null;
  resolved_at: string | null;
  failure_count: number | null;
  flap_count: number | null;
  open_reason_code: string | null;
  close_reason_code: string | null;
};

export async function getMonitorMetrics(checkId: string, siteId: string): Promise<MonitorMetrics> {
  const [uptimeRow, lastRow, latencyRow, buckets, latencySeries] = await Promise.all([
    fetchUptime(checkId, siteId),
    fetchLastCheck(checkId, siteId),
    fetchLatency(checkId, siteId),
    fetchUptimeBuckets(checkId, siteId),
    fetchLatencySeries(checkId, siteId),
  ]);

  const uptimePercent = uptimeRow.total_count > 0 ? (uptimeRow.up_count / uptimeRow.total_count) * 100 : null;

  return MonitorMetricsSchema.parse({
    lastCheckAt: lastRow?.ts ? toIsoUtc(lastRow.ts) : null,
    lastStatus: lastRow?.status ?? null,
    uptime24hPercent: uptimePercent,
    incidents24h: uptimeRow.incident_count,
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
    effectiveIntervalSeconds: lastRow?.effective_interval_seconds ?? null,
    backoffLevel: lastRow?.backoff_level ?? null,
  });
}

export async function getRecentMonitorResults(
  checkId: string,
  siteId: string,
  limit = 20,
): Promise<MonitorResult[]> {
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
      tls_not_after,
      tls_days_left
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
    tlsDaysLeft: row.tls_days_left,
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
      tls_not_after,
      tls_days_left
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
      tlsDaysLeft: row.tls_days_left,
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
    WITH sorted AS (
      SELECT
        ts,
        status,
        reason_code,
        lag(status) OVER (ORDER BY ts) AS prev_status,
        lag(reason_code) OVER (ORDER BY ts) AS prev_reason
      FROM analytics.monitor_results
      WHERE check_id = {check_id:String}
        AND kind != 'tls'
        AND site_id = {site_id:String}
        AND ts >= now() - INTERVAL {days:Int32} DAY
    ),
    breaks AS (
      SELECT
        *,
                (
                  prev_status IS NULL
                  OR ((status NOT IN ('ok','warn')) != (prev_status NOT IN ('ok','warn')))
                  OR (status NOT IN ('ok','warn') AND reason_code != prev_reason)
                ) AS is_break
      FROM sorted
    ),
    segmented AS (
      SELECT
        *,
        sum(is_break) OVER (ORDER BY ts) AS segment_id
      FROM breaks
    ),
    failing AS (
      SELECT
        segment_id,
        ts,
        status,
        reason_code
      FROM segmented
      WHERE status NOT IN ('ok','warn')
    ),
    aggregated_fail AS (
      SELECT
        segment_id,
        min(ts) AS start_ts,
        max(ts) AS end_ts,
        argMax(status, ts) AS status,
        argMax(reason_code, ts) AS reason_code,
        count() AS fail_count
      FROM failing
      GROUP BY segment_id
    )
    SELECT
      aggregated_fail.start_ts,
      aggregated_fail.end_ts,
      aggregated_fail.status,
      aggregated_fail.reason_code
    FROM aggregated_fail
    WHERE aggregated_fail.fail_count > 0
    ORDER BY start_ts DESC
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId, days, limit },
    })
    .toPromise()) as any[];

  return rows.map((row) =>
    MonitorIncidentSegmentSchema.parse({
      status: row.status,
      reason: row.reason_code,
      start: toIsoUtc(row.start_ts) ?? row.start_ts,
      end: row.end_ts ? (toIsoUtc(row.end_ts) ?? row.end_ts) : null,
      durationMs: computeDurationMs(row.start_ts, row.end_ts),
    }),
  );
}

export async function getLatestIncidentsForMonitors(
  checkIds: string[],
  siteId: string,
): Promise<
  Record<
    string,
    {
      state: string;
      severity: string;
      lastStatus: string | null;
      startedAt: string | null;
      lastEventAt: string | null;
      resolvedAt: string | null;
      failureCount: number | null;
      flapCount: number | null;
      openReasonCode: string | null;
      closeReasonCode: string | null;
    }
  >
> {
  if (!checkIds.length) return {};

  const query = safeSql`
    SELECT
      check_id,
      state,
      severity,
      last_status,
      started_at,
      last_event_at,
      resolved_at,
      failure_count,
      flap_count,
      reason_code AS open_reason_code,
      NULL AS close_reason_code
    FROM analytics.monitor_incidents FINAL
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
    ORDER BY check_id, last_event_at DESC
    LIMIT 1 BY check_id
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as LatestIncidentRow[];

  return rows.reduce<
    Record<
      string,
      {
        state: string;
        severity: string;
        lastStatus: string | null;
        startedAt: string | null;
        lastEventAt: string | null;
        resolvedAt: string | null;
        failureCount: number | null;
        flapCount: number | null;
        openReasonCode: string | null;
        closeReasonCode: string | null;
      }
    >
  >((acc, row) => {
    acc[row.check_id] = {
      state: row.state,
      severity: row.severity,
      lastStatus: row.last_status,
      startedAt: toIsoUtc(row.started_at) ?? row.started_at,
      lastEventAt: toIsoUtc(row.last_event_at) ?? row.last_event_at,
      resolvedAt: toIsoUtc(row.resolved_at) ?? row.resolved_at,
      failureCount: row.failure_count,
      flapCount: row.flap_count,
      openReasonCode: row.open_reason_code,
      closeReasonCode: row.close_reason_code,
    };
    return acc;
  }, {});
}

export async function getLatestStatusesForMonitors(
  checkIds: string[],
  siteId: string,
): Promise<
  Record<string, { status: MonitorStatus; effectiveIntervalSeconds: number | null; backoffLevel: number | null }>
> {
  if (!checkIds.length) return {};

  const query = safeSql`
    SELECT
      check_id,
      argMax(status, ts) AS status,
      argMax(effective_interval_seconds, ts) AS effective_interval_seconds,
      argMax(backoff_level, ts) AS backoff_level
    FROM analytics.monitor_results
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
      AND kind != 'tls'
    GROUP BY check_id
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as LatestStatusRow[];

  return rows.reduce<
    Record<string, { status: MonitorStatus; effectiveIntervalSeconds: number | null; backoffLevel: number | null }>
  >((acc, row) => {
    acc[row.check_id] = {
      status: MonitorStatusSchema.parse(row.status),
      effectiveIntervalSeconds: row.effective_interval_seconds ?? null,
      backoffLevel: row.backoff_level ?? null,
    };
    return acc;
  }, {});
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

function computeDurationMs(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const startIso = toIsoUtc(start) ?? start;
  const endIso = toIsoUtc(end) ?? end;
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Number.isFinite(diff) && diff >= 0 ? diff : null;
}

async function fetchUptime(checkId: string, siteId: string): Promise<UpCountRow> {
  const query = safeSql`
    SELECT
      sum(status IN ('ok', 'warn')) AS up_count,
      count() AS total_count,
      sum(status IN ('down', 'error')) AS incident_count
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

  return row ?? { up_count: 0, total_count: 0, incident_count: 0 };
}

async function fetchLastCheck(checkId: string, siteId: string): Promise<LastCheckRow | null> {
  const query = safeSql`
    SELECT ts, status, effective_interval_seconds, backoff_level
    FROM analytics.monitor_results
    WHERE check_id = {check_id:String}
      AND kind != 'tls'
      AND site_id = {site_id:String}
    ORDER BY ts DESC
    LIMIT 1
  `;

  const [row] = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId },
    })
    .toPromise()) as any[];

  return row ?? null;
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
      toString(toStartOfInterval(ts, INTERVAL 15 MINUTE)) AS bucket,
      quantile(0.5)(latency_ms) AS p50_ms,
      quantile(0.95)(latency_ms) AS p95_ms,
      avg(latency_ms) AS avg_ms
    FROM analytics.monitor_results
    WHERE check_id = {check_id:String}
      AND kind != 'tls'
      AND site_id = {site_id:String}
      AND ts >= now() - INTERVAL 24 HOUR
      AND latency_ms IS NOT NULL
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
