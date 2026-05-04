import {
  fetchLatestMonitorTlsResultAction,
  fetchMonitorCheckAction,
  fetchMonitorIncidentsAction,
  fetchMonitorMetricsAction,
  fetchMonitorUptimeAction,
  fetchRecentMonitorResultsAction,
} from '@/app/actions/analytics/monitoring.actions';
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
  const timezone = await getUserTimezone();

  const [monitor, metrics, recentChecks, incidents, tls, uptime] = await Promise.all([
    fetchMonitorCheckAction(dashboardId, monitorId),
    fetchMonitorMetricsAction(dashboardId, monitorId, timezone),
    fetchRecentMonitorResultsAction(dashboardId, monitorId, false),
    fetchMonitorIncidentsAction(dashboardId, monitorId),
    fetchLatestMonitorTlsResultAction(dashboardId, monitorId),
    fetchMonitorUptimeAction(dashboardId, monitorId, timezone, 180),
  ]);

  if (!monitor) {
    notFound();
  }

  const hostname = safeHostname(monitor.url);
  const serverNow = Date.now();

  return (
    <MonitorDetailClient
      dashboardId={dashboardId}
      monitorId={monitorId}
      hostname={hostname}
      timezone={timezone}
      serverNow={serverNow}
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
