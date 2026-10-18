'use server';

import { z } from 'zod';
import { DashboardSettings, DashboardSettingsUpdateSchema } from '@/entities/dashboard/dashboardSettings.entities';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import * as SettingsService from '@/services/dashboard/dashboardSettings.service';

export const getDashboardSettingsAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<DashboardSettings> => {
    return await SettingsService.getDashboardSettings(ctx.dashboardId);
  },
);

export const updateDashboardSettingsAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, updates: z.input<typeof DashboardSettingsUpdateSchema>): Promise<DashboardSettings> => {
    const data = DashboardSettingsUpdateSchema.parse(updates);
    return await SettingsService.updateDashboardSettings(ctx.dashboardId, data);
  },
  { permission: 'canManageSettings' },
);
