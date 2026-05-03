import 'server-only';

import prisma from '@/lib/postgres';
import { AuditLogEntrySchema, type AuditLogEntry } from '@/entities/superadmin/auditLog.entities';
import { ADMIN_PAGE_SIZE } from '@/constants/superadmin';

export async function listAuditLogEntries(page = 1): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const [rawEntries, total] = await Promise.all([
    prisma.superAdminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    prisma.superAdminAuditLog.count(),
  ]);

  return {
    entries: rawEntries.map((e) => AuditLogEntrySchema.parse(e)),
    total,
  };
}

export async function logSuperAdminAction(
  actorUserId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await prisma.superAdminAuditLog.create({
    data: {
      actorUserId,
      action,
      targetType,
      targetId,
      payload: payload as never,
    },
  });
}
