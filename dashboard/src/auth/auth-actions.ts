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
import { DashboardFindByUserSchema } from '@/entities/dashboard';
import { stableStringify } from '@/utils/stableStringify';
import { trace, SpanStatusCode } from '@opentelemetry/api';

// Stable per-action signature to avoid cache key collisions (alternatively we provide each function an explicit name)
type AnyFn = (...args: unknown[]) => unknown;
const actionSignatureMap = new WeakMap<AnyFn, string>();
function hashString(input: string): string {
  // Simple DJB2 hash, stable and fast for short strings
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) + hash + input.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  return Math.abs(hash).toString(36);
}

function getActionSignature(fn: AnyFn): string {
  let sig = actionSignatureMap.get(fn);
  if (!sig) {
    const source = fn.toString();
    const h = hashString(source);
    sig = h;
    actionSignatureMap.set(fn, sig);
  }
  return sig;
}

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
      console.error(err.message);
      // Mask the UI-facing error
      throw new Error('An error occurred');
    } finally {
      span.end();
    }
  });
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

async function tryGetAuthorizedContext(userId: string, dashboardId: string): Promise<AuthContext | null> {
  return await getAuthorizedDashboardContextOrNull(DashboardFindByUserSchema.parse({ userId, dashboardId }));
}

async function createDemoContext(dashboardId: string): Promise<AuthContext> {
  const dashboard = await findDashboardById(dashboardId);
  return {
    dashboardId: dashboard.id,
    siteId: dashboard.siteId,
    userId: 'demo',
    role: 'viewer',
    isDemo: true,
  };
}

async function resolveDemoDashboardContext(dashboardId: string): Promise<AuthContext> {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const authorizedCtx = await tryGetAuthorizedContext(session.user.id, dashboardId);
    if (authorizedCtx) return authorizedCtx;
  }
  return await createDemoContext(dashboardId);
}

async function resolvePrivateDashboardContext(dashboardId: string): Promise<AuthContext> {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const authorizedCtx = await tryGetAuthorizedContext(session.user.id, dashboardId);
    if (authorizedCtx) return authorizedCtx;
  }
  throw new Error('Unauthorized');
}

async function resolveDashboardContext(dashboardId: string): Promise<AuthContext> {
  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
    return await resolveDemoDashboardContext(dashboardId);
  }
  return await resolvePrivateDashboardContext(dashboardId);
}

async function requireDashboardAuth(dashboardId: string): Promise<AuthContext> {
  const session = await requireAuth();
  const ctx = await getAuthorizedDashboardContextOrNull(
    DashboardFindByUserSchema.parse({ userId: session.user.id, dashboardId }),
  );
  if (!ctx) throw new Error('Unauthorized');
  return ctx;
}

function getArgsSignature<Args extends Array<unknown>>(args: Args): string {
  const serializedArgs = stableStringify(args);
  return hashString(serializedArgs);
}

function createCacheKeyForDemo(context: AuthContext, actionId: string, argsKey: string): string {
  return ['demo:v1', actionId, context.dashboardId, context.siteId, argsKey].join('|');
}

async function executeWithCachingIfDemo<Args extends Array<unknown>, Ret>(
  context: AuthContext,
  action: ActionRequiringAuthContext<Args, Ret>,
  args: Args,
): Promise<Ret> {
  // For demo/public dashboards, cache reads to reduce load
  if (context.isDemo) {
    const actionId = getActionSignature(action as AnyFn);
    const argsKey = getArgsSignature(args);
    const cacheKey = createCacheKeyForDemo(context, actionId, argsKey);
    return await unstable_cache(async () => action(context, ...args), [cacheKey], { revalidate: 300 })();
  }

  return await action(context, ...args);
}

export function withDashboardAuthContext<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringAuthContext<Args, Ret>,
) {
  return async function (dashboardId: string, ...args: Args): Promise<Awaited<Ret>> {
    const context = await resolveDashboardContext(dashboardId);
    const actionId = getActionSignature(action as AnyFn);
    const spanName = `action.${(action as AnyFn).name || 'dashboard_action'}`;
    return await withActionSpan(
      spanName,
      {
        'ba.action.id': actionId,
        'ba.dashboard.id': context.dashboardId,
        'ba.site.id': context.siteId,
        'ba.auth.is_demo': context.isDemo,
      },
      async () => await executeWithCachingIfDemo(context, action, args),
    );
  };
}

export function withDashboardMutationAuthContext<Args extends Array<unknown> = unknown[], Ret = unknown>(
  action: ActionRequiringAuthContext<Args, Ret>,
) {
  return async function (dashboardId: string, ...args: Args): Promise<Awaited<Ret>> {
    const context = await requireDashboardAuth(dashboardId);
    const actionId = getActionSignature(action as AnyFn);
    const spanName = `action.${(action as AnyFn).name || 'dashboard_mutation'}`;
    return await withActionSpan(
      spanName,
      {
        'ba.action.id': actionId,
        'ba.dashboard.id': context.dashboardId,
        'ba.site.id': context.siteId,
        'ba.auth.is_demo': context.isDemo,
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
      { 'ba.user.id': session.user.id },
      async () => await action(session.user, ...args),
    );
  });
}
