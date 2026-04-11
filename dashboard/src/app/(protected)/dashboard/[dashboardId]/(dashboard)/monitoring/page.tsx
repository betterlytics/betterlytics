import { getMonitorChecksWithStatus } from '@/services/analytics/monitoring.service';
import { getCurrentDashboardAction } from '@/app/actions/dashboard/dashboard.action';
import { requireAuth, getCachedAuthorizedContext } from '@/auth/auth-actions';
import { getUserTimezone } from '@/lib/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { notFound } from 'next/navigation';
import { MonitoringClient } from './MonitoringClient';

type MonitoringPageParams = {
  params: Promise<{ dashboardId: string }>;
};

export default async function MonitoringPage({ params }: MonitoringPageParams) {
  if (!isFeatureEnabled('enableUptimeMonitoring')) {
    notFound();
  }

  const { dashboardId } = await params;
  const session = await requireAuth();
  const authCtx = await getCachedAuthorizedContext(session.user.id, dashboardId);
  if (!authCtx) notFound();

  const timezone = await getUserTimezone();
  const [monitors, dashboard] = await Promise.all([
    getMonitorChecksWithStatus(authCtx.dashboardId, authCtx.siteId, timezone),
    getCurrentDashboardAction(dashboardId),
  ]);

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <MonitoringClient dashboardId={dashboardId} monitors={monitors} domain={dashboard.domain} />
    </div>
  );
}
