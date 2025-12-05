'use client';
import React from 'react';
import type { fetchPublicEnvironmentVariablesAction } from '@/app/actions/system/environment';

type PublicEnvironmentVariablesContextProps = {
  publicEnvironmentVariables: Awaited<ReturnType<typeof fetchPublicEnvironmentVariablesAction>>;
};

const PublicEnvironmentVariablesContext = React.createContext<PublicEnvironmentVariablesContextProps>(
  {} as PublicEnvironmentVariablesContextProps,
);

type PublicEnvironmentVariablesProviderProps = {
  children: React.ReactNode;
  publicEnvironmentVariables: Awaited<ReturnType<typeof fetchPublicEnvironmentVariablesAction>>;
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
