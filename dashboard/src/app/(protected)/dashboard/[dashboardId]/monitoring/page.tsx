import { fetchMonitorChecksAction } from '@/app/actions/analytics/monitoring.actions';
import { getCurrentDashboardAction } from '@/app/actions/dashboard/dashboard.action';
import { getUserTimezone } from '@/lib/cookies';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { notFound } from 'next/navigation';
import { MonitoringClient } from './MonitoringClient';
import { PageContainer } from '@/components/layout';

type MonitoringPageParams = {
  params: Promise<{ dashboardId: string }>;
};

export default async function MonitoringPage({ params }: MonitoringPageParams) {
  if (!isFeatureEnabled('enableUptimeMonitoring')) {
    notFound();
  }

  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const [monitors, dashboard] = await Promise.all([
    fetchMonitorChecksAction(dashboardId, timezone),
    getCurrentDashboardAction(dashboardId),
  ]);

  return (
    <PageContainer>
      <MonitoringClient dashboardId={dashboardId} monitors={monitors} domain={dashboard.domain} />
    </PageContainer>
  );
}
