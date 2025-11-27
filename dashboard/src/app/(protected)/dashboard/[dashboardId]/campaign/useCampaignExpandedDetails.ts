'use client';

import { useCallback, useState } from 'react';
import { fetchCampaignExpandedDetailsAction, type CampaignExpandedDetails } from '@/app/actions/campaigns';

export type CampaignDetailsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; data: CampaignExpandedDetails }
  | { status: 'error'; error: string };

type UseCampaignExpandedDetailsArgs = {
  dashboardId: string;
  startDate: string;
  endDate: string;
};

type UseCampaignExpandedDetailsResult = {
  detailsByCampaign: Record<string, CampaignDetailsState>;
  loadCampaignDetails: (campaignName: string) => void;
};

export function useCampaignExpandedDetails({
  dashboardId,
  startDate,
  endDate,
}: UseCampaignExpandedDetailsArgs): UseCampaignExpandedDetailsResult {
  const [detailsByCampaign, setDetailsByCampaign] = useState<Record<string, CampaignDetailsState>>({});

  const loadCampaignDetails = useCallback(
    (campaignName: string) => {
      const existing = detailsByCampaign[campaignName];
      if (existing && existing.status !== 'idle') {
        return;
      }

      setDetailsByCampaign((prev) => ({
        ...prev,
        [campaignName]: { status: 'loading' },
      }));

      void fetchCampaignExpandedDetailsAction(dashboardId, startDate, endDate, campaignName)
        .then((data) => {
          setDetailsByCampaign((prev) => ({
            ...prev,
            [campaignName]: { status: 'loaded', data },
          }));
        })
        .catch((error: unknown) => {
          console.error('Error loading campaign details', error);
          setDetailsByCampaign((prev) => ({
            ...prev,
            [campaignName]: { status: 'error', error: 'Failed to load campaign details.' },
          }));
        });
    },
    [detailsByCampaign, startDate, endDate],
  );

  return {
    detailsByCampaign,
    loadCampaignDetails,
  };
}
