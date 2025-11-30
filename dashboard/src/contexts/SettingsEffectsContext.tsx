'use client';

import React, { createContext, useContext, useCallback, useRef } from 'react';
import type { UserSettingsUpdate } from '@/entities/userSettings';

type SettingsEffect = {
  apply: (settings: UserSettingsUpdate) => void;
  revert: () => void;
};

type SettingsEffectsContextType = {
  registerEffect: (key: string, effect: SettingsEffect) => void;
  unregisterEffect: (key: string) => void;
  applyAll: (settings: UserSettingsUpdate) => void;
  revertAll: () => void;
};

const SettingsEffectsContext = createContext<SettingsEffectsContextType | undefined>(undefined);

export function useSettingsEffects() {
  const context = useContext(SettingsEffectsContext);
  if (!context) {
    throw new Error('useSettingsEffects must be used within SettingsEffectsProvider');
  }
  return context;
}

type Props = {
  children: React.ReactNode;
};

export function SettingsEffectsProvider({ children }: Props) {
  const effectsRef = useRef<Map<string, SettingsEffect>>(new Map());

  const registerEffect = useCallback((key: string, effect: SettingsEffect) => {
    effectsRef.current.set(key, effect);
  }, []);

  const unregisterEffect = useCallback((key: string) => {
    effectsRef.current.delete(key);
  }, []);

  const applyAll = useCallback((settings: UserSettingsUpdate) => {
    effectsRef.current.forEach((effect) => {
      effect.apply(settings);
    });
  }, []);

  const revertAll = useCallback(() => {
    effectsRef.current.forEach((effect) => {
      effect.revert();
    });
  }, []);

  return (
    <SettingsEffectsContext.Provider value={{ registerEffect, unregisterEffect, applyAll, revertAll }}>
      {children}
    </SettingsEffectsContext.Provider>
  );
}
