import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { DateString } from '@/types/dates';
import { TopPageWithPageviews, TopPageWithPageviewsSchema } from '@/entities/reports/reports.entities';

export async function getTotalPageviewsCount(
  siteId: string,
  startDate: DateString,
  endDate: DateString,
  queryFilters: QueryFilter[] = [],
): Promise<number> {
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
  siteId: string,
  startDate: DateString,
  endDate: DateString,
  limit: number = 10,
  queryFilters: QueryFilter[] = [],
): Promise<TopPageWithPageviews[]> {
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
