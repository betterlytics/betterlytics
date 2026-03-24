'use server';

import {
  hasAnyErrorsForSite,
  getErrorGroupForSite,
  getErrorGroupSidebarDataForSite,
  getErrorOccurrenceForSite,
  getSessionTrailForSite,
  hasSessionReplayForSite,
  findReplaySessionForErrorGroup,
  getErrorGroupsForSite,
  getErrorGroupVolumesForSite,
  getErrorGroupTimestampsForSite,
  upsertErrorGroupForSite,
  bulkUpsertErrorGroupForSite,
  type ErrorGroupSidebarData,
} from '@/services/analytics/errors.service';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toGroupedTimeSeries, type TimeSeriesPoint } from '@/presenters/toTimeSeries';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import {
  type ErrorGroupRow,
  type ErrorOccurrence,
  type GroupedSessionTrailEvent,
  ErrorGroupStatusValueSchema,
} from '@/entities/analytics/errors.entities';

export type ErrorGroupsResult = {
  hasAnyErrors: boolean;
  errorGroups: ErrorGroupRow[];
  initialVolumeMap: Record<string, TimeSeriesPoint[]>;
};

const INITIAL_PAGE_SIZE = 10;

export const fetchErrorGroupAction = withDashboardAuthContext(
  async (ctx: AuthContext, fingerprint: string): Promise<ErrorGroupRow | null> => {
    return getErrorGroupForSite(ctx.siteId, ctx.dashboardId, fingerprint);
  },
);

export const fetchErrorOccurrenceAction = withDashboardAuthContext(
  async (ctx: AuthContext, fingerprint: string, offset: number): Promise<ErrorOccurrence | null> => {
    return getErrorOccurrenceForSite(ctx.siteId, fingerprint, Math.max(0, offset));
  },
);

export const fetchErrorGroupSidebarAction = withDashboardAuthContext(
  async (ctx: AuthContext, fingerprint: string): Promise<ErrorGroupSidebarData> => {
    return getErrorGroupSidebarDataForSite(ctx.siteId, fingerprint);
  },
);

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

export const checkSessionReplayAction = withDashboardAuthContext(
  async (ctx: AuthContext, sessionId: string): Promise<boolean> => {
    return hasSessionReplayForSite(ctx.siteId, sessionId);
  },
);

export const findReplaySessionForErrorAction = withDashboardAuthContext(
  async (ctx: AuthContext, fingerprint: string): Promise<string | null> => {
    return findReplaySessionForErrorGroup(ctx.siteId, fingerprint);
  },
);

export const fetchSessionTrailAction = withDashboardAuthContext(
  async (ctx: AuthContext, sessionId: string): Promise<GroupedSessionTrailEvent[]> => {
    return getSessionTrailForSite(ctx.siteId, sessionId);
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
