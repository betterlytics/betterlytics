import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { toDateTimeString } from '@/utils/dateFormatters';
import {
  MonitorDailyUptimeSchema,
  MonitorResultSchema,
  MonitorTlsResultSchema,
  MonitorUptimeBucketSchema,
  MonitorLatencyStatsSchema,
  MonitorLatencyPointSchema,
  UptimeStatsSchema,
  LatestCheckInfoSchema,
  type UptimeStats,
  type MonitorUptimeBucket,
  type MonitorDailyUptime,
  type MonitorResult,
  type MonitorTlsResult,
  type LatestCheckInfo,
  type MonitorLatencyStats,
  type MonitorLatencyPoint,
  MonitorIncidentSegmentSchema,
  type MonitorIncidentSegment,
} from '@/entities/analytics/monitoring.entities';
import { toIsoUtc } from '@/utils/dateHelpers';

// Unified uptime bucket calculation supporting hour or day granularity
export async function getMonitorUptimeBuckets(
  checkId: string,
  siteId: string,
  createdAt: Date,
  timezone: string,
  rangeStart: string,
  rangeEnd: string,
  buckets: number,
  granularity: 'day' | 'hour',
): Promise<MonitorUptimeBucket[]> {
  const createdAtStr = toDateTimeString(createdAt);

  // Granularity-specific SQL fragments
  const interval = granularity === 'day' ? safeSql`DAY` : safeSql`HOUR`;
  const granularityStr = granularity === 'day' ? safeSql`'day'` : safeSql`'hour'`;
  const toStartOfInterval = (name: ReturnType<typeof safeSql>) =>
    granularity === 'day'
      ? safeSql`toStartOfDay(${name}, {timezone:String})`
      : safeSql`toStartOfHour(${name}, {timezone:String})`;

  // For day granularity, use timezone; for hour, no timezone needed
  const toStartOfStartedAt = toStartOfInterval(safeSql`started_at`);
  const toStartOfRange = toStartOfInterval(SQL.DateTime({ rangeStart }));
  const toStartOfTS = toStartOfInterval(safeSql`ts`);

  // Used for calculating bucket end in seconds
  const bucketSizeSeconds = safeSql`least(dateDiff('second', bucket_start, bucket_start + INTERVAL 1 ${interval}), abs(dateDiff('second', bucket_start, now())))`;

  const query = safeSql`
    WITH incident_buckets AS (
      SELECT
        started_at,
        coalesce(resolved_at, now() + INTERVAL 1 ${interval}) AS effective_resolved_at,
        arrayJoin(
          arrayMap(
            i -> ${toStartOfStartedAt} + INTERVAL i ${interval},
            range(
              0,
              toUInt32(dateDiff(${granularityStr}, ${toStartOfStartedAt}, coalesce(resolved_at, now() + INTERVAL 1 ${interval}))) + 1
            )
          )
        ) AS bucket_key
      FROM analytics.monitor_incidents FINAL
      WHERE check_id = {check_id:String}
        AND site_id = {site_id:String}
        AND kind != 'tls'
        AND started_at < ${SQL.DateTime({ rangeEnd })}
        AND (resolved_at IS NULL OR resolved_at > ${SQL.DateTime({ rangeStart })})
    ),
    monitor_presence AS (
      SELECT
        ${toStartOfTS} AS mp_bucket_start,
        1 AS has_data
      FROM analytics.monitor_results
      WHERE check_id = {check_id:String}
        AND site_id = {site_id:String}
        AND kind != 'tls'
        AND ts >= ${SQL.DateTime({ rangeStart })}
        AND ts < ${SQL.DateTime({ rangeEnd })}
      GROUP BY mp_bucket_start
    )
    SELECT
      bucket_start AS date,
      IF(
        mp.has_data = 0,
        NULL,
        IF(
          ${SQL.DateTime({ createdAt: createdAtStr })} >= bucket_start + INTERVAL 1 ${interval},
          NULL,
          ${bucketSizeSeconds} - sum(
            greatest(
              0,
              dateDiff(
                'second',
                greatest(ib.started_at, bucket_start),
                least(ib.effective_resolved_at, bucket_start + INTERVAL 1 ${interval}, now())
              )
            )
          )
        )
      ) AS uptime_seconds,
      ${bucketSizeSeconds} AS total_seconds
    FROM (
      SELECT arrayJoin(
        arrayMap(
          i -> ${toStartOfRange} + INTERVAL i ${interval},
          range(0, {buckets:UInt32})
        )
      ) AS bucket_start
    ) AS buckets
    LEFT JOIN incident_buckets ib ON ib.bucket_key = buckets.bucket_start
    LEFT JOIN monitor_presence mp ON mp.mp_bucket_start = buckets.bucket_start
    GROUP BY bucket_start, mp.has_data
    ORDER BY bucket_start
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId, timezone, buckets },
    })
    .toPromise()) as any[];

  return rows.map((row) =>
    MonitorUptimeBucketSchema.parse({
      bucket: toIsoUtc(row.date) ?? row.date,
      upRatio: row.uptime_seconds != null ? row.uptime_seconds / row.total_seconds : null,
    }),
  );
}

// Convenience wrapper for 24h hourly buckets
export async function getUptimeBuckets24h(
  checkId: string,
  siteId: string,
  createdAt: Date,
  rangeStart: string,
  rangeEnd: string,
): Promise<MonitorUptimeBucket[]> {
  return getMonitorUptimeBuckets(checkId, siteId, createdAt, 'UTC', rangeStart, rangeEnd, 24, 'hour');
}

// Convenience wrapper for daily uptime buckets
export async function getMonitorDailyUptime(
  checkId: string,
  siteId: string,
  createdAt: Date,
  timezone: string,
  rangeStart: string,
  rangeEnd: string,
  days: number,
): Promise<MonitorDailyUptime[]> {
  const buckets = await getMonitorUptimeBuckets(
    checkId,
    siteId,
    createdAt,
    timezone,
    rangeStart,
    rangeEnd,
    days,
    'day',
  );

  return buckets
    .filter((b) => b.upRatio != null)
    .map((b) =>
      MonitorDailyUptimeSchema.parse({
        date: b.bucket,
        upRatio: b.upRatio,
      }),
    );
}

// Get uptime stats for 24h period using array expansion
export async function getUptime24h(
  checkId: string,
  siteId: string,
  createdAt: Date,
  rangeStart: string,
  rangeEnd: string,
): Promise<UptimeStats> {
  const createdAtStr = toDateTimeString(createdAt);

  const query = safeSql`
    SELECT
      greatest(0, dateDiff(
        'second',
        greatest(${SQL.DateTime({ createdAt: createdAtStr })}, ${SQL.DateTime({ rangeStart })}),
        least(now(), ${SQL.DateTime({ rangeEnd })})
      )) AS total_seconds,
      sum(
        greatest(
          0,
          dateDiff(
            'second',
            greatest(started_at, ${SQL.DateTime({ rangeStart })}),
            least(coalesce(resolved_at, now()), ${SQL.DateTime({ rangeEnd })})
          )
        )
      ) AS downtime_seconds
    FROM analytics.monitor_incidents FINAL
    WHERE check_id = {check_id:String}
      AND site_id = {site_id:String}
      AND kind != 'tls'
      AND started_at < ${SQL.DateTime({ rangeEnd })}
      AND (resolved_at IS NULL OR resolved_at > ${SQL.DateTime({ rangeStart })})
  `;

  const [row] = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId },
    })
    .toPromise()) as any[];

  const totalSeconds = row?.total_seconds ?? 0;
  const downtimeSeconds = row?.downtime_seconds ?? 0;
  const uptimeSeconds = Math.max(0, totalSeconds - downtimeSeconds);

  return UptimeStatsSchema.parse({
    uptimeSeconds,
    totalSeconds,
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

export async function getMonitorIncidentSegments(
  checkId: string,
  siteId: string,
  days = 7,
  limit = 5,
): Promise<MonitorIncidentSegment[]> {
  const query = safeSql`
    SELECT
      state,
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
      state: row.state,
      reason: row.reason_code,
      start: toIsoUtc(row.started_at) ?? row.started_at,
      end: row.resolved_at ? (toIsoUtc(row.resolved_at) ?? row.resolved_at) : null,
      durationMs:
        row.started_at && (row.resolved_at || row.last_event_at)
          ? new Date(row.resolved_at ?? row.last_event_at).getTime() - new Date(row.started_at).getTime()
          : null,
    }),
  );
}

export async function getOpenIncidentsForMonitors(
  checkIds: string[],
  siteId: string,
): Promise<Map<string, { startedAt: string }>> {
  if (!checkIds.length) return new Map();

  const query = safeSql`
    SELECT check_id, toString(started_at) AS started_at
    FROM analytics.monitor_incidents FINAL
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
      AND state = 'ongoing'
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as { check_id: string; started_at: string }[];

  return new Map(rows.map((row) => [row.check_id, { startedAt: toIsoUtc(row.started_at) ?? row.started_at }]));
}

export async function getLastResolvedIncidentForMonitors(
  checkIds: string[],
  siteId: string,
): Promise<Map<string, { resolvedAt: string }>> {
  if (!checkIds.length) return new Map();

  const query = safeSql`
    SELECT check_id, toString(resolved_at) AS resolved_at
    FROM analytics.monitor_incidents FINAL
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
      AND state = 'resolved'
    ORDER BY check_id, resolved_at DESC
    LIMIT 1 BY check_id
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as { check_id: string; resolved_at: string }[];

  return new Map(rows.map((row) => [row.check_id, { resolvedAt: toIsoUtc(row.resolved_at) ?? row.resolved_at }]));
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

export async function getLatency24h(checkId: string, siteId: string): Promise<MonitorLatencyStats> {
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

  return MonitorLatencyStatsSchema.parse({
    avgMs: row?.avg_ms ?? null,
    minMs: row?.min_ms ?? null,
    maxMs: row?.max_ms ?? null,
  });
}

export async function getLatencySeries24h(checkId: string, siteId: string): Promise<MonitorLatencyPoint[]> {
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

  return rows.map((row) =>
    MonitorLatencyPointSchema.parse({
      bucket: toIsoUtc(row.bucket) ?? row.bucket,
      p50Ms: row.p50_ms,
      p95Ms: row.p95_ms,
      avgMs: row.avg_ms,
    }),
  );
}

export async function getIncidentCount24h(checkId: string, siteId: string): Promise<number> {
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

export async function getIncidentSegments24h(checkId: string, siteId: string): Promise<MonitorIncidentSegment[]> {
  const query = safeSql`
    SELECT
      state,
      reason_code,
      toStartOfFifteenMinutes(started_at) AS started_at,
      toStartOfFifteenMinutes(ifNull(resolved_at, now() - INTERVAL 15 MINUTE) + INTERVAL 15 MINUTE) AS resolved_at,
      last_event_at
    FROM analytics.monitor_incidents FINAL
    WHERE check_id = {check_id:String}
      AND site_id = {site_id:String}
      AND started_at >= now() - INTERVAL 24 HOUR
    ORDER BY started_at DESC
    LIMIT 100
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_id: checkId, site_id: siteId },
    })
    .toPromise()) as any[];

  return rows.map((row) =>
    MonitorIncidentSegmentSchema.parse({
      state: row.state,
      reason: row.reason_code,
      start: toIsoUtc(row.started_at) ?? row.started_at,
      end: row.resolved_at ? (toIsoUtc(row.resolved_at) ?? row.resolved_at) : null,
      durationMs:
        row.started_at && (row.resolved_at || row.last_event_at)
          ? new Date(row.resolved_at ?? row.last_event_at).getTime() - new Date(row.started_at).getTime()
          : null,
    }),
  );
}
