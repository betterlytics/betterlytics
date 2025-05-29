"use server";

import {
  DashboardSettings,
  DashboardSettingsUpdate,
} from "@/entities/settings";
import { withDashboardAuthContext } from "@/auth/auth-actions";
import { AuthContext } from "@/entities/authContext";
import * as SettingsService from "@/services/settings";

export const getDashboardSettingsAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<DashboardSettings> => {
    return await SettingsService.getDashboardSettings(ctx.dashboardId);
  }
);

export const updateDashboardSettingsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    updates: DashboardSettingsUpdate
  ): Promise<DashboardSettings> => {
    return await SettingsService.updateDashboardSettings(ctx.dashboardId, updates);
  }
);

export const resetDashboardSettingsAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<DashboardSettings> => {
    return await SettingsService.resetDashboardSettings(ctx.dashboardId);
  }
); 