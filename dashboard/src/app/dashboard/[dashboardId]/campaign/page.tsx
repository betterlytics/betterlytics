import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
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

type CampaignPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function CampaignPage({ params, searchParams }: CampaignPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, granularity, compareStartDate, compareEndDate } =
    await BAFilterSearchParams.decodeFromParams(searchParams);

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

  return (
    <div className='container space-y-6 p-6'>
      <DashboardFilters />

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
