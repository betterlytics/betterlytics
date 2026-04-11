import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BAPageQuery } from '@/lib/ba-pages-query';
import { TopPageWithPageviews, TopPageWithPageviewsSchema } from '@/entities/reports/reports.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getTotalPageviewsCount(siteQuery: BASiteQuery): Promise<number> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  const query = BAPageQuery.canUseMv(siteQuery)
    ? safeSql`
        SELECT sum(pageviews_state) AS pageviews
        FROM analytics.page_stats
        WHERE site_id = {site_id:String}
          AND hour BETWEEN {start:DateTime} AND toStartOfHour(subtractSeconds({end:DateTime}, 1))
          AND ${SQL.AND(BAPageQuery.getPagePathFilters(queryFilters))}
      `
    : safeSql`
        SELECT count() AS pageviews
        FROM analytics.events
        WHERE site_id = {site_id:String}
          AND event_type = 'pageview'
          AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
          AND ${SQL.AND(BAQuery.getFilterQuery(queryFilters))}
      `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime },
    })
    .toPromise();

  const row = result[0] as { pageviews: number } | undefined;
  return Number(row?.pageviews ?? 0);
}

export async function getTopPagesWithPageviews(
  siteQuery: BASiteQuery,
  limit: number = 10,
): Promise<TopPageWithPageviews[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  const query = BAPageQuery.canUseMv(siteQuery)
    ? safeSql`
        SELECT path AS url, sum(pageviews_state) AS pageviews
        FROM analytics.page_stats
        WHERE site_id = {site_id:String}
          AND hour BETWEEN {start:DateTime} AND toStartOfHour(subtractSeconds({end:DateTime}, 1))
          AND ${SQL.AND(BAPageQuery.getPagePathFilters(queryFilters))}
        GROUP BY path
        ORDER BY pageviews DESC
        LIMIT {limit:UInt32}
      `
    : safeSql`
        SELECT url, count() AS pageviews
        FROM analytics.events
        WHERE site_id = {site_id:String}
          AND event_type = 'pageview'
          AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
          AND ${SQL.AND(BAQuery.getFilterQuery(queryFilters))}
        GROUP BY url
        ORDER BY pageviews DESC
        LIMIT {limit:UInt32}
      `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
    })
    .toPromise();

  return (result as unknown[]).map((row) => TopPageWithPageviewsSchema.parse(row));
}
