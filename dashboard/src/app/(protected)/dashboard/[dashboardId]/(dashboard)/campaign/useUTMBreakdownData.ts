'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCampaignUTMBreakdownAction } from '@/app/actions/analytics/campaign.actions';
import { CampaignUTMBreakdownItem, type UTMDimension } from '@/entities/analytics/campaign.entities';

type UseUTMBreakdownDataOptions = {
  dashboardId: string;
  campaignName: string;
  startDate: Date;
  endDate: Date;
  dimension: UTMDimension;
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
