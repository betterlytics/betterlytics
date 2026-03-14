'use server';

import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import { SessionReplay, SessionReplayArraySchema } from '@/entities/analytics/sessionReplays.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getSessionReplays(
  siteQuery: BASiteQuery,
  limit: number,
  offset: number,
): Promise<SessionReplay[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

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
        device_type,
        browser,
        os,
        country_code
      FROM analytics.sessions FINAL
      WHERE site_id = {site_id:String}
    ) AS e USING (site_id, session_id)
    WHERE r.site_id = {site_id:String}
      AND r.started_at BETWEEN {start_date:DateTime} AND {end_date:DateTime}
    ORDER BY r.started_at DESC
    LIMIT {limit:UInt32} OFFSET {offset:UInt32}
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDateTime,
        end_date: endDateTime,
        limit,
        offset,
      },
    })
    .toPromise();

  return SessionReplayArraySchema.parse(result);
}
