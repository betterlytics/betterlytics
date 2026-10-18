import 'server-only';

import { unstable_rethrow } from 'next/navigation';
import type { AdminAuditStatus } from '@prisma/client';
import { requireAdminActor } from '@/auth/admin-auth';
import { recordAdminAction } from '@/services/admin/auditLog.service';
import {
  isAdminSectionAvailable,
  type AdminActor,
  type AdminSectionKey,
} from '@/entities/admin/adminAccess.entities';
import type { ServerActionResponse } from '@/middlewares/serverActionHandler';
import { ForbiddenError, UserException } from '@/lib/exceptions';

export type AdminCtx = {
  actor: AdminActor;
};

export type AdminAuditInfo = {
  targetId: string | null;
  targetLabel?: string | null;
  payload?: Record<string, unknown>;
};

type AdminActionOptions<TArgs extends unknown[]> = {
  section: AdminSectionKey;
  action: string;
  targetType: string;
  audit: (...args: TArgs) => Promise<AdminAuditInfo>;
};

async function resolveSectionActor(section: AdminSectionKey): Promise<AdminActor> {
  const actor = await requireAdminActor();
  if (!isAdminSectionAvailable(section, actor.edition)) {
    throw new ForbiddenError();
  }
  return actor;
}

function toErrorResponse(error: unknown, label: string): ServerActionResponse<never> {
  console.error(`Admin ${label} error:`, error);
  const isSafe = error instanceof UserException || error instanceof ForbiddenError;
  return {
    success: false,
    error: {
      message: isSafe ? error.message : 'An error occurred',
      name: isSafe ? error.name : 'UnknownError',
    },
  };
}

async function recordAudit(
  actor: AdminActor,
  options: { action: string; targetType: string },
  auditInfo: AdminAuditInfo,
  status: AdminAuditStatus,
): Promise<void> {
  try {
    await recordAdminAction({
      actor,
      action: options.action,
      targetType: options.targetType,
      targetId: auditInfo.targetId,
      targetLabel: auditInfo.targetLabel,
      payload: auditInfo.payload,
      status,
    });
  } catch (auditError) {
    console.error(`Failed to record admin audit ${status} for [${options.action}]:`, auditError);
  }
}

export function withAdminAction<TArgs extends unknown[], TReturn>(
  options: AdminActionOptions<TArgs>,
  fn: (ctx: AdminCtx, ...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<ServerActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ServerActionResponse<TReturn>> => {
    let actor: AdminActor | null = null;
    let auditInfo: AdminAuditInfo | null = null;

    try {
      actor = await resolveSectionActor(options.section);
      auditInfo = await options.audit(...args);

      const result = await fn({ actor }, ...args);

      await recordAudit(actor, options, auditInfo, 'success');
      return { success: true, data: result };
    } catch (error) {
      unstable_rethrow(error);

      if (actor && auditInfo) {
        await recordAudit(actor, options, auditInfo, 'failed');
      }

      return toErrorResponse(error, `action [${options.action}]`);
    }
  };
}

export function withAdminQuery<TArgs extends unknown[], TReturn>(
  section: AdminSectionKey,
  fn: (ctx: AdminCtx, ...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<ServerActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ServerActionResponse<TReturn>> => {
    try {
      const actor = await resolveSectionActor(section);
      const result = await fn({ actor }, ...args);
      return { success: true, data: result };
    } catch (error) {
      unstable_rethrow(error);
      return toErrorResponse(error, 'query');
    }
  };
}
