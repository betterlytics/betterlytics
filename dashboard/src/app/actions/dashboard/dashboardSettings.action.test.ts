import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DashboardRole } from '@prisma/client';

vi.mock('@/auth/api-auth', () => ({
  getCachedSession: vi.fn(),
  getCachedAuthorizedContext: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(async (context, fn, args) => fn(context, ...args)),
  getFnSignature: vi.fn(() => 'dashboardSettings.action'),
}));

vi.mock('@/services/dashboard/dashboardSettings.service', () => ({
  getDashboardSettings: vi.fn(),
  updateDashboardSettings: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  unstable_rethrow: vi.fn(),
}));

import { getCachedSession, getCachedAuthorizedContext, resolveDashboardAuthResult } from '@/auth/api-auth';
import { updateDashboardSettings } from '@/services/dashboard/dashboardSettings.service';
import { updateDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';

const update = vi.mocked(updateDashboardSettings);

function asMember(role: DashboardRole) {
  const context = { dashboardId: 'dash-1', siteId: 'site-1', userId: 'user-1', role, isDemo: false };
  vi.mocked(getCachedSession).mockResolvedValue({
    user: { id: 'user-1' },
    session: { token: 'session-token', expiresAt: new Date('2030-01-01') },
  } as Awaited<ReturnType<typeof getCachedSession>>);
  vi.mocked(getCachedAuthorizedContext).mockResolvedValue(context);
  vi.mocked(resolveDashboardAuthResult).mockResolvedValue({ context } as Awaited<
    ReturnType<typeof resolveDashboardAuthResult>
  >);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AI access switch', () => {
  it.each<DashboardRole>(['viewer', 'editor'])('rejects turning AI access off by role %s', async (role) => {
    asMember(role);

    await expect(updateDashboardSettingsAction('dash-1', { aiAccessEnabled: false })).rejects.toThrow(
      'You do not have permission to perform this action',
    );
    expect(update).not.toHaveBeenCalled();
  });

  it.each<DashboardRole>(['owner', 'admin'])('lets role %s turn AI access off and on', async (role) => {
    asMember(role);

    await updateDashboardSettingsAction('dash-1', { aiAccessEnabled: false });
    await updateDashboardSettingsAction('dash-1', { aiAccessEnabled: true });

    expect(update).toHaveBeenNthCalledWith(1, 'dash-1', { aiAccessEnabled: false });
    expect(update).toHaveBeenNthCalledWith(2, 'dash-1', { aiAccessEnabled: true });
  });
});
