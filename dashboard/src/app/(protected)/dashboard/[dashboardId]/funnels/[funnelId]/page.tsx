import { Suspense } from 'react';
import { fetchFunnelDetailsAction } from '@/app/actions';
import FunnelStepsSection from './FunnelStepsSection';
import FunnelSummarySection from './FunnelSummarySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { SummaryCardsSkeleton } from '@/components/skeleton';
import FunnelSkeleton from '@/components/skeleton/FunnelSkeleton';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getUserTimezone } from '@/lib/cookies';

type FunnelPageProps = {
  params: Promise<{ dashboardId: string; funnelId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function FunnelPage({ params, searchParams }: FunnelPageProps) {
  const timezone = await getUserTimezone();
  const { startDate, endDate } = BAFilterSearchParams.decode(await searchParams, timezone);

  const { dashboardId, funnelId } = await params;
  const funnelPromise = fetchFunnelDetailsAction(dashboardId, funnelId, startDate, endDate);

  const t = await getTranslations('components.funnels.details');

  return (
    <div className='container space-y-4 p-2 sm:p-6'>
      <DashboardHeader title={t('title')}>
        <DashboardFilters />
      </DashboardHeader>

      <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:p-6 sm:pt-4 sm:pb-4'>
        <CardContent className='px-0'>
          <div className='grid gap-6 lg:grid-cols-3'>
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
        </CardContent>
      </Card>
    </div>
  );
}
