import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { fetchStatusPageAction, fetchStatusPagePreviewAction } from '@/app/actions/analytics/statusPage.actions';
import { fetchMonitorChecksAction } from '@/app/actions/analytics/monitoring.actions';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getUserTimezone } from '@/lib/cookies';
import { StatusPageEditor } from './StatusPageEditor';

type StatusPageEditorParams = {
  params: Promise<{ dashboardId: string; statusPageId: string }>;
};

export default async function StatusPageEditorPage({ params }: StatusPageEditorParams) {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    notFound();
  }

  const { dashboardId, statusPageId } = await params;
  const timezone = await getUserTimezone();
  const [statusPage, monitors, previewPayload, dashboard] = await Promise.all([
    fetchStatusPageAction(dashboardId, statusPageId),
    fetchMonitorChecksAction(dashboardId, timezone),
    fetchStatusPagePreviewAction(dashboardId, statusPageId),
    findDashboardById(dashboardId),
  ]);

  if (!statusPage || !previewPayload) {
    notFound();
  }

  const previewMessages = (await getMessages({ locale: 'en' })).publicStatusPage as Record<string, unknown>;

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <StatusPageEditor
        dashboardId={dashboardId}
        statusPage={statusPage}
        monitors={monitors.map((monitor) => ({ id: monitor.id, name: monitor.name ?? null, url: monitor.url }))}
        publicBaseUrl={env.PUBLIC_BASE_URL}
        dashboardDomain={dashboard.domain}
        previewPayload={previewPayload}
        previewMessages={previewMessages}
      />
    </div>
  );
}
