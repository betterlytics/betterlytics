'use client';

import { useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';

/** Polls every minute (the shortest monitor interval) while the tab is visible, and catches up when it is shown again. */
export const DASHBOARD_ALERTS_REFRESH_OPTIONS = {
  refetchInterval: 60 * 1000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: 'always',
} as const;

/** React Query only refetches when the tab becomes visible, so also refetch when the window regains focus. */
export function useRefetchOnWindowFocus(refetch: (options: { cancelRefetch: boolean }) => unknown) {
  useEffect(() => {
    const onFocus = () => refetch({ cancelRefetch: false });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);
}

/** Down monitors and unresolved status page incidents, behind the sidebar dots. */
export function useDashboardAlerts() {
  const dashboardId = useDashboardId();
  const { data, refetch } = trpc.monitors.activeAlerts.useQuery({ dashboardId }, DASHBOARD_ALERTS_REFRESH_OPTIONS);
  useRefetchOnWindowFocus(refetch);
  return data;
}
