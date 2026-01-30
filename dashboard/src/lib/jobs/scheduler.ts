'server-only';

import cron from 'node-cron';
import { runDailyReportCheck } from '@/lib/jobs/reports/email-reports.job';

let isInitialized = false;

export function startBackgroundJobs() {
  if (isInitialized) {
    console.info('Background jobs already initialized, skipping');
    return;
  }

  cron.schedule('0 8 * * *', async () => {
    console.info('Running daily report check...');
    try {
      await runDailyReportCheck();
      console.info('Daily report check completed');
    } catch (error) {
      console.error('Daily report check failed:', error);
    }
  });

  isInitialized = true;
  console.info('Background jobs scheduled');
}
