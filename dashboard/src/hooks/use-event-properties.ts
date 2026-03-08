import { useQuery } from '@tanstack/react-query';
import type { EventPropertiesOverview } from '@/entities/analytics/events.entities';
import { fetchEventPropertiesAnalyticsAction } from '@/app/actions/analytics/events.actions';
import { useAnalyticsQuery } from './use-analytics-query';
import { useDashboardId } from './use-dashboard-id';

export function useEventProperties(eventName: string, enabled: boolean = true) {
  const query = useAnalyticsQuery();
  const dashboardId = useDashboardId();
  return useQuery<EventPropertiesOverview>({
    queryKey: ['eventProperties', dashboardId, eventName, query],
    queryFn: () => fetchEventPropertiesAnalyticsAction(dashboardId, query, eventName),
    enabled,
  });
}
