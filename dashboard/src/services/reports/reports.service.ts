'server-only';

import { format } from 'date-fns';
import { DashboardWithReportSettings } from '@/entities/dashboard/dashboardSettings.entities';
import {
  updateWeeklyReportSentAt,
  updateMonthlyReportSentAt,
} from '@/repositories/postgres/dashboardSettings.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { createEmailRecipientKey } from '@/services/email/recipient-key.service';
import { getWeeklyReportData, getMonthlyReportData, ReportData } from './report-data.service';

type ReportType = 'weekly' | 'monthly';

async function enqueueReports(
  reportType: ReportType,
  recipients: string[],
  reportData: ReportData,
  dashboardId: string,
  periodKey: string,
): Promise<void> {
  for (const recipient of recipients) {
    try {
      await enqueueEmail({
        type: 'report',
        recipientKey: createEmailRecipientKey(recipient),
        campaignKey: `${reportType}-report:${dashboardId}:${periodKey}`,
        data: { to: recipient, reportData },
      });
    } catch (error) {
      console.error(`Failed to enqueue ${reportType} report to ${recipient}:`, error);
    }
  }
}

export async function sendWeeklyReport(settings: DashboardWithReportSettings): Promise<void> {
  const { dashboard } = settings;

  const reportData = await getWeeklyReportData(dashboard.id, dashboard.siteId, dashboard.domain);
  const periodKey = format(reportData.period.start, 'yyyy-MM-dd');

  await enqueueReports('weekly', settings.weeklyReportRecipients, reportData, dashboard.id, periodKey);

  await updateWeeklyReportSentAt(settings.id);
}

export async function sendMonthlyReport(settings: DashboardWithReportSettings): Promise<void> {
  const { dashboard } = settings;

  const reportData = await getMonthlyReportData(dashboard.id, dashboard.siteId, dashboard.domain);
  const periodKey = format(reportData.period.start, 'yyyy-MM-dd');

  await enqueueReports('monthly', settings.monthlyReportRecipients, reportData, dashboard.id, periodKey);

  await updateMonthlyReportSentAt(settings.id);
}
