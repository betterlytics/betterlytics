'use client';

import React, { useEffect } from 'react';
import { TimeRangeContextProvider, useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { QueryFiltersContextProvider } from '@/contexts/QueryFiltersContextProvider';
import { SettingsProvider } from '@/contexts/SettingsProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import { useSyncURLFilters } from '@/hooks/use-sync-url-filters';
import { UserJourneyFilterProvider } from '@/contexts/UserJourneyFilterContextProvider';
import { getDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import DashboardLoading from '@/components/loading/DashboardLoading';
import { useImmediateTimeRange } from '@/components/TimeRange/hooks/useImmediateTimeRange';
import { useSavedFilters } from '@/hooks/use-saved-filters';
import { CapabilitiesProvider } from '@/contexts/CapabilitiesProvider';

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
    <CapabilitiesProvider dashboardId={dashboardId}>
      <SettingsProvider initialSettings={initialSettings} dashboardId={dashboardId}>
        <TimeRangeContextProvider>
          <QueryFiltersContextProvider>
            <UserJourneyFilterProvider>
              <SyncURLFilters />
              <RealtimeRefresh />
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

function RealtimeRefresh() {
  const { interval } = useTimeRangeContext();
  const { setPresetRange } = useImmediateTimeRange();

  useEffect(() => {
    if (interval === 'realtime') {
      const refreshInterval = setInterval(() => setPresetRange('realtime'), 30_000);
      return () => clearInterval(refreshInterval);
    }
  }, [interval]);

  return undefined;
}

function PrefetchSavedFilters() {
  useSavedFilters();
  return undefined;
}
