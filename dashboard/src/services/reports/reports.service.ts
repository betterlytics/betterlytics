'server-only';

import { type Day, format, startOfWeek } from 'date-fns';
import { DashboardWithReportSettings } from '@/entities/dashboard/dashboardSettings.entities';
import { EmailReportType } from '@/entities/reports/emailReportHistory.entities';
import {
  updateWeeklyReportSentAt,
  updateMonthlyReportSentAt,
} from '@/repositories/postgres/dashboardSettings.repository';
import { createReportHistoryEntry } from '@/repositories/postgres/emailReportHistory.repository';
import { enqueueEmail } from '@/services/email/email-queue.service';
import { createEmailRecipientKey } from '@/services/email/recipient-key.service';
import { getWeeklyReportData, getMonthlyReportData, ReportData } from './report-data.service';
import { env } from '@/lib/env';

async function logReportHistory(
  dashboardId: string,
  reportType: EmailReportType,
  recipient: string,
  reportData: ReportData,
  status: 'sent' | 'failed',
  errorMessage?: string,
): Promise<void> {
  try {
    await createReportHistoryEntry({
      dashboardId,
      reportType,
      recipient,
      status,
      periodStart: reportData.period.start,
      periodEnd: reportData.period.end,
      errorMessage: errorMessage ?? null,
    });
  } catch (error) {
    console.error(`Failed to log report history entry:`, error);
  }
}

async function enqueueReports(
  reportType: EmailReportType,
  recipients: string[],
  reportData: ReportData,
  dashboardId: string,
  dashboardUrl: string,
  periodKey: string,
): Promise<void> {
  for (const recipient of recipients) {
    const recipientHash = createEmailRecipientKey(recipient);
    try {
      await enqueueEmail({
        type: 'report',
        recipientKey: recipientHash,
        campaignKey: `${reportType}-report:${dashboardId}:${periodKey}:${recipientHash}`,
        data: { to: recipient, reportData, dashboardUrl },
      });
      await logReportHistory(dashboardId, reportType, recipient, reportData, 'sent');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to enqueue ${reportType} report to ${recipient}:`, error);
      await logReportHistory(dashboardId, reportType, recipient, reportData, 'failed', errorMessage);
    }
  }
}

export async function sendWeeklyReport(settings: DashboardWithReportSettings): Promise<void> {
  const { dashboard } = settings;

  const reportData = await getWeeklyReportData(dashboard.id, dashboard.siteId, dashboard.domain);
  const dashboardUrl = `${env.PUBLIC_BASE_URL}/dashboard/${dashboard.id}`;

  const weekAnchor = startOfWeek(new Date(), { weekStartsOn: (settings.weeklyReportDay % 7) as Day });
  const periodKey = format(weekAnchor, 'yyyy-MM-dd');

  await enqueueReports(
    'weekly',
    settings.weeklyReportRecipients,
    reportData,
    dashboard.id,
    dashboardUrl,
    periodKey,
  );

  await updateWeeklyReportSentAt(settings.id);
}

export async function sendMonthlyReport(settings: DashboardWithReportSettings): Promise<void> {
  const { dashboard } = settings;

  const reportData = await getMonthlyReportData(dashboard.id, dashboard.siteId, dashboard.domain);
  const dashboardUrl = `${env.PUBLIC_BASE_URL}/dashboard/${dashboard.id}`;

  const periodKey = format(reportData.period.start, 'yyyy-MM-dd');

  await enqueueReports(
    'monthly',
    settings.monthlyReportRecipients,
    reportData,
    dashboard.id,
    dashboardUrl,
    periodKey,
  );

  await updateMonthlyReportSentAt(settings.id);
}
