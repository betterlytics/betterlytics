'use server';

import { withSuperAdminAction, withSuperAdminQuery, type SuperAdminCtx } from '@/middlewares/withSuperAdminAction';
import type { BugReportStatus } from '@prisma/client';
import { getBugReports, updateBugReportStatus } from '@/services/superadmin/bugReports.service';

export const getBugReportsAction = withSuperAdminQuery(
  async (_ctx: SuperAdminCtx, page?: number, status?: BugReportStatus) => {
    return getBugReports(page, status);
  },
);

export const setBugReportStatusAction = withSuperAdminAction(
  'update_bug_report_status',
  'bug_report',
  async (reportId: string, status: BugReportStatus) => ({ targetId: reportId, payload: { status } }),
  async (_ctx: SuperAdminCtx, reportId: string, status: BugReportStatus) => {
    await updateBugReportStatus(reportId, status);
  },
);
