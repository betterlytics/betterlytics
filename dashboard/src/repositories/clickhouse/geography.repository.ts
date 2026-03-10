import { clickhouse } from '@/lib/clickhouse';
import { GeoVisitor, GeoVisitorSchema } from '@/entities/analytics/geography.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getVisitorsByCountry(siteQuery: BASiteQuery, limit: number = 1000): Promise<GeoVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      country_code,
      uniq(visitor_id) as visitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND country_code IS NOT NULL
      AND country_code != ''
      AND ${SQL.AND(filters)}
    GROUP BY country_code
    ORDER BY visitors DESC
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

  return result.map((row) =>
    GeoVisitorSchema.parse({
      country_code: row.country_code,
      visitors: Number(row.visitors),
    }),
  );
}

export async function getVisitorsBySubdivision(
  siteQuery: BASiteQuery,
  limit: number = 1000,
): Promise<GeoVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      subdivision_code AS code,
      country_code,
      uniq(visitor_id) as visitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND subdivision_code IS NOT NULL
      AND subdivision_code != ''
      AND ${SQL.AND(filters)}
    GROUP BY code, country_code
    ORDER BY visitors DESC
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

  return result.map((row) =>
    GeoVisitorSchema.parse({
      country_code: row.country_code,
      subdivision_code: row.code,
      visitors: Number(row.visitors),
    }),
  );
}

export async function getVisitorsByCity(
  siteQuery: BASiteQuery,
  limit: number = 1000,
): Promise<GeoVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      city AS code,
      country_code,
      uniq(visitor_id) as visitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND city IS NOT NULL
      AND city != ''
      AND ${SQL.AND(filters)}
    GROUP BY code, country_code
    ORDER BY visitors DESC
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

  return result.map((row) =>
    GeoVisitorSchema.parse({
      country_code: row.country_code,
      city: row.code,
      visitors: Number(row.visitors),
    }),
  );
}
