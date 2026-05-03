import 'server-only';

import prisma from '@/lib/postgres';
import { AdminBugReportSchema, type AdminBugReport } from '@/entities/superadmin/bugReport.entities';
import { ADMIN_PAGE_SIZE } from '@/constants/superadmin';
import type { BugReportStatus } from '@prisma/client';

export async function listBugReports(
  page = 1,
  status?: BugReportStatus,
): Promise<{ reports: AdminBugReport[]; total: number }> {
  const where = status ? { status } : undefined;

  const [rawReports, total] = await Promise.all([
    prisma.bugReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      include: { user: { select: { email: true } } },
    }),
    prisma.bugReport.count({ where }),
  ]);

  return {
    reports: rawReports.map((r) =>
      AdminBugReportSchema.parse({
        id: r.id,
        userId: r.userId,
        userEmail: r.user.email ?? 'unknown',
        dashboardId: r.dashboardId,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt,
      }),
    ),
    total,
  };
}

export async function setBugReportStatus(id: string, status: BugReportStatus): Promise<void> {
  await prisma.bugReport.update({ where: { id }, data: { status } });
}
