import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import { getWorldMapDataAlpha2 } from '@/app/actions/geography';
import GeographySection from '@/app/(protected)/dashboard/[dashboardId]/geography/mobile/GeographySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
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
  const { startDate, endDate, compareStartDate, compareEndDate, queryFilters } = BAFilterSearchParams.decode(
    await searchParams,
  );

  const worldMapPromise = getWorldMapDataAlpha2(dashboardId, {
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  });

  return (
    <div className='fixed inset-0 top-14 w-full'>
      <Suspense
        fallback={
          <div className='flex h-full w-full flex-col items-center bg-background/70 backdrop-blur-sm'>
            <div className='mb-2 h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-primary'></div>
            <p className='text-foreground'>Loading visitor data...</p>
          </div>
        }
      >
        <GeographySection worldMapPromise={worldMapPromise} />
      </Suspense>

      <div className='fixed right-4 top-16 z-30'>
        <div className='flex flex-col justify-end gap-4'>
          <div className='flex gap-4 rounded-md bg-card p-2 shadow-md'>
            <DashboardFilters />
          </div>
        </div>
      </div>
    </div>
  );
}
