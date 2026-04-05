import { Suspense } from 'react';
import CreateFunnelButton from './CreateFunnelButton';
import FunnelsStack, { FunnelsStackSkeleton } from './FunnelsStack';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';
import DashboardFilters from '@/components/dashboard/DashboardFilters';

export default async function FunnelsPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-3 p-2 pt-4 pb-10 sm:p-6'>
      <DashboardHeader title={t('funnels')}>
        <div className='flex flex-col-reverse justify-end gap-x-4 gap-y-3 sm:flex-row'>
          <div className='hidden xl:block'>
            <CreateFunnelButton />
          </div>
          <DashboardFilters showComparison={false} showQueryFilters={false} />
        </div>
      </DashboardHeader>

      <Suspense fallback={<FunnelsStackSkeleton />}>
        <FunnelsStack />
      </Suspense>
    </div>
  );
}
