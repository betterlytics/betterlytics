'server-only';

import { type BugReportCreate } from '@/entities/system/bugReport';
import { createBugReport } from '@/repositories/postgres/bugReports.repository';

export async function submitBugReport(data: BugReportCreate) {
  return createBugReport(data);
}
