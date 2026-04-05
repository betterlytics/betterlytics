import { Suspense } from 'react';
import { SummaryCardsSkeleton, TableSkeleton } from '@/components/skeleton';
import PagesSummarySection from './PagesSummarySection';
import PagesTableSection from './PagesTableSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default async function PagesPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('pages')}>
        <DashboardFilters />
      </DashboardHeader>

      <Suspense fallback={<SummaryCardsSkeleton />}>
        <PagesSummarySection />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <PagesTableSection />
      </Suspense>
    </div>
  );
}
