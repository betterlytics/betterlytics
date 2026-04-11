import { clickhouse } from '@/lib/clickhouse';
import {
  DailyPageViewRowSchema,
  DailyPageViewRow,
  TotalPageViewsRow,
  TotalPageViewRowSchema,
} from '@/entities/analytics/pageviews.entities';
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
  DailyBounceRateRow,
  DailyBounceRateRowSchema,
} from '@/entities/analytics/pages.entities';
import { BAQuery } from '@/lib/ba-query';
import { BAPageQuery } from '@/lib/ba-pages-query';
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

export async function getPageViews(siteQuery: BASiteQuery): Promise<DailyPageViewRow[]> {
  const { siteId, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('timestamp')} as date,
        url,
        count() * any(_sample_factor) as views
      FROM analytics.events ${sample}
      WHERE site_id = {site_id:String}
        AND event_type = 'pageview'
        AND ${range}
      GROUP BY date, url
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
  return result.map((row) => DailyPageViewRowSchema.parse(row));
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
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = BAPageQuery.canUseMv(siteQuery)
    ? safeSql`
        WITH
          ${BAPageQuery.getPageStatsCte(siteQuery)},
          bounce_stats AS (
            SELECT
              entry_page.2                AS path,
              count()                     AS entry_sessions,
              countIf(pageview_count = 1) AS bounces
            FROM analytics.sessions FINAL
            WHERE site_id = {site_id:String}
              AND session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
              AND ${SQL.AND(BAPageQuery.getEntryPathFilters(siteQuery.queryFilters))}
            GROUP BY entry_page.2
          )
        SELECT
          pa.path,
          pa.visitors,
          pa.pageviews,
          if(bs.entry_sessions > 0, round(bs.bounces / bs.entry_sessions * 100, 2), 0) AS bounceRate,
          pa.avg_time_seconds                                                            AS avgTime,
          pa.avg_scroll_depth                                                            AS avgScrollDepth
        FROM page_agg pa
        LEFT ANY JOIN bounce_stats bs ON pa.path = bs.path
        WHERE pa.visitors > 0
        ORDER BY pa.visitors DESC, pa.pageviews DESC
        LIMIT 100
      `
    : safeSql`
        WITH
          ${BAPageQuery.getPageSessionCte(siteQuery)},
          page_agg AS (
            SELECT
              path,
              uniq(session_id)                                            AS visitors,
              sum(pv_count)                                               AS pageviews,
              avg(avg_duration)                                           AS avg_time_seconds,
              avg(max_scroll)                                             AS avg_scroll_depth,
              countIf(is_entry)                                           AS entries,
              countIf(is_entry AND total_pvs = 1)                         AS bounces
            FROM (
              SELECT
                path, session_id, pv_count, avg_duration, max_scroll,
                sum(pv_count) OVER (PARTITION BY session_id)              AS total_pvs,
                (min(first_ts) OVER (PARTITION BY session_id)) = first_ts AS is_entry
              FROM page_session
              WHERE pv_count > 0
            )
            GROUP BY path
          )
        SELECT
          pa.path,
          pa.visitors,
          pa.pageviews,
          if(pa.entries > 0, round(pa.bounces / pa.entries * 100, 2), 0) AS bounceRate,
          coalesce(pa.avg_time_seconds, 0)                                AS avgTime,
          coalesce(pa.avg_scroll_depth, 0)                                AS avgScrollDepth
        FROM page_agg pa
        WHERE pa.visitors > 0
        ORDER BY pa.visitors DESC, pa.pageviews DESC
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
  const { siteId, granularity, timezone, startDateTime, endDateTime } = siteQuery;

  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
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
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = BAPageQuery.canUseMv(siteQuery)
    ? safeSql`
        WITH
          session_entry_stats AS (
            SELECT
              entry_page.2                 AS path,
              count()                      AS visitors,
              countIf(pageview_count = 1)  AS bounces,
              sum(count()) OVER ()         AS total_sessions
            FROM analytics.sessions FINAL
            WHERE site_id = {site_id:String}
              AND session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
              AND ${SQL.AND(BAPageQuery.getEntryPathFilters(siteQuery.queryFilters))}
            GROUP BY entry_page.2
          ),
          ${BAPageQuery.getPageStatsCte(siteQuery)}
        SELECT
          ses.path,
          ses.visitors,
          coalesce(pa.pageviews, ses.visitors)                                             AS pageviews,
          if(ses.visitors > 0, round(ses.bounces / ses.visitors * 100, 2), 0)             AS bounceRate,
          coalesce(pa.avg_time_seconds, 0)                                                 AS avgTime,
          if(ses.total_sessions > 0, round(ses.visitors / ses.total_sessions * 100, 2), 0) AS entryRate,
          coalesce(pa.avg_scroll_depth, 0)                                                 AS avgScrollDepth
        FROM session_entry_stats ses
        LEFT ANY JOIN page_agg pa ON ses.path = pa.path
        ORDER BY ses.visitors DESC
        LIMIT {limit:UInt64}
      `
    : safeSql`
        WITH
          ${BAPageQuery.getPageSessionCte(siteQuery)},
          page_agg AS (
            SELECT
              path,
              sum(pv_count)                                               AS pageviews,
              avg(avg_duration)                                           AS avg_time_seconds,
              avg(max_scroll)                                             AS avg_scroll_depth,
              countIf(is_entry)                                           AS entry_sessions,
              countIf(is_entry AND total_pvs = 1)                         AS bounces,
              sum(countIf(is_entry)) OVER ()                              AS total_sessions
            FROM (
              SELECT
                path, session_id, pv_count, avg_duration, max_scroll,
                sum(pv_count) OVER (PARTITION BY session_id)              AS total_pvs,
                (min(first_ts) OVER (PARTITION BY session_id)) = first_ts AS is_entry
              FROM page_session
              WHERE pv_count > 0
            )
            GROUP BY path
          )
        SELECT
          pa.path,
          pa.entry_sessions                                                                         AS visitors,
          coalesce(pa.pageviews, pa.entry_sessions)                                                AS pageviews,
          if(pa.entry_sessions > 0, round(pa.bounces / pa.entry_sessions * 100, 2), 0)            AS bounceRate,
          coalesce(pa.avg_time_seconds, 0)                                                         AS avgTime,
          if(pa.total_sessions > 0, round(pa.entry_sessions / pa.total_sessions * 100, 2), 0)     AS entryRate,
          coalesce(pa.avg_scroll_depth, 0)                                                         AS avgScrollDepth
        FROM page_agg pa
        WHERE pa.entry_sessions > 0
        ORDER BY pa.entry_sessions DESC
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
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = BAPageQuery.canUseMv(siteQuery)
    ? safeSql`
        WITH
          session_exit_stats AS (
            SELECT
              exit_page.2                  AS path,
              count()                      AS visitors,
              countIf(pageview_count = 1)  AS bounces,
              sum(count()) OVER ()         AS total_sessions
            FROM analytics.sessions FINAL
            WHERE site_id = {site_id:String}
              AND session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
              AND ${SQL.AND(BAPageQuery.getExitPathFilters(siteQuery.queryFilters))}
            GROUP BY exit_page.2
          ),
          ${BAPageQuery.getPageStatsCte(siteQuery)}
        SELECT
          ses.path,
          ses.visitors,
          coalesce(pa.pageviews, ses.visitors)                                              AS pageviews,
          if(ses.visitors > 0, round(ses.bounces / ses.visitors * 100, 2), 0)              AS bounceRate,
          coalesce(pa.avg_time_seconds, 0)                                                  AS avgTime,
          if(ses.total_sessions > 0, round(ses.visitors / ses.total_sessions * 100, 2), 0) AS exitRate,
          coalesce(pa.avg_scroll_depth, 0)                                                  AS avgScrollDepth
        FROM session_exit_stats ses
        LEFT ANY JOIN page_agg pa ON ses.path = pa.path
        ORDER BY ses.visitors DESC
        LIMIT {limit:UInt64}
      `
    : safeSql`
        WITH
          ${BAPageQuery.getPageSessionCte(siteQuery)},
          page_agg AS (
            SELECT
              path,
              sum(pv_count)                                             AS pageviews,
              avg(avg_duration)                                         AS avg_time_seconds,
              avg(max_scroll)                                           AS avg_scroll_depth,
              countIf(is_exit)                                          AS exit_sessions,
              countIf(is_exit AND total_pvs = 1)                        AS bounces,
              sum(countIf(is_exit)) OVER ()                             AS total_sessions
            FROM (
              SELECT
                path, session_id, pv_count, avg_duration, max_scroll, last_ts,
                sum(pv_count) OVER (PARTITION BY session_id)            AS total_pvs,
                (max(last_ts) OVER (PARTITION BY session_id)) = last_ts AS is_exit
              FROM page_session
              WHERE pv_count > 0
            )
            GROUP BY path
          )
        SELECT
          pa.path,
          pa.exit_sessions                                                                        AS visitors,
          coalesce(pa.pageviews, pa.exit_sessions)                                               AS pageviews,
          if(pa.exit_sessions > 0, round(pa.bounces / pa.exit_sessions * 100, 2), 0)            AS bounceRate,
          coalesce(pa.avg_time_seconds, 0)                                                        AS avgTime,
          if(pa.total_sessions > 0, round(pa.exit_sessions / pa.total_sessions * 100, 2), 0)    AS exitRate,
          coalesce(pa.avg_scroll_depth, 0)                                                        AS avgScrollDepth
        FROM page_agg pa
        WHERE pa.exit_sessions > 0
        ORDER BY pa.exit_sessions DESC
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
        avg(toFloat64(duration)) as avgTime
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND event_type = 'engagement'
        AND duration > 0
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
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise()) as unknown[];

  return result.map((row) => DailyAverageTimeRowSchema.parse(row));
}

export async function getDailyBounceRate(siteQuery: BASiteQuery): Promise<DailyBounceRateRow[]> {
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
      WITH
        session_events AS (
          SELECT
            session_id,
            timestamp,
            ${granularityFunc('timestamp')} as event_date
          FROM analytics.events
          WHERE site_id = {site_id:String}
            AND event_type = 'pageview'
            AND ${range}
            AND ${SQL.AND(filters)}
        ),
        daily_sessions AS (
          SELECT
            session_id,
            min(event_date) as session_date,
            count() as page_count
          FROM session_events
          GROUP BY session_id
        )
      SELECT
        session_date as date,
        if(count() > 0, round(countIf(page_count = 1) / count() * 100, 2), 0) as bounceRate
      FROM daily_sessions
      GROUP BY session_date
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

  return result.map((row) => DailyBounceRateRowSchema.parse(row));
}
