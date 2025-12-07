'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { DashboardSettings } from '@/entities/dashboard/dashboardSettings.entities';
import { getDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';

type SettingsContextType = {
  settings: DashboardSettings | null;
  refreshSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}

type Props = {
  initialSettings: DashboardSettings;
  dashboardId: string;
  children: React.ReactNode;
};

export function SettingsProvider({ initialSettings, dashboardId, children }: Props) {
  const [settings, setSettings] = useState<DashboardSettings | null>(initialSettings);

  const refreshSettings = useCallback(async () => {
    try {
      const updatedSettings = await getDashboardSettingsAction(dashboardId);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to refresh settings:', error);
    }
  }, [dashboardId]);

  return <SettingsContext.Provider value={{ settings, refreshSettings }}>{children}</SettingsContext.Provider>;
}
