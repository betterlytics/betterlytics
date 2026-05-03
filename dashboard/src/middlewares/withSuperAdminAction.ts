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

type SuperAdminAuditStatus = 'success' | 'failed';

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

async function recordAuditResult(
  actorUserId: string,
  action: string,
  targetType: string,
  auditInfo: SuperAdminAuditInfo,
  status: SuperAdminAuditStatus,
): Promise<void> {
  await recordSuperAdminAction(
    actorUserId,
    action,
    targetType,
    auditInfo.targetId,
    auditInfo.payload,
    status,
  );
}

export function withSuperAdminAction<TArgs extends unknown[], TReturn>(
  action: string,
  targetType: string,
  audit: (...args: TArgs) => Promise<SuperAdminAuditInfo>,
  fn: (ctx: SuperAdminCtx, ...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<ServerActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ServerActionResponse<TReturn>> => {
    let ctx: SuperAdminCtx | null = null;
    let auditInfo: SuperAdminAuditInfo | null = null;

    try {
      const session = await getCachedSession();
      assertSuperAdmin(session);

      ctx = { actorUserId: session.user.id };
      const resolvedAudit = await audit(...args);
      auditInfo = resolvedAudit;

      const result = await fn(ctx, ...args);
      await recordAuditResult(ctx.actorUserId, action, targetType, resolvedAudit, 'success');

      return { success: true, data: result };
    } catch (error) {
      unstable_rethrow(error);

      if (ctx && auditInfo) {
        try {
          await recordAuditResult(ctx.actorUserId, action, targetType, auditInfo, 'failed');
        } catch (auditError) {
          console.error(`Failed to record super admin audit failure for [${action}]:`, auditError);
        }
      }

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
