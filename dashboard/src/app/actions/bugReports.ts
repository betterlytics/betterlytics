'use server';

import { withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { BugReportSubmission, BugReportSubmissionSchema } from '@/entities/bugReport';
import { submitBugReport } from '@/services/bugReports';
import { type AuthContext } from '@/entities/authContext';

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
