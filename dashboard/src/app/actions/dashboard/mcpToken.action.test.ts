import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DashboardRole } from '@prisma/client';

vi.mock('@/auth/api-auth', () => ({
  getCachedSession: vi.fn(),
  getCachedAuthorizedContext: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(async (context, fn, args) => fn(context, ...args)),
  getFnSignature: vi.fn(() => 'mcpToken.action'),
}));

vi.mock('@/services/dashboard/mcpToken.service', () => ({
  getDashboardMcpTokens: vi.fn(),
  removeDashboardFromToken: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  unstable_rethrow: vi.fn(),
}));

import { getCachedSession, getCachedAuthorizedContext, resolveDashboardAuthResult } from '@/auth/api-auth';
import { getDashboardMcpTokens, removeDashboardFromToken } from '@/services/dashboard/mcpToken.service';
import {
  getDashboardMcpTokensAction,
  removeDashboardFromMcpTokenAction,
} from '@/app/actions/dashboard/mcpToken.action';

const session = vi.mocked(getCachedSession);
const authorizedContext = vi.mocked(getCachedAuthorizedContext);
const dashboardAuthResult = vi.mocked(resolveDashboardAuthResult);
const listTokens = vi.mocked(getDashboardMcpTokens);
const removeToken = vi.mocked(removeDashboardFromToken);

function asMember(role: DashboardRole) {
  const context = { dashboardId: 'dash-1', siteId: 'site-1', userId: 'user-1', role, isDemo: false };
  session.mockResolvedValue({
    user: { id: 'user-1' },
    session: { token: 'session-token', expiresAt: new Date('2030-01-01') },
  } as Awaited<ReturnType<typeof getCachedSession>>);
  authorizedContext.mockResolvedValue(context);
  dashboardAuthResult.mockResolvedValue({ context } as Awaited<ReturnType<typeof resolveDashboardAuthResult>>);
}

beforeEach(() => {
  vi.clearAllMocks();
  listTokens.mockResolvedValue([]);
  removeToken.mockResolvedValue(undefined);
});

describe('dashboard MCP token actions', () => {
  it.each<DashboardRole>(['viewer', 'editor'])("doesn't list other members' tokens to role %s", async (role) => {
    asMember(role);

    expect(await getDashboardMcpTokensAction('dash-1')).toEqual({ canManage: false });
    expect(listTokens).not.toHaveBeenCalled();
  });

  it.each<DashboardRole>(['owner', 'admin'])(
    'lists the tokens that can read the dashboard to role %s',
    async (role) => {
      asMember(role);

      expect(await getDashboardMcpTokensAction('dash-1')).toEqual({ canManage: true, tokens: [] });
      expect(listTokens).toHaveBeenCalledWith('dash-1');
    },
  );

  it.each<DashboardRole>(['viewer', 'editor'])(
    'rejects removing a token by role %s before removing it',
    async (role) => {
      asMember(role);

      await expect(removeDashboardFromMcpTokenAction('dash-1', 'token-1')).rejects.toThrow(
        'You do not have permission to perform this action',
      );
      expect(removeToken).not.toHaveBeenCalled();
    },
  );

  it.each<DashboardRole>(['owner', 'admin'])('lets role %s remove the dashboard from a token', async (role) => {
    asMember(role);

    await removeDashboardFromMcpTokenAction('dash-1', 'token-1');

    expect(authorizedContext).toHaveBeenCalledWith('user-1', 'dash-1');
    expect(removeToken).toHaveBeenCalledWith('dash-1', 'token-1');
  });
});
