"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { DashboardSettings, DashboardSettingsUpdate } from "@/entities/settings";
import { getDashboardSettingsAction, updateDashboardSettingsAction } from "@/app/actions/settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type SettingsContextType = {
  settings: DashboardSettings | null;
  refreshSettings: () => Promise<void>;
  setSettings: (updates: Partial<DashboardSettingsUpdate>) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}

type Props = {
  initialSettings: DashboardSettings;
  dashboardId: string;
  children: React.ReactNode;
};

export function SettingsProvider({ initialSettings, dashboardId, children }: Props) {
  const [settings, updateSettings] = useState<DashboardSettings | null>(initialSettings);
  const router = useRouter();

  const refreshSettings = useCallback(async () => {
    try {
      const updatedSettings = await getDashboardSettingsAction(dashboardId);
      updateSettings(updatedSettings);
    } catch (error) {
      console.error("Failed to refresh settings:", error);
    }
  }, [dashboardId]);
  
  const setSettings = useCallback(async (updates: Partial<DashboardSettingsUpdate>) => {
    try {
      const updatedSettings = await updateDashboardSettingsAction(dashboardId, updates);
      updateSettings(updatedSettings);
      toast.success('Settings saved successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to save settings');
    }
  }, [dashboardId]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
} 