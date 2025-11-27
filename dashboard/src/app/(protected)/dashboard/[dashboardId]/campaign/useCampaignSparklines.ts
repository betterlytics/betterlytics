'use client';

import { useEffect, useState } from 'react';
import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { fetchCampaignSparklineAction, type CampaignSparklinePoint } from '@/app/actions/campaigns';

type CampaignSparklineStatus = 'idle' | 'loading' | 'loaded' | 'error';

type UseCampaignSparklinesArgs = {
  dashboardId: string;
  startDate: string;
  endDate: string;
  granularity: GranularityRangeValues;
  timezone: string;
  campaignNames: string[];
};

type CampaignSparklineMap = Record<string, CampaignSparklinePoint[]>;

type CampaignSparklineStatusMap = Record<string, CampaignSparklineStatus>;

export function useCampaignSparklines({
  dashboardId,
  startDate,
  endDate,
  granularity,
  timezone,
  campaignNames,
}: UseCampaignSparklinesArgs): {
  sparklines: CampaignSparklineMap;
  statuses: CampaignSparklineStatusMap;
} {
  const [sparklines, setSparklines] = useState<CampaignSparklineMap>({});
  const [statuses, setStatuses] = useState<CampaignSparklineStatusMap>({});

  useEffect(() => {
    if (campaignNames.length === 0) return;

    campaignNames.forEach((campaignName) => {
      const currentStatus = statuses[campaignName] ?? 'idle';
      if (currentStatus === 'loading' || currentStatus === 'loaded') {
        return;
      }

      setStatuses((prev) => ({ ...prev, [campaignName]: 'loading' }));

      void fetchCampaignSparklineAction(
        dashboardId,
        new Date(startDate),
        new Date(endDate),
        granularity,
        timezone,
        campaignName,
      )
        .then((data) => {
          setSparklines((prev) => ({ ...prev, [campaignName]: data }));
          setStatuses((prev) => ({ ...prev, [campaignName]: 'loaded' }));
        })
        .catch((error: unknown) => {
          console.error('Error loading campaign sparkline', error);
          setStatuses((prev) => ({ ...prev, [campaignName]: 'error' }));
        });
    });
  }, [campaignNames, dashboardId, endDate, granularity, startDate, statuses, timezone]);

  return { sparklines, statuses };
}
