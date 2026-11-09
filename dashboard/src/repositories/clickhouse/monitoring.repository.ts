import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import {
  MonitorResultSchema,
  MonitorTlsResultSchema,
  MonitorUptimeBucketSchema,
  MonitorLatencyStatsSchema,
  MonitorLatencyPointSchema,
  LatestCheckInfoSchema,
  type MonitorUptimeBucket,
  type MonitorResult,
  type MonitorTlsResult,
  type LatestCheckInfo,
  type MonitorLatencyStats,
  type MonitorLatencyPoint,
  MonitorIncidentSegmentSchema,
  type MonitorIncidentSegment,
  MonitorIncidentRecordSchema,
  type MonitorIncidentRecord,
  type IncidentState,
  DetectedOutageRowSchema,
  type DetectedOutageRow,
} from '@/entities/analytics/monitoring.entities';
import { parseClickHouseDate, toIsoUtc } from '@/utils/dateHelpers';
import { groupByKey } from '@/utils/collections';
import { uptimeRatio } from '@/entities/analytics/monitoring.helpers';

type UptimeBucketRow = { check_id: string; date: string; monitored_seconds: number; down_seconds: number };
type IncidentSegmentRow = {
  state: string;
  reason_code: string | null;
  started_at: string;
  resolved_at: string | null;
  last_event_at: string | null;
};

function parseUptimeBucketRow(row: UptimeBucketRow): MonitorUptimeBucket {
  const totals = {
    monitoredSeconds: row.monitored_seconds,
    upSeconds: Math.max(0, row.monitored_seconds - row.down_seconds),
  };
  return MonitorUptimeBucketSchema.parse({
    bucket: toIsoUtc(row.date) ?? row.date,
    upRatio: uptimeRatio(totals),
    ...totals,
  });
}

function parseIncidentSegmentRow(row: IncidentSegmentRow): MonitorIncidentSegment {
  const end = row.resolved_at ?? row.last_event_at;
  return MonitorIncidentSegmentSchema.parse({
    state: row.state,
    reason: row.reason_code,
    start: toIsoUtc(row.started_at) ?? row.started_at,
    end: row.resolved_at ? (toIsoUtc(row.resolved_at) ?? row.resolved_at) : null,
    durationMs:
      row.started_at && end
        ? parseClickHouseDate(end).getTime() - parseClickHouseDate(row.started_at).getTime()
        : null,
  });
}

// The wait before the next check may run up to the interval (backoff included) plus 20% for jitter,
// in permille so that interval seconds times it gives milliseconds. Intervals never exceed 24 hours.
const PROBE_COVERAGE_PERMILLE = 1200;
// Far enough back to reach the probe whose coverage runs into the range, with room for its duration
const COVERAGE_LOOKBACK_MS = 24 * 60 * 60 * PROBE_COVERAGE_PERMILLE + 10 * 60 * 1000;
// Far enough past the range to see a next check that started inside it but finished after it
const COVERAGE_LOOKAHEAD_MS = 10 * 60 * 1000;

export type UptimeMonitorRef = { checkId: string; createdAt: Date };

/**
 * Monitored and up seconds per hour or day bucket, for many monitors in one query.
 *
 * Each non-TLS probe result covers the time from its check until the next check, as long as the
 * next check started within its recorded interval plus 20%; otherwise it covers only that capped
 * interval. The next check's start is its timestamp minus its latency, since a result is stamped
 * when its probe finishes, so a slow or timing out probe doesn't eat into the allowance. Downtime is incident time inside that coverage, so unmonitored time
 * (paused, not yet created, our own probing down) counts on neither side of the ratio. Coverage
 * is split across bucket boundaries and clipped to [rangeStart, rangeEnd), to the monitor's
 * creation and to now, so summing the buckets gives the exact range. Only buckets with monitored
 * time are returned, oldest first, keyed by check_id.
 */
export async function getUptimeBuckets(
  monitors: UptimeMonitorRef[],
  siteId: string,
  options: { rangeStart: Date; rangeEnd: Date; granularity: 'hour' | 'day'; timezone: string },
): Promise<Map<string, MonitorUptimeBucket[]>> {
  if (!monitors.length) return new Map();

  const unit = options.granularity === 'day' ? safeSql`DAY` : safeSql`HOUR`;
  const unitName = options.granularity === 'day' ? safeSql`'day'` : safeSql`'hour'`;
  const toBucketStart = (ms: ReturnType<typeof safeSql>) =>
    options.granularity === 'day'
      ? safeSql`toStartOfDay(fromUnixTimestamp64Milli(${ms}, 'UTC'), {timezone:String})`
      : safeSql`toStartOfHour(fromUnixTimestamp64Milli(${ms}, 'UTC'), {timezone:String})`;
  // Every bucket a [fromMs, toMs) span touches, one row each
  const bucketsOf = (fromMs: ReturnType<typeof safeSql>, toMs: ReturnType<typeof safeSql>) => safeSql`
    arrayJoin(
      arrayMap(
        i -> ${toBucketStart(fromMs)} + INTERVAL i ${unit},
        range(toUInt32(dateDiff(
          ${unitName},
          ${toBucketStart(fromMs)},
          fromUnixTimestamp64Milli(${toMs} - 1, 'UTC'),
          {timezone:String}
        )) + 1)
      )
    )
  `;

  const query = safeSql`
    WITH
      monitors AS (
        SELECT
          tupleElement(m, 1) AS check_id,
          tupleElement(m, 2) AS created_ms
        FROM (
          SELECT arrayJoin(arrayZip({check_ids:Array(String)}, {created_ms:Array(Int64)})) AS m
        )
      ),
      probes AS (
        SELECT
          check_id,
          toUnixTimestamp64Milli(ts) AS probe_ms,
          leadInFrame(toNullable(toUnixTimestamp64Milli(ts))) OVER (
            PARTITION BY check_id ORDER BY ts ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING
          ) AS next_probe_ms,
          leadInFrame(toNullable(toInt64(ifNull(latency_ms, 0)))) OVER (
            PARTITION BY check_id ORDER BY ts ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING
          ) AS next_latency_ms,
          effective_interval_seconds
        FROM analytics.monitor_results
        WHERE check_id IN {check_ids:Array(String)}
          AND site_id = {site_id:String}
          AND kind != 'tls'
          AND ts >= fromUnixTimestamp64Milli({lookback_start_ms:Int64}, 'UTC')
          AND ts < fromUnixTimestamp64Milli({lookahead_end_ms:Int64}, 'UTC')
      ),
      coverage AS (
        SELECT
          p.check_id AS check_id,
          p.probe_ms + toInt64(p.effective_interval_seconds * {coverage_permille:UInt32}) AS capped_ms,
          greatest(p.probe_ms, m.created_ms, {range_start_ms:Int64}) AS covered_from_ms,
          least(
            if(
              ifNull(p.next_probe_ms - p.next_latency_ms <= capped_ms, 0),
              assumeNotNull(p.next_probe_ms),
              capped_ms
            ),
            {range_end_ms:Int64},
            toUnixTimestamp64Milli(now64(3))
          ) AS covered_to_ms
        FROM probes AS p
        INNER JOIN monitors AS m ON m.check_id = p.check_id
        WHERE covered_to_ms > covered_from_ms
      ),
      incidents AS (
        SELECT
          check_id,
          greatest(toUnixTimestamp64Milli(started_at), {range_start_ms:Int64}) AS down_from_ms,
          least(
            ifNull(toUnixTimestamp64Milli(resolved_at), toUnixTimestamp64Milli(now64(3))),
            {range_end_ms:Int64}
          ) AS down_to_ms
        FROM analytics.monitor_incidents FINAL
        WHERE check_id IN {check_ids:Array(String)}
          AND site_id = {site_id:String}
          AND kind != 'tls'
          AND started_at < fromUnixTimestamp64Milli({range_end_ms:Int64}, 'UTC')
          AND (resolved_at IS NULL OR resolved_at > fromUnixTimestamp64Milli({range_start_ms:Int64}, 'UTC'))
      ),
      -- Incident spans per bucket, so each coverage segment only meets its own bucket's incidents
      downtime AS (
        SELECT
          check_id,
          ${bucketsOf(safeSql`down_from_ms`, safeSql`down_to_ms`)} AS bucket_start,
          groupArray((down_from_ms, down_to_ms)) AS spans
        FROM incidents
        WHERE down_to_ms > down_from_ms
        GROUP BY check_id, bucket_start
      ),
      segments AS (
        SELECT
          check_id,
          ${bucketsOf(safeSql`covered_from_ms`, safeSql`covered_to_ms`)} AS bucket_start,
          greatest(covered_from_ms, toInt64(toUnixTimestamp(bucket_start)) * 1000) AS from_ms,
          least(covered_to_ms, toInt64(toUnixTimestamp(bucket_start + INTERVAL 1 ${unit})) * 1000) AS to_ms
        FROM coverage
      )
    SELECT
      s.check_id AS check_id,
      toTimeZone(s.bucket_start, 'UTC') AS date,
      sum(s.to_ms - s.from_ms) / 1000 AS monitored_seconds,
      sum(least(
        s.to_ms - s.from_ms,
        arraySum(span -> greatest(0, least(s.to_ms, span.2) - greatest(s.from_ms, span.1)), d.spans)
      )) / 1000 AS down_seconds
    FROM segments AS s
    LEFT JOIN downtime AS d ON d.check_id = s.check_id AND d.bucket_start = s.bucket_start
    WHERE s.to_ms > s.from_ms
    GROUP BY s.check_id, s.bucket_start
    ORDER BY s.check_id, s.bucket_start
  `;

  const rangeStartMs = options.rangeStart.getTime();
  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        check_ids: monitors.map((monitor) => monitor.checkId),
        created_ms: monitors.map((monitor) => monitor.createdAt.getTime()),
        site_id: siteId,
        timezone: options.timezone,
        range_start_ms: rangeStartMs,
        range_end_ms: options.rangeEnd.getTime(),
        lookahead_end_ms: options.rangeEnd.getTime() + COVERAGE_LOOKAHEAD_MS,
        lookback_start_ms: rangeStartMs - COVERAGE_LOOKBACK_MS,
        coverage_permille: PROBE_COVERAGE_PERMILLE,
      },
    })
    .toPromise()) as UptimeBucketRow[];

  return groupByKey(rows, (row) => row.check_id, parseUptimeBucketRow);
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
    .toPromise()) as {
    ts: string;
    status: string;
    latency_ms: number | null;
    status_code: number | null;
    reason_code: string | null;
  }[];

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
    .toPromise()) as {
    check_id: string;
    ts: string;
    status: string;
    reason_code: string | null;
    tls_not_after: string | null;
  }[];

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
    .toPromise()) as IncidentSegmentRow[];

  return rows.map(parseIncidentSegmentRow);
}

/**
 * Batched variant of getMonitorIncidentSegments for the public status page:
 * one query for all monitors of a page (newest-first per monitor). TLS
 * incidents are excluded as cert expiry is not downtime.
 */
export async function getIncidentSegmentsForMonitors(
  checkIds: string[],
  siteId: string,
  days: number,
  limitPerMonitor: number,
): Promise<Map<string, MonitorIncidentSegment[]>> {
  if (!checkIds.length) return new Map();

  const query = safeSql`
    SELECT
      check_id,
      state,
      reason_code,
      started_at,
      resolved_at,
      last_event_at
    FROM analytics.monitor_incidents FINAL
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
      AND kind != 'tls'
      AND started_at >= now() - INTERVAL {days:Int32} DAY
    ORDER BY check_id, started_at DESC
    LIMIT {limit:UInt32} BY check_id
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId, days, limit: limitPerMonitor },
    })
    .toPromise()) as (IncidentSegmentRow & { check_id: string })[];

  return groupByKey(rows, (row) => row.check_id, parseIncidentSegmentRow);
}

export async function getLatencyStatsForMonitors(
  checkIds: string[],
  siteId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<Map<string, MonitorLatencyStats>> {
  if (!checkIds.length) return new Map();

  const query = safeSql`
    SELECT
      check_id,
      avg(latency_ms) AS avg_ms,
      min(latency_ms) AS min_ms,
      max(latency_ms) AS max_ms
    FROM analytics.monitor_results
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
      AND kind != 'tls'
      AND ts >= ${SQL.DateTime({ rangeStart })}
      AND ts < ${SQL.DateTime({ rangeEnd })}
      AND latency_ms IS NOT NULL
    GROUP BY check_id
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId },
    })
    .toPromise()) as {
    check_id: string;
    avg_ms: number | null;
    min_ms: number | null;
    max_ms: number | null;
  }[];

  return new Map(
    rows.map((row) => [
      row.check_id,
      MonitorLatencyStatsSchema.parse({ avgMs: row.avg_ms, minMs: row.min_ms, maxMs: row.max_ms }),
    ]),
  );
}

export async function getMonitorIncidentsInRange(
  checkIds: string[],
  siteId: string,
  rangeStart: string,
  rangeEnd: string,
  limit: number,
  state?: IncidentState,
): Promise<MonitorIncidentRecord[]> {
  if (!checkIds.length) return [];

  const stateCondition = state ? safeSql`state = ${SQL.String({ state })}` : safeSql`1=1`;

  const query = safeSql`
    SELECT
      toString(incident_id) AS incident_id,
      check_id,
      state,
      severity,
      reason_code,
      started_at,
      resolved_at,
      last_event_at
    FROM analytics.monitor_incidents FINAL
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
      AND kind != 'tls'
      AND started_at < ${SQL.DateTime({ rangeEnd })}
      AND (resolved_at IS NULL OR resolved_at > ${SQL.DateTime({ rangeStart })})
      AND ${stateCondition}
    ORDER BY started_at DESC
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, check_ids: checkIds, site_id: siteId, limit },
    })
    .toPromise()) as (IncidentSegmentRow & { incident_id: string; check_id: string; severity: string })[];

  return rows.map((row) => {
    // An ongoing incident has no resolved_at, so its duration so far runs to the latest failing check.
    const end = row.resolved_at ?? row.last_event_at;
    return MonitorIncidentRecordSchema.parse({
      incidentId: row.incident_id,
      monitorCheckId: row.check_id,
      state: row.state,
      severity: row.severity,
      reason: row.reason_code,
      startedAt: toIsoUtc(row.started_at) ?? row.started_at,
      resolvedAt: row.resolved_at ? (toIsoUtc(row.resolved_at) ?? row.resolved_at) : null,
      durationMs: end ? parseClickHouseDate(end).getTime() - parseClickHouseDate(row.started_at).getTime() : null,
    });
  });
}

/**
 * Detected outages to suggest as incidents: ongoing ones, plus recently-recovered ones (within
 * `resolvedMaxAgeDays`) so a finished outage can still be documented after the fact. TLS incidents
 * are excluded (cert expiry is not downtime).
 */
export async function getDetectedOutagesForMonitors(
  checkIds: string[],
  siteId: string,
  days: number,
  resolvedMaxAgeDays: number,
  limit: number,
): Promise<DetectedOutageRow[]> {
  if (!checkIds.length) return [];

  const query = safeSql`
    SELECT
      toString(incident_id) AS incident_id,
      check_id,
      state,
      severity,
      reason_code,
      started_at,
      resolved_at
    FROM analytics.monitor_incidents FINAL
    WHERE check_id IN ({check_ids:Array(String)})
      AND site_id = {site_id:String}
      AND kind != 'tls'
      AND (state = 'ongoing' OR resolved_at >= now() - INTERVAL {resolved_max_age_days:Int32} DAY)
      AND started_at >= now() - INTERVAL {days:Int32} DAY
    ORDER BY started_at DESC
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        check_ids: checkIds,
        site_id: siteId,
        days,
        resolved_max_age_days: resolvedMaxAgeDays,
        limit,
      },
    })
    .toPromise()) as {
    incident_id: string;
    check_id: string;
    state: string;
    severity: string;
    reason_code: string;
    started_at: string;
    resolved_at: string | null;
  }[];

  return rows.map((row) =>
    DetectedOutageRowSchema.parse({
      detectedIncidentId: row.incident_id,
      monitorCheckId: row.check_id,
      reasonCode: row.reason_code,
      ongoing: row.state === 'ongoing',
      startedAt: toIsoUtc(row.started_at) ?? row.started_at,
      resolvedAt: row.resolved_at ? (toIsoUtc(row.resolved_at) ?? row.resolved_at) : null,
      severity: row.severity,
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
    .toPromise()) as {
    check_id: string;
    ts: string;
    status: string;
    effective_interval_seconds: number | null;
    backoff_level: number | null;
  }[];

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
    .toPromise()) as { avg_ms: number | null; min_ms: number | null; max_ms: number | null }[];

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
    .toPromise()) as { bucket: string; p50_ms: number | null; p95_ms: number | null; avg_ms: number | null }[];

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
    .toPromise()) as { count: number }[];

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
    .toPromise()) as IncidentSegmentRow[];

  return rows.map(parseIncidentSegmentRow);
}
