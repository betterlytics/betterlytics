import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { TopPageWithPageviews, TopPageWithPageviewsSchema } from '@/entities/reports/reports.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getTotalPageviewsCount(siteQuery: BASiteQuery): Promise<number> {
  const { siteId, queryFilters } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT count() AS pageviews
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'pageview'
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
      },
    })
    .toPromise();

  const row = result[0] as { pageviews: number } | undefined;
  return Number(row?.pageviews ?? 0);
}

export async function getTopPagesWithPageviews(
  siteQuery: BASiteQuery,
  limit: number = 10,
): Promise<TopPageWithPageviews[]> {
  const { siteId, queryFilters } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      url,
      count() AS pageviews
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'pageview'
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY url
    ORDER BY pageviews DESC
    LIMIT {limit:UInt32}
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
        limit,
      },
    })
    .toPromise();

  return (result as unknown[]).map((row) => TopPageWithPageviewsSchema.parse(row));
}
