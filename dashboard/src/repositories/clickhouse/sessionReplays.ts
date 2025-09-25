'use server';

import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import { DateTimeString } from '@/types/dates';
import { SessionReplayArraySchema, SessionReplay } from '@/entities/sessionReplays';

export async function getSessionReplays(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
): Promise<SessionReplay[]> {
  const query = safeSql`
    SELECT
      site_id,
      session_id,
      visitor_id,
      started_at,
      ended_at,
      duration,
      date,
      size_bytes,
      s3_prefix,
      sample_rate,
      start_url
    FROM analytics.session_replays FINAL
    WHERE site_id = {site_id:String}
      AND started_at BETWEEN {start_date:DateTime} AND {end_date:DateTime}
    ORDER BY started_at DESC
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
