import { Suspense } from 'react';
import { SummaryCardsSkeleton, TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import ReferrersSummarySection from './ReferrersSummarySection';
import ReferrersChartsSection from './ReferrersChartsSection';
import ReferrersTableSection from './ReferrersTableSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default async function ReferrersPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('referrers')}>
        <DashboardFilters />
      </DashboardHeader>
      <Suspense fallback={<SummaryCardsSkeleton count={4} />}>
        <ReferrersSummarySection />
      </Suspense>
      <Suspense
        fallback={
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        }
      >
        <ReferrersChartsSection />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <ReferrersTableSection />
      </Suspense>
    </div>
  );
}
