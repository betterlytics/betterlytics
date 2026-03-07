'use server';

import {
  hasAnyErrorsForSite,
  getErrorGroupsForSite,
  getErrorVolumeForSite,
  getErrorGroupVolumesForSite,
  getGlobalErrorGroupFirstSeenForSite,
  upsertErrorGroupForSite,
  bulkUpsertErrorGroupForSite,
} from '@/services/analytics/errors.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toTimeSeries, toGroupedTimeSeries, type TimeSeriesPoint } from '@/presenters/toTimeSeries';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import { type ErrorGroupRow, ErrorGroupStatusValueSchema } from '@/entities/analytics/errors.entities';

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

    const [hasAnyErrors, errorGroups, overallData, firstSeenMap] = await Promise.all([
      hasAnyErrorsForSite(ctx.siteId),
      getErrorGroupsForSite(main, ctx.dashboardId),
      getErrorVolumeForSite(main),
      getGlobalErrorGroupFirstSeenForSite(ctx.siteId),
    ]);

    const enrichedGroups = errorGroups.map((g) => ({ ...g, first_seen: firstSeenMap[g.error_fingerprint] }));

    const timeBuckets = toTimeSeries({ dataKey: 'errorCount', data: overallData });

    const initialFingerprints = enrichedGroups.slice(0, INITIAL_PAGE_SIZE).map((g) => g.error_fingerprint);
    const initialVolumeRows = await getErrorGroupVolumesForSite(main, initialFingerprints);

    const initialVolumeMap = toGroupedTimeSeries({
      groupKey: 'error_fingerprint',
      dataKey: 'errorCount',
      timeBuckets,
      data: initialVolumeRows,
    });

    return { hasAnyErrors, errorGroups: enrichedGroups, timeBuckets, initialVolumeMap };
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

export const upsertErrorGroupAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    errorFingerprint: string,
    status: string,
  ): Promise<void> => {
    const validatedStatus = ErrorGroupStatusValueSchema.parse(status);
    await upsertErrorGroupForSite(ctx.dashboardId, errorFingerprint, validatedStatus);
  },
);

export const bulkUpsertErrorGroupAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    fingerprints: string[],
    status: string,
  ): Promise<void> => {
    const validatedStatus = ErrorGroupStatusValueSchema.parse(status);
    await bulkUpsertErrorGroupForSite(ctx.dashboardId, fingerprints, validatedStatus);
  },
);
