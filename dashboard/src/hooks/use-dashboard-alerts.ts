'use client';

import { useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';

/** Shared by the sidebar dots and the Monitoring list: every minute (the shortest monitor interval) while the tab is
 *  visible, and right away when it is shown again. */
export const DASHBOARD_ALERTS_REFRESH_OPTIONS = {
  refetchInterval: 60 * 1000,
  staleTime: 60 * 1000,
  refetchOnWindowFocus: 'always',
} as const;

/** React Query only refetches when the tab becomes visible, so also refetch when the window regains focus. */
export function useRefetchOnWindowFocus(
  refetch: (options: { cancelRefetch: boolean }) => unknown,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => refetch({ cancelRefetch: false });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch, enabled]);
}

/** Whether a monitor is down and whether a status page incident is unresolved, behind the sidebar dots. */
export function useDashboardAlerts() {
  const dashboardId = useDashboardId();
  const { isDemo } = useDashboardAuth();
  const { data, refetch } = trpc.monitors.activeAlerts.useQuery(
    { dashboardId },
    { ...DASHBOARD_ALERTS_REFRESH_OPTIONS, enabled: !isDemo },
  );
  useRefetchOnWindowFocus(refetch, !isDemo);
  return data;
}
