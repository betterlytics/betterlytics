import { getVisitorsByCountry } from '@/repositories/clickhouse/geography';
import { toDateTimeString } from '@/utils/dateFormatters';
import { GeoVisitor } from '@/entities/geography';
import { QueryFilter } from '@/entities/filter';

/**
 * Fetches visitor data aggregated by country code from the database
 * @param limit Limit for top countries. Defaults to 1000 to get all countries in practice.
 */
export async function fetchVisitorsByGeography(
  siteId: string, 
  startDate: Date, 
  endDate: Date,
  queryFilters: QueryFilter[],
  limit: number = 1000
): Promise<GeoVisitor[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  
  return getVisitorsByCountry(siteId, formattedStart, formattedEnd, queryFilters, limit);
}