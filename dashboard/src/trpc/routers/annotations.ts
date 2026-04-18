import { z } from 'zod';
import { createRouter, dashboardProcedure } from '@/trpc/init';
import { getDashboardAnnotations } from '@/services/dashboard/annotations.service';

export const annotationsRouter = createRouter({
  list: dashboardProcedure
    .input(z.object({ chartId: z.string() }))
    .query(async ({ ctx, input }) => {
      return getDashboardAnnotations(ctx.authContext.dashboardId, input.chartId);
    }),
});
