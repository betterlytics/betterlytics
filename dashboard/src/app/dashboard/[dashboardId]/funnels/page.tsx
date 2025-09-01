import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import { fetchFunnelsAction } from '@/app/actions';
import FunnelsListSection from './FunnelsListSection';
import { CreateFunnelDialog } from './CreateFunnelDialog';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import FunnelSkeleton from '@/components/skeleton/FunnelSkeleton';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';

type FunnelsPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function FunnelsPage({ params, searchParams }: FunnelsPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate } = await BAFilterSearchParams.decodeFromParams(searchParams);
  const funnelsPromise = fetchFunnelsAction(dashboardId, startDate, endDate);

  const t = await getTranslations('components.funnels.page');

  return (
    <div className='container space-y-6 p-6'>
      <div className='flex flex-col justify-between gap-y-4 xl:flex-row xl:items-center'>
        <div>
          <h1 className='text-foreground mb-1 text-2xl font-bold'>{t('title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('description')}</p>
        </div>
        <div className='flex flex-col-reverse gap-4 lg:flex-row lg:justify-end xl:items-center'>
          <CreateFunnelDialog />
          <TimeRangeSelector />
        </div>
      </div>

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
