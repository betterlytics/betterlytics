import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import type { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';

vi.mock('@/auth/api-auth', () => ({
  getCachedSession: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(),
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

import { executeWithDemoCache, resolveDashboardAuthResult } from '@/auth/api-auth';
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
  vi.mocked(resolveDashboardAuthResult).mockResolvedValue({ context: DEMO });
  vi.mocked(executeWithDemoCache).mockImplementation(async (context, fn, args) => fn(context, ...args));
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

    expect(executeWithDemoCache).not.toHaveBeenCalled();
  });

  it('still caches dashboard procedures without the flag', async () => {
    const cached = createRouter({ view: dashboardProcedure.query(() => 'ok') }).createCaller({ session: null });

    expect(await cached.view({ dashboardId })).toBe('ok');
    expect(executeWithDemoCache).toHaveBeenCalledOnce();
  });
});
