import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import {
  fetchErrorGroupAction,
  fetchErrorGroupSidebarAction,
  findReplaySessionForErrorAction,
} from '@/app/actions/analytics/errors.actions';
import { ErrorDetailHeader } from './ErrorDetailHeader';
import { ErrorDetailSidebar } from './ErrorDetailSidebar';
import { ErrorOccurrencePanel } from './ErrorOccurrencePanel';

type ErrorDetailPageParams = {
  params: Promise<{ dashboardId: string; fingerprint: string }>;
};

export default async function ErrorDetailPage({ params }: ErrorDetailPageParams) {
  if (!isFeatureEnabled('enableErrorTracking')) {
    notFound();
  }

  const { dashboardId, fingerprint } = await params;

  const [errorGroup, sidebarData, replaySessionId] = await Promise.all([
    fetchErrorGroupAction(dashboardId, fingerprint),
    fetchErrorGroupSidebarAction(dashboardId, fingerprint),
    findReplaySessionForErrorAction(dashboardId, fingerprint),
  ]);

  if (!errorGroup) {
    notFound();
  }

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <ErrorDetailHeader dashboardId={dashboardId} errorGroup={errorGroup} />

      <div className='grid grid-cols-1 items-start gap-4 lg:grid-cols-4'>
        <div className='order-2 lg:order-none lg:col-span-3'>
          <ErrorOccurrencePanel
            dashboardId={dashboardId}
            fingerprint={fingerprint}
            totalCount={errorGroup.count}
          />
        </div>

        <ErrorDetailSidebar
          errorGroup={errorGroup}
          sidebarData={sidebarData}
          replaySessionId={replaySessionId}
        />
      </div>
    </div>
  );
}
