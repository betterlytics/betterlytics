import { clickhouse } from '@/lib/clickhouse';
import { GeoFeatureVisitor, GeoFeatureVisitorSchema, GeoLevel, GeoLevelSchema } from '@/entities/analytics/geography.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

/**
 * Retrieves visitor data aggregated by a geographic level (country, subdivision, etc.)
 * @param level The ClickHouse column to group by (validated via GeoLevelSchema)
 * @param parentFilter Optional parent-level filter (e.g. country_code = 'US' when querying subdivisions)
 * @param limit Defaults to 1000
 */
export async function getVisitorsByGeoLevel(
  siteQuery: BASiteQuery,
  level: GeoLevel,
  parentFilter?: { column: GeoLevel; value: string },
  limit: number = 1000,
  minVisitors: number = 0,
): Promise<GeoFeatureVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  // Safe to use SQL.Unsafe: GeoLevelSchema.parse() validates against a closed enum of allowed column names
  const validatedLevel = GeoLevelSchema.parse(level);
  const filters = BAQuery.getFilterQuery(queryFilters);

  const parentClause = parentFilter
    ? safeSql`AND ${SQL.Unsafe(GeoLevelSchema.parse(parentFilter.column))} = ${SQL.String({ parent_filter_value: parentFilter.value })}`
    : safeSql``;

  const includeCountryCode = validatedLevel !== 'country_code';

  const query = safeSql`
    SELECT
      ${SQL.Unsafe(validatedLevel)} AS code,
      ${includeCountryCode ? safeSql`any(country_code) AS parent_country_code,` : safeSql``}
      uniq(visitor_id) as visitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.Unsafe(validatedLevel)} IS NOT NULL
      AND ${SQL.Unsafe(validatedLevel)} != ''
      ${parentClause}
      AND ${SQL.AND(filters)}
    GROUP BY code
    ${minVisitors > 0 ? safeSql`HAVING visitors >= {min_visitors:UInt32}` : safeSql``}
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
        ...(minVisitors > 0 ? { min_visitors: minVisitors } : {}),
      },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    GeoFeatureVisitorSchema.parse({
      code: row.code,
      visitors: Number(row.visitors),
      ...(includeCountryCode && row.parent_country_code ? { countryCode: row.parent_country_code } : {}),
    }),
  );
}
