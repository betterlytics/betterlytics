'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { BugReportSubmission, BugReportSubmissionSchema } from '@/entities/system/bugReport.entities';
import { submitBugReport } from '@/services/system/bugReports.service';
import { type User } from 'next-auth';

export const submitBugReportAction = withUserAuth(
  async (user: User, dashboardId: string | undefined, payload: BugReportSubmission) => {
    const data = BugReportSubmissionSchema.parse(payload);

    await submitBugReport({
      userId: user.id,
      dashboardId: dashboardId || undefined,
      message: data.message,
    });
  },
);
