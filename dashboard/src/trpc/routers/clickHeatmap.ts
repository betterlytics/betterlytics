import { z } from 'zod';
import { createRouter, analyticsProcedure, dashboardProcedure } from '@/trpc/init';
import {
  getHasHeatmapClicks,
  getHeatmapBackground,
  getHeatmapClickAnchorsForPage,
  getHeatmapClicksForPage,
  getHeatmapDeviceSharesForPage,
  getHeatmapPagesForSite,
} from '@/services/analytics/clickHeatmap.service';
import { HeatmapDeviceSchema, type HeatmapBackground } from '@/entities/analytics/clickHeatmap.entities';

export const clickHeatmapRouter = createRouter({
  hasData: dashboardProcedure.query(async ({ ctx }) => {
    return getHasHeatmapClicks(ctx.authContext.siteId);
  }),

  pages: analyticsProcedure.query(async ({ ctx }) => {
    return getHeatmapPagesForSite(ctx.main);
  }),

  devices: analyticsProcedure.input(z.object({ url: z.string() })).query(async ({ ctx, input }) => {
    return getHeatmapDeviceSharesForPage(ctx.main, input.url);
  }),

  clicks: analyticsProcedure
    .input(z.object({ url: z.string(), device: HeatmapDeviceSchema }))
    .query(async ({ ctx, input }) => {
      return getHeatmapClicksForPage(ctx.main, input.url, input.device);
    }),

  // Public views get no replay layout: the snapshot route only serves members
  background: analyticsProcedure
    .input(z.object({ url: z.string(), device: HeatmapDeviceSchema }))
    .query(async ({ ctx, input }): Promise<HeatmapBackground> => {
      if (ctx.authContext.isDemo) return { kind: 'none' };
      return getHeatmapBackground(ctx.main, input.url, input.device);
    }),

  anchors: analyticsProcedure
    .input(z.object({ url: z.string(), device: HeatmapDeviceSchema, width: z.number().int().min(1).max(16384) }))
    .query(async ({ ctx, input }) => {
      return getHeatmapClickAnchorsForPage(ctx.main, input.url, input.device, input.width);
    }),
});
