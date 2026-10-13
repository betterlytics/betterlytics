'use server';

import type { BugReportStatus } from '@prisma/client';
import { withAdminAction, withAdminQuery, type AdminCtx } from '@/middlewares/withAdminAction';
import { getBugReports, updateBugReportStatus } from '@/services/admin/bugReports.service';

export const getBugReportsAction = withAdminQuery(
  'bug-reports',
  async (_ctx: AdminCtx, page?: number, status?: BugReportStatus) => {
    return getBugReports(page, status);
  },
);

export const setBugReportStatusAction = withAdminAction(
  {
    section: 'bug-reports',
    action: 'update_bug_report_status',
    targetType: 'bug_report',
    audit: async (reportId: string, status: BugReportStatus) => ({ targetId: reportId, payload: { status } }),
  },
  async (_ctx: AdminCtx, reportId: string, status: BugReportStatus) => {
    await updateBugReportStatus(reportId, status);
  },
);
