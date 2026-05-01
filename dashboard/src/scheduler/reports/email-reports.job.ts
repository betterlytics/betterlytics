'server-only';

import { findDashboardsWithReportsEnabled } from '@/repositories/postgres/dashboardSettings.repository';
import { canDashboardReceiveReports } from '@/lib/billing/capabilityAccess';
import { sendWeeklyReport, sendMonthlyReport } from '@/services/reports/reports.service';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getIsoDay(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export async function runDailyReportCheck(): Promise<void> {
  const today = new Date();
  const dayOfWeek = getIsoDay(today);
  const dayOfMonth = today.getDate();

  const dashboardSettings = await findDashboardsWithReportsEnabled();

  console.info(
    `Running daily report check for ${DAY_NAMES[dayOfWeek]}, day ${dayOfMonth} of month. Found ${dashboardSettings.length} dashboards with reports enabled`,
  );

  for (const settings of dashboardSettings) {
    try {
      const isEligible = await canDashboardReceiveReports(settings.dashboardId);
      if (!isEligible) {
        continue;
      }

      const now = Date.now();

      if (settings.weeklyReports && settings.weeklyReportDay === dayOfWeek) {
        const hoursSinceLastWeekly = settings.lastWeeklyReportSentAt
          ? (now - settings.lastWeeklyReportSentAt.getTime()) / (1000 * 60 * 60)
          : Infinity;

        if (hoursSinceLastWeekly >= 20) {
          await sendWeeklyReport(settings);
        } else {
          console.warn(
            `Skipping weekly report for dashboard ${settings.dashboardId} - last sent ${hoursSinceLastWeekly.toFixed(1)} hours ago`,
          );
        }
      }

      if (settings.monthlyReports && dayOfMonth === 1) {
        const daysSinceLastMonthly = settings.lastMonthlyReportSentAt
          ? (now - settings.lastMonthlyReportSentAt.getTime()) / (1000 * 60 * 60 * 24)
          : Infinity;

        if (daysSinceLastMonthly >= 20) {
          await sendMonthlyReport(settings);
        } else {
          console.warn(
            `Skipping monthly report for dashboard ${settings.dashboardId} - last sent ${daysSinceLastMonthly.toFixed(1)} days ago`,
          );
        }
      }
    } catch (error) {
      console.error(`Error processing dashboard ${settings.dashboardId}:`, error);
    }
  }

  console.info('Daily report check completed');
}
