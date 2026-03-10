'use client';

import React, { useEffect } from 'react';
import { TimeRangeContextProvider, useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { QueryFiltersContextProvider } from '@/contexts/QueryFiltersContextProvider';
import { SettingsProvider } from '@/contexts/SettingsProvider';
import { SiteConfigProvider } from '@/contexts/SiteConfigProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import { useSyncURLFilters } from '@/hooks/use-sync-url-filters';
import { UserJourneyFilterProvider } from '@/contexts/UserJourneyFilterContextProvider';
import { getDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { getSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';
import DashboardLoading from '@/components/loading/DashboardLoading';
import { useSavedFilters } from '@/hooks/use-saved-filters';
import { CapabilitiesProvider } from '@/contexts/CapabilitiesProvider';
import { useBARouter } from '@/hooks/use-ba-router';

type DashboardProviderProps = {
  children: React.ReactNode;
};

export function DashboardProvider({ children }: DashboardProviderProps) {
  const dashboardId = useDashboardId();

  const { data: initialSettings } = useQuery({
    queryKey: ['dashboard-settings', dashboardId],
    queryFn: () => getDashboardSettingsAction(dashboardId),
  });

  const { data: initialSiteConfig, isLoading: siteConfigLoading } = useQuery({
    queryKey: ['site-config', dashboardId],
    queryFn: () => getSiteConfigAction(dashboardId),
  });

  if (!initialSettings || siteConfigLoading) {
    return <DashboardLoading />;
  }

  return (
    <CapabilitiesProvider dashboardId={dashboardId}>
      <SettingsProvider initialSettings={initialSettings} dashboardId={dashboardId}>
        <SiteConfigProvider initialSiteConfig={initialSiteConfig ?? null} dashboardId={dashboardId}>
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
        </SiteConfigProvider>
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
  const router = useBARouter();

  useEffect(() => {
    if (interval === 'realtime') {
      const refreshInterval = setInterval(() => {
        router.refresh();
      }, 30_000);
      return () => clearInterval(refreshInterval);
    }
  }, [interval, router]);

  return undefined;
}

function PrefetchSavedFilters() {
  useSavedFilters();
  return undefined;
}
