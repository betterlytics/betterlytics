import { defaultPublicMonitorName } from '@/entities/analytics/statusPage/statusPage.helpers';
import { type MonitorOperationalState } from '@/entities/analytics/monitoring.entities';

export type MonitorRow = {
  monitorCheckId: string;
  name: string | null;
  url: string;
  included: boolean;
  publicName: string;
  operationalState?: MonitorOperationalState;
  uptimePercent?: number | null;
};

export function newMonitorRow(monitor: { id: string; name?: string | null; url: string }): MonitorRow {
  return {
    monitorCheckId: monitor.id,
    name: monitor.name ?? null,
    url: monitor.url,
    included: true,
    publicName: defaultPublicMonitorName(monitor),
    operationalState: 'preparing',
    uptimePercent: null,
  };
}
