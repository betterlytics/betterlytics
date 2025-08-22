'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { QueryFilter } from '@/entities/filter';
import {
  getAllCoreWebVitalPercentilesTimeseries,
  getCoreWebVitalsSummaryForSite,
  getCoreWebVitalsAllPercentilesPerDimension,
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
    const rows = await getCoreWebVitalsAllPercentilesPerDimension(
      ctx.siteId,
      startDate,
      endDate,
      queryFilters,
      dimension,
    );
    const pivoted = pivotByCategory(rows, 'key', 'name', 'p75').map((r) => {
      const bucket = rows.filter((w) => w.key === r.key);
      const metricToPercentiles = Object.fromEntries(bucket.map((b) => [b.name, [b.p50, b.p75, b.p90, b.p99]]));
      const samples = bucket.reduce((acc, w) => acc + (w.samples || 0), 0);
      return { ...r, __percentiles: metricToPercentiles, samples };
    });
    return toDataTable({ categoryKey: 'key', data: pivoted });
  },
);
