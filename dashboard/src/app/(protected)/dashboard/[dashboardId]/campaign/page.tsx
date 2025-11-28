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
  searchParams: Promise<FilterQuerySearchParams & { page?: string; pageSize?: string }>;
};

const DEFAULT_PAGE_SIZE = 10;

export default async function CampaignPage({ params, searchParams }: CampaignPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const resolvedSearchParams = await searchParams;
  const { startDate, endDate, granularity } = BAFilterSearchParams.decode(resolvedSearchParams, timezone);

  const rawPage = resolvedSearchParams.page ? Number(resolvedSearchParams.page) : 1;
  const rawPageSize = resolvedSearchParams.pageSize ? Number(resolvedSearchParams.pageSize) : DEFAULT_PAGE_SIZE;

  const pageSizeOptions = [6, 10, 25, 50] as const;
  const safePageSize = pageSizeOptions.includes(rawPageSize as (typeof pageSizeOptions)[number])
    ? rawPageSize
    : DEFAULT_PAGE_SIZE;
  const pageIndex = Number.isFinite(rawPage) && rawPage > 0 ? rawPage - 1 : 0;

  const campaignPerformancePromise = fetchCampaignPerformanceAction(
    dashboardId,
    startDate,
    endDate,
    granularity,
    timezone,
    pageIndex,
    safePageSize,
  );

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
          campaignPerformancePromise={campaignPerformancePromise}
        />
      </Suspense>
    </div>
  );
}
