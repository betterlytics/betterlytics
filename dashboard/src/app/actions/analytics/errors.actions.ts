'use server';

import {
  hasAnyErrorsForSite,
  getErrorGroupsForSite,
  getErrorVolumeForSite,
  getErrorGroupVolumesForSite,
} from '@/services/analytics/errors.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toTimeSeries, toGroupedTimeSeries, type TimeSeriesPoint } from '@/presenters/toTimeSeries';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';

export type ErrorGroupsResult = {
  hasAnyErrors: boolean;
  errorGroups: ErrorGroupRow[];
  timeBuckets: TimeSeriesPoint[];
  initialVolumeMap: Record<string, TimeSeriesPoint[]>;
};

const INITIAL_PAGE_SIZE = 10;

export const fetchErrorGroupsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<ErrorGroupsResult> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    const [hasAnyErrors, errorGroups, overallData] = await Promise.all([
      hasAnyErrorsForSite(ctx.siteId),
      getErrorGroupsForSite(main),
      getErrorVolumeForSite(main),
    ]);

    const timeBuckets = toTimeSeries({ dataKey: 'errorCount', data: overallData });

    const initialFingerprints = errorGroups.slice(0, INITIAL_PAGE_SIZE).map((g) => g.error_fingerprint);
    const initialVolumeRows = await getErrorGroupVolumesForSite(main, initialFingerprints);

    const initialVolumeMap = toGroupedTimeSeries({
      groupKey: 'error_fingerprint',
      dataKey: 'errorCount',
      timeBuckets,
      data: initialVolumeRows,
    });

    return { hasAnyErrors, errorGroups, timeBuckets, initialVolumeMap };
  },
);

export const fetchErrorGroupVolumesAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    query: BAAnalyticsQuery,
    fingerprints: string[],
    timeBuckets: TimeSeriesPoint[],
  ): Promise<Record<string, TimeSeriesPoint[]>> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const volumeRows = await getErrorGroupVolumesForSite(main, fingerprints);

    return toGroupedTimeSeries({
      groupKey: 'error_fingerprint',
      dataKey: 'errorCount',
      timeBuckets,
      data: volumeRows,
    });
  },
);
