import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import { fetchFunnelDetailsAction } from '@/app/actions';
import FunnelStepsSection from './FunnelStepsSection';
import FunnelSummarySection from './FunnelSummarySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { SummaryCardsSkeleton } from '@/components/skeleton';
import FunnelSkeleton from '@/components/skeleton/FunnelSkeleton';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';

type FunnelPageProps = {
  params: Promise<{ dashboardId: string; funnelId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function FunnelPage({ params, searchParams }: FunnelPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { startDate, endDate } = await BAFilterSearchParams.decodeFromParams(searchParams);

  const { dashboardId, funnelId } = await params;
  const funnelPromise = fetchFunnelDetailsAction(dashboardId, funnelId, startDate, endDate);

  const tPage = await getTranslations('components.funnels.details');

  return (
    <div className='container space-y-6 p-6'>
      <div className='flex flex-col justify-between gap-y-4 lg:flex-row lg:items-center'>
        <div>
          <h1 className='text-foreground mb-1 text-2xl font-bold'>{tPage('title')}</h1>
          <p className='text-muted-foreground text-sm'>{tPage('description')}</p>
        </div>
        <DashboardFilters />
      </div>

      <div className='bg-card grid gap-6 rounded-md border p-5 lg:grid-cols-3'>
        <div className='col-span-3 lg:col-span-2'>
          <Suspense fallback={<FunnelSkeleton />}>
            <FunnelStepsSection funnelPromise={funnelPromise} />
          </Suspense>
        </div>

        <div className='col-span-3 lg:col-span-1 lg:border-l lg:pl-6'>
          <Suspense fallback={<SummaryCardsSkeleton count={4} />}>
            <FunnelSummarySection funnelPromise={funnelPromise} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
