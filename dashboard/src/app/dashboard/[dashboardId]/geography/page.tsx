import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import { getWorldMapGranularityTimeseries } from '@/app/actions/geography';
import GeographySection from '@/app/dashboard/[dashboardId]/geography/GeographySection';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';

type GeographyPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function GeographyPage({ params, searchParams }: GeographyPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, queryFilters, granularity } = BAFilterSearchParams.decode(await searchParams);

  const worldMapPromise = getWorldMapGranularityTimeseries(
    dashboardId,
    { startDate, endDate, queryFilters },
    granularity,
  );

  return (
    <div className='fixed inset-0 top-14 w-full'>
      {/* <Suspense
        fallback={
          <div className='bg-background/70 flex h-full w-full flex-col items-center backdrop-blur-sm'>
            <div className='border-accent border-t-primary mb-2 h-10 w-10 animate-spin rounded-full border-4'></div>
            <p className='text-foreground'>Loading visitor data...</p>
          </div>
        }
      > */}
      <GeographySection worldMapPromise={worldMapPromise} />
      {/* </Suspense> */}
    </div>
  );
}
