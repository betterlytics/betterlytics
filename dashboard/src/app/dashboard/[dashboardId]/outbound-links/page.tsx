import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import {
  fetchOutboundLinksAnalyticsAction,
  fetchOutboundLinksSummaryWithChartsAction,
} from '@/app/actions/outboundLinks';
import { SummaryCardsSkeleton, TableSkeleton } from '@/components/skeleton';
import OutboundLinksSummarySection from './OutboundLinksSummarySection';
import OutboundLinksTableSection from './OutboundLinksTableSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { ActiveQueryFilters } from '@/components/filters/ActiveQueryFilters';

type OutboundLinksPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function OutboundLinksPage({ params, searchParams }: OutboundLinksPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate } =
    await BAFilterSearchParams.decodeFromParams(searchParams);

  const outboundLinksSummaryWithChartsPromise = fetchOutboundLinksSummaryWithChartsAction(
    dashboardId,
    startDate,
    endDate,
    granularity,
    queryFilters,
  );

  const outboundLinksAnalyticsPromise = fetchOutboundLinksAnalyticsAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );

  return (
    <div className='container space-y-6 p-6'>
      <div className='flex flex-col justify-between gap-y-4 lg:flex-row lg:items-center'>
        <div>
          <h1 className='text-foreground mb-1 text-2xl font-bold'>Outbound Links</h1>
          <p className='text-muted-foreground text-sm'>Track clicks to external websites</p>
        </div>
        <DashboardFilters />
      </div>

      <ActiveQueryFilters />

      <Suspense fallback={<SummaryCardsSkeleton />}>
        <OutboundLinksSummarySection
          outboundLinksSummaryWithChartsPromise={outboundLinksSummaryWithChartsPromise}
        />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <OutboundLinksTableSection outboundLinksAnalyticsPromise={outboundLinksAnalyticsPromise} />
      </Suspense>
    </div>
  );
}
