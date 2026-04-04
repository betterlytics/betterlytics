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
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  const rangeSeconds = (new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / 1000;
  const canUseMv = queryFilters.length === 0 && rangeSeconds >= 3600;

  const query = canUseMv
    ? safeSql`
          WITH
            page_agg AS (
              SELECT
                path,
                uniqMerge(visitors_state)                                                              AS visitors,
                sum(pageviews_state)                                                                   AS pageviews,
                if(sum(scroll_depth_count) > 0, sum(scroll_depth_sum) / sum(scroll_depth_count), 0)   AS avg_scroll_depth,
                if(sum(duration_count) > 0, sum(duration_sum) / sum(duration_count), 0)               AS avg_time_seconds
              FROM analytics.page_stats
              WHERE site_id = {site_id:String}
                AND hour BETWEEN toStartOfHour({start:DateTime}) AND toStartOfHour({end:DateTime})
              GROUP BY path
            ),
            bounce_stats AS (
              SELECT
                entry_page.2                AS path,
                count()                     AS entry_sessions,
                countIf(pageview_count = 1) AS bounces
              FROM analytics.sessions FINAL
              WHERE site_id = {site_id:String}
                AND session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
              GROUP BY entry_page.2
            )
          SELECT
            pa.path                                                                            AS path,
            pa.visitors                                                                        AS visitors,
            pa.pageviews                                                                       AS pageviews,
            if(bs.entry_sessions > 0, round(bs.bounces / bs.entry_sessions * 100, 2), 0)     AS bounceRate,
            pa.avg_time_seconds                                                                AS avgTime,
            pa.avg_scroll_depth                                                                AS avgScrollDepth
          FROM page_agg pa
          LEFT ANY JOIN bounce_stats bs ON pa.path = bs.path
          WHERE pa.visitors > 0
          ORDER BY pa.visitors DESC, pa.pageviews DESC
          LIMIT 100
        `
    : (() => {
        const filters = BAQuery.getFilterQuery(queryFilters);
        return safeSql`
            WITH
              events_agg AS (
                SELECT
                  url as path,
                  uniqIf(session_id, event_type = 'pageview') as visitors,
                  countIf(event_type = 'pageview') as pageviews,
                  avgIf(scroll_depth_percentage, event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL) as avg_scroll_depth
                FROM analytics.events
                WHERE site_id = {site_id:String}
                  AND event_type IN ('pageview', 'scroll_depth')
                  AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
                  AND ${SQL.AND(filters)}
                GROUP BY url
              ),
              duration_stats AS (
                SELECT
                  prev_url as path,
                  avg(prev_pageview_duration) as avg_time_seconds
                FROM analytics.events
                WHERE site_id = {site_id:String}
                  AND event_type IN ('pageview', 'pagehide')
                  AND prev_url != ''
                  AND prev_pageview_duration IS NOT NULL
                  AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
                GROUP BY prev_url
              ),
              bounce_stats AS (
                SELECT
                  entry_url as path,
                  count() as entry_sessions,
                  countIf(pv_count = 1) as bounces
                FROM (
                  SELECT
                    session_id,
                    argMin(url, timestamp) as entry_url,
                    count() as pv_count
                  FROM analytics.events
                  WHERE site_id = {site_id:String}
                    AND event_type = 'pageview'
                    AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
                  GROUP BY session_id
                )
                GROUP BY entry_url
              )
            SELECT
              ea.path AS path,
              ea.visitors AS visitors,
              ea.pageviews AS pageviews,
              if(bs.entry_sessions > 0, round(bs.bounces / bs.entry_sessions * 100, 2), 0) as bounceRate,
              coalesce(ds.avg_time_seconds, 0) as avgTime,
              coalesce(ea.avg_scroll_depth, 0) as avgScrollDepth
            FROM events_agg ea
            LEFT ANY JOIN duration_stats ds ON ea.path = ds.path
            LEFT ANY JOIN bounce_stats bs ON ea.path = bs.path
            WHERE ea.visitors > 0
            ORDER BY ea.visitors DESC, ea.pageviews DESC
            LIMIT 100
          `;
      })();

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
  const rangeSeconds = (new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / 1000;
  const canUseMv = queryFilters.length === 0 && rangeSeconds >= 3600;

  const query = canUseMv
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
              GROUP BY entry_page.2
            ),
            page_agg AS (
              SELECT
                path,
                sum(pageviews_state)                                                                 AS pageviews,
                if(sum(scroll_depth_count) > 0, sum(scroll_depth_sum) / sum(scroll_depth_count), 0) AS avg_scroll_depth,
                if(sum(duration_count) > 0, sum(duration_sum) / sum(duration_count), 0)             AS avg_time_seconds
              FROM analytics.page_stats
              WHERE site_id = {site_id:String}
                AND hour BETWEEN toStartOfHour({start:DateTime}) AND toStartOfHour({end:DateTime})
              GROUP BY path
            )
          SELECT
            ses.path                                                                              AS path,
            ses.visitors                                                                          AS visitors,
            coalesce(pa.pageviews, ses.visitors)                                                  AS pageviews,
            if(ses.visitors > 0, round(ses.bounces / ses.visitors * 100, 2), 0)                  AS bounceRate,
            coalesce(pa.avg_time_seconds, 0)                                                      AS avgTime,
            if(ses.total_sessions > 0, round(ses.visitors / ses.total_sessions * 100, 2), 0)     AS entryRate,
            coalesce(pa.avg_scroll_depth, 0)                                                      AS avgScrollDepth
          FROM session_entry_stats ses
          LEFT ANY JOIN page_agg pa ON ses.path = pa.path
          ORDER BY ses.visitors DESC
          LIMIT {limit:UInt64}
        `
    : (() => {
        const filters = BAQuery.getFilterQuery(queryFilters);
        return safeSql`
            WITH
              session_entry_stats AS (
                SELECT
                  path,
                  visitors,
                  bounces,
                  sum(visitors) OVER () as total_sessions
                FROM (
                  SELECT
                    entry_url as path,
                    count() as visitors,
                    countIf(pv_count = 1) as bounces
                  FROM (
                    SELECT
                      session_id,
                      argMin(url, timestamp) as entry_url,
                      count() as pv_count
                    FROM analytics.events
                    WHERE site_id = {site_id:String}
                      AND event_type = 'pageview'
                      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
                    GROUP BY session_id
                  )
                  GROUP BY entry_url
                )
              ),
              events_agg AS (
                SELECT
                  url as path,
                  countIf(event_type = 'pageview') as pageviews,
                  avgIf(scroll_depth_percentage, event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL) as avg_scroll_depth
                FROM analytics.events
                WHERE site_id = {site_id:String}
                  AND event_type IN ('pageview', 'scroll_depth')
                  AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
                  AND ${SQL.AND(filters)}
                GROUP BY url
              ),
              duration_stats AS (
                SELECT
                  prev_url as path,
                  avg(prev_pageview_duration) as avg_time_seconds
                FROM analytics.events
                WHERE site_id = {site_id:String}
                  AND event_type IN ('pageview', 'pagehide')
                  AND prev_url != ''
                  AND prev_pageview_duration IS NOT NULL
                  AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
                GROUP BY prev_url
              )
            SELECT
              ses.path AS path,
              ses.visitors AS visitors,
              coalesce(ea.pageviews, ses.visitors) as pageviews,
              if(ses.visitors > 0, round(ses.bounces / ses.visitors * 100, 2), 0) as bounceRate,
              coalesce(ds.avg_time_seconds, 0) as avgTime,
              if(ses.total_sessions > 0, round(ses.visitors / ses.total_sessions * 100, 2), 0) as entryRate,
              coalesce(ea.avg_scroll_depth, 0) as avgScrollDepth
            FROM session_entry_stats ses
            LEFT ANY JOIN events_agg ea ON ses.path = ea.path
            LEFT ANY JOIN duration_stats ds ON ses.path = ds.path
            ORDER BY ses.visitors DESC
            LIMIT {limit:UInt64}
          `;
      })();

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
  const rangeSeconds = (new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / 1000;
  const canUseMv = queryFilters.length === 0 && rangeSeconds >= 3600;

  const query = canUseMv
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
              GROUP BY exit_page.2
            ),
            page_agg AS (
              SELECT
                path,
                sum(pageviews_state)                                                                 AS pageviews,
                if(sum(scroll_depth_count) > 0, sum(scroll_depth_sum) / sum(scroll_depth_count), 0) AS avg_scroll_depth,
                if(sum(duration_count) > 0, sum(duration_sum) / sum(duration_count), 0)             AS avg_time_seconds
              FROM analytics.page_stats
              WHERE site_id = {site_id:String}
                AND hour BETWEEN toStartOfHour({start:DateTime}) AND toStartOfHour({end:DateTime})
              GROUP BY path
            )
          SELECT
            ses.path                                                                              AS path,
            ses.visitors                                                                          AS visitors,
            coalesce(pa.pageviews, ses.visitors)                                                  AS pageviews,
            if(ses.visitors > 0, round(ses.bounces / ses.visitors * 100, 2), 0)                  AS bounceRate,
            coalesce(pa.avg_time_seconds, 0)                                                      AS avgTime,
            if(ses.total_sessions > 0, round(ses.visitors / ses.total_sessions * 100, 2), 0)     AS exitRate,
            coalesce(pa.avg_scroll_depth, 0)                                                      AS avgScrollDepth
          FROM session_exit_stats ses
          LEFT ANY JOIN page_agg pa ON ses.path = pa.path
          ORDER BY ses.visitors DESC
          LIMIT {limit:UInt64}
        `
    : (() => {
        const filters = BAQuery.getFilterQuery(queryFilters);
        return safeSql`
            WITH
              session_exit_stats AS (
                SELECT
                  path,
                  visitors,
                  bounces,
                  sum(visitors) OVER () as total_sessions
                FROM (
                  SELECT
                    exit_url as path,
                    count() as visitors,
                    countIf(pv_count = 1) as bounces
                  FROM (
                    SELECT
                      session_id,
                      argMax(url, timestamp) as exit_url,
                      count() as pv_count
                    FROM analytics.events
                    WHERE site_id = {site_id:String}
                      AND event_type = 'pageview'
                      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
                    GROUP BY session_id
                  )
                  GROUP BY exit_url
                )
              ),
              events_agg AS (
                SELECT
                  url as path,
                  countIf(event_type = 'pageview') as pageviews,
                  avgIf(scroll_depth_percentage, event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL) as avg_scroll_depth
                FROM analytics.events
                WHERE site_id = {site_id:String}
                  AND event_type IN ('pageview', 'scroll_depth')
                  AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
                  AND ${SQL.AND(filters)}
                GROUP BY url
              ),
              duration_stats AS (
                SELECT
                  prev_url as path,
                  avg(prev_pageview_duration) as avg_time_seconds
                FROM analytics.events
                WHERE site_id = {site_id:String}
                  AND event_type IN ('pageview', 'pagehide')
                  AND prev_url != ''
                  AND prev_pageview_duration IS NOT NULL
                  AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
                GROUP BY prev_url
              )
            SELECT
              ses.path AS path,
              ses.visitors AS visitors,
              coalesce(ea.pageviews, ses.visitors) as pageviews,
              if(ses.visitors > 0, round(ses.bounces / ses.visitors * 100, 2), 0) as bounceRate,
              coalesce(ds.avg_time_seconds, 0) as avgTime,
              if(ses.total_sessions > 0, round(ses.visitors / ses.total_sessions * 100, 2), 0) as exitRate,
              coalesce(ea.avg_scroll_depth, 0) as avgScrollDepth
            FROM session_exit_stats ses
            LEFT ANY JOIN events_agg ea ON ses.path = ea.path
            LEFT ANY JOIN duration_stats ds ON ses.path = ds.path
            ORDER BY ses.visitors DESC
            LIMIT {limit:UInt64}
          `;
      })();

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
        avg(toFloat64(prev_pageview_duration)) as avgTime
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND event_type IN ('pageview', 'pagehide')
        AND prev_url != ''
        AND prev_pageview_duration IS NOT NULL
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
