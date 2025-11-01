import { Suspense } from 'react';
import { fetchFunnelsAction } from '@/app/actions';
import FunnelsListSection from './FunnelsListSection';
import { CreateFunnelDialog } from './CreateFunnelDialog';
import FunnelSkeleton from '@/components/skeleton/FunnelSkeleton';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { getDashboardAccessAction } from '@/app/actions/authentication';

type FunnelsPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

type FunnelsHeaderProps = {
  funnelsPromise: ReturnType<typeof fetchFunnelsAction>;
  title: string;
  isDemo: boolean;
};

async function FunnelsHeader({ funnelsPromise, title, isDemo }: FunnelsHeaderProps) {
  const funnels = await funnelsPromise;
  if (funnels.length === 0) return null;

  return (
    <DashboardHeader title={title}>
      <div className='flex flex-col-reverse justify-end gap-x-4 gap-y-3 sm:flex-row'>
        {!isDemo && <CreateFunnelDialog />}
        <DashboardFilters showComparison={false} />
      </div>
    </DashboardHeader>
  );
}

export default async function FunnelsPage({ params, searchParams }: FunnelsPageParams) {
  const { dashboardId } = await params;
  const { startDate, endDate } = BAFilterSearchParams.decode(await searchParams);
  const funnelsPromise = fetchFunnelsAction(dashboardId, startDate, endDate);
  const { isDemo } = await getDashboardAccessAction(dashboardId);
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <Suspense fallback={null}>
        <FunnelsHeader funnelsPromise={funnelsPromise} title={t('funnels')} isDemo={isDemo} />
      </Suspense>

      <Suspense
        fallback={
          <div className='space-y-5'>
            {[1, 2, 3].map((i) => (
              <FunnelSkeleton key={i} />
            ))}
          </div>
        }
      >
        <FunnelsListSection funnelsPromise={funnelsPromise} dashboardId={dashboardId} />
      </Suspense>
    </div>
  );
}
