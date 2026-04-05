import { Suspense } from 'react';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import OutboundLinksTableSection from './OutboundLinksTableSection';
import OutboundLinksChartSection from './OutboundLinksChartSection';
import OutboundLinksPieChart from './OutboundLinksPieChart';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';

export default async function OutboundLinksPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('outboundLinks')}>
        <DashboardFilters />
      </DashboardHeader>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <Suspense fallback={<ChartSkeleton />}>
          <OutboundLinksPieChart />
        </Suspense>
        <div className='xl:col-span-2'>
          <Suspense fallback={<ChartSkeleton />}>
            <OutboundLinksChartSection />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <OutboundLinksTableSection />
      </Suspense>
    </div>
  );
}
