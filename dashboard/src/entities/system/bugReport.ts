import { z } from 'zod';

export const BUG_REPORT_MAX_LENGTH = 2000;

export const BugReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dashboardId: z.string().nullable(),
  message: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const NonEmptyString = z.string().min(1);

export const BugReportCreateSchema = z.object({
  userId: NonEmptyString,
  dashboardId: NonEmptyString.optional(),
  message: z.string().min(5).max(BUG_REPORT_MAX_LENGTH),
});

export const BugReportSubmissionSchema = BugReportCreateSchema.omit({ userId: true, dashboardId: true });

export type BugReport = z.infer<typeof BugReportSchema>;
export type BugReportCreate = z.infer<typeof BugReportCreateSchema>;
export type BugReportSubmission = z.infer<typeof BugReportSubmissionSchema>;
