import { Suspense } from 'react';
import { getWorldMapDataAlpha2 } from '@/app/actions/analytics/geography.actions';
import GeographySection from './GeographySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams.entities';
import { getUserTimezone } from '@/lib/cookies';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { getSiteConfig } from '@/services/dashboard/siteConfig.service';
import { getAllowedGeoLevels } from '@/entities/analytics/geography.entities';

type GeographyPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function GeographyPage({ params, searchParams }: GeographyPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const query = BAFilterSearchParams.decode(await searchParams, timezone);

  const siteConfig = await getSiteConfig(dashboardId);
  const allowedLevels = getAllowedGeoLevels(siteConfig?.geoLevel ?? 'COUNTRY');

  const worldMapPromise = allowedLevels.includes('country_code')
    ? getWorldMapDataAlpha2(dashboardId, query)
    : Promise.resolve({ visitorData: [], compareData: [], maxVisitors: 0 });

  return (
    <div className='fixed inset-0 top-14 w-full'>
      <Suspense
        fallback={<GeographyLoading />}
      >
        <GeographySection worldMapPromise={worldMapPromise} geoLevel={siteConfig?.geoLevel ?? 'COUNTRY'} />
      </Suspense>

      <div className='fixed top-16 right-4 z-30'>
        <div className='bg-card flex gap-4 rounded-md p-2 shadow-md'>
          <DashboardFilters />
        </div>
      </div>
    </div>
  );
}
