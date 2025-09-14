'use client';

import React from 'react';
import { TimeRangeContextProvider } from '@/contexts/TimeRangeContextProvider';
import { QueryFiltersContextProvider } from '@/contexts/QueryFiltersContextProvider';
import { SettingsProvider } from '@/contexts/SettingsProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import { useSyncURLFilters } from '@/hooks/use-sync-url-filters';
import { UserJourneyFilterProvider } from '@/contexts/UserJourneyFilterContextProvider';
import { getDashboardSettingsAction } from '@/app/actions/dashboardSettings';
import DashboardLoading from '@/components/loading/DashboardLoading';

type DashboardProviderProps = {
  children: React.ReactNode;
};

export function DashboardProvider({ children }: DashboardProviderProps) {
  const dashboardId = useDashboardId();

  const { data: initialSettings } = useQuery({
    queryKey: ['dashboard-settings', dashboardId],
    queryFn: () => getDashboardSettingsAction(dashboardId),
  });

  if (!initialSettings) {
    return <DashboardLoading />;
  }

  return (
    <SettingsProvider initialSettings={initialSettings} dashboardId={dashboardId}>
      <TimeRangeContextProvider>
        <QueryFiltersContextProvider>
          <UserJourneyFilterProvider>
            <SyncURLFilters />
            {children}
          </UserJourneyFilterProvider>
        </QueryFiltersContextProvider>
      </TimeRangeContextProvider>
    </SettingsProvider>
  );
}

function SyncURLFilters() {
  useSyncURLFilters();
  return undefined;
}
