'use client';

import React, { createContext, useContext, useState, Dispatch, SetStateAction, ReactNode } from 'react';

type Dashboard = {
  id: string;
  siteId: string;
  domain: string;
};

type OnboardingContextProps = {
  dashboard: Dashboard | null;
  setDashboard: Dispatch<SetStateAction<Dashboard | null>>;
};

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}

type OnboardingProviderProps = {
  initialDashboard: Dashboard | null;
  children: ReactNode;
};

export function OnboardingProvider({ initialDashboard, children }: OnboardingProviderProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(initialDashboard);

  return <OnboardingContext.Provider value={{ dashboard, setDashboard }}>{children}</OnboardingContext.Provider>;
}
