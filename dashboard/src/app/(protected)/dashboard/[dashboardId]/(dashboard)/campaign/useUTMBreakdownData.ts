'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCampaignUTMBreakdownAction } from '@/app/actions/analytics/campaign.actions';
import { CampaignUTMBreakdownItem, type UTMDimension } from '@/entities/analytics/campaign.entities';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';

type UseUTMBreakdownDataOptions = {
  dashboardId: string;
  campaignName: string;
  query: BAAnalyticsQuery;
  dimension: UTMDimension;
  enabled: boolean;
};

export function useUTMBreakdownData({ dashboardId, campaignName, query, dimension, enabled }: UseUTMBreakdownDataOptions) {
  return useQuery<CampaignUTMBreakdownItem[]>({
    queryKey: ['campaign-utm-breakdown', dashboardId, campaignName, query.startDate, query.endDate, dimension],
    queryFn: () => fetchCampaignUTMBreakdownAction(dashboardId, query, campaignName, dimension),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
