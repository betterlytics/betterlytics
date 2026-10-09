import { z } from 'zod';
import { BugReportStatus } from '@prisma/client';

export const AdminBugReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  dashboardId: z.string().nullable(),
  message: z.string(),
  status: z.nativeEnum(BugReportStatus),
  createdAt: z.date(),
});

export type AdminBugReport = z.infer<typeof AdminBugReportSchema>;
