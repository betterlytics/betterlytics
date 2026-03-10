import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { parseClickHouseDate } from '@/utils/dateHelpers';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import {
  ErrorGroupRow,
  ErrorGroupRowSchema,
  ErrorGroupVolumeRow,
  ErrorGroupVolumeRowSchema,
  ErrorGroupEnvironmentRow,
  ErrorGroupEnvironmentRowSchema,
  ErrorGroupVolumePoint,
  ErrorGroupVolumePointSchema,
  RawErrorOccurrenceRow,
  RawErrorOccurrenceRowSchema,
} from '@/entities/analytics/errors.entities';

export async function getErrorGroup(siteId: string, fingerprint: string): Promise<ErrorGroupRow | null> {
  const query = safeSql`
    SELECT
      error_fingerprint,
      any(error_type) as error_type,
      any(error_message) as error_message,
      count() as count,
      min(timestamp) as first_seen,
      max(timestamp) as last_seen,
      uniq(session_id) as session_count
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'js_error'
      AND error_fingerprint = {fingerprint:String}
    GROUP BY error_fingerprint
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, fingerprint },
    })
    .toPromise()) as any[];

  if (result.length === 0) return null;

  return ErrorGroupRowSchema.parse({
    ...result[0],
    first_seen: parseClickHouseDate(result[0].first_seen),
    last_seen: parseClickHouseDate(result[0].last_seen),
  });
}

export async function hasAnyErrors(siteId: string): Promise<boolean> {
  const query = safeSql`
    SELECT 1
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'client_error'
      AND error_fingerprint != ''
    LIMIT 1
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId },
    })
    .toPromise();

  return result.length > 0;
}

export async function getErrorGroups(siteQuery: BASiteQuery): Promise<ErrorGroupRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      error_fingerprint,
      any(error_type) as error_type,
      any(error_message) as error_message,
      count() as count,
      uniq(session_id) as session_count
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'client_error'
      AND error_fingerprint != ''
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY error_fingerprint
    ORDER BY count DESC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise()) as any[];

  return result.map((row) => ErrorGroupRowSchema.parse(row));
}

export type ErrorGroupTimestamps = {
  firstSeenMap: Record<string, Date>;
  lastSeenMap: Record<string, Date>;
};

export async function getErrorGroupTimestamps(
  siteId: string,
  fingerprints: string[],
): Promise<ErrorGroupTimestamps> {
  if (fingerprints.length === 0) return { firstSeenMap: {}, lastSeenMap: {} };

  const query = safeSql`
    SELECT
      error_fingerprint,
      min(timestamp) as first_seen,
      max(timestamp) as last_seen
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'client_error'
      AND error_fingerprint IN ({fingerprints:Array(String)})
    GROUP BY error_fingerprint
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, fingerprints },
    })
    .toPromise()) as any[];

  const firstSeenMap: Record<string, Date> = {};
  const lastSeenMap: Record<string, Date> = {};
  for (const row of result) {
    firstSeenMap[row.error_fingerprint] = parseClickHouseDate(row.first_seen);
    lastSeenMap[row.error_fingerprint] = parseClickHouseDate(row.last_seen);
  }

  return { firstSeenMap, lastSeenMap };
}

export async function getErrorGroupVolumes(
  siteQuery: BASiteQuery,
  fingerprints: string[],
): Promise<ErrorGroupVolumeRow[]> {
  if (fingerprints.length === 0) return [];

  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { range, timeWrapper, granularityFunc, fill } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = timeWrapper(
    safeSql`
      SELECT
        error_fingerprint,
        ${granularityFunc('timestamp')} as date,
        count() as error_count
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND ${range}
        AND event_type = 'client_error'
        AND error_fingerprint IN ({fingerprints:Array(String)})
        AND ${SQL.AND(filters)}
      GROUP BY error_fingerprint, date
      ORDER BY error_fingerprint, date ASC
      ${fill}
    `,
  );

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDateTime,
        end_date: endDateTime,
        fingerprints,
      },
    })
    .toPromise()) as any[];

  return result.map((row) => ErrorGroupVolumeRowSchema.parse(row));
}

export async function getErrorGroupBrowserBreakdown(
  siteId: string,
  fingerprint: string,
): Promise<ErrorGroupEnvironmentRow[]> {
  const query = safeSql`
    SELECT
      browser as label,
      count() as count
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'js_error'
      AND error_fingerprint = {fingerprint:String}
      AND browser != ''
    GROUP BY browser
    ORDER BY count DESC
    LIMIT 5
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, fingerprint },
    })
    .toPromise()) as any[];

  return result.map((row) => ErrorGroupEnvironmentRowSchema.parse(row));
}

export async function getErrorGroupDeviceTypeBreakdown(
  siteId: string,
  fingerprint: string,
): Promise<ErrorGroupEnvironmentRow[]> {
  const query = safeSql`
    SELECT
      device_type as label,
      count() as count
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'js_error'
      AND error_fingerprint = {fingerprint:String}
      AND device_type != ''
    GROUP BY device_type
    ORDER BY count DESC
    LIMIT 5
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, fingerprint },
    })
    .toPromise()) as any[];

  return result.map((row) => ErrorGroupEnvironmentRowSchema.parse(row));
}

export async function getErrorGroupDailyVolume(
  siteId: string,
  fingerprint: string,
  days: number = 30,
): Promise<ErrorGroupVolumePoint[]> {
  const fillFrom = safeSql`toDate(now() - INTERVAL {days:UInt16} DAY)`;
  const fillTo = safeSql`toDate(now() + INTERVAL 1 DAY)`;
  const fill = safeSql`WITH FILL FROM ${fillFrom} TO ${fillTo} STEP INTERVAL 1 DAY`;

  const query = safeSql`
    SELECT
      toString(day) as date,
      count() as count
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'js_error'
      AND error_fingerprint = {fingerprint:String}
      AND timestamp >= now() - INTERVAL {days:UInt16} DAY
    GROUP BY toDate(timestamp) AS day
    ORDER BY day ASC ${fill}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, fingerprint, days },
    })
    .toPromise()) as any[];

  return result.map((row) => ErrorGroupVolumePointSchema.parse(row));
}

export async function getErrorOccurrence(
  siteId: string,
  fingerprint: string,
  offset: number,
): Promise<RawErrorOccurrenceRow | null> {
  const query = safeSql`
    SELECT
      timestamp,
      url,
      browser,
      os,
      device_type,
      country_code,
      session_id,
      error_type,
      error_message,
      exception_list
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'js_error'
      AND error_fingerprint = {fingerprint:String}
    ORDER BY timestamp DESC
    LIMIT 1
    OFFSET {offset:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, fingerprint, offset },
    })
    .toPromise()) as any[];

  if (result.length === 0) return null;

  return RawErrorOccurrenceRowSchema.parse({
    ...result[0],
    timestamp: parseClickHouseDate(result[0].timestamp),
  });
}
