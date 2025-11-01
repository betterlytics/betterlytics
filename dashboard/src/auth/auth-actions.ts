'server only';

import { getServerSession, User } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Session } from 'next-auth';
import { type AuthContext } from '@/entities/authContext';
import { getAuthorizedDashboardContextOrNull } from '@/services/auth.service';
import { withServerAction } from '@/middlewares/serverActionHandler';
import { findDashboardById } from '@/repositories/postgres/dashboard';
import { env } from '@/lib/env';
import { unstable_cache } from 'next/cache';

// Unique identifiers per wrapped action to avoid cache key collisions
const actionIdMap = new WeakMap<Function, string>();
let actionIdSeq = 0;
function getActionId(fn: Function): string {
  let id = actionIdMap.get(fn);
  if (!id) {
    id = `act_${++actionIdSeq}`;
    actionIdMap.set(fn, id);
  }
  return id;
}

export async function getAuthSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session;
}

export async function requireAuth(): Promise<Session> {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/signin');
  }

  return session;
}

type ActionRequiringAuthContext<Args extends Array<unknown>, Ret> = (context: AuthContext, ...args: Args) => Ret;

async function resolveDashboardContext(dashboardId: string): Promise<AuthContext> {
  // Public/demo path: do NOT read session. This enables ISR for public routes.
  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
    const dashboard = await findDashboardById(dashboardId);
    return {
      dashboardId: dashboard.id,
      siteId: dashboard.siteId,
      userId: 'demo',
      role: 'viewer',
    };
  }

  // Private/owner path: read session and authorize.
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const authorizedCtx = await getAuthorizedDashboardContextOrNull(session.user.id, dashboardId);
    if (authorizedCtx) return authorizedCtx;
  }

  throw new Error('Unauthorized');
}

async function resolveDashboardContextStrict(dashboardId: string): Promise<AuthContext> {
  const session = await requireAuth();
  const ctx = await getAuthorizedDashboardContextOrNull(session.user.id, dashboardId);
  if (!ctx) throw new Error('Unauthorized');
  return ctx;
}

export function withDashboardAuthContext<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringAuthContext<Args, Ret>,
) {
  return async function (dashboardId: string, ...args: Args): Promise<Awaited<Ret>> {
    const context = await resolveDashboardContext(dashboardId);

    try {
      // For demo/public dashboards, cache reads to reduce load
      if (context.userId === 'demo') {
        const actionId = getActionId(action as Function);
        const serializedArgs = JSON.stringify(args, (_key, value) => {
          if (value instanceof Date) return { __date: value.toISOString() };
          return value;
        });
        const cacheKey = ['demo', actionId, context.dashboardId, context.siteId, serializedArgs].join('|');

        return await unstable_cache(async () => action(context, ...args), [cacheKey], { revalidate: 300 })();
      }

      return await action(context, ...args);
    } catch (e) {
      console.error('Error occurred:', e);
      throw new Error('An error occurred');
    }
  };
}

export function withDashboardMutationAuthContext<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringAuthContext<Args, Ret>,
) {
  return async function (dashboardId: string, ...args: Args): Promise<Awaited<Ret>> {
    const context = await resolveDashboardContextStrict(dashboardId);

    try {
      return await action(context, ...args);
    } catch (e) {
      console.error('Error occurred:', e);
      throw new Error('An error occurred');
    }
  };
}

type ActionRequiringUserId<Args extends Array<unknown>, Ret> = (user: User, ...args: Args) => Ret;

export function withUserAuth<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringUserId<Args, Ret>,
) {
  return withServerAction(async function (...args: Args): Promise<Awaited<Ret>> {
    const session = await requireAuth();

    return await action(session.user, ...args);
  });
}
