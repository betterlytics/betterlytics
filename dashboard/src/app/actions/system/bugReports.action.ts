'use server';

import { withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { BugReportSubmission, BugReportSubmissionSchema } from '@/entities/system/bugReport.entities';
import { submitBugReport } from '@/services/system/bugReports.service';
import { type AuthContext } from '@/entities/auth/authContext.entities';

export const submitBugReportAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, payload: BugReportSubmission) => {
    const data = BugReportSubmissionSchema.parse(payload);

    await submitBugReport({
      userId: ctx.userId,
      dashboardId: ctx.dashboardId,
      message: data.message,
    });
  },
);
