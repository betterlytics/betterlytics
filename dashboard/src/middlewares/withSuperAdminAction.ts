'server-only';

import { getCachedSession } from '@/auth/api-auth';
import { assertSuperAdmin } from '@/auth/superAdmin-auth';
import { recordSuperAdminAction } from '@/services/superadmin/auditLog.service';
import type { ServerActionResponse } from '@/middlewares/serverActionHandler';
import { unstable_rethrow } from 'next/navigation';

export type SuperAdminCtx = {
  actorUserId: string;
};

export type SuperAdminAuditResult<TReturn> = {
  result: TReturn;
  targetId: string | null;
  payload: Record<string, unknown>;
};

export function withSuperAdminAction<TArgs extends unknown[], TReturn>(
  action: string,
  targetType: string,
  fn: (ctx: SuperAdminCtx, ...args: TArgs) => Promise<SuperAdminAuditResult<TReturn>>,
): (...args: TArgs) => Promise<ServerActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ServerActionResponse<TReturn>> => {
    try {
      const session = await getCachedSession();
      assertSuperAdmin(session);

      const ctx: SuperAdminCtx = { actorUserId: session.user.id };
      const { result, targetId, payload } = await fn(ctx, ...args);

      recordSuperAdminAction(ctx.actorUserId, action, targetType, targetId, payload).catch((err) => {
        console.error(`Failed to record audit log for action [${action}]:`, err);
      });

      return { success: true, data: result };
    } catch (error) {
      unstable_rethrow(error);
      console.error(`Super admin action error [${action}]:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          name: error instanceof Error ? error.name : 'UnknownError',
        },
      };
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
      console.error('Super admin query error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          name: error instanceof Error ? error.name : 'UnknownError',
        },
      };
    }
  };
}
