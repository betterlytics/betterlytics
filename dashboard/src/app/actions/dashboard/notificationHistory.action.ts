'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { NotificationHistoryRow } from '@/entities/dashboard/notificationHistory.entities';
import * as NotificationHistoryService from '@/services/dashboard/notificationHistory.service';

export const getNotificationHistoryAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<NotificationHistoryRow[]> => {
    return await NotificationHistoryService.getNotificationHistory(ctx.dashboardId);
  },
);
