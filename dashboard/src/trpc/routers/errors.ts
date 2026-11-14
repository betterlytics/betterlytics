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
import { isFeatureEnabled } from '@/lib/feature-flags';

const INITIAL_PAGE_SIZE = 10;
// Only Cloud serves the static demo errors; self-hosted public dashboards show real ones
const STATIC_DEMO = { demoCache: !isFeatureEnabled('isCloud') };

export const errorsRouter = createRouter({
  errorGroups: analyticsProcedure.meta(STATIC_DEMO).query(async ({ ctx }) => {
    const { main } = ctx;
    const [hasAnyErrors, errorGroups] = await Promise.all([
      hasAnyErrorsForSite(ctx.authContext),
      getErrorGroupsForSite(ctx.authContext, main),
    ]);
    const fingerprints = errorGroups.map((g) => g.error_fingerprint);
    const initialFingerprints = fingerprints.slice(0, INITIAL_PAGE_SIZE);
    const [{ firstSeenMap, lastSeenMap }, initialVolumeRows] = await Promise.all([
      getErrorGroupTimestampsForSite(ctx.authContext, fingerprints),
      getErrorGroupVolumesForSite(ctx.authContext, main, initialFingerprints),
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
    .meta(STATIC_DEMO)
    .input(z.object({ fingerprints: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const volumeRows = await getErrorGroupVolumesForSite(ctx.authContext, main, input.fingerprints);
      return toGroupedTimeSeries({ groupKey: 'error_fingerprint', dataKey: 'error_count', data: volumeRows });
    }),

  errorOccurrence: dashboardProcedure
    .meta(STATIC_DEMO)
    .input(z.object({ fingerprint: z.string(), offset: z.number() }))
    .query(async ({ ctx, input }) => {
      return getErrorOccurrenceForSite(ctx.authContext, input.fingerprint, Math.max(0, input.offset));
    }),

  checkSessionReplay: dashboardProcedure
    .meta(STATIC_DEMO)
    .input(z.object({ sessionId: z.string().regex(/^\d+$/) }))
    .query(async ({ ctx, input }) => {
      return hasSessionReplayForSite(ctx.authContext, input.sessionId);
    }),

  sessionTrail: dashboardProcedure
    .meta(STATIC_DEMO)
    .input(z.object({ sessionId: z.string().regex(/^\d+$/) }))
    .query(async ({ ctx, input }) => {
      return getSessionTrailForSite(ctx.authContext, input.sessionId);
    }),
});
