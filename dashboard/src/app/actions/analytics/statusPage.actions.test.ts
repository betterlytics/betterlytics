import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mirrors Next: reading cookies() inside unstable_cache throws, so an action that reads the cookie fails loudly.
const demoCache = vi.hoisted(() => ({ inside: false, keys: [] as string[] }));
const getSession = vi.hoisted(() => vi.fn());
const getMonitorChecksWithStatus = vi.hoisted(() => vi.fn());
const getStatusPageStudioData = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => {
    if (demoCache.inside) throw new Error('cookies() was called inside unstable_cache');
    return { get: () => ({ value: 'Europe/Copenhagen' }) };
  },
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => Promise<unknown>, keyParts: string[]) => async () => {
    demoCache.keys.push(keyParts.join('|'));
    demoCache.inside = true;
    try {
      return await fn();
    } finally {
      demoCache.inside = false;
    }
  },
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }));
vi.mock('next-intl/server', () => ({
  getMessages: async () => ({ publicStatusPage: {} }),
  getTranslations: async () => (key: string) => key,
}));
vi.mock('@/lib/env', () => ({ env: { DEMO_DASHBOARD_ID: 'demo-dash' } }));
vi.mock('@/lib/better-auth', () => ({ auth: { api: { getSession } } }));
vi.mock('@/services/auth/auth.service', () => ({ getAuthorizedDashboardContextOrNull: vi.fn() }));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findDashboardById: async (id: string) => ({ id, siteId: 'demo-site', domain: 'betterlytics.io' }),
}));
vi.mock('@/services/analytics/monitoring.service', () => ({ getMonitorChecksWithStatus }));
vi.mock('@/services/analytics/publicStatusPage.service', () => ({
  getStatusPageStudioData,
  getStatusPageLivePreviewData: vi.fn(),
  getStatusPagePreviewDataForDashboard: vi.fn(),
}));
vi.mock('@/services/analytics/statusPage.service', () => ({}));
vi.mock('@/services/analytics/statusPageIncident.service', () => ({}));
vi.mock('@/services/analytics/statusPageDomain.service', () => ({ isOwnNamespace: vi.fn() }));
vi.mock('@/lib/billing/capabilityAccess', () => ({}));
vi.mock('@/lib/billing/validators', () => ({}));
vi.mock('@/lib/statusPageImage', () => ({}));

import {
  fetchStatusPageStudioDataAction,
  suggestStatusPageDefaultsAction,
} from '@/app/actions/analytics/statusPage.actions';

const monitor = {
  id: 'monitor-1',
  name: 'API',
  url: 'https://api.betterlytics.io',
  operationalState: 'up',
  uptimePercent: 99.9,
};

beforeEach(() => {
  vi.clearAllMocks();
  demoCache.keys = [];
  // An expired session: the demo dashboard falls back to the public demo context.
  getSession.mockResolvedValue(null);
  getMonitorChecksWithStatus.mockResolvedValue([monitor]);
  getStatusPageStudioData.mockResolvedValue({ monitors: [] });
});

describe('status page studio reads on the demo dashboard after the session expires', () => {
  it('suggests the defaults in the given timezone from inside the demo cache', async () => {
    const defaults = await suggestStatusPageDefaultsAction('demo-dash', 'America/New_York');

    expect(demoCache.keys).toHaveLength(1);
    expect(defaults).toMatchObject({
      name: 'Betterlytics Status',
      slug: 'betterlytics-io',
      monitors: [{ monitorCheckId: 'monitor-1', operationalState: 'up', uptimePercent: 99.9 }],
    });
    expect(getMonitorChecksWithStatus).toHaveBeenCalledWith('demo-dash', 'demo-site', 'America/New_York');
  });

  it('loads the studio data for an existing page in the given timezone from inside the demo cache', async () => {
    const data = await fetchStatusPageStudioDataAction('demo-dash', 'page-1', 'America/New_York');

    expect(demoCache.keys).toHaveLength(1);
    expect(data).toMatchObject({ monitors: [] });
    expect(getStatusPageStudioData).toHaveBeenCalledWith('demo-dash', 'page-1', 'demo-site', 'America/New_York');
  });

  it('caches each timezone under its own key', async () => {
    await suggestStatusPageDefaultsAction('demo-dash', 'America/New_York');
    await suggestStatusPageDefaultsAction('demo-dash', 'Asia/Tokyo');
    await fetchStatusPageStudioDataAction('demo-dash', 'page-1', 'America/New_York');
    await fetchStatusPageStudioDataAction('demo-dash', 'page-1', 'Asia/Tokyo');

    expect(new Set(demoCache.keys).size).toBe(4);
  });
});
