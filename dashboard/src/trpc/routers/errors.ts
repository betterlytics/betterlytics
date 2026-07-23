import { z } from 'zod';
import { createRouter, analyticsProcedure, dashboardProcedure } from '@/trpc/init';
import {
  hasAnyErrorsForSite,
  getErrorGroupsForSite,
  getErrorGroupTimestampsForSite,
  getErrorGroupVolumesForSite,
  getErrorOccurrenceForSite,
  getSessionTrailForSite,
  hasSessionReplayForSite,
} from '@/services/analytics/errors.service';
import { toGroupedTimeSeries } from '@/presenters/toTimeSeries';

const INITIAL_PAGE_SIZE = 10;

export const errorsRouter = createRouter({
  errorGroups: analyticsProcedure.query(async ({ ctx }) => {
    const { main } = ctx;
    const [hasAnyErrors, errorGroups] = await Promise.all([
      hasAnyErrorsForSite(ctx.authContext.siteId),
      getErrorGroupsForSite(main, ctx.authContext.dashboardId),
    ]);
    const fingerprints = errorGroups.map((g) => g.error_fingerprint);
    const initialFingerprints = fingerprints.slice(0, INITIAL_PAGE_SIZE);
    const [{ firstSeenMap, lastSeenMap }, initialVolumeRows] = await Promise.all([
      getErrorGroupTimestampsForSite(ctx.authContext.siteId, fingerprints),
      getErrorGroupVolumesForSite(main, initialFingerprints),
    ]);
    const enrichedGroups = errorGroups.map((g) => ({
      ...g,
      first_seen: firstSeenMap[g.error_fingerprint],
      last_seen: lastSeenMap[g.error_fingerprint],
    }));
    const initialVolumeMap = toGroupedTimeSeries({
      groupKey: 'error_fingerprint', dataKey: 'error_count', data: initialVolumeRows,
    });
    return { hasAnyErrors, errorGroups: enrichedGroups, initialVolumeMap };
  }),

  errorGroupVolumes: analyticsProcedure
    .input(z.object({ fingerprints: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const volumeRows = await getErrorGroupVolumesForSite(main, input.fingerprints);
      return toGroupedTimeSeries({ groupKey: 'error_fingerprint', dataKey: 'error_count', data: volumeRows });
    }),

  errorOccurrence: dashboardProcedure
    .input(z.object({ fingerprint: z.string(), offset: z.number() }))
    .query(async ({ ctx, input }) => {
      return getErrorOccurrenceForSite(ctx.authContext.siteId, input.fingerprint, Math.max(0, input.offset));
    }),

  checkSessionReplay: dashboardProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return hasSessionReplayForSite(ctx.authContext.siteId, input.sessionId);
    }),

  sessionTrail: dashboardProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return getSessionTrailForSite(ctx.authContext.siteId, input.sessionId);
    }),
});
