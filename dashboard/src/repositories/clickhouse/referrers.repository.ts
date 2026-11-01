import {
  ReferrerSourceAggregation,
  ReferrerSourceAggregationSchema,
  ReferrerTrafficBySourceRow,
  ReferrerTrafficBySourceRowSchema,
  TopChannel,
  TopChannelSchema,
  DailyReferralSummaryMetricsRow,
  DailyReferralSummaryMetricsRowSchema,
  ReferralRangeMetrics,
  ReferralRangeMetricsSchema,
  ReferrerUrlRollupRow,
  ReferrerUrlRollupRowSchema,
} from '@/entities/analytics/referrers.entities';
import { clickhouse } from '@/lib/clickhouse';
import { BAQuery } from '@/lib/ba-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BASessionQuery } from '@/lib/ba-session-query';
import { SessionMetricSql } from '@/lib/session-metrics-sql';

/**
 * Get the distribution of referrers by source type using unique sessions
 */
export async function getReferrerDistribution(siteQuery: BASiteQuery): Promise<ReferrerSourceAggregation[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = safeSql`
    SELECT
      referrer_source_effective as referrer_source,
      uniq(session_id) * any(_sample_factor) as visitorCount
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp >= {start:DateTime}
      AND timestamp <= {end:DateTime}
      AND referrer_source_effective != 'internal'
      AND ${SQL.AND(filters)}
    GROUP BY referrer_source
    ORDER BY visitorCount DESC
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

  return ReferrerSourceAggregationSchema.array().parse(result);
}

/**
 * Get the traffic trend for referrers grouped by source with specified granularity
 */
export async function getReferrerTrafficTrendBySource(
  siteQuery: BASiteQuery,
): Promise<ReferrerTrafficBySourceRow[]> {
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
        referrer_source_effective as referrer_source,
        uniq(session_id) * any(_sample_factor) as count
      FROM analytics.events ${sample}
      WHERE site_id = {site_id:String}
        AND ${range}
        AND referrer_source_effective != 'internal'
        AND ${SQL.AND(filters)}
      GROUP BY date, referrer_source
      ORDER BY date ASC ${fill}, count DESC
    `,
  );

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

  return ReferrerTrafficBySourceRowSchema.array().parse(result);
}

/**
 * Get detailed referrer data for the table display
 * Including visits, bounce rate, and visit duration by referrer source
 */
export async function getReferrerTableData(siteQuery: BASiteQuery, limit: number = 100): Promise<any[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = safeSql`
    WITH session_data AS (
      SELECT
        session_id,
        referrer_source_effective as source_type,
        referrer_source_name as source_name,
        referrer_url as source_url,
        count() as page_count,
        if(count() > 1,
          dateDiff('second', min(timestamp), max(timestamp)),
          0
        ) as duration_seconds,
        any(_sample_factor) as _sample_factor
      FROM analytics.events ${sample}
      WHERE site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND referrer_source_effective != 'internal'
        AND ${SQL.AND(filters)}
      GROUP BY session_id, source_type, source_name, source_url
    )
    SELECT
      source_type,
      source_name,
      source_url,
      count() * any(_sample_factor) as visits,
      if(count() > 0,
        round((count() - countIf(page_count > 1)) / count() * 100, 1),
        0
      ) as bounce_rate,
      if(countIf(page_count > 1) > 0,
        avgIf(duration_seconds, page_count > 1),
        0
      ) as avg_visit_duration
    FROM session_data
    GROUP BY source_type, source_name, source_url
    ORDER BY visits DESC
    LIMIT {limit:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        limit,
      },
    })
    .toPromise()) as any[];

  return result;
}

export async function getReferrerUrlRollup(
  siteQuery: BASiteQuery,
  limit: number = 10,
): Promise<ReferrerUrlRollupRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = safeSql`
    WITH enriched AS (
      SELECT
        cutToFirstSignificantSubdomain(concat('http://', referrer_url)) as source_name,
        referrer_url,
        referrer_source_name,
        session_id,
        _sample_factor
      FROM analytics.events ${sample}
      WHERE site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND referrer_url != ''
        AND referrer_source_effective != 'direct'
        AND referrer_source_effective != 'internal'
        AND ${SQL.AND(filters)}
    ),
    top_parents AS (
      SELECT source_name
      FROM enriched
      WHERE source_name != ''
      GROUP BY source_name
      ORDER BY uniq(session_id) DESC
      LIMIT {limit:UInt32}
    )
    SELECT
      source_name,
      referrer_url,
      uniq(session_id) * any(_sample_factor) as visitors,
      /* pre-#813 events store legacy parser names here, not root domains; topK picks the majority */
      arrayElement(topK(1)(nullIf(referrer_source_name, '')), 1) as stored_source_name,
      grouping(referrer_url) as is_rollup
    FROM enriched
    WHERE source_name IN (SELECT source_name FROM top_parents)
    GROUP BY GROUPING SETS ((source_name, referrer_url), (source_name))
    HAVING (is_rollup = 0 AND referrer_url != '') OR is_rollup = 1
    ORDER BY is_rollup DESC, visitors DESC
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        limit,
      },
    })
    .toPromise();

  return ReferrerUrlRollupRowSchema.array().parse(result);
}

/**
 * Get top traffic channels (aggregated by referrer_source) with visit counts
 */
export async function getTopChannels(siteQuery: BASiteQuery, limit: number = 10): Promise<TopChannel[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = safeSql`
    SELECT
      referrer_source_effective as channel,
      uniq(session_id) * any(_sample_factor) as visits
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND referrer_source_effective != 'internal'
      AND ${SQL.AND(filters)}
    GROUP BY channel
    ORDER BY visits DESC
    LIMIT {limit:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        limit,
      },
    })
    .toPromise()) as any[];

  return TopChannelSchema.array().parse(result);
}

const isReferralSession = safeSql`referrer_source_effective NOT IN ('direct', 'internal')`;
const isMultiPageReferralSession = safeSql`${isReferralSession} AND pageview_count > 1`;
const referralSessionDuration = safeSql`if(countIf(${isMultiPageReferralSession}) > 0, avgIf(dateDiff('second', session_start, session_end), ${isMultiPageReferralSession}), 0)`;

/**
 * Referral summary over the whole range from session records, so each session counts once.
 * Duration leaves out single-pageview sessions, like the Overview's avg visit duration.
 */
export async function getReferralRangeMetrics(siteQuery: BASiteQuery): Promise<ReferralRangeMetrics> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['session_start', 'session_end', 'pageview_count', 'referrer_source_effective'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const query = safeSql`
    SELECT
      countIf(${isReferralSession}) AS referralSessions,
      ${SessionMetricSql.sessions} AS totalSessions,
      round(${referralSessionDuration}, 1) AS avgSessionDuration
    FROM ${sessionSubQuery}
  `;

  const result = await clickhouse.query(query.taggedSql, { params: query.taggedParams }).toPromise();

  return ReferralRangeMetricsSchema.parse(result[0]);
}

/**
 * Referral sparkline series from session records, each session placed in the bucket it started in
 */
export async function getDailyReferralSummaryMetrics(
  siteQuery: BASiteQuery,
): Promise<DailyReferralSummaryMetricsRow[]> {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { fill, timeWrapper, granularityFunc } = BASessionQuery.getSessionStartRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );

  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['session_created_at', 'session_start', 'session_end', 'pageview_count', 'referrer_source_effective'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const query = timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('session_created_at')} AS date,
        countIf(${isReferralSession}) AS referralSessions,
        if(${SessionMetricSql.sessions} > 0, round(100 * referralSessions / ${SessionMetricSql.sessions}, 1), 0) AS referralPercentage,
        round(${referralSessionDuration}, 1) AS avgSessionDuration
      FROM ${sessionSubQuery}
      GROUP BY date
      ORDER BY date ASC ${fill}
      LIMIT 10080
    `,
  );

  const result = (await clickhouse
    .query(query.taggedSql, { params: query.taggedParams })
    .toPromise()) as unknown[];

  return DailyReferralSummaryMetricsRowSchema.array().parse(result);
}

/**
 * Get the top referrer source (excluding direct and internal traffic) for summary display
 */
export async function getTopReferrerSource(siteQuery: BASiteQuery): Promise<string | null> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = safeSql`
    SELECT referrer_source_effective as referrer_source
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND referrer_source_effective != 'direct'
      AND referrer_source_effective != 'internal'
      AND ${SQL.AND(filters)}
    GROUP BY referrer_source
    ORDER BY uniq(session_id) DESC
    LIMIT 1
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

  return result.length > 0 ? result[0].referrer_source : null;
}
