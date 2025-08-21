import { getCoreWebVitalSeries, getCoreWebVitalsP75 } from '@/repositories/clickhouse/webVitals';
import { CoreWebVitalSeriesRow, CoreWebVitalsSummary } from '@/entities/webVitals';
import { QueryFilter } from '@/entities/filter';
import { toDateTimeString } from '@/utils/dateFormatters';
import { BAQuery } from '@/lib/ba-query';

export async function getCoreWebVitalsSummaryForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<CoreWebVitalsSummary> {
  return getCoreWebVitalsP75(siteId, toDateTimeString(startDate), toDateTimeString(endDate), queryFilters);
}

export async function getCoreWebVitalTimeseries(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: any,
  queryFilters: QueryFilter[],
  metricName: string,
): Promise<CoreWebVitalSeriesRow[]> {
  const granularitySql = BAQuery.getGranularitySQLFunctionFromGranularityRange(granularity);
  return getCoreWebVitalSeries(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    granularitySql,
    queryFilters,
    metricName,
  );
}
