'use client';

import { createContext, useContext, useMemo } from 'react';

const DemoModeContext = createContext<boolean>(false);

type DemoModeProviderProps = {
  isDemo: boolean;
  children: React.ReactNode;
};

export function DemoModeProvider({ isDemo, children }: DemoModeProviderProps) {
  const value = useMemo(() => isDemo, [isDemo]);
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode(): boolean {
  return useContext(DemoModeContext);
}
