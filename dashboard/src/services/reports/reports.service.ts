'server-only';

import { DashboardWithReportSettings } from '@/entities/dashboard/dashboardSettings.entities';
import { EmailReportType } from '@/entities/reports/emailReportHistory.entities';
import {
  updateWeeklyReportSentAt,
  updateMonthlyReportSentAt,
} from '@/repositories/postgres/dashboardSettings.repository';
import { createReportHistoryEntry } from '@/repositories/postgres/emailReportHistory.repository';
import { sendReportEmail } from '@/services/email/mail.service';
import { getWeeklyReportData, getMonthlyReportData, ReportData } from './report-data.service';
import { env } from '@/lib/env';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function sendWeeklyReport(settings: DashboardWithReportSettings): Promise<void> {
  const { dashboard } = settings;

  const reportData = await getWeeklyReportData(dashboard.id, dashboard.siteId, dashboard.domain);
  const dashboardUrl = `${env.PUBLIC_BASE_URL}/dashboard/${dashboard.id}`;

  for (const recipient of settings.weeklyReportRecipients) {
    try {
      await sendReportEmail({
        to: recipient,
        reportData,
        dashboardUrl,
      });
      await logReportHistory(dashboard.id, 'weekly', recipient, reportData, 'sent');
      await sleep(500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to send weekly report to ${recipient}:`, error);
      await logReportHistory(dashboard.id, 'weekly', recipient, reportData, 'failed', errorMessage);
    }
  }

  await updateWeeklyReportSentAt(settings.id);
}

export async function sendMonthlyReport(settings: DashboardWithReportSettings): Promise<void> {
  const { dashboard } = settings;

  const reportData = await getMonthlyReportData(dashboard.id, dashboard.siteId, dashboard.domain);
  const dashboardUrl = `${env.PUBLIC_BASE_URL}/dashboard/${dashboard.id}`;

  for (const recipient of settings.monthlyReportRecipients) {
    try {
      await sendReportEmail({
        to: recipient,
        reportData,
        dashboardUrl,
      });
      await logReportHistory(dashboard.id, 'monthly', recipient, reportData, 'sent');
      await sleep(500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to send monthly report to ${recipient}:`, error);
      await logReportHistory(dashboard.id, 'monthly', recipient, reportData, 'failed', errorMessage);
    }
  }

  await updateMonthlyReportSentAt(settings.id);
}
