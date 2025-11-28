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
  const campaignPerformancePage = await campaignPerformancePromise;
  const { campaigns: performanceCampaigns, totalCampaigns, pageIndex, pageSize } = campaignPerformancePage;

  const campaignNames = performanceCampaigns.map((campaign) => campaign.name);
  const sparklineMap =
    campaignNames.length > 0
      ? await fetchCampaignSparklinesAction(dashboardId, startDate, endDate, granularity, timezone, campaignNames)
      : {};

  const campaignsWithSparkline: CampaignListItem[] = performanceCampaigns.map((campaign) => ({
    ...campaign,
    sparkline: sparklineMap[campaign.name] ?? [],
  }));

  return (
    <CampaignList
      dashboardId={dashboardId}
      campaigns={campaignsWithSparkline}
      startDate={startDate.toISOString()}
      endDate={endDate.toISOString()}
      pageIndex={pageIndex}
      pageSize={pageSize}
      totalCampaigns={totalCampaigns}
    />
  );
}
