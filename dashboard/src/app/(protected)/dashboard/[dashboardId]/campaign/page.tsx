import { Suspense } from 'react';
import { fetchCampaignPerformanceAction } from '@/app/actions';
import CampaignDirectorySection from './CampaignDirectorySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getUserTimezone } from '@/lib/cookies';
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton';

type CampaignPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function CampaignPage({ params, searchParams }: CampaignPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const { startDate, endDate, granularity } = BAFilterSearchParams.decode(await searchParams, timezone);

  const campaignPerformancePromise = fetchCampaignPerformanceAction(dashboardId, startDate, endDate);

  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('campaigns')}>
        <DashboardFilters />
      </DashboardHeader>

      <Suspense
        fallback={
          <div className='space-y-4'>
            <TableSkeleton />
            <ChartSkeleton />
            <div className='grid grid-cols-1 gap-3 lg:grid-cols-3'>
              <div className='lg:col-span-2'>
                <TableSkeleton />
              </div>
              <ChartSkeleton />
            </div>
          </div>
        }
      >
        <CampaignDirectorySection
          dashboardId={dashboardId}
          startDate={startDate}
          endDate={endDate}
          granularity={granularity}
          timezone={timezone}
          campaignPerformancePromise={campaignPerformancePromise}
        />
      </Suspense>
    </div>
  );
}
