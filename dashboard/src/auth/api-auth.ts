'server only';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getAuthorizedDashboardContextOrNull } from '@/services/auth/auth.service';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import { DashboardFindByUserSchema } from '@/entities/dashboard/dashboard.entities';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import { stableStringify } from '@/utils/stableStringify';

export const getCachedSession = cache(async () => {
  return await getServerSession(authOptions);
});

export const getCachedAuthorizedContext = cache(
  async (userId: string, dashboardId: string): Promise<AuthContext | null> => {
    return await getAuthorizedDashboardContextOrNull(DashboardFindByUserSchema.parse({ userId, dashboardId }));
  },
);

export async function createDemoContext(dashboardId: string): Promise<AuthContext> {
  const dashboard = await findDashboardById(dashboardId);
  return {
    dashboardId: dashboard.id,
    siteId: dashboard.siteId,
    userId: 'demo',
    role: 'viewer',
    isDemo: true,
  };
}

// Resolves demo dashboard context: uses the caller's own auth context if they're a member,
// otherwise falls back to a public demo context.
export async function resolveDemoDashboardContext(dashboardId: string): Promise<AuthContext> {
  const session = await getCachedSession();
  if (session?.user) {
    const authorizedCtx = await getCachedAuthorizedContext(session.user.id, dashboardId);
    if (authorizedCtx) return authorizedCtx;
  }
  return await createDemoContext(dashboardId);
}

type AnyFn = (...args: unknown[]) => unknown;
const fnSignatureMap = new WeakMap<AnyFn, string>();

function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) + hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function getFnSignature(fn: AnyFn): string {
  let sig = fnSignatureMap.get(fn);
  if (!sig) {
    sig = hashString(fn.toString());
    fnSignatureMap.set(fn, sig);
  }
  return sig;
}

function getArgsSignature<Args extends Array<unknown>>(args: Args): string {
  return hashString(stableStringify(args));
}

function buildDemoCacheKey(context: AuthContext, fnId: string, argsKey: string): string {
  return ['demo:v1', fnId, context.dashboardId, context.siteId, argsKey].join('|');
}

export async function executeWithDemoCache<Args extends Array<unknown>, Ret>(
  context: AuthContext,
  fn: (context: AuthContext, ...args: Args) => Ret,
  args: Args,
): Promise<Ret> {
  if (context.isDemo) {
    const fnId = getFnSignature(fn as AnyFn);
    const argsKey = getArgsSignature(args);
    const cacheKey = buildDemoCacheKey(context, fnId, argsKey);
    return await unstable_cache(async () => fn(context, ...args), [cacheKey], { revalidate: 300 })();
  }
  return await fn(context, ...args);
}
