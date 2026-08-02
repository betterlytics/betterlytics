import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/analytics/monitoring.service', () => ({
  getMonitorSummariesForRange: vi.fn(),
  getMonitorIncidentsForRange: vi.fn(),
}));

vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn(() => true),
}));

import { getMonitorIncidentsForRange, getMonitorSummariesForRange } from '@/services/analytics/monitoring.service';
import type { MonitorIncidentWithMonitor, MonitorRangeSummary } from '@/entities/analytics/monitoring.entities';
import { isFeatureEnabled } from '@/lib/feature-flags';
import {
  McpListMonitorsInputSchema,
  McpListMonitorIncidentsInputSchema,
  executeListMonitors,
  executeListMonitorIncidents,
} from '@/mcp/tools/monitoring';

const getSummaries = vi.mocked(getMonitorSummariesForRange);
const getIncidents = vi.mocked(getMonitorIncidentsForRange);
const featureEnabled = vi.mocked(isFeatureEnabled);

const monitor = {
  id: 'mon-1',
  dashboardId: 'dash-1',
  name: 'API health',
  url: 'https://example.com/health',
  isEnabled: true,
  intervalSeconds: 300,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
} as MonitorRangeSummary['monitor'];

const summary: MonitorRangeSummary = {
  monitor,
  operationalState: 'up',
  currentStateSince: '2026-01-05T00:00:00.000Z',
  lastCheckAt: '2026-02-01T10:00:00.000Z',
  lastStatus: 'ok',
  effectiveIntervalSeconds: 900,
  backoffLevel: 2,
  uptimePercent: 99.98765,
  uptimeSeconds: 86391,
  totalSeconds: 86400,
  latency: { avgMs: 120.456, minMs: 90.1, maxMs: 800.99 },
  tls: { ts: '2026-02-01T10:00:00.000Z', status: 'ok', reasonCode: null, tlsNotAfter: '2026-06-01T00:00:00.000Z' },
};

const incident: MonitorIncidentWithMonitor = {
  incidentId: 'inc-1',
  monitorCheckId: 'mon-1',
  monitor,
  state: 'resolved',
  severity: 'critical',
  reason: 'http_5xx',
  startedAt: '2026-01-30T12:00:00.000Z',
  resolvedAt: '2026-01-30T12:15:00.000Z',
  durationMs: 900_000,
};

beforeEach(() => {
  vi.clearAllMocks();
  featureEnabled.mockReturnValue(true);
});

describe('McpListMonitorsInputSchema', () => {
  it('accepts valid input with just a time range', () => {
    expect(McpListMonitorsInputSchema.safeParse({ timeRange: '24h' }).success).toBe(true);
  });

  it('rejects custom time range without dates', () => {
    expect(McpListMonitorsInputSchema.safeParse({ timeRange: 'custom' }).success).toBe(false);
  });
});

describe('executeListMonitors', () => {
  it('returns monitors with operational state, uptime, and response times', async () => {
    getSummaries.mockResolvedValue([summary]);

    const result = await executeListMonitors({ timeRange: '24h' }, 'site-1', 'dash-1');

    expect(getSummaries).toHaveBeenCalledOnce();
    expect(result.total).toBe(1);
    expect(result.monitors[0]).toMatchObject({
      id: 'mon-1',
      name: 'API health',
      operational_state: 'up',
      last_status: 'ok',
      uptime: { percent: 99.988, up_seconds: 86391, measured_seconds: 86400 },
      response_time_ms: { avg: 120.5, min: 90.1, max: 801 },
    });
  });

  it('exposes cert staleness and the backed-off interval, not just the configured one', async () => {
    getSummaries.mockResolvedValue([summary]);

    const result = await executeListMonitors({ timeRange: '24h' }, 'site-1', 'dash-1');

    expect(result.monitors[0]).toMatchObject({
      check_interval_seconds: 300,
      effective_check_interval_seconds: 900,
      backoff_level: 2,
      ssl: {
        status: 'ok',
        expires_at: '2026-06-01T00:00:00.000Z',
        // The TLS read is unbounded in time, so the caller needs to see how old this result is.
        checked_at: '2026-02-01T10:00:00.000Z',
      },
    });
  });

  it('returns every monitor rather than capping at a guessed ceiling', async () => {
    const many = Array.from({ length: 120 }, (_, i) => ({
      ...summary,
      monitor: { ...monitor, id: `mon-${i}` },
    }));
    getSummaries.mockResolvedValue(many);

    const result = await executeListMonitors({ timeRange: '24h' }, 'site-1', 'dash-1');

    // A cap without an offset would strand the rest: nothing here can select a specific monitor.
    expect(result.monitors).toHaveLength(120);
    expect(result.total).toBe(120);
  });

  it('reports null uptime when nothing was measured', async () => {
    getSummaries.mockResolvedValue([{ ...summary, uptimePercent: null, uptimeSeconds: 0, totalSeconds: 0 }]);

    const result = await executeListMonitors({ timeRange: '24h' }, 'site-1', 'dash-1');

    expect(result.monitors[0].uptime.percent).toBeNull();
  });

  it('errors instead of returning data when uptime monitoring is disabled', async () => {
    featureEnabled.mockReturnValue(false);

    await expect(executeListMonitors({ timeRange: '24h' }, 'site-1', 'dash-1')).rejects.toThrow(
      'Uptime monitoring is not enabled',
    );
    expect(getSummaries).not.toHaveBeenCalled();
  });
});

describe('McpListMonitorIncidentsInputSchema', () => {
  it('accepts a monitor and state filter', () => {
    expect(
      McpListMonitorIncidentsInputSchema.safeParse({ timeRange: '7d', monitorId: 'mon-1', state: 'ongoing' })
        .success,
    ).toBe(true);
  });

  it('rejects an unknown incident state', () => {
    expect(McpListMonitorIncidentsInputSchema.safeParse({ timeRange: '7d', state: 'flapping' }).success).toBe(
      false,
    );
  });

  it('rejects startDate after endDate', () => {
    expect(
      McpListMonitorIncidentsInputSchema.safeParse({
        timeRange: 'custom',
        startDate: '2026-02-01',
        endDate: '2026-01-01',
      }).success,
    ).toBe(false);
  });
});

describe('executeListMonitorIncidents', () => {
  it('returns incidents with the monitor, duration, and a readable reason', async () => {
    getIncidents.mockResolvedValue([incident]);

    const result = await executeListMonitorIncidents({ timeRange: '7d' }, 'site-1', 'dash-1');

    expect(result.count).toBe(1);
    expect(result.truncated).toBe(false);
    expect(result.incidents[0]).toMatchObject({
      id: 'inc-1',
      monitor_id: 'mon-1',
      monitor_name: 'API health',
      state: 'resolved',
      severity: 'critical',
      reason: 'http_5xx',
      reason_description: 'Server returned a server error',
      duration_ms: 900_000,
    });
  });

  it('passes the monitor, state, and limit filters through to the service', async () => {
    getIncidents.mockResolvedValue([]);

    await executeListMonitorIncidents(
      { timeRange: '7d', monitorId: 'mon-1', state: 'ongoing', limit: 5 },
      'site-1',
      'dash-1',
    );

    expect(getIncidents.mock.calls[0][2]).toMatchObject({ monitorId: 'mon-1', state: 'ongoing', limit: 6 });
  });

  it('does not flag truncation when the result lands exactly on the limit', async () => {
    getIncidents.mockResolvedValue([incident]);

    const result = await executeListMonitorIncidents({ timeRange: '7d', limit: 1 }, 'site-1', 'dash-1');

    // One row came back for a limit of 1, but the service was asked for 2, so there is no more.
    expect(getIncidents.mock.calls[0][2]).toMatchObject({ limit: 2 });
    expect(result.count).toBe(1);
    expect(result.truncated).toBe(false);
  });

  it('flags truncation and trims the over-fetched row when more exist', async () => {
    getIncidents.mockResolvedValue([incident, { ...incident, incidentId: 'inc-2' }]);

    const result = await executeListMonitorIncidents({ timeRange: '7d', limit: 1 }, 'site-1', 'dash-1');

    expect(result.incidents).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(result.truncated).toBe(true);
  });

  it('describes an unmapped reason code as unknown rather than dropping it', async () => {
    getIncidents.mockResolvedValue([{ ...incident, reason: null }]);

    const result = await executeListMonitorIncidents({ timeRange: '7d' }, 'site-1', 'dash-1');

    expect(result.incidents[0].reason).toBeNull();
    expect(result.incidents[0].reason_description).toBe('Unknown error');
  });

  it('errors instead of returning data when uptime monitoring is disabled', async () => {
    featureEnabled.mockReturnValue(false);

    await expect(executeListMonitorIncidents({ timeRange: '7d' }, 'site-1', 'dash-1')).rejects.toThrow(
      'Uptime monitoring is not enabled',
    );
    expect(getIncidents).not.toHaveBeenCalled();
  });
});
