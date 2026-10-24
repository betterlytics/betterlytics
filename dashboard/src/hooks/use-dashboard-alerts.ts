'use client';

import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';

export const DASHBOARD_ALERTS_REFRESH_INTERVAL_MS = 30 * 1000;

/** Down monitors and unresolved status page incidents, shared by the banners and the sidebar badges. */
export function useDashboardAlerts() {
  const dashboardId = useDashboardId();
  const { data } = trpc.monitors.activeAlerts.useQuery(
    { dashboardId },
    { refetchInterval: DASHBOARD_ALERTS_REFRESH_INTERVAL_MS },
  );
  return data;
}
