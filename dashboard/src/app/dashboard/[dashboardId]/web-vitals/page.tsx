import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SummaryCardsSkeleton } from '@/components/skeleton';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { fetchCoreWebVitalsSummaryAction } from '@/app/actions';
import WebVitalsSummaryCards from './summaryCards';

type PageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function WebVitalsPage({ params, searchParams }: PageParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, queryFilters } = await BAFilterSearchParams.decodeFromParams(searchParams);

  const summaryPromise = fetchCoreWebVitalsSummaryAction(dashboardId, startDate, endDate, queryFilters);

  return (
    <div className='container space-y-6 p-6'>
      <DashboardFilters />
      <Suspense fallback={<SummaryCardsSkeleton />}>
        <WebVitalsSummaryCards summaryPromise={summaryPromise} />
      </Suspense>
    </div>
  );
}
