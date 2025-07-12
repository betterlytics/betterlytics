'server only';

import { getServerSession, User } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Session } from 'next-auth';
import { type AuthContext } from '@/entities/authContext';
import { authorizeUserDashboard } from '@/services/auth.service';
import { withServerAction, type ServerActionResponse } from '@/middlewares/serverActionHandler';

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

export async function requireDashboardAuth() {
  const session = await requireAuth();

  return session;
}

type ActionRequiringAuthContext<Args extends Array<unknown>, Ret> = (context: AuthContext, ...args: Args) => Ret;

export function withDashboardAuthContext<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringAuthContext<Args, Ret>,
) {
  return async function (dashboardId: string, ...args: Args): Promise<Awaited<Ret>> {
    const session = await requireDashboardAuth();
    const context = await authorizeUserDashboard(session.user.id, dashboardId);

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
