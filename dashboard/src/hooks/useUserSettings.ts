'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { getUserSettingsAction, updateUserSettingsAction } from '@/app/actions/userSettings';
import { UserSettings, UserSettingsUpdate } from '@/entities/userSettings';

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updateSetting: <K extends keyof UserSettingsUpdate>(key: K, value: UserSettingsUpdate[K]) => void;
  saveSettings: (newSettings?: Partial<UserSettingsUpdate>) => Promise<{ success: boolean; error?: string }>;
  refreshSettings: () => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<UserSettingsUpdate>({});
  const [isSaving, startTransition] = useTransition();

  const loadUserSettings = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getUserSettingsAction();

    if (result.success) {
      setSettings(result.data);
      setPendingUpdates({});
    } else {
      setError(result.error.message);
      console.error('Failed to load user settings:', result.error);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadUserSettings();
  }, []);

  const updateSetting = <K extends keyof UserSettingsUpdate>(key: K, value: UserSettingsUpdate[K]) => {
    setPendingUpdates((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async (
    newSettings?: Partial<UserSettingsUpdate>,
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const settingsToSave = newSettings || pendingUpdates;
        const result = await updateUserSettingsAction(settingsToSave);

        if (result.success) {
          setSettings(result.data);
          setPendingUpdates({});
          resolve({ success: true });
        } else {
          console.error('Failed to save user settings:', result.error);
          resolve({ success: false, error: result.error.message });
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
    error,
    updateSetting,
    saveSettings,
    refreshSettings,
  };
}
