import { Suspense } from 'react';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import DevicesChartsSection from './DevicesChartsSection';
import DevicesTablesSection from './DevicesTablesSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default async function DevicesPage() {
  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('devices')}>
        <DashboardFilters />
      </DashboardHeader>

      <Suspense
        fallback={
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            <div className='md:col-span-2'>
              <ChartSkeleton />
            </div>

            <div className='md:col-span-1'>
              <ChartSkeleton />
            </div>
          </div>
        }
      >
        <DevicesChartsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <TableSkeleton />
            <TableSkeleton />
          </div>
        }
      >
        <DevicesTablesSection />
      </Suspense>
    </div>
  );
}
