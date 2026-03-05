'use server';

import {
  getErrorGroupCountForSite,
  getErrorGroupsForSite,
  getErrorVolumeForSite,
  getErrorGroupVolumesPaginatedForSite,
} from '@/services/analytics/errors.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toBarChart, toGroupedBarCharts, type BarChartPoint } from '@/presenters/toBarChart';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';

export type ErrorGroupsPageResult = {
  errorGroups: ErrorGroupRow[];
  totalGroups: number;
  volumeMap: Record<string, BarChartPoint[]>;
  timeBuckets: BarChartPoint[];
};

export const fetchErrorGroupsInitialAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, pageSize: number): Promise<ErrorGroupsPageResult> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    const [totalGroups, errorGroups, volumeRows, overallData] = await Promise.all([
      getErrorGroupCountForSite(main),
      getErrorGroupsForSite(main, pageSize, 0),
      getErrorGroupVolumesPaginatedForSite(main, pageSize, 0),
      getErrorVolumeForSite(main),
    ]);

    const timeBuckets = toBarChart({ dataKey: 'errorCount', data: overallData });
    const volumeMap = toGroupedBarCharts({
      groupKey: 'error_fingerprint',
      dataKey: 'errorCount',
      timeBuckets,
      data: volumeRows,
    });

    return { errorGroups, totalGroups, volumeMap, timeBuckets };
  },
);

export const fetchErrorGroupsPageAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    query: BAAnalyticsQuery,
    pageSize: number,
    offset: number,
    timeBuckets: BarChartPoint[],
  ): Promise<{ errorGroups: ErrorGroupRow[]; volumeMap: Record<string, BarChartPoint[]> }> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    const [errorGroups, volumeRows] = await Promise.all([
      getErrorGroupsForSite(main, pageSize, offset),
      getErrorGroupVolumesPaginatedForSite(main, pageSize, offset),
    ]);

    const volumeMap = toGroupedBarCharts({
      groupKey: 'error_fingerprint',
      dataKey: 'errorCount',
      timeBuckets,
      data: volumeRows,
    });

    return { errorGroups, volumeMap };
  },
);

export const fetchErrorVolumeAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const data = await getErrorVolumeForSite(main);
    return toBarChart({ dataKey: 'errorCount', data });
  },
);
