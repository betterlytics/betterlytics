import { clickhouse } from '@/lib/clickhouse';
import { DateTimeString } from '@/types/dates';
import { GeoVisitor, GeoVisitorSchema } from '@/entities/geography';
import { safeSql, SQL } from '@/lib/safe-sql';
import { QueryFilter } from '@/entities/filter';
import { BAQuery } from '@/lib/ba-query';

/**
 * Retrieves visitor data aggregated by country code
 * @param limit Limit for top countries. Defaults to 1000 to get all countries in practice.
 */
export async function getVisitorsByCountry(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
  limit: number = 1000
): Promise<GeoVisitor[]> {
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

  const result = await clickhouse.query(query.taggedSql, {
    params: {
      ...query.taggedParams,
      site_id: siteId,
      start: startDate,
      end: endDate,
      limit,
    },
  }).toPromise() as any[];

  return result.map(row => 
    GeoVisitorSchema.parse({
      country_code: row.country_code,
      visitors: Number(row.visitors)
    })
  );
}