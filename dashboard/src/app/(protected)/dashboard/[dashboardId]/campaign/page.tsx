import { Suspense } from 'react';
import { fetchCampaignPerformanceAction } from '@/app/actions';
import CampaignDirectorySection from './CampaignDirectorySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getUserTimezone } from '@/lib/cookies';
import CampaignRowSkeleton from '@/components/skeleton/CampaignRowSkeleton';

type CampaignPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_INDEX = 0;

export default async function CampaignPage({ params, searchParams }: CampaignPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const resolvedSearchParams = await searchParams;
  const { startDate, endDate, granularity } = BAFilterSearchParams.decode(resolvedSearchParams, timezone);

  const campaignPerformancePromise = fetchCampaignPerformanceAction(
    dashboardId,
    startDate,
    endDate,
    granularity,
    timezone,
    DEFAULT_PAGE_INDEX,
    DEFAULT_PAGE_SIZE,
  );

  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('campaigns')}>
        <DashboardFilters showQueryFilters={false} showComparison={false} />
      </DashboardHeader>

      <Suspense
        fallback={
          <div className='space-y-3'>
            {Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, index) => (
              <CampaignRowSkeleton key={index} />
            ))}
          </div>
        }
      >
        <CampaignDirectorySection
          dashboardId={dashboardId}
          campaignPerformancePromise={campaignPerformancePromise}
        />
      </Suspense>
    </div>
  );
}
