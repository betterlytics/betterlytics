import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { fetchErrorGroupAction, fetchErrorGroupSidebarAction } from '@/app/actions/analytics/errors.actions';
import { ErrorDetailHeader } from './ErrorDetailHeader';
import { ErrorDetailSidebar } from './ErrorDetailSidebar';

type ErrorDetailPageParams = {
  params: Promise<{ dashboardId: string; fingerprint: string }>;
};

export default async function ErrorDetailPage({ params }: ErrorDetailPageParams) {
  if (!isFeatureEnabled('enableErrorTracking')) {
    notFound();
  }

  const { dashboardId, fingerprint } = await params;

  const [errorGroup, sidebarData] = await Promise.all([
    fetchErrorGroupAction(dashboardId, fingerprint),
    fetchErrorGroupSidebarAction(dashboardId, fingerprint),
  ]);

  if (!errorGroup) {
    notFound();
  }

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <ErrorDetailHeader dashboardId={dashboardId} errorGroup={errorGroup} />

      <div className='grid grid-cols-4 items-start gap-4'>
        <div className='col-span-3 min-w-0' />

        <ErrorDetailSidebar errorGroup={errorGroup} sidebarData={sidebarData} />
      </div>
    </div>
  );
}
