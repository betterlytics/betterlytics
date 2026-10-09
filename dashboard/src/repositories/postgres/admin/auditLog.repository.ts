import 'server-only';

import prisma from '@/lib/postgres';
import {
  AdminAuditLogEntrySchema,
  type AdminAuditLogEntry,
  type AdminAuditRecord,
} from '@/entities/admin/auditLog.entities';
import { ADMIN_PAGE_SIZE } from '@/constants/admin';

export async function listAuditLogEntries(page = 1): Promise<{ entries: AdminAuditLogEntry[]; total: number }> {
  const [rawEntries, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    prisma.adminAuditLog.count(),
  ]);

  return {
    entries: rawEntries.map((e) => AdminAuditLogEntrySchema.parse(e)),
    total,
  };
}

export async function createAuditLogEntry(record: AdminAuditRecord): Promise<void> {
  await prisma.adminAuditLog.create({
    data: { ...record, payload: record.payload as never },
  });
}
