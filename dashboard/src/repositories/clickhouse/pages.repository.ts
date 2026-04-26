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
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { z } from 'zod';
import { parseFilterColumn } from '@/entities/analytics/filter.entities';

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

// ---------------------------------------------------------------------------
// Granularity helper for the page_stats fast path (`hour` column).
//
// `BAQuery.getTimestampRange` is built around the `timestamp` column on
// `analytics.events`. The page_stats MV buckets at hourly resolution under a
// `hour DateTime` column, so we need a parallel helper that produces:
//   - a bucket function:  toStartOfInterval(hour, INTERVAL X, timezone)
//   - a fill clause:      WITH FILL FROM ... TO ... STEP <interval>
// at the requested granularity, but only for the granularities that are
// hourly-MV-compatible (hour/day/week/month — see `canUseHourlyMVBoundaries`).
// ---------------------------------------------------------------------------
const HOURLY_GRANULARITY_INTERVAL = {
  month: '1 MONTH',
  week: '1 WEEK',
  day: '1 DAY',
  hour: '1 HOUR',
} as const;
const HourlyGranularityIntervalSchema = z.enum(['1 MONTH', '1 WEEK', '1 DAY', '1 HOUR']);

function getPageStatsHourGranularity(
  granularity: GranularityRangeValues,
  timezone: string,
  startDateTime: string,
  endDateTime: string,
) {
  const intervalLiteral =
    granularity in HOURLY_GRANULARITY_INTERVAL
      ? HOURLY_GRANULARITY_INTERVAL[granularity as keyof typeof HOURLY_GRANULARITY_INTERVAL]
      : HOURLY_GRANULARITY_INTERVAL.day;
  const validated = HourlyGranularityIntervalSchema.parse(intervalLiteral);
  const interval = safeSql`INTERVAL ${SQL.Unsafe(validated)}`;

  const start = SQL.DateTime({ startDate: startDateTime });
  const end = SQL.DateTime({ endDate: endDateTime });
  const tz = SQL.String({ timezone });

  const granularityFunc = safeSql`toStartOfInterval(hour, ${interval}, ${tz})`;

  const intervalFrom = safeSql`toStartOfInterval(${start}, ${interval}, ${tz})`;
  const isCoarseGranularity = granularity === 'week' || granularity === 'month';
  const intervalTo = isCoarseGranularity
    ? safeSql`toStartOfInterval(${end}, ${interval}, ${tz}) + ${interval}`
    : safeSql`toStartOfInterval(addSeconds(${end}, 1), ${interval}, ${tz})`;
  const fill = safeSql`WITH FILL FROM ${intervalFrom} TO ${intervalTo} STEP ${interval}`;

  // Same date-cast wrapper as BAQuery.getTimestampRange so the returned
  // DateTime is materialised as a timezone-converted DateTime64 (matching the
  // shape produced by the slow path in this file and the rest of the app).
  const timeWrapper = (sql: ReturnType<typeof safeSql>) =>
    safeSql`SELECT toTimezone(toDateTime64(date, 0), 'UTC') as date, q.* EXCEPT (date) FROM (${sql}) q`;

  return { granularityFunc, fill, timeWrapper };
}

// ---------------------------------------------------------------------------
// Q1: getPageMetrics — fast/slow dispatch
// ---------------------------------------------------------------------------

export async function getPageMetrics(siteQuery: BASiteQuery): Promise<PageAnalytics[]> {
  const useMv = BAPageQuery.canUseMv(siteQuery);
  const query = useMv ? buildPageMetricsFast(siteQuery) : buildPageMetricsSlow(siteQuery);

  const result = (await clickhouse
    .query(query.taggedSql, { params: query.taggedParams })
    .toPromise()) as any[];

  const mappedResults = result.map((row) => ({
    path: row.path,
    title: row.path,
    visitors: Number(row.visitors),
    pageviews: Number(row.pageviews),
    bounceRate: row.bounceRate,
    avgTime: row.avgTime,
    avgScrollDepth: row.avgScrollDepth,
  }));

  return PageAnalyticsSchema.array().parse(mappedResults);
}

function buildPageMetricsFast(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const mvFilters = BAPageQuery.getPageStatsFilters(queryFilters);
  const mergedSessions = BAPageQuery.getMergedSessionsCte({
    siteId,
    startDate: startDateTime,
    endDate: endDateTime,
    queryFilters,
    includeEntryPage: true,
  });

  return safeSql`
    WITH
      page_agg AS (
        SELECT
          path,
          uniqMerge(visitors_state)                                     AS visitors,
          sum(pageviews_state)                                          AS pageviews,
          sum(duration_sum)     / nullIf(sum(duration_count), 0)        AS avg_time_seconds,
          sum(scroll_depth_sum) / nullIf(sum(scroll_depth_count), 0)    AS avg_scroll_depth
        FROM analytics.page_stats
        WHERE site_id = ${SQL.String({ siteId })}
          AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
          AND ${SQL.AND(mvFilters)}
        GROUP BY path
      ),
      bounce_stats AS (
        SELECT
          tupleElement(entry_page, 2) AS path,
          count()                     AS bounces
        FROM (${mergedSessions})
        WHERE pageview_count = 1
        GROUP BY tupleElement(entry_page, 2)
      )
    SELECT
      pa.path,
      pa.visitors,
      pa.pageviews,
      if(pa.visitors > 0, round(coalesce(bs.bounces, 0) / pa.visitors * 100, 2), 0) AS bounceRate,
      pa.avg_time_seconds                                                            AS avgTime,
      pa.avg_scroll_depth                                                            AS avgScrollDepth
    FROM page_agg pa
    LEFT ANY JOIN bounce_stats bs ON pa.path = bs.path
    WHERE pa.visitors > 0
    ORDER BY pa.visitors DESC, pa.pageviews DESC
    LIMIT 100
  `;
}

function buildPageMetricsSlow(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  return safeSql`
    WITH
      per_session_url AS (
        SELECT
          session_id,
          url AS path,
          countIf(event_type = 'pageview')                                                  AS visits,
          sumIf(duration_seconds,  event_type = 'engagement' AND duration_seconds > 0)      AS dur_sum,
          countIf(                 event_type = 'engagement' AND duration_seconds > 0)      AS dur_count,
          sumIf(scroll_depth_percentage,
                event_type = 'engagement' AND scroll_depth_percentage IS NOT NULL)          AS scroll_sum,
          countIf(event_type = 'engagement' AND scroll_depth_percentage IS NOT NULL)        AS scroll_count
        FROM analytics.events
        WHERE site_id = ${SQL.String({ siteId })}
          AND event_type IN ('pageview', 'engagement')
          AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
          AND ${SQL.AND(filters)}
        GROUP BY session_id, url
      ),
      session_pv AS (
        SELECT session_id, sum(visits) AS pv_count
        FROM per_session_url
        GROUP BY session_id
      )
    SELECT
      psu.path,
      uniq(psu.session_id)                                                AS visitors,
      sum(psu.visits)                                                     AS pageviews,
      if(uniq(psu.session_id) > 0,
         round(countIf(spv.pv_count = 1) / uniq(psu.session_id) * 100, 2),
         0)                                                                AS bounceRate,
      sum(psu.dur_sum)    / nullIf(sum(psu.dur_count), 0)                  AS avgTime,
      sum(psu.scroll_sum) / nullIf(sum(psu.scroll_count), 0)               AS avgScrollDepth
    FROM per_session_url psu
    JOIN session_pv spv USING (session_id)
    WHERE psu.visits > 0
    GROUP BY psu.path
    ORDER BY visitors DESC, pageviews DESC
    LIMIT 100
  `;
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

// ---------------------------------------------------------------------------
// Q2: getEntryPageAnalytics — fast/slow dispatch
// ---------------------------------------------------------------------------

export async function getEntryPageAnalytics(siteQuery: BASiteQuery, limit = 100): Promise<PageAnalytics[]> {
  const useMv = BAPageQuery.canUseMv(siteQuery);
  const query = useMv ? buildEntryPageAnalyticsFast(siteQuery) : buildEntryPageAnalyticsSlow(siteQuery);

  const result = (await clickhouse
    .query(query.taggedSql, { params: { ...query.taggedParams, limit } })
    .toPromise()) as any[];

  const mappedResults = result.map((row) => ({
    path: row.path,
    title: row.path,
    visitors: Number(row.visitors),
    pageviews: Number(row.pageviews),
    bounceRate: row.bounceRate,
    avgTime: row.avgTime,
    entryRate: Number(row.entryRate ?? 0),
    avgScrollDepth: row.avgScrollDepth,
  }));

  return PageAnalyticsSchema.array().parse(mappedResults);
}

function buildEntryPageAnalyticsFast(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const mvFilters = BAPageQuery.getPageStatsFilters(queryFilters);
  const mergedSessions = BAPageQuery.getMergedSessionsCte({
    siteId,
    startDate: startDateTime,
    endDate: endDateTime,
    queryFilters,
    includeEntryPage: true,
  });

  // The url filter on `queryFilters` only constrains the entry-page selection
  // (sessions whose entry_page matches). Translate it into a WHERE on
  // tupleElement(entry_page, 2) for the merged-sessions CTE projection. Other
  // MV-compatible filters (country/device/etc.) are already applied inside
  // the merged-sessions CTE.
  const entryPathFilter = buildEntryOrExitPathFilter(queryFilters, 'entry');

  return safeSql`
    WITH
      merged_sessions AS (${mergedSessions}),
      session_entry_stats AS (
        SELECT
          tupleElement(entry_page, 2) AS path,
          count()                     AS entry_sessions,
          countIf(pageview_count = 1) AS bounces_entry,
          sum(count()) OVER ()        AS total_sessions
        FROM merged_sessions
        WHERE ${entryPathFilter}
        GROUP BY tupleElement(entry_page, 2)
      ),
      page_agg AS (
        SELECT
          path,
          uniqMerge(visitors_state)                                                          AS path_visitors,
          sum(pageviews_state)                                                               AS pageviews,
          if(sum(duration_count) > 0, sum(duration_sum) / sum(duration_count), 0)            AS avg_time_seconds,
          if(sum(scroll_depth_count) > 0, sum(scroll_depth_sum) / sum(scroll_depth_count), 0) AS avg_scroll_depth
        FROM analytics.page_stats
        WHERE site_id = ${SQL.String({ siteId })}
          AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
          AND ${SQL.AND(mvFilters)}
        GROUP BY path
      )
    SELECT
      ses.path,
      ses.entry_sessions                                                                       AS visitors,
      coalesce(pa.pageviews, ses.entry_sessions)                                                AS pageviews,
      if(coalesce(pa.path_visitors, ses.entry_sessions) > 0,
         round(ses.bounces_entry / coalesce(pa.path_visitors, ses.entry_sessions) * 100, 2),
         0)                                                                                     AS bounceRate,
      coalesce(pa.avg_time_seconds, 0)                                                          AS avgTime,
      if(ses.total_sessions > 0, round(ses.entry_sessions / ses.total_sessions * 100, 2), 0)   AS entryRate,
      coalesce(pa.avg_scroll_depth, 0)                                                          AS avgScrollDepth
    FROM session_entry_stats ses
    LEFT ANY JOIN page_agg pa ON ses.path = pa.path
    ORDER BY ses.entry_sessions DESC
    LIMIT {limit:UInt64}
  `;
}

function buildEntryPageAnalyticsSlow(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  return safeSql`
    WITH
      per_session_url AS (
        SELECT
          session_id,
          url AS path,
          countIf(event_type = 'pageview')                                                  AS visits,
          sumIf(duration_seconds,  event_type = 'engagement' AND duration_seconds > 0)      AS dur_sum,
          countIf(                 event_type = 'engagement' AND duration_seconds > 0)      AS dur_count,
          sumIf(scroll_depth_percentage,
                event_type = 'engagement' AND scroll_depth_percentage IS NOT NULL)          AS scroll_sum,
          countIf(event_type = 'engagement' AND scroll_depth_percentage IS NOT NULL)        AS scroll_count
        FROM analytics.events
        WHERE site_id = ${SQL.String({ siteId })}
          AND event_type IN ('pageview', 'engagement')
          AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
          AND ${SQL.AND(filters)}
        GROUP BY session_id, url
      ),
      session_pv AS (
        SELECT session_id, sum(visits) AS pv_count
        FROM per_session_url
        GROUP BY session_id
      ),
      session_entry AS (
        SELECT
          session_id,
          argMin(url, timestamp) AS entry_url
        FROM analytics.events
        WHERE site_id = ${SQL.String({ siteId })}
          AND event_type = 'pageview'
          AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
          AND ${SQL.AND(filters)}
        GROUP BY session_id
      ),
      total_sessions AS (
        SELECT count(DISTINCT session_id) AS total FROM session_entry
      )
    SELECT
      se.entry_url                                                                            AS path,
      uniq(se.session_id)                                                                     AS visitors,
      sum(psu.visits)                                                                         AS pageviews,
      if(uniq(se.session_id) > 0,
         round(countIf(spv.pv_count = 1) / uniq(se.session_id) * 100, 2),
         0)                                                                                    AS bounceRate,
      sum(psu.dur_sum)    / nullIf(sum(psu.dur_count), 0)                                      AS avgTime,
      sum(psu.scroll_sum) / nullIf(sum(psu.scroll_count), 0)                                   AS avgScrollDepth,
      if((SELECT total FROM total_sessions) > 0,
         round(uniq(se.session_id) / (SELECT total FROM total_sessions) * 100, 2),
         0)                                                                                    AS entryRate
    FROM session_entry se
    JOIN session_pv      spv USING (session_id)
    JOIN per_session_url psu ON psu.session_id = se.session_id AND psu.path = se.entry_url
    GROUP BY se.entry_url
    ORDER BY visitors DESC, pageviews DESC
    LIMIT {limit:UInt64}
  `;
}

// ---------------------------------------------------------------------------
// Q3: getExitPageAnalytics — fast/slow dispatch (mirror of Q2)
// ---------------------------------------------------------------------------

export async function getExitPageAnalytics(siteQuery: BASiteQuery, limit = 100): Promise<PageAnalytics[]> {
  const useMv = BAPageQuery.canUseMv(siteQuery);
  const query = useMv ? buildExitPageAnalyticsFast(siteQuery) : buildExitPageAnalyticsSlow(siteQuery);

  const result = (await clickhouse
    .query(query.taggedSql, { params: { ...query.taggedParams, limit } })
    .toPromise()) as any[];

  const mappedResults = result.map((row) => ({
    path: row.path,
    title: row.path,
    visitors: Number(row.visitors),
    pageviews: Number(row.pageviews),
    bounceRate: row.bounceRate,
    avgTime: row.avgTime,
    exitRate: Number(row.exitRate ?? 0),
    avgScrollDepth: row.avgScrollDepth,
  }));

  return PageAnalyticsSchema.array().parse(mappedResults);
}

function buildExitPageAnalyticsFast(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const mvFilters = BAPageQuery.getPageStatsFilters(queryFilters);
  const mergedSessions = BAPageQuery.getMergedSessionsCte({
    siteId,
    startDate: startDateTime,
    endDate: endDateTime,
    queryFilters,
    includeExitPage: true,
  });
  const exitPathFilter = buildEntryOrExitPathFilter(queryFilters, 'exit');

  return safeSql`
    WITH
      merged_sessions AS (${mergedSessions}),
      session_exit_stats AS (
        SELECT
          tupleElement(exit_page, 2) AS path,
          count()                    AS exit_sessions,
          countIf(pageview_count = 1) AS bounces_exit,
          sum(count()) OVER ()       AS total_sessions
        FROM merged_sessions
        WHERE ${exitPathFilter}
        GROUP BY tupleElement(exit_page, 2)
      ),
      page_agg AS (
        SELECT
          path,
          uniqMerge(visitors_state)                                                          AS path_visitors,
          sum(pageviews_state)                                                               AS pageviews,
          if(sum(duration_count) > 0, sum(duration_sum) / sum(duration_count), 0)            AS avg_time_seconds,
          if(sum(scroll_depth_count) > 0, sum(scroll_depth_sum) / sum(scroll_depth_count), 0) AS avg_scroll_depth
        FROM analytics.page_stats
        WHERE site_id = ${SQL.String({ siteId })}
          AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
          AND ${SQL.AND(mvFilters)}
        GROUP BY path
      )
    SELECT
      ses.path,
      ses.exit_sessions                                                                         AS visitors,
      coalesce(pa.pageviews, ses.exit_sessions)                                                  AS pageviews,
      if(coalesce(pa.path_visitors, ses.exit_sessions) > 0,
         round(ses.bounces_exit / coalesce(pa.path_visitors, ses.exit_sessions) * 100, 2),
         0)                                                                                      AS bounceRate,
      coalesce(pa.avg_time_seconds, 0)                                                           AS avgTime,
      if(ses.total_sessions > 0, round(ses.exit_sessions / ses.total_sessions * 100, 2), 0)     AS exitRate,
      coalesce(pa.avg_scroll_depth, 0)                                                           AS avgScrollDepth
    FROM session_exit_stats ses
    LEFT ANY JOIN page_agg pa ON ses.path = pa.path
    ORDER BY ses.exit_sessions DESC
    LIMIT {limit:UInt64}
  `;
}

function buildExitPageAnalyticsSlow(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  return safeSql`
    WITH
      per_session_url AS (
        SELECT
          session_id,
          url AS path,
          countIf(event_type = 'pageview')                                                  AS visits,
          sumIf(duration_seconds,  event_type = 'engagement' AND duration_seconds > 0)      AS dur_sum,
          countIf(                 event_type = 'engagement' AND duration_seconds > 0)      AS dur_count,
          sumIf(scroll_depth_percentage,
                event_type = 'engagement' AND scroll_depth_percentage IS NOT NULL)          AS scroll_sum,
          countIf(event_type = 'engagement' AND scroll_depth_percentage IS NOT NULL)        AS scroll_count
        FROM analytics.events
        WHERE site_id = ${SQL.String({ siteId })}
          AND event_type IN ('pageview', 'engagement')
          AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
          AND ${SQL.AND(filters)}
        GROUP BY session_id, url
      ),
      session_pv AS (
        SELECT session_id, sum(visits) AS pv_count
        FROM per_session_url
        GROUP BY session_id
      ),
      session_exit AS (
        SELECT
          session_id,
          argMax(url, timestamp) AS exit_url
        FROM analytics.events
        WHERE site_id = ${SQL.String({ siteId })}
          AND event_type = 'pageview'
          AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
          AND ${SQL.AND(filters)}
        GROUP BY session_id
      ),
      total_sessions AS (
        SELECT count(DISTINCT session_id) AS total FROM session_exit
      )
    SELECT
      se.exit_url                                                                             AS path,
      uniq(se.session_id)                                                                     AS visitors,
      sum(psu.visits)                                                                         AS pageviews,
      if(uniq(se.session_id) > 0,
         round(countIf(spv.pv_count = 1) / uniq(se.session_id) * 100, 2),
         0)                                                                                    AS bounceRate,
      sum(psu.dur_sum)    / nullIf(sum(psu.dur_count), 0)                                      AS avgTime,
      sum(psu.scroll_sum) / nullIf(sum(psu.scroll_count), 0)                                   AS avgScrollDepth,
      if((SELECT total FROM total_sessions) > 0,
         round(uniq(se.session_id) / (SELECT total FROM total_sessions) * 100, 2),
         0)                                                                                    AS exitRate
    FROM session_exit se
    JOIN session_pv      spv USING (session_id)
    JOIN per_session_url psu ON psu.session_id = se.session_id AND psu.path = se.exit_url
    GROUP BY se.exit_url
    ORDER BY visitors DESC, pageviews DESC
    LIMIT {limit:UInt64}
  `;
}

// ---------------------------------------------------------------------------
// Helper: build a WHERE-clause fragment that constrains
// `tupleElement(entry_page|exit_page, 2)` to match the URL filters in
// `queryFilters` (used by the Q2/Q3 fast paths). Non-URL filters are already
// applied inside the merged-sessions CTE; this helper handles only `url`
// filters (mapped onto entry_page.2 / exit_page.2).
// ---------------------------------------------------------------------------
function buildEntryOrExitPathFilter(
  queryFilters: BASiteQuery['queryFilters'],
  kind: 'entry' | 'exit',
): ReturnType<typeof safeSql> {
  const tupleColumn = kind === 'entry' ? safeSql`tupleElement(entry_page, 2)` : safeSql`tupleElement(exit_page, 2)`;

  const urlFilters = queryFilters.filter((f) => {
    const parsed = parseFilterColumn(f.column);
    return parsed.kind === 'standard' && parsed.col === 'url' && Boolean(f.values?.length);
  });

  if (urlFilters.length === 0) {
    // Non-empty entry/exit URL guard (sessions with no pageview have empty string)
    return safeSql`${tupleColumn} != ''`;
  }

  const fragments = urlFilters.map((filter, idx) => {
    const values = SQL.StringArray({
      [`entry_exit_url_${kind}_${idx}`]: filter.values.map((v) => v.replaceAll('*', '%')),
    });
    return filter.operator === '='
      ? safeSql`arrayExists(pattern -> ${tupleColumn} ILIKE pattern, ${values})`
      : safeSql`arrayAll(pattern -> ${tupleColumn} NOT ILIKE pattern, ${values})`;
  });

  // Always include the non-empty guard so empty-URL sessions never bubble up.
  return SQL.AND([safeSql`${tupleColumn} != ''`, ...fragments]);
}

// ---------------------------------------------------------------------------
// Q4: getDailyAverageTimeOnPage — fast/slow dispatch
// ---------------------------------------------------------------------------

export async function getDailyAverageTimeOnPage(siteQuery: BASiteQuery): Promise<DailyAverageTimeRow[]> {
  const useMv = BAPageQuery.canUseMv(siteQuery);
  const query = useMv ? buildDailyAverageTimeOnPageFast(siteQuery) : buildDailyAverageTimeOnPageSlow(siteQuery);

  const result = (await clickhouse
    .query(query.taggedSql, { params: query.taggedParams })
    .toPromise()) as unknown[];

  return result.map((row) => DailyAverageTimeRowSchema.parse(row));
}

function buildDailyAverageTimeOnPageFast(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const mvFilters = BAPageQuery.getPageStatsFilters(queryFilters);
  const { granularityFunc, fill, timeWrapper } = getPageStatsHourGranularity(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );

  return timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc} AS date,
        if(sum(duration_count) > 0, sum(duration_sum) / sum(duration_count), 0) AS avgTime
      FROM analytics.page_stats
      WHERE site_id = ${SQL.String({ siteId })}
        AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
        AND ${SQL.AND(mvFilters)}
      GROUP BY date
      ORDER BY date ASC ${fill}
      LIMIT 10080
    `,
  );
}

function buildDailyAverageTimeOnPageSlow(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);

  return timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('timestamp')} AS date,
        if(count() > 0, sum(duration_seconds) / count(), 0) AS avgTime
      FROM analytics.events
      WHERE site_id = ${SQL.String({ siteId })}
        AND event_type = 'engagement'
        AND duration_seconds > 0
        AND ${range}
        AND ${SQL.AND(filters)}
      GROUP BY date
      ORDER BY date ASC ${fill}
      LIMIT 10080
    `,
  );
}

// ---------------------------------------------------------------------------
// Q5: getDailyBounceRate — sessions-only fast / events fallback for url filters
// ---------------------------------------------------------------------------

export async function getDailyBounceRate(siteQuery: BASiteQuery): Promise<DailyBounceRateRow[]> {
  // The fast path reads from analytics.sessions via the merged-sessions
  // pattern. It can serve any MV-compatible filter set EXCEPT a `url` filter:
  // the sessions table has only entry_page / exit_page, not a per-pageview
  // URL, so a "sessions that visited /a" predicate can't be expressed there.
  // When a url filter is present (or anything non-MV-compatible), fall back
  // to the events-based legacy slow path which preserves today's behaviour.
  const useMv =
    BAPageQuery.canUseMv(siteQuery) &&
    siteQuery.queryFilters.every((f) => {
      const parsed = parseFilterColumn(f.column);
      return parsed.kind === 'standard' && parsed.col !== 'url';
    });

  const query = useMv ? buildDailyBounceRateFast(siteQuery) : buildDailyBounceRateSlow(siteQuery);

  const result = (await clickhouse
    .query(query.taggedSql, { params: query.taggedParams })
    .toPromise()) as unknown[];

  return result.map((row) => DailyBounceRateRowSchema.parse(row));
}

function buildDailyBounceRateFast(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;

  // Bucket the merged-session rows at the requested granularity. Fast path is
  // gated on canUseHourlyMVBoundaries so granularity is hour/day/week/month.
  const intervalLiteral =
    granularity in HOURLY_GRANULARITY_INTERVAL
      ? HOURLY_GRANULARITY_INTERVAL[granularity as keyof typeof HOURLY_GRANULARITY_INTERVAL]
      : HOURLY_GRANULARITY_INTERVAL.day;
  const validated = HourlyGranularityIntervalSchema.parse(intervalLiteral);
  const interval = safeSql`INTERVAL ${SQL.Unsafe(validated)}`;
  const tz = SQL.String({ timezone });
  const start = SQL.DateTime({ startDate: startDateTime });
  const end = SQL.DateTime({ endDate: endDateTime });

  // Build the merged-sessions inner select inline so we can also pull out
  // `min(session_created_at)` for date bucketing. `getMergedSessionsCte`
  // doesn't expose that column today and Q5 is the only caller that needs
  // it, so we reconstruct it here using the same FINAL-avoidance pattern.
  const sessionFilters = buildSessionsTableFiltersForBounce(queryFilters);

  const granularityFunc = safeSql`toStartOfInterval(min_session_created_at, ${interval}, ${tz})`;
  const intervalFrom = safeSql`toStartOfInterval(${start}, ${interval}, ${tz})`;
  const isCoarseGranularity = granularity === 'week' || granularity === 'month';
  const intervalTo = isCoarseGranularity
    ? safeSql`toStartOfInterval(${end}, ${interval}, ${tz}) + ${interval}`
    : safeSql`toStartOfInterval(addSeconds(${end}, 1), ${interval}, ${tz})`;
  const fill = safeSql`WITH FILL FROM ${intervalFrom} TO ${intervalTo} STEP ${interval}`;

  return safeSql`
    SELECT toTimezone(toDateTime64(date, 0), 'UTC') as date, q.* EXCEPT (date) FROM (
      SELECT
        ${granularityFunc} AS date,
        if(count() > 0, round(countIf(pageview_count = 1) / count() * 100, 2), 0) AS bounceRate
      FROM (
        SELECT
          session_id,
          min(session_created_at) AS min_session_created_at,
          sum(pageview_count)     AS pageview_count
        FROM analytics.sessions
        WHERE site_id = ${SQL.String({ siteId })}
          AND session_created_at BETWEEN ${start} AND ${end}
          AND ${SQL.AND(sessionFilters)}
        GROUP BY session_id
      )
      GROUP BY date
      ORDER BY date ASC ${fill}
      LIMIT 10080
    ) q
  `;
}

/**
 * Inline session-table filter builder for the Q5 fast path. Mirrors the
 * non-url subset of BAPageQuery's session filters, but without the throw
 * on url filters — gating in `getDailyBounceRate` already excludes those.
 * Other non-MV-compatible columns will still throw via canUseMv → fall back
 * to the slow path before reaching here.
 */
function buildSessionsTableFiltersForBounce(
  queryFilters: BASiteQuery['queryFilters'],
): ReturnType<typeof safeSql>[] {
  const SESSION_OK = new Set(['country_code', 'device_type', 'browser', 'os']);
  const fragments = queryFilters
    .filter((f) => {
      const parsed = parseFilterColumn(f.column);
      return parsed.kind === 'standard' && SESSION_OK.has(parsed.col);
    })
    .filter((f) => Boolean(f.column) && Boolean(f.operator) && f.values.every(Boolean));

  if (fragments.length === 0) return [safeSql`1=1`];

  return fragments.map((filter, idx) => {
    const parsed = parseFilterColumn(filter.column);
    const colName = (parsed as { kind: 'standard'; col: string }).col;
    const col = SQL.Unsafe(colName);
    const values = SQL.StringArray({
      [`bounce_session_filter_${idx}`]: filter.values.map((v) => v.replaceAll('*', '%')),
    });
    return filter.operator === '='
      ? safeSql`arrayExists(pattern -> ${col} ILIKE pattern, ${values})`
      : safeSql`arrayAll(pattern -> ${col} NOT ILIKE pattern, ${values})`;
  });
}

function buildDailyBounceRateSlow(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);

  return timeWrapper(
    safeSql`
      WITH
        session_events AS (
          SELECT
            session_id,
            timestamp,
            ${granularityFunc('timestamp')} as event_date
          FROM analytics.events
          WHERE site_id = ${SQL.String({ siteId })}
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
}

// ---------------------------------------------------------------------------
// §6.5 scalar queries: traffic-weighted summary numbers for the Pages page
// header. Both reuse the same fast/slow split as Q1-Q4.
// ---------------------------------------------------------------------------

export async function getAvgTimeOnPageScalar(siteQuery: BASiteQuery): Promise<number> {
  const useMv = BAPageQuery.canUseMv(siteQuery);
  const query = useMv ? buildAvgTimeOnPageScalarFast(siteQuery) : buildAvgTimeOnPageScalarSlow(siteQuery);

  const result = (await clickhouse
    .query(query.taggedSql, { params: query.taggedParams })
    .toPromise()) as Array<{ avgTimeOnPage: number | string | null }>;

  const raw = result[0]?.avgTimeOnPage ?? 0;
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function buildAvgTimeOnPageScalarFast(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const mvFilters = BAPageQuery.getPageStatsFilters(queryFilters);

  return safeSql`
    SELECT sum(duration_sum) / nullIf(sum(duration_count), 0) AS avgTimeOnPage
    FROM analytics.page_stats
    WHERE site_id = ${SQL.String({ siteId })}
      AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND ${SQL.AND(mvFilters)}
  `;
}

function buildAvgTimeOnPageScalarSlow(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  return safeSql`
    SELECT if(count() > 0, sum(duration_seconds) / count(), 0) AS avgTimeOnPage
    FROM analytics.events
    WHERE site_id = ${SQL.String({ siteId })}
      AND event_type = 'engagement'
      AND duration_seconds > 0
      AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND ${SQL.AND(filters)}
  `;
}

export async function getAvgBounceRateScalar(siteQuery: BASiteQuery): Promise<number> {
  // Same gating as Q5: url filters force the events-based fallback, since
  // the sessions table has no per-pageview URL.
  const useMv =
    BAPageQuery.canUseMv(siteQuery) &&
    siteQuery.queryFilters.every((f) => {
      const parsed = parseFilterColumn(f.column);
      return parsed.kind === 'standard' && parsed.col !== 'url';
    });

  const query = useMv ? buildAvgBounceRateScalarFast(siteQuery) : buildAvgBounceRateScalarSlow(siteQuery);

  const result = (await clickhouse
    .query(query.taggedSql, { params: query.taggedParams })
    .toPromise()) as Array<{ avgBounceRate: number | string | null }>;

  const raw = result[0]?.avgBounceRate ?? 0;
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function buildAvgBounceRateScalarFast(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const mergedSessions = BAPageQuery.getMergedSessionsCte({
    siteId,
    startDate: startDateTime,
    endDate: endDateTime,
    queryFilters,
  });

  return safeSql`
    SELECT countIf(pageview_count = 1) / nullIf(count(), 0) * 100 AS avgBounceRate
    FROM (${mergedSessions})
  `;
}

function buildAvgBounceRateScalarSlow(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  return safeSql`
    SELECT if(count() > 0, countIf(page_count = 1) / count() * 100, 0) AS avgBounceRate
    FROM (
      SELECT session_id, count() AS page_count
      FROM analytics.events
      WHERE site_id = ${SQL.String({ siteId })}
        AND event_type = 'pageview'
        AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
        AND ${SQL.AND(filters)}
      GROUP BY session_id
    )
  `;
}
