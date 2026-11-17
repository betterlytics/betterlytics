import { z } from 'zod';
import { createRouter, analyticsProcedure, dashboardProcedure } from '@/trpc/init';
import {
  getHasHeatmapClicks,
  getHeatmapClicksForPage,
  getHeatmapDeviceSharesForPage,
  getHeatmapPagesForSite,
} from '@/services/analytics/clickHeatmap.service';
import { HeatmapDeviceSchema } from '@/entities/analytics/clickHeatmap.entities';

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
});
