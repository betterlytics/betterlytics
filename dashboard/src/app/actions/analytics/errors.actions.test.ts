import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/entities/auth/authContext.entities';

const auth = vi.hoisted(() => ({
  getCachedSession: vi.fn(),
  getCachedAuthorizedContext: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(),
  getFnSignature: vi.fn(() => 'errors.actions'),
}));
vi.mock('@/auth/api-auth', () => auth);
const service = vi.hoisted(() => ({
  getErrorGroupForSite: vi.fn(async () => null),
  getErrorGroupSidebarDataForSite: vi.fn(async () => ({ browsers: [], deviceTypes: [], dailyVolume: [] })),
  findReplaySessionForErrorGroup: vi.fn(async () => null),
  upsertErrorGroupForSite: vi.fn(),
  bulkUpsertErrorGroupForSite: vi.fn(),
}));
vi.mock('@/services/analytics/errors.service', () => service);
const flags = vi.hoisted(() => ({ isCloud: true }));
vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: (flag: string) => flag === 'isCloud' && flags.isCloud,
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  unstable_rethrow: vi.fn(),
}));

import { withDashboardAuthContext } from '@/auth/auth-actions';
import {
  fetchErrorGroupAction,
  fetchErrorGroupSidebarAction,
  findReplaySessionForErrorAction,
} from '@/app/actions/analytics/errors.actions';

const DEMO: AuthContext = { dashboardId: 'demo-dash', siteId: 'demo-site', userId: 'demo', role: 'viewer', isDemo: true };

beforeEach(() => {
  vi.clearAllMocks();
  flags.isCloud = true;
  auth.resolveDashboardAuthResult.mockResolvedValue({ context: DEMO });
  auth.executeWithDemoCache.mockImplementation(async (context, fn, args) => fn(context, ...args));
});

// The static demo error views are re-dated relative to now, so cached copies of separate views drift apart
describe('demo cache on the static error detail actions', () => {
  it.each([
    ['fetchErrorGroupAction', () => fetchErrorGroupAction('demo-dash', 'fp')],
    ['fetchErrorGroupSidebarAction', () => fetchErrorGroupSidebarAction('demo-dash', 'fp', 'Etc/UTC')],
    ['findReplaySessionForErrorAction', () => findReplaySessionForErrorAction('demo-dash', 'fp')],
  ])('skips the demo cache for %s', async (_name, call) => {
    await call();

    expect(auth.executeWithDemoCache).not.toHaveBeenCalled();
  });

  it('passes the demo context to the service', async () => {
    await fetchErrorGroupAction('demo-dash', 'fp');

    expect(service.getErrorGroupForSite).toHaveBeenCalledWith(DEMO, 'fp');
  });

  it('still caches dashboard actions without the option', async () => {
    const cached = withDashboardAuthContext(async () => 'ok');

    expect(await cached('demo-dash')).toBe('ok');
    expect(auth.executeWithDemoCache).toHaveBeenCalledOnce();
  });

  it('keeps the demo cache on self-hosted public dashboards, whose errors are real', async () => {
    flags.isCloud = false;
    vi.resetModules();
    const { fetchErrorGroupAction: selfHosted } = await import('@/app/actions/analytics/errors.actions');

    await selfHosted('demo-dash', 'fp');

    expect(auth.executeWithDemoCache).toHaveBeenCalledOnce();
  });
});
