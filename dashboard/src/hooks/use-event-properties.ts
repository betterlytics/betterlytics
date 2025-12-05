import { useQuery } from '@tanstack/react-query';
import { EventPropertiesOverview } from '@/entities/events';
import { fetchEventPropertiesAnalyticsAction } from '@/app/actions/analytics/events';
import { QueryFilter } from '@/entities/filter';

export function useEventProperties(
  dashboardId: string,
  eventName: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  enabled: boolean = true,
) {
  return useQuery<EventPropertiesOverview>({
    queryKey: ['eventProperties', dashboardId, eventName, startDate, endDate, queryFilters],
    queryFn: () => fetchEventPropertiesAnalyticsAction(dashboardId, eventName, startDate, endDate, queryFilters),
    enabled,
  });
}
