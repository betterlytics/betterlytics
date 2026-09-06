'use server';

import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import { SessionReplay, SessionReplayArraySchema } from '@/entities/analytics/sessionReplays.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function hasSessionReplay(siteId: string, sessionId: string): Promise<boolean> {
  const query = safeSql`
    SELECT 1
    FROM analytics.session_replays FINAL
    WHERE site_id = {site_id:String}
      AND session_id = {session_id:UInt64}
    LIMIT 1
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, session_id: sessionId },
    })
    .toPromise();

  return result.length > 0;
}

export async function getReplayStorageForSession(siteId: string, sessionId: string): Promise<string | null> {
  const query = safeSql`
    SELECT storage
    FROM analytics.session_replays FINAL
    WHERE site_id = {site_id:String}
      AND session_id = {session_id:UInt64}
    LIMIT 1
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, session_id: sessionId },
    })
    .toPromise()) as { storage: string }[];

  return result.length > 0 ? result[0].storage : null;
}

export async function findReplaySessionForError(siteId: string, fingerprint: string): Promise<string | null> {
  const query = safeSql`
    SELECT toString(session_id) AS session_id
    FROM analytics.session_replays FINAL
    WHERE site_id = {site_id:String}
      AND has(error_fingerprints, {fingerprint:String})
    ORDER BY started_at DESC, session_id DESC
    LIMIT 1
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, fingerprint },
    })
    .toPromise()) as any[];

  return result.length > 0 ? result[0].session_id : null;
}

export async function getSessionReplays(
  siteQuery: BASiteQuery,
  limit: number,
  offset: number,
): Promise<SessionReplay[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = safeSql`
    WITH page AS (
      SELECT *
      FROM analytics.session_replays FINAL
      WHERE site_id = {site_id:String}
        AND started_at BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      ORDER BY started_at DESC, session_id DESC
      LIMIT {limit:UInt32} OFFSET {offset:UInt32}
    )
    SELECT
      r.site_id AS site_id,
      toString(r.session_id) as session_id,
      toString(r.visitor_id) as visitor_id,
      r.started_at,
      r.ended_at,
      r.duration,
      r.date,
      r.size_bytes,
      r.event_count,
      r.s3_prefix,
      r.start_url,
      r.recorded_error_count AS error_count,
      e.device_type,
      e.browser,
      e.os,
      e.country_code
    FROM page AS r
    LEFT ANY JOIN (
      SELECT
        site_id,
        session_id,
        device_type,
        browser,
        os,
        country_code
      FROM analytics.sessions FINAL
      WHERE site_id = {site_id:String}
        AND session_id IN (SELECT session_id FROM page)
    ) AS e USING (site_id, session_id)
    ORDER BY r.started_at DESC, r.session_id DESC
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
