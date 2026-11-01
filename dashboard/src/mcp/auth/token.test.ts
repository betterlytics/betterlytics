import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMcpTokenByHash: vi.fn(),
  updateMcpTokenLastUsed: vi.fn(),
  findUserDashboardOrNull: vi.fn(),
}));

vi.mock('@/repositories/postgres/mcpToken.repository', () => ({
  findMcpTokenByHash: mocks.findMcpTokenByHash,
  updateMcpTokenLastUsed: mocks.updateMcpTokenLastUsed,
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserDashboardOrNull: mocks.findUserDashboardOrNull,
}));
vi.mock('@/services/dashboard/mcpToken.service', () => ({ hashToken: (token: string) => `hash:${token}` }));

import { validateToken } from '@/mcp/auth/token';

const TOKEN = {
  id: 'token-1',
  name: 'Claude',
  dashboardId: 'dash-1',
  createdBy: 'user-1',
  createdAt: new Date('2026-01-01'),
  lastUsedAt: null,
  expiresAt: null,
  tokenHash: 'hash:btl_abc',
  dashboard: { siteId: 'site-1', domain: 'example.com' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateToken', () => {
  it("builds a context holding the token's dashboard with the creator's current role", async () => {
    mocks.findMcpTokenByHash.mockResolvedValue(TOKEN);
    mocks.findUserDashboardOrNull.mockResolvedValue({ role: 'editor' });

    expect(await validateToken('btl_abc')).toEqual({
      valid: true,
      context: {
        credentialId: 'mcp-token:token-1',
        dashboards: [{ dashboardId: 'dash-1', siteId: 'site-1', domain: 'example.com', role: 'editor' }],
      },
    });
    expect(mocks.findMcpTokenByHash).toHaveBeenCalledWith('hash:btl_abc');
    expect(mocks.findUserDashboardOrNull).toHaveBeenCalledWith({ userId: 'user-1', dashboardId: 'dash-1' });
    expect(mocks.updateMcpTokenLastUsed).toHaveBeenCalledWith('token-1');
  });

  it('leaves the role empty when the creator has left the dashboard', async () => {
    mocks.findMcpTokenByHash.mockResolvedValue(TOKEN);
    mocks.findUserDashboardOrNull.mockResolvedValue(null);

    const result = await validateToken('btl_abc');
    expect(result.valid && result.context.dashboards[0]?.role).toBeNull();
  });

  it('rejects unknown and expired tokens', async () => {
    mocks.findMcpTokenByHash.mockResolvedValue(null);
    expect(await validateToken('btl_nope')).toEqual({ valid: false, reason: 'Invalid MCP token' });

    mocks.findMcpTokenByHash.mockResolvedValue({ ...TOKEN, expiresAt: new Date('2020-01-01') });
    expect(await validateToken('btl_abc')).toEqual({ valid: false, reason: 'MCP token has expired' });
    expect(mocks.updateMcpTokenLastUsed).not.toHaveBeenCalled();
  });
});
