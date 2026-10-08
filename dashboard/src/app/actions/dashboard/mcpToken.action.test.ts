import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DashboardRole } from '@prisma/client';

vi.mock('@/auth/api-auth', () => ({
  getCachedSession: vi.fn(),
  getCachedAuthorizedContext: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(),
  getFnSignature: vi.fn(() => 'mcpToken.action'),
}));

vi.mock('@/services/dashboard/mcpToken.service', () => ({
  createMcpTokenForDashboard: vi.fn(),
  getMcpTokensForDashboard: vi.fn(),
  removeMcpToken: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  unstable_rethrow: vi.fn(),
}));

import { getCachedSession, getCachedAuthorizedContext } from '@/auth/api-auth';
import { createMcpTokenForDashboard, removeMcpToken } from '@/services/dashboard/mcpToken.service';
import { createMcpTokenAction, deleteMcpTokenAction } from '@/app/actions/dashboard/mcpToken.action';

const session = vi.mocked(getCachedSession);
const authorizedContext = vi.mocked(getCachedAuthorizedContext);
const createToken = vi.mocked(createMcpTokenForDashboard);
const removeToken = vi.mocked(removeMcpToken);

function asMember(role: DashboardRole) {
  session.mockResolvedValue({
    user: { id: 'user-1' },
    session: { token: 'session-token', expiresAt: new Date('2030-01-01') },
  } as Awaited<ReturnType<typeof getCachedSession>>);
  authorizedContext.mockResolvedValue({
    dashboardId: 'dash-1',
    siteId: 'site-1',
    userId: 'user-1',
    role,
    isDemo: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  createToken.mockResolvedValue({ id: 'token-1', plainToken: 'btl_plain' } as Awaited<
    ReturnType<typeof createMcpTokenForDashboard>
  >);
  removeToken.mockResolvedValue(undefined);
});

describe('MCP token actions', () => {
  it.each<DashboardRole>(['viewer', 'editor'])(
    'rejects creation by role %s before creating a token',
    async (role) => {
      asMember(role);

      await expect(createMcpTokenAction('dash-1', 'Claude', '30d')).rejects.toThrow(
        'You do not have permission to perform this action',
      );
      expect(createToken).not.toHaveBeenCalled();
    },
  );

  it.each<DashboardRole>(['viewer', 'editor'])(
    'rejects deletion by role %s before deleting a token',
    async (role) => {
      asMember(role);

      await expect(deleteMcpTokenAction('dash-1', 'token-1')).rejects.toThrow(
        'You do not have permission to perform this action',
      );
      expect(removeToken).not.toHaveBeenCalled();
    },
  );

  it.each<DashboardRole>(['owner', 'admin'])(
    'lets role %s create a token on the selected dashboard',
    async (role) => {
      asMember(role);

      await expect(createMcpTokenAction('dash-1', 'Claude', '30d')).resolves.toEqual({
        id: 'token-1',
        plainToken: 'btl_plain',
      });
      expect(authorizedContext).toHaveBeenCalledWith('user-1', 'dash-1');
      expect(createToken).toHaveBeenCalledWith('dash-1', 'Claude', 'user-1', '30d');
    },
  );

  it.each<DashboardRole>(['owner', 'admin'])(
    'lets role %s delete a token on the selected dashboard',
    async (role) => {
      asMember(role);

      await deleteMcpTokenAction('dash-1', 'token-1');

      expect(removeToken).toHaveBeenCalledWith('token-1', 'dash-1');
    },
  );
});
