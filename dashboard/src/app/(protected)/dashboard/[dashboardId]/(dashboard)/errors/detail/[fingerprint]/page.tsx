import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { fetchErrorGroupAction } from '@/app/actions/analytics/errors.actions';
import { ErrorDetailHeader } from './ErrorDetailHeader';

type ErrorDetailPageParams = {
  params: Promise<{ dashboardId: string; fingerprint: string }>;
};

export default async function ErrorDetailPage({ params }: ErrorDetailPageParams) {
  if (!isFeatureEnabled('enableErrorTracking')) {
    notFound();
  }

  const { dashboardId, fingerprint } = await params;
  const errorGroup = await fetchErrorGroupAction(dashboardId, fingerprint);

  if (!errorGroup) {
    notFound();
  }

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <ErrorDetailHeader dashboardId={dashboardId} errorGroup={errorGroup} />
    </div>
  );
}
