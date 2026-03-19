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
} from '@/entities/analytics/errors.entities';

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
      max(timestamp) as last_seen,
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

  return result.map((row) =>
    ErrorGroupRowSchema.parse({
      ...row,
      last_seen: parseClickHouseDate(row.last_seen),
    }),
  );
}

export async function getGlobalErrorGroupFirstSeen(siteId: string): Promise<Record<string, Date>> {
  const query = safeSql`
    SELECT
      error_fingerprint,
      min(timestamp) as first_seen
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'client_error'
      AND error_fingerprint != ''
    GROUP BY error_fingerprint
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId },
    })
    .toPromise()) as any[];

  return Object.fromEntries(result.map((row) => [row.error_fingerprint, parseClickHouseDate(row.first_seen)]));
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
