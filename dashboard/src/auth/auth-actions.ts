'server only';

import { getServerSession, User } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Session } from 'next-auth';
import { type AuthContext } from '@/entities/authContext';
import { authorizeUserDashboard } from '@/services/auth.service';
import { withServerAction } from '@/middlewares/serverActionHandler';
import { findDashboardById } from '@/repositories/postgres/dashboard';
import { env } from '@/lib/env';

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
  const session = await getServerSession(authOptions);
  if (session?.user) {
    try {
      return await authorizeUserDashboard(session.user.id, dashboardId);
    } catch (e) {
      // If the requested dashboard is the public demo, fall back to demo viewer context
      if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
        const dashboard = await findDashboardById(dashboardId);
        return {
          dashboardId: dashboard.id,
          siteId: dashboard.siteId,
          userId: 'demo',
          role: 'viewer',
        };
      }
      throw e;
    }
  }

  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
    const dashboard = await findDashboardById(dashboardId);
    return {
      dashboardId: dashboard.id,
      siteId: dashboard.siteId,
      userId: 'demo',
      role: 'viewer',
    };
  }

  throw new Error('Unauthorized');
}

async function resolveDashboardContextStrict(dashboardId: string): Promise<AuthContext> {
  const session = await requireAuth();
  return authorizeUserDashboard(session.user.id, dashboardId);
}

export function withDashboardAuthContext<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringAuthContext<Args, Ret>,
) {
  return async function (dashboardId: string, ...args: Args): Promise<Awaited<Ret>> {
    const context = await resolveDashboardContext(dashboardId);

    try {
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
