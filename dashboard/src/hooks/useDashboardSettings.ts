'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { DashboardSettings, DashboardSettingsUpdate } from '@/entities/dashboard/dashboardSettings.entities';
import {
  getDashboardSettingsAction,
  updateDashboardSettingsAction,
} from '@/app/actions/dashboard/dashboardSettings.action';
import { useDashboardId } from '@/hooks/use-dashboard-id';

interface UseDashboardSettingsReturn {
  settings: DashboardSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  updateSetting: <K extends keyof DashboardSettingsUpdate>(key: K, value: DashboardSettingsUpdate[K]) => void;
  saveSettings: (newSettings?: Partial<DashboardSettingsUpdate>) => Promise<{ success: boolean }>;
  refreshSettings: () => Promise<void>;
}

export function useDashboardSettings(): UseDashboardSettingsReturn {
  const dashboardId = useDashboardId();
  const [settings, setSettings] = useState<DashboardSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState<DashboardSettingsUpdate>({});
  const [isSaving, startTransition] = useTransition();

  const loadDashboardSettings = async () => {
    try {
      setIsLoading(true);
      const dashboardSettings = await getDashboardSettingsAction(dashboardId);
      setSettings(dashboardSettings);
      setPendingUpdates({});
    } catch (error) {
      console.error('Failed to load dashboard settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dashboardId) {
      loadDashboardSettings();
    }
  }, [dashboardId]);

  const updateSetting = <K extends keyof DashboardSettingsUpdate>(key: K, value: DashboardSettingsUpdate[K]) => {
    setPendingUpdates((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async (newSettings?: Partial<DashboardSettingsUpdate>): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const settingsToSave = newSettings || pendingUpdates;
          const updatedSettings = await updateDashboardSettingsAction(dashboardId, settingsToSave);
          setSettings(updatedSettings);
          setPendingUpdates({});
          resolve({ success: true });
        } catch (error) {
          console.error('Failed to save dashboard settings:', error);
          resolve({ success: false });
        }
      });
    });
  };

  const refreshSettings = async () => {
    await loadDashboardSettings();
  };

  const effectiveSettings = useMemo(() => {
    return settings ? { ...settings, ...pendingUpdates } : null;
  }, [settings, pendingUpdates]);

  return {
    settings: effectiveSettings,
    isLoading,
    isSaving,
    updateSetting,
    saveSettings,
    refreshSettings,
  };
}
