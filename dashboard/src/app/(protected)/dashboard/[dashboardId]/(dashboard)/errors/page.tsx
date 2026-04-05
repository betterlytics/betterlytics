import { Suspense } from 'react';
import { TableSkeleton } from '@/components/skeleton';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ErrorGroupsSection } from './ErrorGroupsSection';
import { getTranslations } from 'next-intl/server';

export default async function ErrorsPage() {
  const t = await getTranslations('errors.page');

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('title')}>
        <DashboardFilters showComparison={false} />
      </DashboardHeader>

      <Suspense fallback={<TableSkeleton />}>
        <ErrorGroupsSection />
      </Suspense>
    </div>
  );
}
