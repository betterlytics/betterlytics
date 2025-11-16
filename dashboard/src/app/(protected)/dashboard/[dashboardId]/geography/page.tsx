import { Suspense } from 'react';
import { getWorldMapDataAlpha2 } from '@/app/actions/geography';
import GeographySection from '@/app/(protected)/dashboard/[dashboardId]/geography/GeographySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getUserTimezone } from '@/lib/cookies';

type GeographyPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function GeographyPage({ params, searchParams }: GeographyPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const { startDate, endDate, queryFilters } = BAFilterSearchParams.decode(await searchParams, timezone);

  const worldMapPromise = getWorldMapDataAlpha2(dashboardId, { startDate, endDate, queryFilters });

  return (
    <div className='fixed inset-0 top-14 w-full'>
      <Suspense
        fallback={
          <div className='bg-background/70 flex h-full w-full flex-col items-center backdrop-blur-sm'>
            <div className='border-accent border-t-primary mb-2 h-10 w-10 animate-spin rounded-full border-4'></div>
            <p className='text-foreground'>Loading visitor data...</p>
          </div>
        }
      >
        <GeographySection worldMapPromise={worldMapPromise} />
      </Suspense>

      <div className='fixed top-16 right-4 z-30'>
        <div className='bg-card flex gap-4 rounded-md p-2 shadow-md'>
          <DashboardFilters />
        </div>
      </div>
    </div>
  );
}
