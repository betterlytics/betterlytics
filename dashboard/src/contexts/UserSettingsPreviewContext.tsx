'use client';

import React, { createContext, useContext, useCallback, useRef, Dispatch } from 'react';
import type { UserSettingsUpdate } from '@/entities/userSettings';

type UserSettingsPreviewContextType = {
  register: (key: string, handler: Dispatch<UserSettingsUpdate>) => void;
  unregister: (key: string) => void;
  preview: Dispatch<UserSettingsUpdate>;
  restore: () => void;
};

const UserSettingsPreviewContext = createContext<UserSettingsPreviewContextType | undefined>(undefined);

export function useUserSettingsPreview() {
  const context = useContext(UserSettingsPreviewContext);
  if (!context) {
    throw new Error('useUserSettingsPreview must be used within UserSettingsPreviewProvider');
  }
  return context;
}

type UserSettingsPreviewProviderProps = {
  children: React.ReactNode;
  originalSettings: UserSettingsUpdate;
};

export function UserSettingsPreviewProvider({ children, originalSettings }: UserSettingsPreviewProviderProps) {
  const handlersRef = useRef<Map<string, Dispatch<UserSettingsUpdate>>>(new Map());
  const originalSettingsRef = useRef(originalSettings);
  originalSettingsRef.current = originalSettings;

  const register = useCallback((key: string, handler: Dispatch<UserSettingsUpdate>) => {
    handlersRef.current.set(key, handler);
  }, []);

  const unregister = useCallback((key: string) => {
    handlersRef.current.delete(key);
  }, []);

  const preview = useCallback((settings: UserSettingsUpdate) => {
    handlersRef.current.forEach((handler) => handler(settings));
  }, []);

  const restore = useCallback(() => {
    handlersRef.current.forEach((handler) => handler(originalSettingsRef.current));
  }, []);

  return (
    <UserSettingsPreviewContext.Provider value={{ register, unregister, preview, restore }}>
      {children}
    </UserSettingsPreviewContext.Provider>
  );
}
