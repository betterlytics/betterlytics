"server-only";

import {
  DashboardSettings,
  DashboardSettingsUpdate,
  DEFAULT_DASHBOARD_SETTINGS,
} from "@/entities/settings";
import * as SettingsRepository from "@/repositories/postgres/settings";

export async function getDashboardSettings(
  dashboardId: string,
): Promise<DashboardSettings> {
  try {
    const settings = await SettingsRepository.findSettingsByDashboardId(dashboardId);

    if (!settings) {
      return await SettingsRepository.createSettings(dashboardId, DEFAULT_DASHBOARD_SETTINGS);
    }

    return settings;
  } catch (error) {
    console.error("Error getting dashboard settings:", error);
    throw new Error("Failed to get dashboard settings");
  }
}

export async function updateDashboardSettings(
  dashboardId: string,
  updates: DashboardSettingsUpdate,
): Promise<DashboardSettings> {
  try {
    return await SettingsRepository.updateSettings(dashboardId, updates);
  } catch (error) {
    console.error("Error updating dashboard settings:", error);
    throw new Error("Failed to update dashboard settings");
  }
}

export async function resetDashboardSettings(
  dashboardId: string,
): Promise<DashboardSettings> {
  try {
    return await SettingsRepository.updateSettings(dashboardId, DEFAULT_DASHBOARD_SETTINGS);
  } catch (error) {
    console.error("Error resetting dashboard settings:", error);
    throw new Error("Failed to reset dashboard settings");
  }
}