import {
  fetchCampaignPerformanceAction,
  fetchCampaignSourceBreakdownAction,
  fetchCampaignVisitorTrendAction,
  fetchCampaignMediumBreakdownAction,
  fetchCampaignContentBreakdownAction,
  fetchCampaignTermBreakdownAction,
  fetchCampaignLandingPagePerformanceAction,
} from '@/app/actions';
import CampaignTabs from './CampaignTabs';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';

type CampaignPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function CampaignPage({ params, searchParams }: CampaignPageParams) {
  const { dashboardId } = await params;
  const { startDate, endDate, granularity, compareStartDate, compareEndDate } = BAFilterSearchParams.decode(
    await searchParams,
  );

  const campaignPerformancePromise = fetchCampaignPerformanceAction(dashboardId, startDate, endDate);
  const sourceBreakdownPromise = fetchCampaignSourceBreakdownAction(dashboardId, startDate, endDate);
  const visitorTrendPromise = fetchCampaignVisitorTrendAction(
    dashboardId,
    startDate,
    endDate,
    granularity,
    compareStartDate,
    compareEndDate,
  );
  const mediumBreakdownPromise = fetchCampaignMediumBreakdownAction(dashboardId, startDate, endDate);
  const contentBreakdownPromise = fetchCampaignContentBreakdownAction(dashboardId, startDate, endDate);
  const termBreakdownPromise = fetchCampaignTermBreakdownAction(dashboardId, startDate, endDate);
  const landingPagePerformancePromise = fetchCampaignLandingPagePerformanceAction(dashboardId, startDate, endDate);

  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('campaigns')}>
        <DashboardFilters />
      </DashboardHeader>

      <CampaignTabs
        campaignPerformancePromise={campaignPerformancePromise}
        visitorTrendPromise={visitorTrendPromise}
        sourceBreakdownPromise={sourceBreakdownPromise}
        mediumBreakdownPromise={mediumBreakdownPromise}
        contentBreakdownPromise={contentBreakdownPromise}
        termBreakdownPromise={termBreakdownPromise}
        landingPagePerformancePromise={landingPagePerformancePromise}
      />
    </div>
  );
}
