import { notFound } from 'next/navigation';
import { fetchStatusPagesAction } from '@/app/actions/analytics/statusPage.actions';
import { fetchMonitorChecksAction } from '@/app/actions/analytics/monitoring.actions';
import { getCurrentDashboardAction } from '@/app/actions/dashboard/dashboard.action';
import { getUserTimezone } from '@/lib/cookies';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type { MonitorOperationalState } from '@/entities/analytics/monitoring.entities';
import { StatusPagesClient } from './StatusPagesClient';

type StatusPagesPageParams = {
  params: Promise<{ dashboardId: string }>;
};

export default async function StatusPagesPage({ params }: StatusPagesPageParams) {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    notFound();
  }

  const { dashboardId } = await params;
  const [statusPages, dashboard] = await Promise.all([
    fetchStatusPagesAction(dashboardId),
    getCurrentDashboardAction(dashboardId),
  ]);

  const hasMonitors = statusPages.some((page) => page.monitors.length > 0);
  const monitorStatuses: Record<string, MonitorOperationalState> = {};
  if (hasMonitors) {
    const checks = await fetchMonitorChecksAction(dashboardId, await getUserTimezone());
    for (const check of checks) {
      monitorStatuses[check.id] = check.operationalState;
    }
  }

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <StatusPagesClient
        dashboardId={dashboardId}
        statusPages={statusPages}
        monitorStatuses={monitorStatuses}
        publicBaseUrl={env.PUBLIC_BASE_URL}
        domain={dashboard.domain}
      />
    </div>
  );
}
