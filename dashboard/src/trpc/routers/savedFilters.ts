import { createRouter, dashboardProcedure } from '@/trpc/init';
import { getSavedFiltersForDashboard, isSavedFiltersLimitReached } from '@/services/analytics/savedFilters.service';

export const savedFiltersRouter = createRouter({
  list: dashboardProcedure.query(async ({ ctx }) => {
    return getSavedFiltersForDashboard(ctx.authContext.dashboardId);
  }),

  isLimitReached: dashboardProcedure.query(async ({ ctx }) => {
    return isSavedFiltersLimitReached(ctx.authContext.dashboardId);
  }),
});
