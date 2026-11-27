import { z } from 'zod';
import { createRouter, analyticsProcedure, dashboardProcedure } from '@/trpc/init';
import {
  getCaptureOrigin,
  getHasHeatmapClicks,
  getHeatmapBackground,
  getHeatmapClickAnchorsForPage,
  getHeatmapPagesForSite,
} from '@/services/analytics/clickHeatmap.service';
import { getLivePageUrl } from '@/services/analytics/heatmapLivePage.service';
import { HeatmapDeviceSchema, type HeatmapBackground } from '@/entities/analytics/clickHeatmap.entities';

export const clickHeatmapRouter = createRouter({
  hasData: dashboardProcedure.query(async ({ ctx }) => {
    return getHasHeatmapClicks(ctx.authContext.siteId);
  }),

  pages: analyticsProcedure.query(async ({ ctx }) => {
    return getHeatmapPagesForSite(ctx.main);
  }),

  // Public views get no replay layout: the snapshot route only serves members
  background: analyticsProcedure
    .input(z.object({ url: z.string(), device: HeatmapDeviceSchema }))
    .query(async ({ ctx, input }): Promise<HeatmapBackground> => {
      if (ctx.authContext.isDemo) return { kind: 'none' };
      return getHeatmapBackground(ctx.main, input.url, input.device);
    }),

  livePage: analyticsProcedure.input(z.object({ url: z.string() })).query(async ({ ctx, input }) => {
    if (ctx.authContext.isDemo) return null;
    return getLivePageUrl(ctx.main, ctx.authContext.dashboardId, input.url);
  }),

  captureOrigin: analyticsProcedure.input(z.object({ url: z.string() })).query(async ({ ctx, input }) => {
    if (ctx.authContext.isDemo) return null;
    return getCaptureOrigin(ctx.main, ctx.authContext.dashboardId, input.url);
  }),

  anchors: analyticsProcedure
    .input(z.object({ url: z.string(), device: HeatmapDeviceSchema, width: z.number().int().min(1).max(16384) }))
    .query(async ({ ctx, input }) => {
      if (ctx.authContext.isDemo) return [];
      return getHeatmapClickAnchorsForPage(ctx.main, input.url, input.device, input.width);
    }),
});
