import CampaignList from './CampaignList';
import { fetchCampaignPerformanceAction } from '@/app/actions';
import type { CampaignPerformance } from '@/entities/campaign';
import type { GranularityRangeValues } from '@/utils/granularityRanges';

type CampaignDirectorySectionProps = {
  dashboardId: string;
  startDate: Date;
  endDate: Date;
  granularity: GranularityRangeValues;
  timezone: string;
  campaignPerformancePromise: ReturnType<typeof fetchCampaignPerformanceAction>;
};

export type CampaignListItem = CampaignPerformance;

export default async function CampaignDirectorySection({
  dashboardId,
  startDate,
  endDate,
  granularity,
  timezone,
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
      granularity={granularity}
      timezone={timezone}
    />
  );
}
