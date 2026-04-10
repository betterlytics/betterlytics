import {
  getMonitorCheck,
  fetchMonitorMetrics,
  fetchMonitorIncidentSegments,
  fetchRecentMonitorResults,
  fetchLatestMonitorTlsResult,
  fetchMonitorDailyUptime,
} from '@/services/analytics/monitoring.service';
import { toMonitorUptimePresentation } from '@/presenters/toMonitorUptimeDays';
import { requireAuth, getCachedAuthorizedContext } from '@/auth/auth-actions';
import { MonitorDetailClient } from './MonitorDetailClient';
import { notFound } from 'next/navigation';
import { safeHostname } from '../utils';
import { getUserTimezone } from '@/lib/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';

type MonitorDetailParams = {
  params: Promise<{ dashboardId: string; monitorId: string }>;
};

export default async function MonitorDetailPage({ params }: MonitorDetailParams) {
  if (!isFeatureEnabled('enableUptimeMonitoring')) {
    notFound();
  }

  const { dashboardId, monitorId } = await params;
  const session = await requireAuth();
  const authCtx = await getCachedAuthorizedContext(session.user.id, dashboardId);
  if (!authCtx) notFound();

  const timezone = await getUserTimezone();

  const [monitor, metrics, recentChecks, incidents, tls, uptimeRows] = await Promise.all([
    getMonitorCheck(authCtx.dashboardId, monitorId),
    fetchMonitorMetrics(authCtx.dashboardId, monitorId, authCtx.siteId, timezone),
    fetchRecentMonitorResults(monitorId, authCtx.siteId, 10, false),
    fetchMonitorIncidentSegments(monitorId, authCtx.siteId),
    fetchLatestMonitorTlsResult(monitorId, authCtx.siteId),
    fetchMonitorDailyUptime(monitorId, authCtx.dashboardId, authCtx.siteId, timezone, 180),
  ]);

  if (!monitor) {
    notFound();
  }

  const uptime = toMonitorUptimePresentation(uptimeRows, 180);
  const hostname = safeHostname(monitor.url);

  return (
    <MonitorDetailClient
      dashboardId={dashboardId}
      monitorId={monitorId}
      hostname={hostname}
      timezone={timezone}
      initialData={{
        monitor,
        metrics,
        recentChecks,
        incidents,
        tls,
        uptime,
      }}
    />
  );
}
