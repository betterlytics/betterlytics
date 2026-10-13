import 'server-only';

import type { BugReportStatus } from '@prisma/client';
import { listBugReports, setBugReportStatus } from '@/repositories/postgres/admin/bugReports.repository';
import { ADMIN_PAGE_SIZE } from '@/constants/admin';

export async function getBugReports(page = 1, status?: BugReportStatus) {
  const { reports, total } = await listBugReports(page, status);
  return {
    reports,
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    totalPages: Math.ceil(total / ADMIN_PAGE_SIZE),
  };
}

export async function updateBugReportStatus(id: string, status: BugReportStatus): Promise<void> {
  await setBugReportStatus(id, status);
}
