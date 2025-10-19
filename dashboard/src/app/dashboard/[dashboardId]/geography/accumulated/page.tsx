import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import { getWorldMapDataAlpha2 } from '@/app/actions/geography';
import GeographySection from '@/app//dashboard/[dashboardId]/geography/accumulated/GeographySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import MapTypeNavigationButton from '@/components/map/MapTypeNavigationButton';

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
  const { startDate, endDate, queryFilters } = BAFilterSearchParams.decode(await searchParams);

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
        <div className='flex flex-col justify-end gap-4'>
          <div className='bg-card flex gap-4 rounded-md p-2 shadow-md'>
            <DashboardFilters />
          </div>
          <MapTypeNavigationButton className='bg-secondary ml-auto w-fit bg-transparent underline text-shadow-lg' />
        </div>
      </div>
    </div>
  );
}
