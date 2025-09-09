import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import { fetchFunnelsAction } from '@/app/actions';
import FunnelsListSection from './FunnelsListSection';
import { CreateFunnelDialog } from './CreateFunnelDialog';
import FunnelSkeleton from '@/components/skeleton/FunnelSkeleton';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';

type FunnelsPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

type FunnelsHeaderProps = {
  funnelsPromise: ReturnType<typeof fetchFunnelsAction>;
  title: string;
};

async function FunnelsHeader({ funnelsPromise, title }: FunnelsHeaderProps) {
  const funnels = await funnelsPromise;
  if (funnels.length === 0) return null;

  return (
    <DashboardHeader title={title}>
      <DashboardFilters>
        <CreateFunnelDialog />
      </DashboardFilters>
    </DashboardHeader>
  );
}

export default async function FunnelsPage({ params, searchParams }: FunnelsPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate } = await BAFilterSearchParams.decodeFromParams(searchParams);
  const funnelsPromise = fetchFunnelsAction(dashboardId, startDate, endDate);
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <Suspense fallback={null}>
        <FunnelsHeader funnelsPromise={funnelsPromise} title={t('funnels')} />
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
