'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { QueryFilter } from '@/entities/filter';
import { getCoreWebVitalPercentilesTimeseries, getCoreWebVitalsSummaryForSite } from '@/services/webVitals';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { CoreWebVitalName } from '@/entities/webVitals';

export const fetchCoreWebVitalsSummaryAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getCoreWebVitalsSummaryForSite(ctx.siteId, startDate, endDate, queryFilters);
  },
);

export const fetchCoreWebVitalPercentilesSeriesAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
    metricName: CoreWebVitalName,
  ) => {
    return getCoreWebVitalPercentilesTimeseries(
      ctx.siteId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      metricName,
    );
  },
);
