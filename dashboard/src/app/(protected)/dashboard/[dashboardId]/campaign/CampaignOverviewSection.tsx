'use client';

import { use } from 'react';
import CampaignPerformanceTable from '@/app/(protected)/dashboard/[dashboardId]/campaign/CampaignPerformanceTable';
import CampaignVisitorTrendChart from '@/app/(protected)/dashboard/[dashboardId]/campaign/CampaignVisitorTrendChart';
import {
  fetchCampaignLandingPagePerformanceAction,
  fetchCampaignPerformanceAction,
  fetchCampaignVisitorTrendAction,
} from '@/app/actions';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

type CampaignOverviewSectionProps = {
  campaignPerformancePromise: ReturnType<typeof fetchCampaignPerformanceAction>;
  landingPagePerformancePromise: ReturnType<typeof fetchCampaignLandingPagePerformanceAction>;
  visitorTrendPromise: ReturnType<typeof fetchCampaignVisitorTrendAction>;
};

export default function CampaignOverviewSection({
  campaignPerformancePromise,
  landingPagePerformancePromise,
  visitorTrendPromise,
}: CampaignOverviewSectionProps) {
  const campaignPerformance = use(campaignPerformancePromise);
  const landingPagePerformance = use(landingPagePerformancePromise);
  const visitorTrend = use(visitorTrendPromise);
  const { granularity } = useTimeRangeContext();

  return (
    <div className='space-y-3'>
      <CampaignPerformanceTable data={campaignPerformance} landingPages={landingPagePerformance} />
      <CampaignVisitorTrendChart
        chartData={visitorTrend.data}
        categories={visitorTrend.categories}
        comparisonMap={visitorTrend.comparisonMap}
        granularity={granularity}
      />
    </div>
  );
}
