import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboardAlerts } from '@/services/analytics/dashboardAlerts.service';
import { getOpenIncidentsForMonitors } from '@/repositories/clickhouse/monitoring.repository';
import { listUnresolvedIncidents } from '@/repositories/postgres/statusPageIncident.repository';
import { isFeatureEnabled } from '@/lib/feature-flags';

vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: vi.fn(() => true) }));
vi.mock('@/repositories/postgres/monitoring.repository', () => ({
  listMonitorChecks: vi.fn(async () => [
    { id: 'up', name: 'Up', url: 'https://example.com', isEnabled: true },
    { id: 'down', name: '', url: 'https://example.com/health', isEnabled: true },
    { id: 'paused', name: 'Paused', url: 'https://example.com/paused', isEnabled: false },
  ]),
}));
vi.mock('@/repositories/clickhouse/monitoring.repository', () => ({
  getOpenIncidentsForMonitors: vi.fn(
    async () => new Map([['down', { incidentId: 'i-1', startedAt: '2026-10-23T10:00:00Z' }]]),
  ),
}));
vi.mock('@/repositories/postgres/statusPageIncident.repository', () => ({
  listUnresolvedIncidents: vi.fn(async () => [
    {
      incidentId: 's-1',
      title: 'Checkout slow',
      statusPageId: 'p-1',
      statusPageName: 'Shop',
      startedAt: new Date(),
    },
  ]),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isFeatureEnabled).mockReturnValue(true);
});

describe('getDashboardAlerts', () => {
  it('returns down monitors by display name and leaves paused monitors out', async () => {
    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(getOpenIncidentsForMonitors).toHaveBeenCalledWith(['up', 'down'], 'site-1');
    expect(alerts.downMonitors).toEqual([
      { monitorId: 'down', name: 'example.com/health', incidentId: 'i-1', startedAt: '2026-10-23T10:00:00Z' },
    ]);
    expect(alerts.statusPageIncidents).toHaveLength(1);
  });

  it('skips down monitors when uptime monitoring is disabled', async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((flag) => flag !== 'enableUptimeMonitoring');

    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(alerts.downMonitors).toEqual([]);
    expect(getOpenIncidentsForMonitors).not.toHaveBeenCalled();
    expect(alerts.statusPageIncidents).toHaveLength(1);
  });

  it('skips status page incidents when public status pages are disabled', async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((flag) => flag !== 'enablePublicStatusPages');

    const alerts = await getDashboardAlerts('dashboard-1', 'site-1');

    expect(alerts.statusPageIncidents).toEqual([]);
    expect(listUnresolvedIncidents).not.toHaveBeenCalled();
    expect(alerts.downMonitors).toHaveLength(1);
  });
});
