'use server';

import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import { SessionReplay, SessionReplayArraySchema } from '@/entities/analytics/sessionReplays.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const REPLAY_ERROR_WINDOW_TOLERANCE_SEC = 30;

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
    SELECT toString(r.session_id) AS session_id
    FROM (
      SELECT site_id, session_id, timestamp
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND event_type = 'client_error'
        AND error_fingerprint = {fingerprint:String}
        AND toDate(timestamp) >= (SELECT min(date) FROM analytics.session_replays WHERE site_id = {site_id:String}) - 1
        AND session_id IN (SELECT session_id FROM analytics.session_replays WHERE site_id = {site_id:String})
    ) AS err
    INNER JOIN (
      SELECT site_id, session_id, started_at, ended_at
      FROM analytics.session_replays FINAL
      WHERE site_id = {site_id:String}
    ) AS r USING (site_id, session_id)
    WHERE err.timestamp BETWEEN r.started_at - {tolerance:UInt32} AND r.ended_at + {tolerance:UInt32}
    ORDER BY r.started_at DESC
    LIMIT 1
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        fingerprint,
        tolerance: REPLAY_ERROR_WINDOW_TOLERANCE_SEC,
      },
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
      ORDER BY started_at DESC
      LIMIT {limit:UInt32} OFFSET {offset:UInt32}
    )
    SELECT
      r.site_id,
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
      arrayCount(
        t -> t BETWEEN r.started_at - {tolerance:UInt32} AND r.ended_at + {tolerance:UInt32},
        err.error_timestamps
      ) AS error_count,
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
    LEFT ANY JOIN (
      SELECT site_id, session_id, groupArray(timestamp) AS error_timestamps
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND event_type = 'client_error'
        AND toDate(timestamp) BETWEEN toDate({start_date:DateTime}) - 1 AND toDate({end_date:DateTime}) + 1
        AND session_id IN (SELECT session_id FROM page)
      GROUP BY site_id, session_id
    ) AS err USING (site_id, session_id)
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
        tolerance: REPLAY_ERROR_WINDOW_TOLERANCE_SEC,
      },
    })
    .toPromise();

  return SessionReplayArraySchema.parse(result);
}
