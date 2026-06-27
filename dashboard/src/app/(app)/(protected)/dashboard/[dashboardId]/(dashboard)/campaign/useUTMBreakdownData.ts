'use client';

import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import type { UTMDimension } from '@/entities/analytics/campaign.entities';

type UseUTMBreakdownDataOptions = {
  campaignName: string;
  dimension: UTMDimension;
  enabled: boolean;
};

export function useUTMBreakdownData({ campaignName, dimension, enabled }: UseUTMBreakdownDataOptions) {
  const { input, options } = useBAQueryParams();
  return trpc.campaign.utmBreakdown.useQuery({ ...input, campaignName, dimension }, { ...options, enabled });
}
