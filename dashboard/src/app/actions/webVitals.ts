'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { QueryFilter } from '@/entities/filter';
import { getAllCoreWebVitalPercentilesTimeseries, getCoreWebVitalsSummaryForSite } from '@/services/webVitals';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { CoreWebVitalName } from '@/entities/webVitals';
import { toPercentileLinesByMetric, type PercentilePoint } from '@/presenters/toMultiLine';

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
