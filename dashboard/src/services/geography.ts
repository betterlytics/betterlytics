import { getVisitorsByCountry, getVisitorsByCountryTimeseries } from '@/repositories/clickhouse/geography';
import { toDateTimeString } from '@/utils/dateFormatters';
import { GeoVisitor, WorldMapResponseTimeseries } from '@/entities/geography';
import { QueryFilter } from '@/entities/filter';
import { GranularityRangeValues } from '@/utils/granularityRanges';

/**
 * Fetches visitor data aggregated by country code from the database
 * @param limit Limit for top countries. Defaults to 1000 to get all countries in practice.
 */
export async function fetchVisitorsByGeography(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  limit: number = 10000,
): Promise<GeoVisitor[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getVisitorsByCountry(siteId, formattedStart, formattedEnd, queryFilters, limit);
}

export async function fetchVisitorsByGeographyTimeseries(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  granularity: GranularityRangeValues,
  limit: number = 1000,
) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getVisitorsByCountryTimeseries(siteId, formattedStart, formattedEnd, queryFilters, granularity, limit);
}
