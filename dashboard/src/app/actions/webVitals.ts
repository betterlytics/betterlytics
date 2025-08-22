'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { QueryFilter } from '@/entities/filter';
import {
  getAllCoreWebVitalPercentilesTimeseries,
  getCoreWebVitalsSummaryForSite,
  getCoreWebVitalsPerDimension,
} from '@/services/webVitals';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { CoreWebVitalName } from '@/entities/webVitals';
import { toPercentileLinesByMetric, type PercentilePoint } from '@/presenters/toMultiLine';
import { pivotByCategory, toDataTable } from '@/presenters/toDataTable';
import { type CWVDimension } from '@/entities/webVitals';

export const fetchCoreWebVitalsSummaryAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getCoreWebVitalsSummaryForSite(ctx.siteId, startDate, endDate, queryFilters);
  },
);

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
    const rows = await getCoreWebVitalsPerDimension(ctx.siteId, startDate, endDate, queryFilters, dimension);
    const pivoted = pivotByCategory(rows, 'key', 'name', 'p75').map((r) => ({
      ...r,
      samples: rows.filter((w) => w.key === r.key).reduce((acc, w) => acc + (w.samples || 0), 0),
    }));
    return toDataTable({ categoryKey: 'key', data: pivoted });
  },
);
