'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchCampaignUTMBreakdownAction,
  type CampaignUTMBreakdownItem,
  type CampaignUTMDimension,
} from '@/app/actions/campaigns';

type UseUTMBreakdownDataOptions = {
  dashboardId: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  dimension: CampaignUTMDimension;
  enabled: boolean;
};

export function useUTMBreakdownData({
  dashboardId,
  campaignName,
  startDate,
  endDate,
  dimension,
  enabled,
}: UseUTMBreakdownDataOptions) {
  return useQuery<CampaignUTMBreakdownItem[]>({
    queryKey: ['campaign-utm-breakdown', dashboardId, campaignName, startDate, endDate, dimension],
    queryFn: () => fetchCampaignUTMBreakdownAction(dashboardId, startDate, endDate, campaignName, dimension),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
