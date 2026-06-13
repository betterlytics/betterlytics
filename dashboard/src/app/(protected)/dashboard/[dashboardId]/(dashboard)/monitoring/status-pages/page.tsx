import { notFound } from 'next/navigation';
import { fetchStatusPagesAction } from '@/app/actions/analytics/statusPage.actions';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { StatusPagesClient } from './StatusPagesClient';

type StatusPagesPageParams = {
  params: Promise<{ dashboardId: string }>;
};

export default async function StatusPagesPage({ params }: StatusPagesPageParams) {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    notFound();
  }

  const { dashboardId } = await params;
  const statusPages = await fetchStatusPagesAction(dashboardId);

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <StatusPagesClient dashboardId={dashboardId} statusPages={statusPages} publicBaseUrl={env.PUBLIC_BASE_URL} />
    </div>
  );
}
