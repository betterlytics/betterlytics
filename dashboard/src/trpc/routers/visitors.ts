import { createRouter, dashboardProcedure } from '@/trpc/init';
import { getActiveUsersForSite } from '@/services/analytics/visitors.service';

export const visitorsRouter = createRouter({
  activeUsers: dashboardProcedure.query(async ({ ctx }) => {
    return getActiveUsersForSite(ctx.authContext.siteId);
  }),
});
