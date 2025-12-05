'use client';

import React, { createContext, useContext, useCallback, useRef } from 'react';
import type { UserSettingsUpdate } from '@/entities/userSettings';

type SettingsEffect = {
  apply: (settings: UserSettingsUpdate) => void;
};

type SettingsEffectsContextType = {
  register: (key: string, effect: SettingsEffect) => void;
  unregister: (key: string) => void;
  applyAll: (settings: UserSettingsUpdate) => void;
};

const SettingsEffectsContext = createContext<SettingsEffectsContextType | undefined>(undefined);

export function useSettingsEffects() {
  const context = useContext(SettingsEffectsContext);
  if (!context) {
    throw new Error('useSettingsEffects must be used within SettingsEffectsProvider');
  }
  return context;
}

type SettingsEffectsProviderProps = {
  children: React.ReactNode;
};

export function SettingsEffectsProvider({ children }: SettingsEffectsProviderProps) {
  const effectsRef = useRef<Map<string, SettingsEffect>>(new Map());

  const register = useCallback((key: string, effect: SettingsEffect) => {
    effectsRef.current.set(key, effect);
  }, []);

  const unregister = useCallback((key: string) => {
    effectsRef.current.delete(key);
  }, []);

  const applyAll = useCallback((settings: UserSettingsUpdate) => {
    effectsRef.current.forEach((effect) => {
      effect.apply(settings);
    });
  }, []);

  return (
    <SettingsEffectsContext.Provider value={{ register, unregister, applyAll }}>
      {children}
    </SettingsEffectsContext.Provider>
  );
}
