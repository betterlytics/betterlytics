'use client';

import { createContext, useContext, useMemo, useCallback } from 'react';
import { DashboardRole } from '@prisma/client';
import { Permission, ROLE_PERMISSIONS } from '@/lib/permissions';

type DashboardAuthContextValue = {
  isDemo: boolean;
  role: DashboardRole;
  hasPermission: (permission: Permission) => boolean; // Returns false if demo mode
  canMutate: boolean;
};

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(null);

type DashboardAuthProviderProps = {
  isDemo: boolean;
  role: DashboardRole;
  children: React.ReactNode;
};

export function DashboardAuthProvider({ isDemo, role, children }: DashboardAuthProviderProps) {
  const hasPermissionCheck = useCallback(
    (permission: Permission): boolean => {
      if (isDemo) return false;
      return ROLE_PERMISSIONS[permission].includes(role);
    },
    [isDemo, role],
  );

  const value = useMemo<DashboardAuthContextValue>(
    () => ({
      isDemo,
      role,
      hasPermission: hasPermissionCheck,
      canMutate: !isDemo && role !== 'viewer',
    }),
    [isDemo, role, hasPermissionCheck],
  );

  return <DashboardAuthContext.Provider value={value}>{children}</DashboardAuthContext.Provider>;
}

export function useDashboardAuth(): DashboardAuthContextValue {
  const context = useContext(DashboardAuthContext);
  if (!context) {
    throw new Error('useDashboardAuth must be used within a DashboardAuthProvider');
  }
  return context;
}
