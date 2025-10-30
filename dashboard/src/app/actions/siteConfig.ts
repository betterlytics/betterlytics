'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/authContext';
import { DashboardConfigUpdateSchema, type DashboardConfigUpdate } from '@/entities/dashboardConfig';
import * as ConfigService from '@/services/dashboardConfig';

export const getDashboardConfigAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  return await ConfigService.getDashboardConfig(ctx.dashboardId);
});

export const saveDashboardConfigAction = withDashboardAuthContext(
  async (ctx: AuthContext, updates: DashboardConfigUpdate) => {
    const validated = DashboardConfigUpdateSchema.parse(updates);
    return await ConfigService.saveDashboardConfig(ctx.dashboardId, validated);
  },
);
