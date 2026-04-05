import { Suspense } from 'react';
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import InteractiveWebVitalsChartSection from './InteractiveWebVitalsChartSection';
import WebVitalsTableSection from './webVitalsTableSection';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { WebVitalsBanner } from './WebVitalsBanner';

export default async function WebVitalsPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('webVitals')}>
        <DashboardFilters showComparison={false} />
      </DashboardHeader>
      <Suspense>
        <WebVitalsBanner />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <InteractiveWebVitalsChartSection />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <WebVitalsTableSection />
      </Suspense>
    </div>
  );
}
