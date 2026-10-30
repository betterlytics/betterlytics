import {
  fetchLatestMonitorTlsResultAction,
  fetchMonitorCheckAction,
  fetchMonitorIncidentsAction,
  fetchMonitorMetricsAction,
  fetchMonitorUptimeAction,
  fetchRecentMonitorResultsAction,
} from '@/app/actions/analytics/monitoring.actions';
import { MonitorDetailClient } from './MonitorDetailClient';
import { NotFoundState } from './NotFoundState';
import { MonitorDetailGhost } from './MonitorDetailGhost';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { safeHostname } from '@/utils/domainValidation';
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

  // The metrics and uptime loads throw for a missing monitor, so look it up before starting them
  const monitor = await fetchMonitorCheckAction(dashboardId, monitorId);

  if (!monitor) {
    const t = await getTranslations('monitoringDetailPage');
    return (
      <NotFoundState
        title={t('notFound.title')}
        description={t('notFound.description')}
        actionLabel={t('header.back')}
        href='monitoring'
        backdrop={<MonitorDetailGhost />}
      />
    );
  }

  const timezone = await getUserTimezone();

  const [metrics, recentChecks, incidents, tls, uptime] = await Promise.all([
    fetchMonitorMetricsAction(dashboardId, monitorId, timezone),
    fetchRecentMonitorResultsAction(dashboardId, monitorId, false),
    fetchMonitorIncidentsAction(dashboardId, monitorId),
    fetchLatestMonitorTlsResultAction(dashboardId, monitorId),
    fetchMonitorUptimeAction(dashboardId, monitorId, timezone, 180),
  ]);

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
