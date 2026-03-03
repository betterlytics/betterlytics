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
  ErrorVolumeRow,
  ErrorVolumeRowSchema,
} from '@/entities/analytics/errors.entities';

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
      any(JSONExtractString(exception_list, 'mechanism')) as mechanism
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'js_error'
      AND error_fingerprint != ''
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY error_fingerprint
    ORDER BY count DESC
    LIMIT 100
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

export async function getErrorVolume(siteQuery: BASiteQuery): Promise<ErrorVolumeRow[]> {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('timestamp')} as date,
        count() as errorCount
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND ${range}
        AND event_type = 'js_error'
        AND ${SQL.AND(filters)}
      GROUP BY date
      ORDER BY date ASC ${fill}
      LIMIT 10080
    `,
  );

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise();

  return result.map((row) => ErrorVolumeRowSchema.parse(row));
}

export async function getErrorGroupVolumes(siteQuery: BASiteQuery): Promise<ErrorGroupVolumeRow[]> {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { range, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
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
        count() as errorCount
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND ${range}
        AND event_type = 'js_error'
        AND error_fingerprint != ''
        AND ${SQL.AND(filters)}
      GROUP BY error_fingerprint, date
      ORDER BY error_fingerprint, date ASC
    `,
  );

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

  return result.map((row) => ErrorGroupVolumeRowSchema.parse(row));
}
