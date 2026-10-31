import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboardAlerts } from '@/services/analytics/dashboardAlerts.service';
import { getOpenIncidentsForMonitors } from '@/repositories/clickhouse/monitoring.repository';
import { countUnresolvedIncidents } from '@/repositories/postgres/statusPageIncident.repository';
import { isFeatureEnabled } from '@/lib/feature-flags';

vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: vi.fn(() => true) }));
vi.mock('@/repositories/postgres/monitoring.repository', () => ({
  listMonitorChecks: vi.fn(async () => [
    { id: 'up', isEnabled: true },
    { id: 'down', isEnabled: true },
    { id: 'paused', isEnabled: false },
  ]),
}));
vi.mock('@/repositories/clickhouse/monitoring.repository', () => ({
  getOpenIncidentsForMonitors: vi.fn(async () => new Map([['down', { startedAt: '2026-10-23T10:00:00Z' }]])),
}));
vi.mock('@/repositories/postgres/statusPageIncident.repository', () => ({
  countUnresolvedIncidents: vi.fn(async () => 1),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isFeatureEnabled).mockReturnValue(true);
});

describe('getDashboardAlerts', () => {
  it('flags down monitors among the active ones and leaves paused monitors out', async () => {
    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(getOpenIncidentsForMonitors).toHaveBeenCalledWith(['up', 'down'], 'site-1');
    expect(alerts).toEqual({ hasDownMonitors: true, hasUnresolvedStatusPageIncidents: true });
  });

  it('reports no down monitors when none has an open outage', async () => {
    vi.mocked(getOpenIncidentsForMonitors).mockResolvedValueOnce(new Map());
    vi.mocked(countUnresolvedIncidents).mockResolvedValueOnce(0);

    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(alerts).toEqual({ hasDownMonitors: false, hasUnresolvedStatusPageIncidents: false });
  });

  it('skips down monitors when uptime monitoring is disabled', async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((flag) => flag !== 'enableUptimeMonitoring');

    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(alerts.hasDownMonitors).toBe(false);
    expect(getOpenIncidentsForMonitors).not.toHaveBeenCalled();
    expect(alerts.hasUnresolvedStatusPageIncidents).toBe(true);
  });

  it('skips status page incidents when public status pages are disabled', async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((flag) => flag !== 'enablePublicStatusPages');

    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(alerts.hasUnresolvedStatusPageIncidents).toBe(false);
    expect(countUnresolvedIncidents).not.toHaveBeenCalled();
    expect(alerts.hasDownMonitors).toBe(true);
  });
});
