import CampaignList from './CampaignList';
import type { fetchCampaignPerformanceAction } from '@/app/actions';
import type { CampaignDirectoryRowSummary } from '@/entities/campaign';
import { use } from 'react';

type CampaignDirectorySectionProps = {
  dashboardId: string;
  campaignPerformancePromise: ReturnType<typeof fetchCampaignPerformanceAction>;
};

export type CampaignListItem = CampaignDirectoryRowSummary;

export default function CampaignDirectorySection({
  dashboardId,
  campaignPerformancePromise,
}: CampaignDirectorySectionProps) {
  const campaignPerformancePage = use(campaignPerformancePromise);
  const { campaigns, totalCampaigns, pageIndex, pageSize } = campaignPerformancePage;

  return (
    <CampaignList
      dashboardId={dashboardId}
      campaigns={campaigns}
      pageIndex={pageIndex}
      pageSize={pageSize}
      totalCampaigns={totalCampaigns}
    />
  );
}
