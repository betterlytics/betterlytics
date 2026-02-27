'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import {
  getAllCoreWebVitalPercentilesTimeseries,
  getCoreWebVitalsSummaryForSite,
  getCoreWebVitalsPreparedByDimension,
  getHasCoreWebVitalsData,
} from '@/services/analytics/webVitals.service';
import { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { toWebVitalsPercentileChart, type PercentilePoint } from '@/presenters/toMultiLine';
import { toDataTable } from '@/presenters/toDataTable';
import { type CWVDimension } from '@/entities/analytics/webVitals.entities';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchCoreWebVitalsSummaryAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getCoreWebVitalsSummaryForSite(main);
  },
);

export const fetchHasCoreWebVitalsData = withDashboardAuthContext(async (ctx: AuthContext) => {
  return getHasCoreWebVitalsData(ctx.siteId);
});

export const fetchCoreWebVitalChartDataAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<Record<CoreWebVitalName, PercentilePoint[]>> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const rows = await getAllCoreWebVitalPercentilesTimeseries(main);
    return toWebVitalsPercentileChart(rows);
  },
);

export const fetchCoreWebVitalsByDimensionAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, dimension: CWVDimension) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const prepared = await getCoreWebVitalsPreparedByDimension(main, dimension);
    return toDataTable({ categoryKey: 'key', data: prepared });
  },
);
