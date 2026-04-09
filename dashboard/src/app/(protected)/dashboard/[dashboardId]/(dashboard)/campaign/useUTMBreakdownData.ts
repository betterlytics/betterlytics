'use client';

import { useBAQuery } from '@/trpc/hooks';
import type { UTMDimension } from '@/entities/analytics/campaign.entities';

type UseUTMBreakdownDataOptions = {
  campaignName: string;
  dimension: UTMDimension;
  enabled: boolean;
};

export function useUTMBreakdownData({ campaignName, dimension, enabled }: UseUTMBreakdownDataOptions) {
  return useBAQuery((t, input, opts) =>
    t.campaign.utmBreakdown.useQuery(
      { ...input, campaignName, dimension },
      { ...opts, enabled },
    ),
  );
}
