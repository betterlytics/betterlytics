import { clickhouse } from '@/lib/clickhouse';
import { TotalPageViewsRow, TotalPageViewRowSchema } from '@/entities/analytics/pageviews.entities';
import {
  PageAnalytics,
  PageAnalyticsSchema,
  TopPageRow,
  TopPageRowSchema,
  TopEntryPageRow,
  TopEntryPageRowSchema,
  TopExitPageRow,
  TopExitPageRowSchema,
  DailyAverageTimeRow,
  DailyAverageTimeRowSchema,
  AverageTimeOnPageRow,
  AverageTimeOnPageRowSchema,
} from '@/entities/analytics/pages.entities';
import { BAQuery } from '@/lib/ba-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BASessionQuery } from '@/lib/ba-session-query';

export async function getTotalPageViews(siteQuery: BASiteQuery): Promise<TotalPageViewsRow[]> {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('timestamp')} as date,
        count() * any(_sample_factor) as views
      FROM analytics.events ${sample}
      WHERE site_id = {site_id:String}
        AND event_type = 'pageview'
        AND ${range}
        AND ${SQL.AND(filters)}
      GROUP BY date
      ORDER BY date ASC ${fill}, views DESC
      LIMIT 10080
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
    .toPromise()) as unknown[];
  return result.map((row) => TotalPageViewRowSchema.parse(row));
}

export async function getTopPages(siteQuery: BASiteQuery, limit = 5): Promise<TopPageRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const queryResponse = safeSql`
    SELECT
      url,
      uniq(session_id) * any(_sample_factor) as visitors
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND event_type = 'pageview'
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY url
    ORDER BY visitors DESC
    LIMIT {limit:UInt64}
  `;

  const result = (await clickhouse
    .query(queryResponse.taggedSql, {
      params: {
        ...queryResponse.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        limit: limit,
      },
    })
    .toPromise()) as any[];

  return result.map((row) => TopPageRowSchema.parse(row));
}

export async function getPageMetrics(siteQuery: BASiteQuery): Promise<PageAnalytics[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    WITH
      session_pv AS (
        SELECT session_id, count() AS pv_count
        FROM analytics.events
        WHERE site_id = {site_id:String}
          AND event_type = 'pageview'
          AND session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
          AND timestamp >= {start:DateTime}
          AND ${SQL.AND(filters)}
        GROUP BY session_id
      ),
      page_pv AS (
        SELECT
          ev.url                                       AS path,
          uniq(ev.session_id)                          AS visitors,
          count()                                      AS pageviews,
          uniqIf(ev.session_id, sp.pv_count = 1)       AS bounce_sessions
        FROM analytics.events ev
        ANY LEFT JOIN session_pv sp USING (session_id)
        WHERE ev.site_id = {site_id:String}
          AND ev.event_type = 'pageview'
          AND ev.session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
          AND ev.timestamp >= {start:DateTime}
          AND ${SQL.AND(filters)}
        GROUP BY ev.url
      ),
      page_eng AS (
        SELECT
          url                                                AS path,
          avgIf(visit_duration, visit_duration > 0)          AS avg_time,
          avgIf(toFloat64(max_scroll), max_scroll IS NOT NULL) AS avg_scroll
        FROM (
          SELECT
            url,
            session_id,
            sumIf(page_duration_seconds, page_duration_seconds > 0) AS visit_duration,
            maxIf(scroll_depth_percentage, scroll_depth_percentage IS NOT NULL) AS max_scroll
          FROM analytics.events
          WHERE site_id = {site_id:String}
            AND event_type = 'engagement'
            AND session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
            AND timestamp >= {start:DateTime}
            AND ${SQL.AND(filters)}
          GROUP BY url, session_id
        )
        GROUP BY url
      )
    SELECT
      pv.path,
      pv.visitors,
      pv.pageviews,
      if(pv.visitors > 0, round(pv.bounce_sessions / pv.visitors * 100, 2), 0) AS bounceRate,
      coalesce(eng.avg_time, 0)                                                AS avgTime,
      coalesce(eng.avg_scroll, 0)                                              AS avgScrollDepth
    FROM page_pv pv
    LEFT JOIN page_eng eng USING (path)
    ORDER BY pv.visitors DESC, pv.pageviews DESC
    LIMIT 100
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
      },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    PageAnalyticsSchema.parse({
      path: row.path,
      title: row.path,
      visitors: Number(row.visitors),
      pageviews: Number(row.pageviews),
      bounceRate: row.bounceRate,
      avgTime: row.avgTime,
      avgScrollDepth: row.avgScrollDepth,
    }),
  );
}

export async function getPageTrafficTimeSeries(
  siteQuery: BASiteQuery,
  path: string,
): Promise<TotalPageViewsRow[]> {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;

  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('timestamp')} as date,
        count() * any(_sample_factor) as views
      FROM analytics.events ${sample}
      WHERE site_id = {site_id:String}
        AND url = {path:String}
        AND event_type = 'pageview'
        AND ${range}
        AND ${SQL.AND(filters)}
      GROUP BY date
      ORDER BY date ASC ${fill}
      LIMIT 10080
    `,
  );

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        path: path,
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise()) as unknown[];

  return result.map((row) => TotalPageViewRowSchema.parse(row));
}

export async function getTopEntryPages(siteQuery: BASiteQuery, limit = 5): Promise<TopEntryPageRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['session_id', 'entry_page'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const queryResponse = safeSql`
    SELECT
      entry_page as url,
      count() as visitors
    FROM ${sessionSubQuery}
    WHERE entry_page != ''
    GROUP BY entry_page
    ORDER BY visitors DESC
    LIMIT {limit:UInt64}
  `;

  const result = (await clickhouse
    .query(queryResponse.taggedSql, {
      params: {
        ...queryResponse.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        limit: limit,
      },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    TopEntryPageRowSchema.parse({
      url: row.url,
      visitors: Number(row.visitors),
    }),
  );
}

export async function getTopExitPages(siteQuery: BASiteQuery, limit = 5): Promise<TopExitPageRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['session_id', 'exit_page'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const queryResponse = safeSql`
    SELECT
      exit_page as url,
      count() as visitors
    FROM ${sessionSubQuery}
    WHERE exit_page != ''
    GROUP BY exit_page
    ORDER BY visitors DESC
    LIMIT {limit:UInt64}
  `;

  const result = (await clickhouse
    .query(queryResponse.taggedSql, {
      params: {
        ...queryResponse.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        limit: limit,
      },
    })
    .toPromise()) as any[];

  return result.map((row) => TopExitPageRowSchema.parse(row));
}

export async function getEntryPageAnalytics(siteQuery: BASiteQuery, limit = 100): Promise<PageAnalytics[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['session_start', 'session_end', 'pageview_count', 'entry_page'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const query = safeSql`
    WITH
      filtered_sessions AS ${sessionSubQuery},
      total_sessions AS (
        SELECT count() AS n FROM filtered_sessions
      ),
      entry_agg AS (
        SELECT
          entry_page              AS path,
          count()                 AS visitors,
          countIf(pageview_count = 1) AS bounce_sessions,
          sum(pageview_count)     AS pageviews,
          avg(dateDiff('second', session_start, session_end)) AS avg_session_time
        FROM filtered_sessions
        WHERE entry_page != ''
        GROUP BY entry_page
      )
    SELECT
      ea.path                                                                  AS path,
      ea.visitors                                                              AS visitors,
      ea.pageviews                                                             AS pageviews,
      if(ea.visitors > 0, round(ea.bounce_sessions / ea.visitors * 100, 2), 0) AS bounceRate,
      ea.avg_session_time                                                      AS avgTime,
      if(ts.n > 0, round(ea.visitors / ts.n * 100, 2), 0)                      AS entryRate,
      NULL                                                                     AS avgScrollDepth
    FROM entry_agg ea
    CROSS JOIN total_sessions ts
    ORDER BY ea.visitors DESC
    LIMIT {limit:UInt64}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        limit: limit,
      },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    PageAnalyticsSchema.parse({
      path: row.path,
      title: row.path,
      visitors: Number(row.visitors),
      pageviews: Number(row.pageviews),
      bounceRate: row.bounceRate,
      avgTime: row.avgTime,
      entryRate: Number(row.entryRate ?? 0),
      avgScrollDepth: row.avgScrollDepth,
    }),
  );
}

export async function getExitPageAnalytics(siteQuery: BASiteQuery, limit = 100): Promise<PageAnalytics[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['session_start', 'session_end', 'pageview_count', 'exit_page'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const query = safeSql`
    WITH
      filtered_sessions AS ${sessionSubQuery},
      total_sessions AS (
        SELECT count() AS n FROM filtered_sessions
      ),
      exit_agg AS (
        SELECT
          exit_page               AS path,
          count()                 AS visitors,
          sum(pageview_count)     AS pageviews,
          avg(dateDiff('second', session_start, session_end)) AS avg_session_time
        FROM filtered_sessions
        WHERE exit_page != ''
        GROUP BY exit_page
      )
    SELECT
      ea.path                                                                  AS path,
      ea.visitors                                                              AS visitors,
      ea.pageviews                                                             AS pageviews,
      0                                                                        AS bounceRate,
      ea.avg_session_time                                                      AS avgTime,
      if(ts.n > 0, round(ea.visitors / ts.n * 100, 2), 0)                      AS exitRate,
      NULL                                                                     AS avgScrollDepth
    FROM exit_agg ea
    CROSS JOIN total_sessions ts
    ORDER BY ea.visitors DESC
    LIMIT {limit:UInt64}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        limit: limit,
      },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    PageAnalyticsSchema.parse({
      path: row.path,
      title: row.path,
      visitors: Number(row.visitors),
      pageviews: Number(row.pageviews),
      bounceRate: row.bounceRate,
      avgTime: row.avgTime,
      exitRate: Number(row.exitRate ?? 0),
      avgScrollDepth: row.avgScrollDepth,
    }),
  );
}

export async function getDailyAverageTimeOnPage(siteQuery: BASiteQuery): Promise<DailyAverageTimeRow[]> {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { range, fill, timeWrapper, granularityFunc } = BASessionQuery.getSessionStartRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = timeWrapper(
    safeSql`
      SELECT
        date,
        avg(visit_duration) as avgTime,
        count() as visitCount
      FROM (
        SELECT
          ${granularityFunc('session_created_at')} as date,
          session_id,
          url,
          sum(page_duration_seconds) as visit_duration
        FROM analytics.events
        WHERE site_id = {site_id:String}
          AND event_type = 'engagement'
          AND page_duration_seconds > 0
          AND ${range}
          AND timestamp >= {startDate:DateTime}
          AND ${SQL.AND(filters)}
        GROUP BY date, session_id, url
      )
      GROUP BY date
      ORDER BY date ASC ${fill}
      LIMIT 10080
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
    .toPromise()) as unknown[];

  return result.map((row) => DailyAverageTimeRowSchema.parse(row));
}

export async function getAverageTimeOnPage(siteQuery: BASiteQuery): Promise<AverageTimeOnPageRow> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      coalesce(avg(visit_duration), 0) AS avgTime
    FROM (
      SELECT
        session_id,
        url,
        sum(page_duration_seconds) AS visit_duration
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND event_type = 'engagement'
        AND page_duration_seconds > 0
        AND session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
        AND timestamp >= {start:DateTime}
        AND ${SQL.AND(filters)}
      GROUP BY session_id, url
    )
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
      },
    })
    .toPromise()) as unknown[];

  return AverageTimeOnPageRowSchema.parse(result[0] ?? {});
}
