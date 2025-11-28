import CampaignList from './CampaignList';
import { fetchCampaignPerformanceAction } from '@/app/actions';
import type { CampaignDirectoryRowSummary } from '@/entities/campaign';

type CampaignDirectorySectionProps = {
  dashboardId: string;
  startDate: Date;
  endDate: Date;
  campaignPerformancePromise: ReturnType<typeof fetchCampaignPerformanceAction>;
};

export type CampaignListItem = CampaignDirectoryRowSummary;

export default async function CampaignDirectorySection({
  dashboardId,
  startDate,
  endDate,
  campaignPerformancePromise,
}: CampaignDirectorySectionProps) {
  const campaignPerformancePage = await campaignPerformancePromise;
  const { campaigns, totalCampaigns, pageIndex, pageSize } = campaignPerformancePage;

  return (
    <CampaignList
      dashboardId={dashboardId}
      campaigns={campaigns}
      startDate={startDate.toISOString()}
      endDate={endDate.toISOString()}
      pageIndex={pageIndex}
      pageSize={pageSize}
      totalCampaigns={totalCampaigns}
    />
  );
}
