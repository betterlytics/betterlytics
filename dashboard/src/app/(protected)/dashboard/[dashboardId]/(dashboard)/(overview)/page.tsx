import { Suspense } from 'react';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import SummaryAndChartSection from './SummaryAndChartSection';
import PagesAnalyticsSection from './PagesAnalyticsSection';
import GeographySection from './GeographySection';
import DevicesSection from './DevicesSection';
import TrafficSourcesSection from './TrafficSourcesSection';
import CustomEventsSection from './CustomEventsSection';
import WeeklyHeatmapSection from './WeeklyHeatmapSection';
import { getEnabledGeoLevels } from '@/lib/geoLevels';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const enabledLevels = getEnabledGeoLevels();
  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='container space-y-4 p-2 sm:p-6'>
      <DashboardHeader title={t('overview')}>
        <DashboardFilters />
      </DashboardHeader>

      <Suspense fallback={<ChartSkeleton />}>
        <SummaryAndChartSection />
      </Suspense>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Suspense fallback={<TableSkeleton />}>
          <PagesAnalyticsSection />
        </Suspense>
        {enabledLevels.length > 0 && (
          <Suspense fallback={<TableSkeleton />}>
            <GeographySection />
          </Suspense>
        )}
        <Suspense fallback={<TableSkeleton />}>
          <DevicesSection />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <TrafficSourcesSection />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <CustomEventsSection />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <WeeklyHeatmapSection />
        </Suspense>
      </div>
    </div>
  );
}
