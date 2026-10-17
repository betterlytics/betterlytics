import 'server-only';

import type { AdminAuditStatus } from '@prisma/client';
import type { AdminActor } from '@/entities/admin/adminAccess.entities';
import { createAuditLogEntry, listAuditLogEntries } from '@/repositories/postgres/admin/auditLog.repository';
import { ADMIN_PAGE_SIZE } from '@/constants/admin';

export async function getAuditLog(page = 1) {
  const { entries, total } = await listAuditLogEntries(page);
  return {
    entries,
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    totalPages: Math.ceil(total / ADMIN_PAGE_SIZE),
  };
}

export async function recordAdminAction(params: {
  actor: AdminActor;
  action: string;
  targetType: string;
  targetId: string | null;
  targetLabel?: string | null;
  payload?: Record<string, unknown>;
  status: AdminAuditStatus;
}): Promise<void> {
  await createAuditLogEntry({
    actorUserId: params.actor.userId,
    actorLabel: params.actor.email,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    targetLabel: params.targetLabel ?? null,
    payload: params.payload ?? {},
    status: params.status,
  });
}
