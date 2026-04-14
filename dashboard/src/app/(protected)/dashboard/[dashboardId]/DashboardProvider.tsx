'use client';

import React, { useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { BAFilterSearchParams } from '@/utils/filterSearchParams';

type DashboardProviderProps = {
  children: React.ReactNode;
  initialSettings: DashboardSettings;
};

export function DashboardProvider({ children, initialSettings }: DashboardProviderProps) {
  const dashboardId = useDashboardId();
  const searchParams = useSearchParams();
  const initialFilters = useMemo(() => BAFilterSearchParams.parseFromSearchParams(searchParams), []);

  const { data: settings } = useQuery({
    queryKey: ['dashboard-settings', dashboardId],
    queryFn: () => getDashboardSettingsAction(dashboardId),
    initialData: initialSettings,
  });

  return (
    <CapabilitiesProvider dashboardId={dashboardId}>
      <SettingsProvider initialSettings={settings} dashboardId={dashboardId}>
        <TimeRangeContextProvider initialFilters={initialFilters}>
          <QueryFiltersContextProvider initialQueryFilters={initialFilters.queryFilters}>
            <UserJourneyFilterProvider
              initialNumberOfSteps={initialFilters.userJourney.numberOfSteps}
              initialNumberOfJourneys={initialFilters.userJourney.numberOfJourneys}
            >
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
