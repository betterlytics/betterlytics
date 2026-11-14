import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import type { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';

const auth = vi.hoisted(() => ({
  getCachedSession: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(),
}));
vi.mock('@/auth/api-auth', () => auth);
const flags = vi.hoisted(() => ({ isCloud: true }));
vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: (flag: string) => flag === 'isCloud' && flags.isCloud,
}));
vi.mock('@/services/analytics/errors.service', () => ({
  hasAnyErrorsForSite: vi.fn(async () => true),
  getErrorGroupsForSite: vi.fn(async () => []),
  getErrorGroupTimestampsForSite: vi.fn(async () => ({ firstSeenMap: {}, lastSeenMap: {} })),
  getErrorGroupVolumesForSite: vi.fn(async () => []),
  getErrorOccurrenceForSite: vi.fn(async () => null),
  getSessionTrailForSite: vi.fn(async () => []),
  hasSessionReplayForSite: vi.fn(async () => false),
}));
vi.mock('@/services/analytics/sessionReplays.service', () => ({
  getSessionReplaysForSite: vi.fn(async () => []),
}));

import { createRouter, dashboardProcedure } from '@/trpc/init';
import { errorsRouter } from '@/trpc/routers/errors';
import { sessionReplaysRouter } from '@/trpc/routers/sessionReplays';

const DEMO: AuthContext = { dashboardId: 'demo-dash', siteId: 'demo-site', userId: 'demo', role: 'viewer', isDemo: true };
const dashboardId = DEMO.dashboardId;
const query: BAAnalyticsQuery = {
  startDate: new Date('2026-10-16T00:00:00Z'),
  endDate: new Date('2026-10-23T00:00:00Z'),
  granularity: 'day',
  queryFilters: [],
  timezone: 'Etc/UTC',
  userJourney: { numberOfSteps: 3, numberOfJourneys: 5 },
  interval: '7d',
  compare: 'off',
};

const errors = errorsRouter.createCaller({ session: null });
const replays = sessionReplaysRouter.createCaller({ session: null });

beforeEach(() => {
  vi.clearAllMocks();
  flags.isCloud = true;
  auth.resolveDashboardAuthResult.mockResolvedValue({ context: DEMO });
  auth.executeWithDemoCache.mockImplementation(async (context, fn, args) => fn(context, ...args));
});

// The static demo views are re-dated relative to now, so cached copies of separate views drift apart
describe('demo cache on the static public demo views', () => {
  it.each([
    ['errors.errorGroups', () => errors.errorGroups({ dashboardId, query })],
    ['errors.errorGroupVolumes', () => errors.errorGroupVolumes({ dashboardId, query, fingerprints: [] })],
    ['errors.errorOccurrence', () => errors.errorOccurrence({ dashboardId, fingerprint: 'fp', offset: 0 })],
    ['errors.checkSessionReplay', () => errors.checkSessionReplay({ dashboardId, sessionId: '123' })],
    ['errors.sessionTrail', () => errors.sessionTrail({ dashboardId, sessionId: '123' })],
    ['sessionReplays.list', () => replays.list({ dashboardId, query })],
  ])('skips the demo cache for %s', async (_name, call) => {
    await call();

    expect(auth.executeWithDemoCache).not.toHaveBeenCalled();
  });

  it('still caches dashboard procedures without the flag', async () => {
    const cached = createRouter({ view: dashboardProcedure.query(() => 'ok') }).createCaller({ session: null });

    expect(await cached.view({ dashboardId })).toBe('ok');
    expect(auth.executeWithDemoCache).toHaveBeenCalledOnce();
  });

  it('keeps the demo cache for errors on self-hosted public dashboards, whose errors are real', async () => {
    flags.isCloud = false;
    vi.resetModules();
    const { errorsRouter: selfHosted } = await import('@/trpc/routers/errors');

    await selfHosted.createCaller({ session: null }).errorOccurrence({ dashboardId, fingerprint: 'fp', offset: 0 });

    expect(auth.executeWithDemoCache).toHaveBeenCalledOnce();
  });
});
