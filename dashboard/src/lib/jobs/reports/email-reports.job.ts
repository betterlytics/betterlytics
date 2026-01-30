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

      if (settings.weeklyReports && settings.weeklyReportDay === dayOfWeek) {
        await sendWeeklyReport(settings);
      }

      if (settings.monthlyReports && dayOfMonth === 1) {
        await sendMonthlyReport(settings);
      }
    } catch (error) {
      console.error(`Error processing dashboard ${settings.dashboardId}:`, error);
    }
  }

  console.info('Daily report check completed');
}
