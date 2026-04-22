import { createRouter, dashboardProcedure } from '@/trpc/init';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';

export const dashboardRouter = createRouter({
  domain: dashboardProcedure.query(async ({ ctx }) => {
    const dashboard = await findDashboardById(ctx.authContext.dashboardId);
    return { domain: dashboard.domain };
  }),
});
