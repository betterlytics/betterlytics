import 'server-only';

import { getCachedSession } from '@/auth/api-auth';
import { assertSuperAdmin } from '@/auth/superAdmin-auth';
import { recordSuperAdminAction } from '@/services/superadmin/auditLog.service';
import type { ServerActionResponse } from '@/middlewares/serverActionHandler';
import { ForbiddenError, UserException } from '@/lib/exceptions';
import { unstable_rethrow } from 'next/navigation';

export type SuperAdminCtx = {
  actorUserId: string;
};

export type SuperAdminAuditInfo = {
  targetId: string | null;
  payload: Record<string, unknown>;
};

function toErrorResponse(error: unknown, label: string): ServerActionResponse<never> {
  console.error(`Super admin ${label} error:`, error);
  const isSafe = error instanceof UserException || error instanceof ForbiddenError;
  return {
    success: false,
    error: {
      message: isSafe ? error.message : 'An error occurred',
      name: isSafe ? error.name : 'UnknownError',
    },
  };
}

export function withSuperAdminAction<TArgs extends unknown[], TReturn>(
  action: string,
  targetType: string,
  audit: (...args: TArgs) => SuperAdminAuditInfo,
  fn: (ctx: SuperAdminCtx, ...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<ServerActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ServerActionResponse<TReturn>> => {
    try {
      const session = await getCachedSession();
      assertSuperAdmin(session);

      const ctx: SuperAdminCtx = { actorUserId: session.user.id };
      const { targetId, payload } = audit(...args);

      await recordSuperAdminAction(ctx.actorUserId, action, targetType, targetId, payload);

      const result = await fn(ctx, ...args);
      return { success: true, data: result };
    } catch (error) {
      unstable_rethrow(error);
      return toErrorResponse(error, `action [${action}]`);
    }
  };
}

export function withSuperAdminQuery<TArgs extends unknown[], TReturn>(
  fn: (ctx: SuperAdminCtx, ...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<ServerActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ServerActionResponse<TReturn>> => {
    try {
      const session = await getCachedSession();
      assertSuperAdmin(session);

      const ctx: SuperAdminCtx = { actorUserId: session.user.id };
      const result = await fn(ctx, ...args);

      return { success: true, data: result };
    } catch (error) {
      unstable_rethrow(error);
      return toErrorResponse(error, 'query');
    }
  };
}
