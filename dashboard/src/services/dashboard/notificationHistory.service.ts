'server-only';

import { NotificationHistoryRow } from '@/entities/dashboard/notificationHistory.entities';
import * as NotificationHistoryRepository from '@/repositories/clickhouse/notificationHistory.repository';

const MAX_ERROR_LENGTH = 200;

export async function getNotificationHistory(
  dashboardId: string,
  monitorId?: string,
): Promise<NotificationHistoryRow[]> {
  try {
    const rows = await NotificationHistoryRepository.getNotificationHistory(dashboardId, monitorId);
    return rows.map((row) => ({
      ...row,
      errorMessage: row.errorMessage.slice(0, MAX_ERROR_LENGTH),
    }));
  } catch (error) {
    console.error('Error fetching notification history:', error);
    throw new Error('Failed to fetch notification history');
  }
}
