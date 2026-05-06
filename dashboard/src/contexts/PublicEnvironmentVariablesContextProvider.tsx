'use client';
import React from 'react';
import type { getPublicEnvironmentVariables } from '@/services/system/environment.service';

type PublicEnvironmentVariablesContextProps = {
  publicEnvironmentVariables: ReturnType<typeof getPublicEnvironmentVariables>;
};

const PublicEnvironmentVariablesContext = React.createContext<PublicEnvironmentVariablesContextProps>(
  {} as PublicEnvironmentVariablesContextProps,
);

type PublicEnvironmentVariablesProviderProps = {
  children: React.ReactNode;
  publicEnvironmentVariables: ReturnType<typeof getPublicEnvironmentVariables>;
};

export function PublicEnvironmentVariablesProvider({
  children,
  publicEnvironmentVariables,
}: PublicEnvironmentVariablesProviderProps) {
  return (
    <PublicEnvironmentVariablesContext.Provider value={{ publicEnvironmentVariables }}>
      {children}
    </PublicEnvironmentVariablesContext.Provider>
  );
}

export function usePublicEnvironmentVariablesContext() {
  const context = React.useContext(PublicEnvironmentVariablesContext);
  if (!context) {
    throw new Error('usePublicEnvironmentVariablesContext must be used within PublicEnvironmentVariablesProvider');
  }

  return context.publicEnvironmentVariables;
}
