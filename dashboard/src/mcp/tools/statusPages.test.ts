import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/analytics/statusPage.service', () => ({
  getStatusPagesForDashboard: vi.fn(),
}));

vi.mock('@/services/analytics/publicStatusPage.service', () => ({
  getStatusPageLivePreviewData: vi.fn(),
}));

vi.mock('@/services/analytics/statusPageIncident.service', () => ({
  getIncidentSuggestions: vi.fn(),
}));

vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn(() => true),
}));

vi.mock('@/lib/env', () => ({
  env: { PUBLIC_BASE_URL: 'https://betterlytics.io' },
}));

import { getStatusPagesForDashboard } from '@/services/analytics/statusPage.service';
import { getStatusPageLivePreviewData } from '@/services/analytics/publicStatusPage.service';
import { getIncidentSuggestions } from '@/services/analytics/statusPageIncident.service';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type { StatusPageListItem } from '@/entities/analytics/statusPage/statusPage.entities';
import type { StatusPagePreviewPayload } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import type { DetectedOutageSuggestion } from '@/entities/analytics/statusPage/statusPageIncident.entities';
import { executeListStatusPages, executeListIncidentSuggestions } from '@/mcp/tools/statusPages';

const listPages = vi.mocked(getStatusPagesForDashboard);
const livePreview = vi.mocked(getStatusPageLivePreviewData);
const suggestions = vi.mocked(getIncidentSuggestions);
const featureEnabled = vi.mocked(isFeatureEnabled);

const page = {
  id: 'sp-1',
  name: 'Betterlytics Status',
  slug: 'betterlytics',
  isPublished: true,
  visibility: 'public',
  customDomain: null,
  showPastIncidents: true,
  monitorCount: 1,
  monitors: [{ monitorCheckId: 'mon-1', publicName: 'API' }],
  activeIncidentCount: 1,
} as StatusPageListItem;

const payload = {
  data: {
    name: 'Betterlytics Status',
    slug: 'betterlytics',
    overallStatus: 'partial_outage',
    overallUptime: 99.9876,
    lastUpdatedAt: '2026-02-01T10:00:00.000Z',
    monitors: [{ key: '0', publicName: 'API', status: 'down', uptime: 98.7654, days: [] }],
    incidents: [
      {
        title: 'API is unreachable',
        body: 'Investigating',
        description: 'Customers cannot reach the API.',
        impact: 'outage',
        status: 'investigating',
        monitorPublicNames: ['API'],
        startedAt: '2026-02-01T09:00:00.000Z',
        resolvedAt: null,
        updates: [{ status: 'investigating', message: 'Investigating', createdAt: '2026-02-01T09:05:00.000Z' }],
      },
    ],
  },
  monitorCheckIds: ['mon-1'],
  detectedStatuses: ['down'],
  incidentMonitorCheckIds: [['mon-1']],
} as unknown as StatusPagePreviewPayload;

const suggestion: DetectedOutageSuggestion = {
  detectedIncidentId: 'det-1',
  monitors: [{ monitorCheckId: 'mon-1', monitorPublicName: 'API' }],
  startedAt: '2026-02-01T09:00:00.000Z',
  resolvedAt: null,
  ongoing: true,
  suggestedImpact: 'outage',
};

beforeEach(() => {
  vi.clearAllMocks();
  featureEnabled.mockReturnValue(true);
});

describe('executeListStatusPages', () => {
  it('returns what the page currently shows visitors, including open incidents', async () => {
    listPages.mockResolvedValue([page]);
    livePreview.mockResolvedValue(payload);

    const result = await executeListStatusPages({}, 'dash-1');

    expect(result.total).toBe(1);
    expect(result.status_pages[0]).toMatchObject({
      id: 'sp-1',
      slug: 'betterlytics',
      public_url: 'https://betterlytics.io/status/betterlytics',
      published: true,
      overall_status: 'partial_outage',
      overall_uptime_percent: 99.988,
      monitors: [{ monitor_id: 'mon-1', public_name: 'API', status: 'down', uptime_percent: 98.765 }],
    });
    expect(result.status_pages[0].incidents[0]).toMatchObject({
      title: 'API is unreachable',
      impact: 'outage',
      status: 'investigating',
      affected_monitors: ['API'],
      resolved_at: null,
      updates: [{ status: 'investigating', message: 'Investigating' }],
    });
  });

  it('prefers the custom domain for the public URL', async () => {
    listPages.mockResolvedValue([{ ...page, customDomain: 'status.example.com' }]);
    livePreview.mockResolvedValue(payload);

    const result = await executeListStatusPages({}, 'dash-1');

    expect(result.status_pages[0].public_url).toBe('https://status.example.com');
  });

  it('scopes to a single status page', async () => {
    listPages.mockResolvedValue([page, { ...page, id: 'sp-2' }]);
    livePreview.mockResolvedValue(payload);

    const result = await executeListStatusPages({ statusPageId: 'sp-2' }, 'dash-1');

    expect(result.status_pages).toHaveLength(1);
    // total counts what matched the request, not every page on the dashboard.
    expect(result.total).toBe(1);
    expect(livePreview).toHaveBeenCalledExactlyOnceWith('dash-1', 'sp-2');
  });

  it('returns every status page rather than capping at a guessed ceiling', async () => {
    const pages = Array.from({ length: 12 }, (_, i) => ({ ...page, id: `sp-${i}` }));
    listPages.mockResolvedValue(pages);
    livePreview.mockResolvedValue(payload);

    const result = await executeListStatusPages({}, 'dash-1');

    // A cap without an offset would strand pages 11+ : their ids only come from this tool.
    expect(livePreview).toHaveBeenCalledTimes(12);
    expect(result.status_pages).toHaveLength(12);
    expect(result.total).toBe(12);
  });

  it('rejects a status page id that does not belong to the dashboard', async () => {
    listPages.mockResolvedValue([page]);

    await expect(executeListStatusPages({ statusPageId: 'sp-other' }, 'dash-1')).rejects.toThrow(
      'Status page not found',
    );
    expect(livePreview).not.toHaveBeenCalled();
  });

  it('still reports the page when its live data cannot be assembled', async () => {
    listPages.mockResolvedValue([page]);
    livePreview.mockResolvedValue(null);

    const result = await executeListStatusPages({}, 'dash-1');

    expect(result.status_pages[0]).toMatchObject({
      id: 'sp-1',
      overall_status: null,
      monitors: [],
      incidents: [],
    });
  });

  it('errors instead of returning data when status pages are disabled', async () => {
    featureEnabled.mockReturnValue(false);

    await expect(executeListStatusPages({}, 'dash-1')).rejects.toThrow('Public status pages are not enabled');
    expect(listPages).not.toHaveBeenCalled();
  });
});

describe('executeListIncidentSuggestions', () => {
  it('reports uncovered outages per status page with their detected incident ids', async () => {
    listPages.mockResolvedValue([page]);
    suggestions.mockResolvedValue([suggestion]);

    const result = await executeListIncidentSuggestions({}, 'dash-1');

    expect(result.total_suggestions).toBe(1);
    expect(result.status_pages[0]).toMatchObject({
      status_page_id: 'sp-1',
      status_page_name: 'Betterlytics Status',
      published: true,
    });
    expect(result.status_pages[0].suggestions[0]).toMatchObject({
      detected_incident_id: 'det-1',
      ongoing: true,
      suggested_impact: 'outage',
      monitors: [{ monitor_id: 'mon-1', public_name: 'API' }],
    });
  });

  it('reports an empty suggestion list when every outage is already posted', async () => {
    listPages.mockResolvedValue([page]);
    suggestions.mockResolvedValue([]);

    const result = await executeListIncidentSuggestions({}, 'dash-1');

    expect(result.total_suggestions).toBe(0);
    expect(result.status_pages[0].suggestions).toEqual([]);
  });

  it('totals suggestions across every status page', async () => {
    listPages.mockResolvedValue([page, { ...page, id: 'sp-2' }]);
    suggestions.mockResolvedValueOnce([suggestion]).mockResolvedValueOnce([suggestion, suggestion]);

    const result = await executeListIncidentSuggestions({}, 'dash-1');

    expect(result.total_suggestions).toBe(3);
  });

  it('sweeps every status page rather than capping the scan', async () => {
    const pages = Array.from({ length: 12 }, (_, i) => ({ ...page, id: `sp-${i}` }));
    listPages.mockResolvedValue(pages);
    suggestions.mockResolvedValue([]);

    const result = await executeListIncidentSuggestions({}, 'dash-1');

    // An unchecked page would make an empty result read as a clean bill of health.
    expect(suggestions).toHaveBeenCalledTimes(12);
    expect(result.status_pages).toHaveLength(12);
    expect(result.total_status_pages).toBe(12);
  });

  it('errors instead of returning data when status pages are disabled', async () => {
    featureEnabled.mockReturnValue(false);

    await expect(executeListIncidentSuggestions({}, 'dash-1')).rejects.toThrow(
      'Public status pages are not enabled',
    );
    expect(suggestions).not.toHaveBeenCalled();
  });
});
