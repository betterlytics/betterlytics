import { Suspense } from 'react';
import { fetchUserJourneyAction } from '@/app/actions/analytics/userJourney';
import { Spinner } from '@/components/ui/spinner';
import UserJourneySection from '@/app/(protected)/dashboard/[dashboardId]/user-journey/UserJourneySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { UserJourneyFilters } from './UserJourneyFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams';
import { getUserTimezone } from '@/lib/cookies';

type UserJourneyPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function UserJourneyPage({ params, searchParams }: UserJourneyPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const { startDate, endDate, userJourney, queryFilters } = BAFilterSearchParams.decode(
    await searchParams,
    timezone,
  );

  const userJourneyPromise = fetchUserJourneyAction(
    dashboardId,
    startDate,
    endDate,
    userJourney?.numberOfSteps,
    userJourney?.numberOfJourneys,
    queryFilters,
  );

  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('userJourney')}>
        <DashboardFilters showComparison={false}>
          <div className='hidden 2xl:inline-block'>
            <UserJourneyFilters />
          </div>
        </DashboardFilters>
      </DashboardHeader>

      <div className='flex justify-end 2xl:hidden'>
        <UserJourneyFilters />
      </div>

      <Suspense
        fallback={
          <div className='relative min-h-[400px]'>
            <div className='bg-background/70 absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-sm'>
              <div className='flex flex-col items-center'>
                <Spinner size='lg' className='mb-2' />
                <p className='text-muted-foreground'>Loading journey data...</p>
              </div>
            </div>
          </div>
        }
      >
        <UserJourneySection userJourneyPromise={userJourneyPromise} />
      </Suspense>
    </div>
  );
}
