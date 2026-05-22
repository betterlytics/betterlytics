'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { UserSettings } from '@/entities/account/userSettings.entities';

type SettingsUpdater = UserSettings | ((prev: UserSettings) => UserSettings);

type UserSettingsContextValue = {
  settings: UserSettings;
  setSettings: (updates: SettingsUpdater) => void;
  getSettings: () => UserSettings;
};

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

interface UserSettingsProviderProps {
  initialSettings: UserSettings;
  children: React.ReactNode;
}

export function UserSettingsProvider({ initialSettings, children }: UserSettingsProviderProps) {
  const [settings, setSettingsState] = useState<UserSettings>(initialSettings);
  const settingsRef = useRef(settings);

  const setSettings = useCallback((updates: SettingsUpdater) => {
    setSettingsState((prev) => {
      const next = typeof updates === 'function' ? updates(prev) : updates;
      settingsRef.current = next;
      return next;
    });
  }, []);

  const getSettings = useCallback(() => settingsRef.current, []);

  return (
    <UserSettingsContext.Provider value={{ settings, setSettings, getSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings(): UserSettings {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettings must be used within UserSettingsProvider');
  return ctx.settings;
}

export function useUserSettingsActions() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettingsActions must be used within UserSettingsProvider');
  return { setSettings: ctx.setSettings, getSettings: ctx.getSettings };
}
