'server-only';

import { logSuperAdminAction, listAuditLogEntries } from '@/repositories/postgres/superadmin/auditLog.repository';
import { ADMIN_PAGE_SIZE } from '@/constants/superadmin';

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

export async function recordSuperAdminAction(
  actorUserId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await logSuperAdminAction(actorUserId, action, targetType, targetId, payload);
}
