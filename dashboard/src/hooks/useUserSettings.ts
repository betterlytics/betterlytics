'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { getUserSettingsAction, updateUserSettingsAction } from '@/app/actions/userSettings';
import { UserSettings, UserSettingsUpdate } from '@/entities/userSettings';

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  updateSetting: <K extends keyof UserSettingsUpdate>(key: K, value: UserSettingsUpdate[K]) => void;
  saveSettings: (newSettings?: Partial<UserSettingsUpdate>) => Promise<{ success: boolean }>;
  refreshSettings: () => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState<UserSettingsUpdate>({});
  const [isSaving, startTransition] = useTransition();

  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      const userSettings = await getUserSettingsAction();
      setSettings(userSettings);
      setPendingUpdates({});
    } catch (error) {
      console.error('Failed to load user settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserSettings();
  }, []);

  const updateSetting = <K extends keyof UserSettingsUpdate>(key: K, value: UserSettingsUpdate[K]) => {
    setPendingUpdates((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async (newSettings?: Partial<UserSettingsUpdate>): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const settingsToSave = newSettings || pendingUpdates;
          const updatedSettings = await updateUserSettingsAction(settingsToSave);
          setSettings(updatedSettings);
          setPendingUpdates({});
          resolve({ success: true });
        } catch (error) {
          console.error('Failed to save user settings:', error);
          resolve({ success: false });
        }
      });
    });
  };

  const refreshSettings = async () => {
    await loadUserSettings();
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
