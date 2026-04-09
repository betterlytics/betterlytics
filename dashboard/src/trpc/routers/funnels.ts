import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import { FunnelStepSchema } from '@/entities/analytics/funnels.entities';
import { getFunnelsByDashboardId, getFunnelDetailsById, getFunnelPreviewData } from '@/services/analytics/funnels.service';
import { toFunnel } from '@/presenters/toFunnel';
import { TRPCError } from '@trpc/server';

export const funnelsRouter = createRouter({
  list: analyticsProcedure.query(async ({ ctx }) => {
    const { main } = ctx;
    const funnels = await getFunnelsByDashboardId(ctx.authContext.dashboardId, ctx.authContext.siteId, main.startDate, main.endDate);
    return funnels.map((funnel) => ({ stepCount: funnel.funnelSteps.length, ...toFunnel(funnel) }));
  }),

  details: analyticsProcedure
    .input(z.object({ funnelId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const funnel = await getFunnelDetailsById(ctx.authContext.siteId, input.funnelId, main.startDate, main.endDate);
      if (!funnel) throw new TRPCError({ code: 'NOT_FOUND' });
      return toFunnel(funnel);
    }),

  preview: analyticsProcedure
    .input(z.object({
      funnelSteps: z.array(FunnelStepSchema),
      isStrict: z.boolean(),
    }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const funnelPreview = await getFunnelPreviewData(ctx.authContext.siteId, main.startDate, main.endDate, input.funnelSteps, input.isStrict);
      return toFunnel(funnelPreview);
    }),
});
