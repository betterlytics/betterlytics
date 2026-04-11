'use client';

import React from 'react';
import { TimeRangeContextProvider } from '@/contexts/TimeRangeContextProvider';
import { QueryFiltersContextProvider } from '@/contexts/QueryFiltersContextProvider';
import { SettingsProvider } from '@/contexts/SettingsProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import { useSyncURLFilters } from '@/hooks/use-sync-url-filters';
import { UserJourneyFilterProvider } from '@/contexts/UserJourneyFilterContextProvider';
import { getDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { type DashboardSettings } from '@/entities/dashboard/dashboardSettings.entities';
import { useSavedFilters } from '@/hooks/use-saved-filters';
import { CapabilitiesProvider } from '@/contexts/CapabilitiesProvider';

type DashboardProviderProps = {
  children: React.ReactNode;
  initialSettings: DashboardSettings;
};

export function DashboardProvider({ children, initialSettings }: DashboardProviderProps) {
  const dashboardId = useDashboardId();

  const { data: settings } = useQuery({
    queryKey: ['dashboard-settings', dashboardId],
    queryFn: () => getDashboardSettingsAction(dashboardId),
    initialData: initialSettings,
  });

  return (
    <CapabilitiesProvider dashboardId={dashboardId}>
      <SettingsProvider initialSettings={settings} dashboardId={dashboardId}>
        <TimeRangeContextProvider>
          <QueryFiltersContextProvider>
            <UserJourneyFilterProvider>
              <SyncURLFilters />

              <PrefetchSavedFilters />
              {children}
            </UserJourneyFilterProvider>
          </QueryFiltersContextProvider>
        </TimeRangeContextProvider>
      </SettingsProvider>
    </CapabilitiesProvider>
  );
}

function SyncURLFilters() {
  useSyncURLFilters();
  return undefined;
}

function PrefetchSavedFilters() {
  useSavedFilters();
  return undefined;
}
