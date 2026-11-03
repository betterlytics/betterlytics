import { describe, it, expect, vi, beforeEach } from 'vitest';

const demoCache = vi.hoisted(() => ({ keys: [] as string[] }));
const getSession = vi.hoisted(() => vi.fn());
const getAuthorizedContext = vi.hoisted(() => vi.fn());
const getMonitorChecksWithStatus = vi.hoisted(() => vi.fn());
const getStatusPageStudioData = vi.hoisted(() => vi.fn());
const getStatusPagePreviewDataForDashboard = vi.hoisted(() => vi.fn());
const isStatusPageSlugAvailable = vi.hoisted(() => vi.fn());
const getStatusPagesForDashboard = vi.hoisted(() => vi.fn());
const getStatusPageEditorData = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => Promise<unknown>, keyParts: string[]) => async () => {
    demoCache.keys.push(keyParts.join('|'));
    return fn();
  },
}));
// Mirrors Next: redirect() ends the action by throwing.
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  unstable_rethrow: vi.fn(),
}));
vi.mock('next-intl/server', () => ({
  getMessages: async () => ({ publicStatusPage: {} }),
  getTranslations: async () => (key: string) => key,
}));
vi.mock('@/lib/env', () => ({ env: { DEMO_DASHBOARD_ID: 'demo-dash' } }));
vi.mock('@/lib/better-auth', () => ({ auth: { api: { getSession } } }));
vi.mock('@/services/auth/auth.service', () => ({ getAuthorizedDashboardContextOrNull: getAuthorizedContext }));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findDashboardById: async (id: string) => ({ id, siteId: 'demo-site', domain: 'betterlytics.io' }),
}));
vi.mock('@/services/analytics/monitoring.service', () => ({ getMonitorChecksWithStatus }));
vi.mock('@/services/analytics/publicStatusPage.service', () => ({
  getStatusPageStudioData,
  getStatusPageLivePreviewData: vi.fn(),
  getStatusPagePreviewDataForDashboard,
}));
vi.mock('@/services/analytics/statusPage.service', () => ({
  isStatusPageSlugAvailable,
  getStatusPagesForDashboard,
  getStatusPageEditorData,
}));
vi.mock('@/services/analytics/statusPageIncident.service', () => ({}));
vi.mock('@/services/analytics/statusPageDomain.service', () => ({ isOwnNamespace: vi.fn() }));
vi.mock('@/lib/billing/capabilityAccess', () => ({}));
vi.mock('@/lib/billing/validators', () => ({}));
vi.mock('@/lib/statusPageImage', () => ({}));

import {
  checkStatusPageSlugAction,
  fetchStatusPageDraftPreviewAction,
  fetchStatusPageEditorDataAction,
  fetchStatusPagesAction,
  fetchStatusPageStudioDataAction,
  suggestStatusPageDefaultsAction,
} from '@/app/actions/analytics/statusPage.actions';

const studioReads: Array<[string, (dashboardId: string) => Promise<unknown>]> = [
  ['studio data', (id) => fetchStatusPageStudioDataAction(id, 'page-1', 'America/New_York')],
  ['default suggestions', (id) => suggestStatusPageDefaultsAction(id, 'America/New_York')],
  ['draft preview', (id) => fetchStatusPageDraftPreviewAction(id)],
  ['slug availability', (id) => checkStatusPageSlugAction(id, 'my-page')],
];

const expectNoStudioDataRead = () => {
  expect(demoCache.keys).toHaveLength(0);
  expect(getStatusPageStudioData).not.toHaveBeenCalled();
  expect(getMonitorChecksWithStatus).not.toHaveBeenCalled();
  expect(getStatusPagePreviewDataForDashboard).not.toHaveBeenCalled();
  expect(isStatusPageSlugAvailable).not.toHaveBeenCalled();
};

const member = { user: { id: 'user-1' }, session: { token: 't', expiresAt: new Date() } };
const memberContext = (dashboardId: string) => ({
  dashboardId,
  siteId: 'member-site',
  userId: 'user-1',
  role: 'admin',
  isDemo: false,
});

beforeEach(() => {
  vi.clearAllMocks();
  demoCache.keys = [];
  getSession.mockResolvedValue(null);
  getAuthorizedContext.mockResolvedValue(null);
  getMonitorChecksWithStatus.mockResolvedValue([
    { id: 'monitor-1', name: 'API', url: 'https://api.betterlytics.io', operationalState: 'up', uptimePercent: 99.9 },
  ]);
  getStatusPageStudioData.mockResolvedValue({ monitors: [] });
  getStatusPagePreviewDataForDashboard.mockResolvedValue({});
  isStatusPageSlugAvailable.mockResolvedValue(true);
  getStatusPagesForDashboard.mockResolvedValue([]);
  getStatusPageEditorData.mockResolvedValue({ id: 'page-1' });
});

describe.each(studioReads)('status page studio read: %s', (_name, read) => {
  it.each(['demo-dash', 'other-dash'])('sends a caller without a session on %s to sign-in', async (dashboardId) => {
    await expect(read(dashboardId)).rejects.toThrow('NEXT_REDIRECT:/signin');
    expectNoStudioDataRead();
  });

  it.each(['demo-dash', 'other-dash'])('sends a signed-in non-member of %s away', async (dashboardId) => {
    getSession.mockResolvedValue(member);

    await expect(read(dashboardId)).rejects.toThrow('NEXT_REDIRECT:/dashboards');
    expectNoStudioDataRead();
  });

  it('runs for a member of the demo dashboard, outside the demo cache', async () => {
    getSession.mockResolvedValue(member);
    getAuthorizedContext.mockResolvedValue(memberContext('demo-dash'));

    await expect(read('demo-dash')).resolves.toBeTruthy();
    expect(demoCache.keys).toHaveLength(0);
  });
});

describe('status page studio reads for a member', () => {
  beforeEach(() => {
    getSession.mockResolvedValue(member);
    getAuthorizedContext.mockResolvedValue(memberContext('dash-1'));
  });

  it('suggests the defaults in the viewer timezone', async () => {
    const defaults = await suggestStatusPageDefaultsAction('dash-1', 'Asia/Tokyo');

    expect(defaults).toMatchObject({
      name: 'Betterlytics Status',
      slug: 'betterlytics-io',
      monitors: [{ monitorCheckId: 'monitor-1', operationalState: 'up', uptimePercent: 99.9 }],
    });
    expect(getMonitorChecksWithStatus).toHaveBeenCalledWith('dash-1', 'member-site', 'Asia/Tokyo');
  });

  it('loads the studio data in the viewer timezone', async () => {
    await expect(fetchStatusPageStudioDataAction('dash-1', 'page-1', 'Asia/Tokyo')).resolves.toMatchObject({
      monitors: [],
    });
    expect(getStatusPageStudioData).toHaveBeenCalledWith('dash-1', 'page-1', 'member-site', 'Asia/Tokyo');
  });
});

describe('reads behind the public demo', () => {
  it('stay available to an anonymous visitor through the demo cache', async () => {
    await expect(fetchStatusPagesAction('demo-dash')).resolves.toEqual([]);
    await expect(fetchStatusPageEditorDataAction('demo-dash', 'page-1')).resolves.toEqual({ id: 'page-1' });

    expect(demoCache.keys).toHaveLength(2);
    expect(getStatusPagesForDashboard).toHaveBeenCalledWith('demo-dash');
  });

  it('still send an anonymous visitor of another dashboard to sign-in', async () => {
    await expect(fetchStatusPagesAction('other-dash')).rejects.toThrow('NEXT_REDIRECT:/signin');
    expect(getStatusPagesForDashboard).not.toHaveBeenCalled();
  });
});
