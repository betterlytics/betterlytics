import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMcpTokenByHash: vi.fn(),
  resolveTokenMcpContext: vi.fn(),
}));

vi.mock('@/repositories/postgres/mcpToken.repository', () => ({
  findMcpTokenByHash: mocks.findMcpTokenByHash,
}));
vi.mock('@/services/auth/mcpAccess.service', () => ({
  resolveTokenMcpContext: mocks.resolveTokenMcpContext,
}));
vi.mock('@/services/dashboard/mcpToken.service', () => ({ hashToken: (token: string) => `hash:${token}` }));

import { validateToken } from '@/mcp/auth/token';

const TOKEN = {
  id: 'token-1',
  createdBy: 'user-1',
  expiresAt: null,
  dashboardIds: ['dash-1', 'dash-2'],
};

const CONTEXT = {
  credentialId: 'mcp-token:token-1',
  dashboards: [{ dashboardId: 'dash-1', siteId: 'site-1', domain: 'example.com', role: 'viewer' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveTokenMcpContext.mockResolvedValue(CONTEXT);
});

describe('validateToken', () => {
  it("resolves the token to its creator's access through the shared resolver", async () => {
    mocks.findMcpTokenByHash.mockResolvedValue(TOKEN);

    expect(await validateToken('btl_abc')).toEqual({ valid: true, context: CONTEXT });
    expect(mocks.findMcpTokenByHash).toHaveBeenCalledWith('hash:btl_abc');
    expect(mocks.resolveTokenMcpContext).toHaveBeenCalledWith(TOKEN);
  });

  it('stays valid with no dashboards, like an OAuth connection with none', async () => {
    mocks.findMcpTokenByHash.mockResolvedValue({ ...TOKEN, dashboardIds: [] });
    mocks.resolveTokenMcpContext.mockResolvedValue({ credentialId: 'mcp-token:token-1', dashboards: [] });

    expect(await validateToken('btl_abc')).toEqual({
      valid: true,
      context: { credentialId: 'mcp-token:token-1', dashboards: [] },
    });
  });

  it('rejects unknown tokens, including those of a deleted or disabled creator', async () => {
    mocks.findMcpTokenByHash.mockResolvedValue(null);

    expect(await validateToken('btl_nope')).toEqual({ valid: false, reason: 'Invalid MCP token' });
    expect(mocks.resolveTokenMcpContext).not.toHaveBeenCalled();
  });

  it('rejects expired tokens without recording a use', async () => {
    mocks.findMcpTokenByHash.mockResolvedValue({ ...TOKEN, expiresAt: new Date('2020-01-01') });

    expect(await validateToken('btl_abc')).toEqual({ valid: false, reason: 'MCP token has expired' });
    expect(mocks.resolveTokenMcpContext).not.toHaveBeenCalled();
  });
});
