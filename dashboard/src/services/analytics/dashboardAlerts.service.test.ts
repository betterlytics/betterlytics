import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboardAlerts } from '@/services/analytics/dashboardAlerts.service';
import { getOpenIncidentsForMonitors } from '@/repositories/clickhouse/monitoring.repository';
import { listMonitorChecks } from '@/repositories/postgres/monitoring.repository';
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isFeatureEnabled).mockReturnValue(true);
});

describe('getDashboardAlerts', () => {
  it('flags down monitors among the active ones and leaves paused monitors out', async () => {
    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(getOpenIncidentsForMonitors).toHaveBeenCalledWith(['up', 'down'], 'site-1');
    expect(alerts).toEqual({ hasDownMonitors: true });
  });

  it('reports no down monitors when none has an open outage', async () => {
    vi.mocked(getOpenIncidentsForMonitors).mockResolvedValueOnce(new Map());

    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(alerts).toEqual({ hasDownMonitors: false });
  });

  it('skips the lookup when uptime monitoring is disabled', async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((flag) => flag !== 'enableUptimeMonitoring');

    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(alerts).toEqual({ hasDownMonitors: false });
    expect(listMonitorChecks).not.toHaveBeenCalled();
    expect(getOpenIncidentsForMonitors).not.toHaveBeenCalled();
  });
});
