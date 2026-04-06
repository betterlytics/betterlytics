import { clickhouse } from '@/lib/clickhouse';
import { GeoVisitor, GeoVisitorSchema } from '@/entities/analytics/geography.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BASessionQuery } from '@/lib/ba-session-query';

export async function getVisitorsByCountry(siteQuery: BASiteQuery, limit: number = 1000): Promise<GeoVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  if (!BASessionQuery.canUseHourlyMV(siteQuery)) {
    const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
      ['country_code', 'visitor_id'],
      queryFilters,
      siteId,
      startDateTime,
      endDateTime,
    );

    const query = safeSql`
      SELECT country_code, uniq(visitor_id) as visitors
      FROM ${sessionSubQuery}
      WHERE country_code IS NOT NULL AND country_code != ''
      GROUP BY country_code
      ORDER BY visitors DESC
      LIMIT {limit:UInt32}
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
      })
      .toPromise()) as any[];

    return result.map((row) =>
      GeoVisitorSchema.parse({ country_code: row.country_code, visitors: Number(row.visitors) }),
    );
  }

  const query = safeSql`
    SELECT country_code, uniqMerge(visitors) as visitors
    FROM analytics.overview_hourly
    WHERE site_id = ${SQL.String({ siteId })}
      AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND country_code != ''
    GROUP BY country_code
    ORDER BY visitors DESC
    LIMIT {limit:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    GeoVisitorSchema.parse({ country_code: row.country_code, visitors: Number(row.visitors) }),
  );
}

export async function getVisitorsBySubdivision(
  siteQuery: BASiteQuery,
  limit: number = 1000,
): Promise<GeoVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  if (!BASessionQuery.canUseHourlyMV(siteQuery)) {
    const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
      ['subdivision_code', 'country_code', 'visitor_id'],
      queryFilters,
      siteId,
      startDateTime,
      endDateTime,
    );

    const query = safeSql`
      SELECT subdivision_code AS code, country_code, uniq(visitor_id) as visitors
      FROM ${sessionSubQuery}
      WHERE subdivision_code != ''
      GROUP BY code, country_code
      ORDER BY visitors DESC
      LIMIT {limit:UInt32}
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
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

  const query = safeSql`
    SELECT subdivision_code AS code, country_code, uniqMerge(visitors) as visitors
    FROM analytics.geo_hourly
    WHERE site_id = ${SQL.String({ siteId })}
      AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND subdivision_code != ''
    GROUP BY code, country_code
    ORDER BY visitors DESC
    LIMIT {limit:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
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

export async function getVisitorsByCity(siteQuery: BASiteQuery, limit: number = 1000): Promise<GeoVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  if (!BASessionQuery.canUseHourlyMV(siteQuery)) {
    const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
      ['city', 'subdivision_code', 'country_code', 'visitor_id'],
      queryFilters,
      siteId,
      startDateTime,
      endDateTime,
    );

    const query = safeSql`
      SELECT city AS code, subdivision_code, country_code, uniq(visitor_id) as visitors
      FROM ${sessionSubQuery}
      WHERE city != ''
      GROUP BY code, subdivision_code, country_code
      ORDER BY visitors DESC
      LIMIT {limit:UInt32}
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
      })
      .toPromise()) as any[];

    return result.map((row) =>
      GeoVisitorSchema.parse({
        country_code: row.country_code,
        subdivision_code: row.subdivision_code,
        city: row.code,
        visitors: Number(row.visitors),
      }),
    );
  }

  const query = safeSql`
    SELECT city AS code, subdivision_code, country_code, uniqMerge(visitors) as visitors
    FROM analytics.geo_hourly
    WHERE site_id = ${SQL.String({ siteId })}
      AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND city != ''
    GROUP BY code, subdivision_code, country_code
    ORDER BY visitors DESC
    LIMIT {limit:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    GeoVisitorSchema.parse({
      country_code: row.country_code,
      subdivision_code: row.subdivision_code,
      city: row.code,
      visitors: Number(row.visitors),
    }),
  );
}

export async function getCompareVisitorsByCountry(
  siteQuery: BASiteQuery,
  keys: [string][],
): Promise<GeoVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = safeSql`
    SELECT
      country_code,
      uniq(visitor_id) * any(_sample_factor) as visitors
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND country_code IN ({keys:Array(String)})
      AND ${SQL.AND(filters)}
    GROUP BY country_code
    ORDER BY visitors DESC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        keys: keys.map((k) => k[0]),
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

export async function getCompareVisitorsBySubdivision(
  siteQuery: BASiteQuery,
  keys: [string, string][],
): Promise<GeoVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = safeSql`
    SELECT
      subdivision_code AS code,
      country_code,
      uniq(visitor_id) * any(_sample_factor) as visitors
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND (coalesce(subdivision_code, ''), coalesce(country_code, '')) IN (SELECT arrayJoin(arrayZip({keys_values:Array(String)}, {keys_countries:Array(String)})))
      AND ${SQL.AND(filters)}
    GROUP BY code, country_code
    ORDER BY visitors DESC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        keys_values: keys.map((k) => k[0]),
        keys_countries: keys.map((k) => k[1]),
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

export async function getCompareVisitorsByCity(
  siteQuery: BASiteQuery,
  keys: [string, string, string][],
): Promise<GeoVisitor[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = safeSql`
    SELECT
      city AS code,
      subdivision_code,
      country_code,
      uniq(visitor_id) * any(_sample_factor) as visitors
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND (coalesce(city, ''), coalesce(subdivision_code, ''), coalesce(country_code, '')) IN (SELECT arrayJoin(arrayZip({keys_values:Array(String)}, {keys_subdivisions:Array(String)}, {keys_countries:Array(String)})))
      AND ${SQL.AND(filters)}
    GROUP BY code, subdivision_code, country_code
    ORDER BY visitors DESC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        keys_values: keys.map((k) => k[0]),
        keys_subdivisions: keys.map((k) => k[1]),
        keys_countries: keys.map((k) => k[2]),
      },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    GeoVisitorSchema.parse({
      country_code: row.country_code,
      subdivision_code: row.subdivision_code,
      city: row.code,
      visitors: Number(row.visitors),
    }),
  );
}
