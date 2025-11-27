import CampaignList from './CampaignList';
import { fetchCampaignPerformanceAction } from '@/app/actions';
import type { CampaignPerformance } from '@/entities/campaign';

type CampaignDirectorySectionProps = {
  dashboardId: string;
  startDate: Date;
  endDate: Date;
  campaignPerformancePromise: ReturnType<typeof fetchCampaignPerformanceAction>;
};

export type CampaignListItem = CampaignPerformance;

export default async function CampaignDirectorySection({
  dashboardId,
  startDate,
  endDate,
  campaignPerformancePromise,
}: CampaignDirectorySectionProps) {
  const [campaignPerformance] = await Promise.all([campaignPerformancePromise]);

  const campaigns: CampaignListItem[] = campaignPerformance;

  return (
    <CampaignList
      dashboardId={dashboardId}
      campaigns={campaigns}
      startDate={startDate.toISOString()}
      endDate={endDate.toISOString()}
    />
  );
}
