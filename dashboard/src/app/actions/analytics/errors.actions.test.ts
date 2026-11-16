import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/entities/auth/authContext.entities';

vi.mock('@/auth/api-auth', () => ({
  getCachedSession: vi.fn(),
  getCachedAuthorizedContext: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(),
  getFnSignature: vi.fn(() => 'errors.actions'),
}));
vi.mock('@/services/analytics/errors.service', () => ({
  getErrorGroupForSite: vi.fn(async () => null),
  getErrorGroupSidebarDataForSite: vi.fn(async () => ({ browsers: [], deviceTypes: [], dailyVolume: [] })),
  findReplaySessionForErrorGroup: vi.fn(async () => null),
  upsertErrorGroupForSite: vi.fn(),
  bulkUpsertErrorGroupForSite: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  unstable_rethrow: vi.fn(),
}));

import { executeWithDemoCache, resolveDashboardAuthResult } from '@/auth/api-auth';
import { getErrorGroupForSite } from '@/services/analytics/errors.service';
import { fetchErrorGroupAction } from '@/app/actions/analytics/errors.actions';

const DEMO: AuthContext = { dashboardId: 'demo-dash', siteId: 'demo-site', userId: 'demo', role: 'viewer', isDemo: true };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveDashboardAuthResult).mockResolvedValue({ context: DEMO });
  vi.mocked(executeWithDemoCache).mockImplementation(async (context, fn, args) => fn(context, ...args));
});

describe('error detail actions', () => {
  it('passes the demo context to the service', async () => {
    await fetchErrorGroupAction('demo-dash', 'fp');

    expect(getErrorGroupForSite).toHaveBeenCalledWith(DEMO, 'fp');
  });
});
