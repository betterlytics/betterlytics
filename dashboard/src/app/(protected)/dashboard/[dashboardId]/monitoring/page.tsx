import { fetchMonitorChecksAction } from '@/app/actions/analytics/monitoring.actions';
import { MonitoringClient } from './MonitoringClient';

type MonitoringPageParams = {
  params: Promise<{ dashboardId: string }>;
};

export default async function MonitoringPage({ params }: MonitoringPageParams) {
  const { dashboardId } = await params;
  const monitorsPromise = fetchMonitorChecksAction(dashboardId);
  const monitors = await monitorsPromise;

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <MonitoringClient
        dashboardId={dashboardId}
        monitors={monitors.map((m) => ({
          ...m,
          intervalSeconds: m.intervalSeconds,
          createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
          updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : m.updatedAt,
        }))}
      />
    </div>
  );
}
