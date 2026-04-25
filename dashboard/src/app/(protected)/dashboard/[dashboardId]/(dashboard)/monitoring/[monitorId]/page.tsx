import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { fetchMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { MonitorDetailClient } from './MonitorDetailClient';

type MonitorDetailParams = {
  params: Promise<{ dashboardId: string; monitorId: string }>;
};

export default async function MonitorDetailPage({ params }: MonitorDetailParams) {
  if (!isFeatureEnabled('enableUptimeMonitoring')) {
    notFound();
  }

  const { dashboardId, monitorId } = await params;
  const initialMonitor = await fetchMonitorCheckAction(dashboardId, monitorId);

  if (!initialMonitor) {
    notFound();
  }

  return <MonitorDetailClient monitorId={monitorId} initialMonitor={initialMonitor} />;
}
