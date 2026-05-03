import 'server-only';

import { User } from 'next-auth';
import { redirect } from 'next/navigation';
import { Session } from 'next-auth';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import { withServerAction } from '@/middlewares/serverActionHandler';
import { env } from '@/lib/env';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { UserException } from '@/lib/exceptions';
import { Permission, hasPermission } from '@/lib/permissions';
import { DashboardRole } from '@prisma/client';
import {
  getCachedSession,
  getCachedAuthorizedContext,
  resolveDemoDashboardContext,
  executeWithDemoCache,
  getFnSignature,
} from '@/auth/api-auth';

export { getCachedSession, getCachedAuthorizedContext };

type AnyFn = (...args: unknown[]) => unknown;

const tracer = trace.getTracer('dashboard');

async function withActionSpan<T>(
  name: string,
  attrs: Record<string, string | number | boolean>,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    span.setAttributes(attrs);
    try {
      const res = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return res;
    } catch (e) {
      console.error(e);
      const err = e as Error;
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      // Propagate user-safe errors; mask the rest
      if (e instanceof UserException) {
        throw e;
      }
      throw new Error('An error occurred');
    } finally {
      span.end();
    }
  });
}

export async function getAuthSession(): Promise<Session | null> {
  return await getCachedSession();
}

export async function requireAuth(): Promise<Session> {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/signin');
  }

  return session;
}

type ActionRequiringAuthContext<Args extends Array<unknown>, Ret> = (context: AuthContext, ...args: Args) => Ret;

async function requireDashboardAuth(dashboardId: string): Promise<AuthContext> {
  const session = await requireAuth();
  const ctx = await getCachedAuthorizedContext(session.user.id, dashboardId);
  if (!ctx) {
    redirect('/dashboards');
  }
  return ctx;
}

async function resolveDashboardContext(dashboardId: string): Promise<AuthContext> {
  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
    return await resolveDemoDashboardContext(dashboardId);
  }
  return await requireDashboardAuth(dashboardId);
}

export function withDashboardAuthContext<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringAuthContext<Args, Ret>,
) {
  return async function (dashboardId: string, ...args: Args): Promise<Awaited<Ret>> {
    const context = await resolveDashboardContext(dashboardId);
    const spanName = `action.${(action as AnyFn).name || 'dashboard_action'}`;
    return await withActionSpan(
      spanName,
      {
        'ba.action.id': getFnSignature(action as AnyFn),
        'ba.dashboard.id': context.dashboardId,
        'ba.site.id': context.siteId,
        'ba.auth.is_demo': context.isDemo,
      },
      async () => await executeWithDemoCache(context, action, args),
    );
  };
}

export type MutationAuthOptions = {
  permission?: Permission;
  allowedRoles?: DashboardRole[];
};

function assertRoleAuthorized(context: AuthContext, options?: MutationAuthOptions): void {
  if (!options) {
    if (context.role === 'viewer') {
      throw new UserException('You do not have permission to perform this action');
    }
    return;
  }

  if (options.allowedRoles) {
    if (!options.allowedRoles.includes(context.role)) {
      throw new UserException('You do not have permission to perform this action');
    }
    return;
  }

  if (options.permission) {
    if (!hasPermission(context.role, options.permission)) {
      throw new UserException('You do not have permission to perform this action');
    }
  }
}

export function withDashboardMutationAuthContext<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringAuthContext<Args, Ret>,
  options?: MutationAuthOptions,
) {
  return async function (dashboardId: string, ...args: Args): Promise<Awaited<Ret>> {
    const context = await requireDashboardAuth(dashboardId);

    assertRoleAuthorized(context, options);

    const spanName = `action.${(action as AnyFn).name || 'dashboard_mutation'}`;
    return await withActionSpan(
      spanName,
      {
        'ba.action.id': getFnSignature(action as AnyFn),
        'ba.dashboard.id': context.dashboardId,
        'ba.site.id': context.siteId,
        'ba.auth.is_demo': context.isDemo,
        'ba.auth.role': context.role,
      },
      async () => await action(context, ...args),
    );
  };
}

type ActionRequiringUserId<Args extends Array<unknown>, Ret> = (user: User, ...args: Args) => Ret;

export function withUserAuth<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringUserId<Args, Ret>,
) {
  return withServerAction(async function (...args: Args): Promise<Awaited<Ret>> {
    const session = await requireAuth();
    const spanName = `action.${(action as AnyFn).name || 'user_action'}`;
    return await withActionSpan(
      spanName,
      {
        'ba.action.id': getFnSignature(action as AnyFn),
        'ba.user.id': session.user.id,
      },
      async () => await action(session.user, ...args),
    );
  });
}
