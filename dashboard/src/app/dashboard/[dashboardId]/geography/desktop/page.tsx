import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getWorldMapGranularityTimeseries } from '@/app/actions/geography';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import GeographyTimeseriesSection from '@/app/dashboard/[dashboardId]/geography/desktop/GeographyTimeseriesSection';

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
  const { startDate, endDate, queryFilters, granularity, compareStartDate, compareEndDate } =
    BAFilterSearchParams.decode(await searchParams);

  const worldMapPromise = getWorldMapGranularityTimeseries(
    dashboardId,
    { startDate, endDate, queryFilters, compareStartDate, compareEndDate },
    granularity,
  );

  return (
    <div className='fixed inset-0 top-14 w-full'>
      <GeographyTimeseriesSection worldMapPromise={worldMapPromise} />
    </div>
  );
}
