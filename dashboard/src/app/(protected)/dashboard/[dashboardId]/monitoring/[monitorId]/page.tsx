import {
  fetchMonitorCheckAction,
  fetchMonitorMetricsAction,
  fetchMonitorIncidentsAction,
  fetchRecentMonitorResultsAction,
  fetchLatestMonitorTlsResultAction,
  fetchMonitorUptimeAction,
} from '@/app/actions/analytics/monitoring.actions';
import { MonitorDetailClient } from './MonitorDetailClient';
import { notFound } from 'next/navigation';
import { safeHostname } from '../utils';
import { getUserTimezone } from '@/lib/cookies';

type MonitorDetailParams = {
  params: Promise<{ dashboardId: string; monitorId: string }>;
};

export default async function MonitorDetailPage({ params }: MonitorDetailParams) {
  const { dashboardId, monitorId } = await params;
  const timezone = await getUserTimezone();

  const monitorPromise = fetchMonitorCheckAction(dashboardId, monitorId);
  const metricsPromise = fetchMonitorMetricsAction(dashboardId, monitorId, timezone);
  const recentChecksPromise = fetchRecentMonitorResultsAction(dashboardId, monitorId, false);
  const incidentsPromise = fetchMonitorIncidentsAction(dashboardId, monitorId);
  const tlsPromise = fetchLatestMonitorTlsResultAction(dashboardId, monitorId);
  const uptimePromise = fetchMonitorUptimeAction(dashboardId, monitorId, timezone, 180);

  const [monitor, metrics, recentChecks, incidents, tls, uptime] = await Promise.all([
    monitorPromise,
    metricsPromise,
    recentChecksPromise,
    incidentsPromise,
    tlsPromise,
    uptimePromise,
  ]);

  if (!monitor) {
    notFound();
  }

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
