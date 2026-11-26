import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DashboardRole } from '@prisma/client';
import type { AuthContext } from '@/entities/auth/authContext.entities';

vi.mock('@/auth/api-auth', () => ({
  getCachedSession: vi.fn(),
  getCachedAuthorizedContext: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(async (context: AuthContext, fn: CallableFunction, args: unknown[]) =>
    fn(context, ...args),
  ),
  getFnSignature: vi.fn(() => 'publicDashboard.action'),
}));

vi.mock('@/services/dashboard/publicDashboard.service', () => ({
  getPublicDashboardSettings: vi.fn(),
  suggestPublicDashboardSlug: vi.fn(),
  checkPublicDashboardSlug: vi.fn(),
  setPublicDashboardVisibility: vi.fn(),
  setPublicDashboardSlug: vi.fn(),
  setPublicDashboardPages: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  unstable_rethrow: vi.fn(),
}));

import { getCachedSession, getCachedAuthorizedContext, resolveDashboardAuthResult } from '@/auth/api-auth';
import * as PublicDashboardService from '@/services/dashboard/publicDashboard.service';
import {
  getPublicDashboardSettingsAction,
  setPublicDashboardPagesAction,
  setPublicDashboardSlugAction,
  setPublicDashboardVisibilityAction,
} from '@/app/actions/dashboard/publicDashboard.action';

const settings = { isPublic: false, slug: null, enabledPages: ['overview' as const] };

function asMember(role: DashboardRole) {
  const context: AuthContext = { dashboardId: 'dash-1', siteId: 'site-1', userId: 'user-1', role, isDemo: false };
  vi.mocked(getCachedSession).mockResolvedValue({
    user: { id: 'user-1' },
    session: { token: 'session-token', expiresAt: new Date('2030-01-01') },
  } as Awaited<ReturnType<typeof getCachedSession>>);
  vi.mocked(getCachedAuthorizedContext).mockResolvedValue(context);
  vi.mocked(resolveDashboardAuthResult).mockResolvedValue({ context });
}

const writes = [
  [
    'turn public',
    () => setPublicDashboardVisibilityAction('dash-1', true),
    PublicDashboardService.setPublicDashboardVisibility,
  ],
  [
    'change slug',
    () => setPublicDashboardSlugAction('dash-1', 'my-site'),
    PublicDashboardService.setPublicDashboardSlug,
  ],
  [
    'change pages',
    () => setPublicDashboardPagesAction('dash-1', ['overview']),
    PublicDashboardService.setPublicDashboardPages,
  ],
] as const;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(PublicDashboardService.getPublicDashboardSettings).mockResolvedValue(settings);
  vi.mocked(PublicDashboardService.setPublicDashboardVisibility).mockResolvedValue(settings);
  vi.mocked(PublicDashboardService.setPublicDashboardSlug).mockResolvedValue(settings);
  vi.mocked(PublicDashboardService.setPublicDashboardPages).mockResolvedValue(settings);
});

describe('public dashboard actions', () => {
  describe.each<DashboardRole>(['editor', 'viewer'])('as %s', (role) => {
    it.each(writes)('refuses to %s', async (_label, write, service) => {
      asMember(role);
      await expect(write()).rejects.toThrow('You do not have permission to perform this action');
      expect(service).not.toHaveBeenCalled();
    });

    it('can read the settings', async () => {
      asMember(role);
      await expect(getPublicDashboardSettingsAction('dash-1')).resolves.toEqual(settings);
    });
  });

  describe.each<DashboardRole>(['owner', 'admin'])('as %s', (role) => {
    it.each(writes)('can %s', async (_label, write, service) => {
      asMember(role);
      await expect(write()).resolves.toEqual(settings);
      expect(service).toHaveBeenCalledWith('dash-1', expect.anything());
    });
  });
});
