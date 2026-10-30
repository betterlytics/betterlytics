'use client';

import { useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';

/** Down monitors and unresolved status page incidents, behind the sidebar dots.
 *  Polls every minute (the shortest monitor interval) while the tab is visible, and catches up when it is shown again. */
export function useDashboardAlertsQuery() {
  const dashboardId = useDashboardId();
  const query = trpc.monitors.activeAlerts.useQuery(
    { dashboardId },
    { refetchInterval: 60 * 1000, refetchIntervalInBackground: false, refetchOnWindowFocus: 'always' },
  );

  // React Query only refetches when the tab becomes visible, so also refetch when the window regains focus.
  const { refetch } = query;
  useEffect(() => {
    const onFocus = () => refetch({ cancelRefetch: false });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  return query;
}

export function useDashboardAlerts() {
  return useDashboardAlertsQuery().data;
}
