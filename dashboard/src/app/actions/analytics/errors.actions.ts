'use server';

import {
  getErrorGroupsForSite,
  getErrorVolumeForSite,
  getErrorGroupVolumesForSite,
} from '@/services/analytics/errors.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toBarChart, toGroupedBarCharts, type BarChartPoint } from '@/presenters/toBarChart';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import type { ErrorGroupRow, ErrorGroupVolumeRow } from '@/entities/analytics/errors.entities';

export type ErrorGroupsResult = {
  errorGroups: ErrorGroupRow[];
  initialVolumeRows: ErrorGroupVolumeRow[];
};

const INITIAL_PAGE_SIZE = 10;

export const fetchErrorGroupsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<ErrorGroupsResult> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const errorGroups = await getErrorGroupsForSite(main);

    const initialFingerprints = errorGroups.slice(0, INITIAL_PAGE_SIZE).map((g) => g.error_fingerprint);
    const initialVolumeRows = await getErrorGroupVolumesForSite(main, initialFingerprints);

    return { errorGroups, initialVolumeRows };
  },
);

export const fetchErrorGroupVolumesAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    query: BAAnalyticsQuery,
    fingerprints: string[],
    timeBuckets: BarChartPoint[],
  ): Promise<Record<string, BarChartPoint[]>> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const volumeRows = await getErrorGroupVolumesForSite(main, fingerprints);

    return toGroupedBarCharts({
      groupKey: 'error_fingerprint',
      dataKey: 'errorCount',
      timeBuckets,
      data: volumeRows,
    });
  },
);

export const fetchErrorVolumeAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const data = await getErrorVolumeForSite(main);
    return toBarChart({ dataKey: 'errorCount', data });
  },
);
