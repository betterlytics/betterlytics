'use server';

import {
  hasAnyErrorsForSite,
  getErrorGroupsForSite,
  getErrorGroupVolumesForSite,
  getErrorGroupTimestampsForSite,
  upsertErrorGroupForSite,
  bulkUpsertErrorGroupForSite,
} from '@/services/analytics/errors.service';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toGroupedTimeSeries, type TimeSeriesPoint } from '@/presenters/toTimeSeries';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import { type ErrorGroupRow, ErrorGroupStatusValueSchema } from '@/entities/analytics/errors.entities';

export type ErrorGroupsResult = {
  hasAnyErrors: boolean;
  errorGroups: ErrorGroupRow[];
  initialVolumeMap: Record<string, TimeSeriesPoint[]>;
};

const INITIAL_PAGE_SIZE = 10;

export const fetchErrorGroupsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<ErrorGroupsResult> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    const [hasAnyErrors, errorGroups] = await Promise.all([
      hasAnyErrorsForSite(ctx.siteId),
      getErrorGroupsForSite(main, ctx.dashboardId),
    ]);

    const fingerprints = errorGroups.map((g) => g.error_fingerprint);
    const initialFingerprints = fingerprints.slice(0, INITIAL_PAGE_SIZE);

    const [{ firstSeenMap, lastSeenMap }, initialVolumeRows] = await Promise.all([
      getErrorGroupTimestampsForSite(ctx.siteId, fingerprints),
      getErrorGroupVolumesForSite(main, initialFingerprints),
    ]);

    const enrichedGroups = errorGroups.map((g) => ({
      ...g,
      first_seen: firstSeenMap[g.error_fingerprint],
      last_seen: lastSeenMap[g.error_fingerprint],
    }));

    const initialVolumeMap = toGroupedTimeSeries({
      groupKey: 'error_fingerprint',
      dataKey: 'error_count',
      data: initialVolumeRows,
    });

    return { hasAnyErrors, errorGroups: enrichedGroups, initialVolumeMap };
  },
);

export const fetchErrorGroupVolumesAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    query: BAAnalyticsQuery,
    fingerprints: string[],
  ): Promise<Record<string, TimeSeriesPoint[]>> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const volumeRows = await getErrorGroupVolumesForSite(main, fingerprints);

    return toGroupedTimeSeries({
      groupKey: 'error_fingerprint',
      dataKey: 'error_count',
      data: volumeRows,
    });
  },
);

export const upsertErrorGroupAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, fingerprint: string, status: string): Promise<void> => {
    const validatedStatus = ErrorGroupStatusValueSchema.parse(status);
    await upsertErrorGroupForSite(ctx.dashboardId, fingerprint, validatedStatus);
  },
);

export const bulkUpsertErrorGroupAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, fingerprints: string[], status: string): Promise<void> => {
    const validatedStatus = ErrorGroupStatusValueSchema.parse(status);
    await bulkUpsertErrorGroupForSite(ctx.dashboardId, fingerprints, validatedStatus);
  },
);
