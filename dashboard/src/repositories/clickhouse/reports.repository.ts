import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BAPageQuery } from '@/lib/ba-pages-query';
import { TopPageWithPageviews, TopPageWithPageviewsSchema } from '@/entities/reports/reports.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getTotalPageviewsCount(siteQuery: BASiteQuery): Promise<number> {
  const useMv = BAPageQuery.canUseMv(siteQuery);
  const query = useMv ? buildTotalPageviewsCountFast(siteQuery) : buildTotalPageviewsCountSlow(siteQuery);

  const result = await clickhouse
    .query(query.taggedSql, { params: query.taggedParams })
    .toPromise();

  const row = result[0] as { pageviews: number | string | null } | undefined;
  return Number(row?.pageviews ?? 0);
}

function buildTotalPageviewsCountFast(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const mvFilters = BAPageQuery.getPageStatsFilters(queryFilters);

  return safeSql`
    SELECT sum(pageviews_state) AS pageviews
    FROM analytics.page_stats
    WHERE site_id = ${SQL.String({ siteId })}
      AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND ${SQL.AND(mvFilters)}
  `;
}

function buildTotalPageviewsCountSlow(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  return safeSql`
    SELECT count() AS pageviews
    FROM analytics.events
    WHERE site_id = ${SQL.String({ siteId })}
      AND event_type = 'pageview'
      AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND ${SQL.AND(filters)}
  `;
}

export async function getTopPagesWithPageviews(
  siteQuery: BASiteQuery,
  limit: number = 10,
): Promise<TopPageWithPageviews[]> {
  const useMv = BAPageQuery.canUseMv(siteQuery);
  const query = useMv ? buildTopPagesWithPageviewsFast(siteQuery) : buildTopPagesWithPageviewsSlow(siteQuery);

  const result = await clickhouse
    .query(query.taggedSql, { params: { ...query.taggedParams, limit } })
    .toPromise();

  return (result as unknown[]).map((row) => TopPageWithPageviewsSchema.parse(row));
}

function buildTopPagesWithPageviewsFast(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const mvFilters = BAPageQuery.getPageStatsFilters(queryFilters);

  return safeSql`
    SELECT
      path AS url,
      sum(pageviews_state) AS pageviews
    FROM analytics.page_stats
    WHERE site_id = ${SQL.String({ siteId })}
      AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND ${SQL.AND(mvFilters)}
    GROUP BY path
    ORDER BY pageviews DESC
    LIMIT {limit:UInt32}
  `;
}

function buildTopPagesWithPageviewsSlow(siteQuery: BASiteQuery) {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  return safeSql`
    SELECT
      url,
      count() AS pageviews
    FROM analytics.events
    WHERE site_id = ${SQL.String({ siteId })}
      AND event_type = 'pageview'
      AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND ${SQL.AND(filters)}
    GROUP BY url
    ORDER BY pageviews DESC
    LIMIT {limit:UInt32}
  `;
}
