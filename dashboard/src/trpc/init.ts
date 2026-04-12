import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import superjson from 'superjson';
import { env } from '@/lib/env';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import { BAAnalyticsQuerySchema } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import {
  getCachedSession,
  getCachedAuthorizedContext,
  resolveDemoDashboardContext,
  executeWithDemoCache,
} from '@/auth/api-auth';

export async function createTRPCContext() {
  const session = await getCachedSession();
  return { session };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      return { ...shape, message: 'An error occurred' };
    }
    return shape;
  },
});

export const createRouter = t.router;
export const publicProcedure = t.procedure;

const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

async function resolveDashboardAuth(session: TRPCContext['session'], dashboardId: string): Promise<AuthContext> {
  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
    return await resolveDemoDashboardContext(dashboardId);
  }

  if (!session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const authorizedCtx = await getCachedAuthorizedContext(session.user.id, dashboardId);
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
  })
  .use(async ({ ctx, input, next, path, getRawInput }) => {
    const rawInput = await getRawInput();
    return executeWithDemoCache(ctx.authContext, (_context, _args) => next({ ctx }), [{ input, path, rawInput }]);
  });

export const analyticsProcedure = dashboardProcedure
  .input(z.object({ query: BAAnalyticsQuerySchema }))
  .use(({ ctx, input, next }) => {
    const { main, compare } = toSiteQuery(ctx.authContext.siteId, input.query);
    return next({ ctx: { ...ctx, main, compare } });
  });

export { authedProcedure };
