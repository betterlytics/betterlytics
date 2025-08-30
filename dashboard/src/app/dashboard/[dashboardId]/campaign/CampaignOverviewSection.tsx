'use client';

import { use } from 'react';
import CampaignPerformanceTable from '@/app/dashboard/[dashboardId]/campaign/CampaignPerformanceTable';
import CampaignVisitorTrendChart from '@/app/dashboard/[dashboardId]/campaign/CampaignVisitorTrendChart';
import { fetchCampaignPerformanceAction, fetchCampaignVisitorTrendAction } from '@/app/actions';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

type CampaignOverviewSectionProps = {
  campaignPerformancePromise: ReturnType<typeof fetchCampaignPerformanceAction>;
  visitorTrendPromise: ReturnType<typeof fetchCampaignVisitorTrendAction>;
};

export default function CampaignOverviewSection({
  campaignPerformancePromise,
  visitorTrendPromise,
}: CampaignOverviewSectionProps) {
  const campaignPerformance = use(campaignPerformancePromise);
  const visitorTrend = use(visitorTrendPromise);
  const { granularity } = useTimeRangeContext();

  return (
    <div className='space-y-3'>
      <CampaignPerformanceTable data={campaignPerformance} />
      <CampaignVisitorTrendChart
        chartData={visitorTrend.data}
        categories={visitorTrend.categories}
        comparisonMap={visitorTrend.comparisonMap}
        granularity={granularity}
      />
    </div>
  );
}
