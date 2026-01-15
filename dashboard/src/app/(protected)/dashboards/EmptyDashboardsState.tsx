'use client';

import { use } from 'react';
import { Suspense } from 'react';
import { getAllUserDashboardsAction, getUserDashboardStatsAction } from '@/app/actions/dashboard/dashboard.action';
import { CreateDashboardDialog } from './CreateDashboardDialog';
import ButtonSkeleton from '@/components/skeleton/ButtonSkeleton';
import { useTranslations } from 'next-intl';

interface EmptyDashboardsStateProps {
  dashboardsPromise: ReturnType<typeof getAllUserDashboardsAction>;
  dashboardStatsPromise: ReturnType<typeof getUserDashboardStatsAction>;
}

export function EmptyDashboardsState({ dashboardsPromise, dashboardStatsPromise }: EmptyDashboardsStateProps) {
  const t = useTranslations('dashboardsPage');
  const dashboards = use(dashboardsPromise);

  if (!dashboards.success || dashboards.data.length > 0) {
    return null;
  }

  return (
    <div className='py-16 text-center'>
      <div className='mx-auto max-w-md'>
        <h3 className='text-foreground mb-2 text-lg font-semibold'>{t('emptyTitle')}</h3>
        <p className='text-muted-foreground mb-6 text-sm'>{t('emptyDescription')}</p>
        <Suspense fallback={<ButtonSkeleton />}>
          <div className='[&_button]:bg-primary [&_button]:text-primary-foreground [&_button:hover]:bg-primary/90 [&_button]:cursor-pointer'>
            <CreateDashboardDialog dashboardStatsPromise={dashboardStatsPromise} />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
