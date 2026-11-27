import { createRouter, memberDashboardProcedure } from '@/trpc/init';
import { HeatmapCaptureFilterSchema } from '@/entities/analytics/heatmapCaptures.entities';
import { listCaptures } from '@/services/analytics/heatmapCaptures.service';

export const heatmapCapturesRouter = createRouter({
  list: memberDashboardProcedure.input(HeatmapCaptureFilterSchema).query(async ({ ctx, input }) => {
    return await listCaptures(ctx.authContext, { path: input.path, device: input.device });
  }),
});
