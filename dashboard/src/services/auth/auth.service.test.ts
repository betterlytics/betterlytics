import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthorizedDashboardContextOrNull, assertPublicDashboardAccess } from '@/services/auth/auth.service';
import { findUserDashboardWithDashboardOrNull } from '@/repositories/postgres/dashboard.repository';

vi.mock('@/lib/env', () => ({
  env: {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'admin-Password-1',
    DEMO_DASHBOARD_ID: 'demo-dashboard-id',
  },
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserDashboardWithDashboardOrNull: vi.fn(),
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAuthorizedDashboardContextOrNull', () => {
  it('returns null when the user has no access to the dashboard', async () => {
    vi.mocked(findUserDashboardWithDashboardOrNull).mockResolvedValue(null);

    const result = await getAuthorizedDashboardContextOrNull({ userId: 'user-1', dashboardId: 'dash-1' });

    expect(result).toBeNull();
  });

  it('returns a parsed auth context for an authorized user', async () => {
    vi.mocked(findUserDashboardWithDashboardOrNull).mockResolvedValue({
      dashboardUser: { userId: 'user-1', dashboardId: 'dash-1', role: 'owner' },
      dashboard: { id: 'dash-1', siteId: 'site-1' },
    } as never);

    const result = await getAuthorizedDashboardContextOrNull({ userId: 'user-1', dashboardId: 'dash-1' });

    expect(result).toEqual({
      role: 'owner',
      userId: 'user-1',
      dashboardId: 'dash-1',
      siteId: 'site-1',
      isDemo: false,
    });
  });
});

describe('assertPublicDashboardAccess', () => {
  it('allows the configured demo dashboard', async () => {
    await expect(assertPublicDashboardAccess('demo-dashboard-id')).resolves.toBeUndefined();
  });

  it('rejects any other dashboard with a not-found error', async () => {
    await expect(assertPublicDashboardAccess('some-other-dashboard')).rejects.toThrow();
  });
});
