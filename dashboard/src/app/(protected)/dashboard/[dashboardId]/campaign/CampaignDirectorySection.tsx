import CampaignList from './CampaignList';
import { fetchCampaignPerformanceAction, fetchCampaignSparklinesAction } from '@/app/actions';
import type { CampaignPerformance, CampaignSparklinePoint } from '@/entities/campaign';
import type { GranularityRangeValues } from '@/utils/granularityRanges';

type CampaignDirectorySectionProps = {
  dashboardId: string;
  startDate: Date;
  endDate: Date;
  granularity: GranularityRangeValues;
  timezone: string;
  campaignPerformancePromise: ReturnType<typeof fetchCampaignPerformanceAction>;
};

export type CampaignListItem = CampaignPerformance & {
  sparkline: CampaignSparklinePoint[];
};

export default async function CampaignDirectorySection({
  dashboardId,
  startDate,
  endDate,
  granularity,
  timezone,
  campaignPerformancePromise,
}: CampaignDirectorySectionProps) {
  const campaignPerformance = await campaignPerformancePromise;
  const campaignNames = campaignPerformance.map((campaign) => campaign.name);
  const sparklineMap =
    campaignNames.length > 0
      ? await fetchCampaignSparklinesAction(dashboardId, startDate, endDate, granularity, timezone, campaignNames)
      : {};

  const campaigns: CampaignListItem[] = campaignPerformance.map((campaign) => ({
    ...campaign,
    sparkline: sparklineMap[campaign.name] ?? [],
  }));

  return (
    <CampaignList
      dashboardId={dashboardId}
      campaigns={campaigns}
      startDate={startDate.toISOString()}
      endDate={endDate.toISOString()}
    />
  );
}
