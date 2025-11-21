'server-only';

import { type BugReportCreate } from '@/entities/bugReport';
import { createBugReport } from '@/repositories/postgres/bugReports';

export async function submitBugReport(data: BugReportCreate) {
  return createBugReport(data);
}
