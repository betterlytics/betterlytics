import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import superjson from 'superjson';
import { getAuthorizedDashboardContextOrNull } from '@/services/auth/auth.service';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import { DashboardFindByUserSchema } from '@/entities/dashboard/dashboard.entities';
import { env } from '@/lib/env';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import { BAAnalyticsQuerySchema } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export async function createTRPCContext() {
  const session = await getServerSession(authOptions);
  return { session };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicProcedure = t.procedure;

const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

async function resolveDashboardAuth(
  session: TRPCContext['session'],
  dashboardId: string,
): Promise<AuthContext> {
  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
    if (session?.user) {
      const authorizedCtx = await getAuthorizedDashboardContextOrNull(
        DashboardFindByUserSchema.parse({ userId: session.user.id, dashboardId }),
      );
      if (authorizedCtx) return authorizedCtx;
    }
    const dashboard = await findDashboardById(dashboardId);
    return {
      dashboardId: dashboard.id,
      siteId: dashboard.siteId,
      userId: 'demo',
      role: 'viewer',
      isDemo: true,
    };
  }

  if (!session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const authorizedCtx = await getAuthorizedDashboardContextOrNull(
    DashboardFindByUserSchema.parse({ userId: session.user.id, dashboardId }),
  );
  if (!authorizedCtx) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this dashboard' });
  }
  return authorizedCtx;
}

export const dashboardProcedure = t.procedure
  .input(z.object({ dashboardId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const authContext = await resolveDashboardAuth(ctx.session, input.dashboardId);
    return next({ ctx: { ...ctx, authContext } });
  });

export const analyticsProcedure = dashboardProcedure
  .input(z.object({ query: BAAnalyticsQuerySchema }))
  .use(({ ctx, input, next }) => {
    const { main, compare } = toSiteQuery(ctx.authContext.siteId, input.query);
    return next({ ctx: { ...ctx, main, compare } });
  });

export { authedProcedure };
