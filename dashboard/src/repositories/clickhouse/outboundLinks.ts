import {
  OutboundLinkRow,
  OutboundLinkRowSchema,
  DailyOutboundClicksRow,
  DailyOutboundClicksRowSchema,
} from '@/entities/outboundLinks';
import { clickhouse } from '@/lib/clickhouse';
import { DateTimeString } from '@/types/dates';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { BAQuery } from '@/lib/ba-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { QueryFilter } from '@/entities/filter';

/**
 * Get outbound links analytics data for table display
 */
export async function getOutboundLinksAnalytics(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
  limit: number = 100,
): Promise<OutboundLinkRow[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    WITH source_data AS (
      SELECT 
        outbound_link_url,
        url as source_url,
        count() as clicks_from_source
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND event_type = 'outbound_link'
        AND outbound_link_url != ''
        AND ${SQL.AND(filters)}
      GROUP BY outbound_link_url, source_url
    ),
    top_sources AS (
      SELECT 
        outbound_link_url,
        source_url as top_source_url,
        ROW_NUMBER() OVER (PARTITION BY outbound_link_url ORDER BY clicks_from_source DESC) as rn
      FROM source_data
    )
    SELECT 
      e.outbound_link_url,
      uniq(e.visitor_id) as clicks,
      ts.top_source_url,
      uniqExact(e.url) as source_url_count,
      uniq(e.visitor_id) as unique_visitors
    FROM analytics.events e
    LEFT JOIN top_sources ts ON e.outbound_link_url = ts.outbound_link_url AND ts.rn = 1
    WHERE e.site_id = {site_id:String}
      AND e.timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND e.event_type = 'outbound_link'
      AND e.outbound_link_url != ''
      AND ${SQL.AND(filters)}
    GROUP BY e.outbound_link_url, ts.top_source_url
    ORDER BY clicks DESC
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

  return OutboundLinkRowSchema.array().parse(result);
}

/**
 * Get daily outbound clicks chart data
 */
export async function getDailyOutboundClicks(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
): Promise<DailyOutboundClicksRow[]> {
  const granularityFunc = BAQuery.getGranularitySQLFunctionFromGranularityRange(granularity);
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT 
      ${granularityFunc('timestamp', startDate)} as date,
      uniq(visitor_id, outbound_link_url) as outboundClicks
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND event_type = 'outbound_link'
      AND outbound_link_url != ''
      AND ${SQL.AND(filters)}
    GROUP BY date
    ORDER BY date ASC
    LIMIT 10080
  `;

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

  return result.map((row) => DailyOutboundClicksRowSchema.parse(row));
}

/**
 * Get outbound links distribution for pie chart (top 9 + others)
 */
export async function getOutboundLinksDistribution(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<Array<{ outbound_link_url: string; clicks: number }>> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  // Query 1: Get top 9 outbound links
  const topQuery = safeSql`
    SELECT 
      outbound_link_url,
      uniq(visitor_id) as clicks
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND event_type = 'outbound_link'
      AND outbound_link_url != ''
      AND ${SQL.AND(filters)}
    GROUP BY outbound_link_url
    ORDER BY clicks DESC
    LIMIT 9
  `;

  // Query 2: Get total clicks across all outbound links
  const totalQuery = safeSql`
    SELECT 
      uniq(visitor_id) as total_clicks
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND event_type = 'outbound_link'
      AND outbound_link_url != ''
      AND ${SQL.AND(filters)}
  `;

  const [top9Result, totalResult] = await Promise.all([
    clickhouse
      .query(topQuery.taggedSql, {
        params: {
          ...topQuery.taggedParams,
          site_id: siteId,
          start: startDate,
          end: endDate,
        },
      })
      .toPromise(),
    clickhouse
      .query(totalQuery.taggedSql, {
        params: {
          ...totalQuery.taggedParams,
          site_id: siteId,
          start: startDate,
          end: endDate,
        },
      })
      .toPromise(),
  ]);

  const topData = top9Result as Array<{ outbound_link_url: string; clicks: number }>;
  const totalClicks = (totalResult as Array<{ total_clicks: number }>)[0]?.total_clicks || 0;

  const topSum = topData.reduce((sum, item) => sum + item.clicks, 0);
  const othersClicks = totalClicks - topSum;

  const result = [...topData];

  if (othersClicks > 0) {
    result.push({
      outbound_link_url: 'Others',
      clicks: othersClicks,
    });
  }

  return result;
}

/**
 * Get summary statistics for outbound links
 */
export async function getOutboundLinksSummary(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<{
  totalClicks: number;
  uniqueVisitors: number;
  topDomain: string | null;
  topSourceUrl: string | null;
}> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT 
      uniq(visitor_id) as totalClicks,
      uniq(visitor_id) as uniqueVisitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND event_type = 'outbound_link'
      AND outbound_link_url != ''
      AND ${SQL.AND(filters)}
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

  // Get top domain
  const topDomainQuery = safeSql`
    SELECT splitByChar('/', outbound_link_url)[1] as domain
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND event_type = 'outbound_link'
      AND outbound_link_url != ''
      AND ${SQL.AND(filters)}
    GROUP BY domain
    ORDER BY uniq(visitor_id) DESC
    LIMIT 1
  `;

  const topDomainResult = (await clickhouse
    .query(topDomainQuery.taggedSql, {
      params: {
        ...topDomainQuery.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
      },
    })
    .toPromise()) as any[];

  // Get top source URL
  const topSourceUrlQuery = safeSql`
    SELECT url as source_url
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND event_type = 'outbound_link'
      AND outbound_link_url != ''
      AND ${SQL.AND(filters)}
    GROUP BY source_url
    ORDER BY uniq(visitor_id) DESC
    LIMIT 1
  `;

  const topSourceUrlResult = (await clickhouse
    .query(topSourceUrlQuery.taggedSql, {
      params: {
        ...topSourceUrlQuery.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
      },
    })
    .toPromise()) as any[];

  return {
    totalClicks: result[0]?.totalClicks || 0,
    uniqueVisitors: result[0]?.uniqueVisitors || 0,
    topDomain: topDomainResult[0]?.domain || null,
    topSourceUrl: topSourceUrlResult[0]?.source_url || null,
  };
}
