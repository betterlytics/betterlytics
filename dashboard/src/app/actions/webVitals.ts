'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { QueryFilter } from '@/entities/filter';
import {
  getAllCoreWebVitalPercentilesTimeseries,
  getCoreWebVitalsSummaryForSite,
  getCoreWebVitalsPreparedByDimension,
  getHasCoreWebVitalsData,
} from '@/services/webVitals';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { CoreWebVitalName } from '@/entities/webVitals';
import { toPercentileLinesByMetric, type PercentilePoint } from '@/presenters/toMultiLine';
import { toDataTable } from '@/presenters/toDataTable';
import { type CWVDimension } from '@/entities/webVitals';

export const fetchCoreWebVitalsSummaryAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getCoreWebVitalsSummaryForSite(ctx.siteId, startDate, endDate, queryFilters);
  },
);

export const fetchHasCoreWebVitalsData = withDashboardAuthContext(async (ctx: AuthContext) => {
  return getHasCoreWebVitalsData(ctx.siteId);
});

export const fetchCoreWebVitalChartDataAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
  ): Promise<Record<CoreWebVitalName, PercentilePoint[]>> => {
    const rows = await getAllCoreWebVitalPercentilesTimeseries(
      ctx.siteId,
      startDate,
      endDate,
      granularity,
      queryFilters,
    );
    return toPercentileLinesByMetric(rows, granularity, { start: startDate, end: endDate });
  },
);

export const fetchCoreWebVitalsByDimensionAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    dimension: CWVDimension,
  ) => {
    const prepared = await getCoreWebVitalsPreparedByDimension(
      ctx.siteId,
      startDate,
      endDate,
      queryFilters,
      dimension,
    );
    return toDataTable({ categoryKey: 'key', data: prepared });
  },
);
