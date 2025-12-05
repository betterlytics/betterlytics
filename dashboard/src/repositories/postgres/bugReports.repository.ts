import prisma from '@/lib/postgres';
import {
  type BugReport,
  type BugReportCreate,
  BugReportCreateSchema,
  BugReportSchema,
} from '@/entities/system/bugReport';

export async function createBugReport(data: BugReportCreate): Promise<BugReport> {
  try {
    const payload = BugReportCreateSchema.parse(data);

    const report = await prisma.bugReport.create({
      data: {
        userId: payload.userId,
        dashboardId: payload.dashboardId ?? null,
        message: payload.message,
      },
    });

    return BugReportSchema.parse(report);
  } catch (error) {
    console.error('Failed to create bug report', error);
    throw new Error('Unable to submit bug report');
  }
}
