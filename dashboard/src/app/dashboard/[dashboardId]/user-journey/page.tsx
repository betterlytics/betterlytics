import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import { fetchUserJourneyAction } from '@/app/actions/userJourney';
import { Spinner } from '@/components/ui/spinner';
import UserJourneySection from '@/app/dashboard/[dashboardId]/user-journey/UserJourneySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';

type UserJourneyPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function UserJourneyPage({ params, searchParams }: UserJourneyPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, userJourney, queryFilters } =
    await BAFilterSearchParams.decodeFromParams(searchParams);

  const userJourneyPromise = fetchUserJourneyAction(
    dashboardId,
    startDate,
    endDate,
    userJourney.numberOfSteps,
    userJourney.numberOfJourneys,
    queryFilters,
  );

  return (
    <div className='container space-y-6 p-6'>
      <div className='flex flex-col justify-between gap-y-4 lg:flex-row lg:items-center'>
        <div>
          <h1 className='text-foreground mb-1 text-2xl font-bold'>User Journey</h1>
          <p className='text-muted-foreground text-sm'>Analytics and insights for your website</p>
        </div>
        <DashboardFilters showComparison={false} />
      </div>

      <Suspense
        fallback={
          <div className='relative min-h-[400px]'>
            <div className='bg-background/70 absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm'>
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
