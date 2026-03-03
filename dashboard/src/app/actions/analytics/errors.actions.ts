'use server';

import {
  getErrorGroupsForSite,
  getErrorVolumeForSite,
  getErrorGroupVolumesForSite,
} from '@/services/analytics/errors.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toBarChart, toGroupedBarCharts } from '@/presenters/toBarChart';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchErrorGroupsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getErrorGroupsForSite(main);
  },
);

export const fetchErrorVolumeAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const data = await getErrorVolumeForSite(main);
    return toBarChart({ dataKey: 'errorCount', data });
  },
);

export const fetchErrorGroupVolumesAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const [overallData, rows] = await Promise.all([
      getErrorVolumeForSite(main),
      getErrorGroupVolumesForSite(main),
    ]);

    return toGroupedBarCharts({
      groupKey: 'error_fingerprint',
      dataKey: 'errorCount',
      timeBuckets: toBarChart({ dataKey: 'errorCount', data: overallData }),
      data: rows,
    });
  },
);
