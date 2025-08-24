import {
  getAllCoreWebVitalPercentilesSeries,
  getCoreWebVitalsP75,
  getCoreWebVitalsAllPercentilesByDimension,
} from '@/repositories/clickhouse/webVitals';
import { CoreWebVitalsSummary, type CWVDimension } from '@/entities/webVitals';
import { QueryFilter } from '@/entities/filter';
import { toDateTimeString } from '@/utils/dateFormatters';

export async function getCoreWebVitalsSummaryForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<CoreWebVitalsSummary> {
  return getCoreWebVitalsP75(siteId, toDateTimeString(startDate), toDateTimeString(endDate), queryFilters);
}

export async function getAllCoreWebVitalPercentilesTimeseries(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: any,
  queryFilters: QueryFilter[],
) {
  return await getAllCoreWebVitalPercentilesSeries(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    granularity,
    queryFilters,
  );
}

export async function getCoreWebVitalsAllPercentilesPerDimension(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  dimension: CWVDimension,
) {
  return getCoreWebVitalsAllPercentilesByDimension(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    queryFilters,
    dimension,
  );
}
