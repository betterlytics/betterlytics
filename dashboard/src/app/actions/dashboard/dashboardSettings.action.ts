'use server';

import { DashboardSettings, DashboardSettingsUpdate } from '@/entities/dashboard/dashboardSettings';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext';
import * as SettingsService from '@/services/dashboard/dashboardSettings.service';

export const getDashboardSettingsAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<DashboardSettings> => {
    return await SettingsService.getDashboardSettings(ctx.dashboardId);
  },
);

export const updateDashboardSettingsAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, updates: DashboardSettingsUpdate): Promise<DashboardSettings> => {
    return await SettingsService.updateDashboardSettings(ctx.dashboardId, updates);
  },
);
