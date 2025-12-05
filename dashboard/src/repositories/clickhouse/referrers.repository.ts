import {
  ReferrerSourceAggregation,
  ReferrerSourceAggregationSchema,
  ReferrerTrafficBySourceRow,
  ReferrerTrafficBySourceRowSchema,
  TopReferrerUrl,
  TopReferrerUrlSchema,
  TopChannel,
  TopChannelSchema,
  TopReferrerSource,
  TopReferrerSourceSchema,
  DailyReferralSessionsRow,
  DailyReferralSessionsRowSchema,
  DailyReferralPercentageRow,
  DailyReferralPercentageRowSchema,
  DailyReferralSessionDurationRow,
  DailyReferralSessionDurationRowSchema,
} from '@/entities/analytics/referrers';
import { clickhouse } from '@/lib/clickhouse';
import { DateTimeString } from '@/types/dates';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { BAQuery } from '@/lib/ba-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { QueryFilter } from '@/entities/analytics/filter';

/**
 * Get the distribution of referrers by source type using unique sessions
 */
export async function getReferrerDistribution(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<ReferrerSourceAggregation[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT 
      referrer_source,
      uniq(session_id) as visitorCount
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp >= {start:DateTime}
      AND timestamp <= {end:DateTime}
      AND referrer_source != 'internal'
      AND ${SQL.AND(filters)}
    GROUP BY referrer_source
    ORDER BY visitorCount DESC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
      },
    })
    .toPromise()) as any[];

  return ReferrerSourceAggregationSchema.array().parse(result);
}

/**
 * Get the traffic trend for referrers grouped by source with specified granularity
 */
export async function getReferrerTrafficTrendBySource(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<ReferrerTrafficBySourceRow[]> {
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDate,
    endDate,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);
  const query = timeWrapper(
    safeSql`
      SELECT 
        ${granularityFunc('timestamp')} as date,
        referrer_source,
        uniq(session_id) as count
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND ${range}
        AND referrer_source != 'internal'
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
        start: startDate,
        end: endDate,
      },
    })
    .toPromise()) as any[];

  return ReferrerTrafficBySourceRowSchema.array().parse(result);
}

/**
 * Get detailed referrer data for the table display
 * Including visits, bounce rate, and visit duration by referrer source
 */
export async function getReferrerTableData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
  limit: number = 100,
): Promise<any[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    WITH session_data AS (
      SELECT
        session_id,
        referrer_source as source_type,
        referrer_source_name as source_name,
        referrer_url as source_url,
        count() as page_count,
        if(count() > 1,
          dateDiff('second', min(timestamp), max(timestamp)),
          0
        ) as duration_seconds
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND referrer_source != 'internal'
        AND ${SQL.AND(filters)}
      GROUP BY session_id, source_type, source_name, source_url
    )
    SELECT 
      source_type,
      source_name,
      source_url,
      count() as visits,
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
        start: startDate,
        end: endDate,
        limit,
      },
    })
    .toPromise()) as any[];

  return result;
}

/**
 * Get top referrer URLs with visit counts
 */
export async function getTopReferrerUrls(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
  limit: number = 10,
): Promise<TopReferrerUrl[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT 
      referrer_url,
      uniq(session_id) as visits
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND referrer_url != ''
      AND referrer_source != 'direct'
      AND referrer_source != 'internal'
      AND ${SQL.AND(filters)}
    GROUP BY referrer_url
    ORDER BY visits DESC
    LIMIT {limit:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
        limit,
      },
    })
    .toPromise()) as any[];

  return TopReferrerUrlSchema.array().parse(result);
}

/**
 * Get top traffic channels (aggregated by referrer_source) with visit counts
 */
export async function getTopChannels(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
  limit: number = 10,
): Promise<TopChannel[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT 
      referrer_source as channel,
      uniq(session_id) as visits
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND referrer_source != 'internal'
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
        start: startDate,
        end: endDate,
        limit,
      },
    })
    .toPromise()) as any[];

  return TopChannelSchema.array().parse(result);
}

/**
 * Get top referrer sources with visit counts
 */
export async function getTopReferrerSources(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
  limit: number = 10,
): Promise<TopReferrerSource[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT 
      referrer_source,
      uniq(session_id) as visits
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND referrer_source != 'direct'
      AND referrer_source != 'internal'
      AND ${SQL.AND(filters)}
    GROUP BY referrer_source
    ORDER BY visits DESC
    LIMIT {limit:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
        limit,
      },
    })
    .toPromise()) as any[];

  return TopReferrerSourceSchema.array().parse(result);
}

/**
 * Get daily referral sessions chart data (aggregated across all sources)
 */
export async function getDailyReferralSessions(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<DailyReferralSessionsRow[]> {
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDate,
    endDate,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);
  const query = timeWrapper(
    safeSql`
      SELECT 
        ${granularityFunc('timestamp')} as date,
        uniq(session_id) as referralSessions
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND ${range}
        AND referrer_source != 'direct'
        AND referrer_source != 'internal'
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
        start_date: startDate,
        end_date: endDate,
      },
    })
    .toPromise()) as unknown[];

  return result.map((row) => DailyReferralSessionsRowSchema.parse(row));
}

/**
 * Get daily referral traffic percentage chart data
 */
export async function getDailyReferralTrafficPercentage(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<DailyReferralPercentageRow[]> {
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDate,
    endDate,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);
  const query = timeWrapper(
    safeSql`
      WITH daily_stats AS (
        SELECT 
          ${granularityFunc('timestamp')} as date,
          uniq(session_id) as totalSessions,
          uniqIf(session_id, referrer_source != 'direct' AND referrer_source != 'internal') as referralSessions
        FROM analytics.events
        WHERE site_id = {site_id:String}
          AND ${range}
          AND ${SQL.AND(filters)}
        GROUP BY date
      )
      SELECT 
        date,
        if(totalSessions > 0, 
          round(referralSessions / totalSessions * 100, 1), 
          0
        ) as referralPercentage
      FROM daily_stats
      ORDER BY date ASC ${fill}
      LIMIT 10080
    `,
  );

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
      },
    })
    .toPromise()) as unknown[];

  return result.map((row) => DailyReferralPercentageRowSchema.parse(row));
}

/**
 * Get daily average session duration chart data for referral traffic
 */
export async function getDailyReferralSessionDuration(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<DailyReferralSessionDurationRow[]> {
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDate,
    endDate,
  );
  const filters = BAQuery.getFilterQuery(queryFilters);
  const query = timeWrapper(
    safeSql`
      WITH session_durations AS (
        SELECT 
          ${granularityFunc('timestamp')} as date,
          session_id,
          max(timestamp) - min(timestamp) as session_duration_seconds
        FROM analytics.events
        WHERE site_id = {site_id:String}
          AND ${range}
          AND referrer_source != 'direct'
          AND referrer_source != 'internal'
          AND ${SQL.AND(filters)}
        GROUP BY date, session_id
      )
      SELECT 
        date,
        round(avg(session_duration_seconds), 1) as avgSessionDuration
      FROM session_durations
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
        start_date: startDate,
        end_date: endDate,
      },
    })
    .toPromise()) as unknown[];

  return result.map((row) => DailyReferralSessionDurationRowSchema.parse(row));
}

/**
 * Get the top referrer source (excluding direct and internal traffic) for summary display
 */
export async function getTopReferrerSource(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<string | null> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT referrer_source
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND referrer_source != 'direct'
      AND referrer_source != 'internal'
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
        start: startDate,
        end: endDate,
      },
    })
    .toPromise()) as any[];

  return result.length > 0 ? result[0].referrer_source : null;
}
