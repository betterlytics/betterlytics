'use server';

import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { DateTimeString } from '@/types/dates';
import { SessionReplayArraySchema, SessionReplay } from '@/entities/sessionReplays';
import { BAQuery } from '@/lib/ba-query';
import { QueryFilter } from '@/entities/filter';

export async function getSessionReplays(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<SessionReplay[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      r.site_id,
      r.session_id,
      r.visitor_id,
      r.started_at,
      r.ended_at,
      r.duration,
      r.date,
      r.size_bytes,
      r.event_count,
      r.s3_prefix,
      r.sample_rate,
      r.start_url,
      e.device_type,
      e.browser,
      e.os,
      e.country_code
    FROM analytics.session_replays AS r FINAL
    LEFT JOIN (
      SELECT
        site_id,
        session_id,
        any(device_type) AS device_type,
        any(browser) AS browser,
        any(os) AS os,
        any(country_code) AS country_code
      FROM analytics.events
      GROUP BY site_id, session_id
    ) AS e USING (site_id, session_id)
    WHERE r.site_id = {site_id:String}
      AND r.started_at BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND ${SQL.AND(filters)}
    ORDER BY r.started_at DESC
    LIMIT 500
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
      },
    })
    .toPromise();

  return SessionReplayArraySchema.parse(result);
}
